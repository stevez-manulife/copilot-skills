// Azure DevOps REST client. Uses the Azure CLI only as a token source.
import { exec } from "node:child_process";

const ADO_RESOURCE = "499b84ac-1321-427f-aa17-267ca6975798";
let cached = { token: null, expires: 0 };

function getToken() {
    if (cached.token && Date.now() < cached.expires) return Promise.resolve(cached.token);
    return new Promise((resolve, reject) => {
        exec(
            `az account get-access-token --resource ${ADO_RESOURCE} -o json`,
            { windowsHide: true, timeout: 60_000 },
            (err, stdout, stderr) => {
                if (err) return reject(new Error(`Azure CLI token failed. Run "az login". ${stderr || err.message}`.trim()));
                try {
                    const j = JSON.parse(stdout);
                    // Refresh 5 minutes before actual expiry.
                    const exp = j.expires_on ? j.expires_on * 1000 : Date.parse(j.expiresOn);
                    cached = { token: j.accessToken, expires: (exp || Date.now() + 3_000_000) - 300_000 };
                    resolve(cached.token);
                } catch (e) {
                    reject(new Error(`Could not parse az token output: ${e.message}`));
                }
            },
        );
    });
}

async function call(org, path, { text = false, method = "GET", body } = {}) {
    const token = await getToken();
    const sep = path.includes("?") ? "&" : "?";
    const url = `https://dev.azure.com/${encodeURIComponent(org)}/${path}${sep}api-version=7.1`;
    const headers = { Authorization: `Bearer ${token}` };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const res = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    if (res.status === 401 || res.status === 203) cached = { token: null, expires: 0 };
    if (!res.ok) {
        let detail = "";
        try { detail = (await res.json()).message || ""; } catch {}
        throw new Error(`ADO ${res.status} ${res.statusText} for ${path.split("?")[0]}${detail ? `: ${detail}` : ""}`);
    }
    return text ? res.text() : res.json();
}

const p = (s) => encodeURIComponent(s);

const slimBuild = (b) => ({
    id: b.id,
    buildNumber: b.buildNumber,
    status: b.status,
    result: b.result,
    sourceBranch: b.sourceBranch,
    sourceVersion: b.sourceVersion,
    reason: b.reason,
    requestedFor: b.requestedFor?.displayName,
    queueTime: b.queueTime,
    startTime: b.startTime,
    finishTime: b.finishTime,
    definition: b.definition ? { id: b.definition.id, name: b.definition.name } : undefined,
    webUrl: b._links?.web?.href,
});

export async function listProjects(org) {
    const r = await call(org, `_apis/projects?$top=500`);
    return r.value.map((x) => x.name).sort((a, b) => a.localeCompare(b));
}

// Resolves a parsed repo to ADO's repositoryId/repositoryType query params.
const repoIdCache = new Map();
async function repoQuery(org, project, repo) {
    if (!repo) return "";
    if (repo.type === "GitHub") return `repositoryId=${p(repo.id)}&repositoryType=GitHub&`;
    const repoProject = repo.project || project;
    const key = `${repo.org || org}/${repoProject}/${repo.name}`.toLowerCase();
    if (!repoIdCache.has(key)) {
        const r = await call(repo.org || org, `${p(repoProject)}/_apis/git/repositories/${p(repo.name)}`);
        repoIdCache.set(key, r.id);
    }
    return `repositoryId=${p(repoIdCache.get(key))}&repositoryType=TfsGit&`;
}

export async function listDefinitions(org, project, repo) {
    const rq = await repoQuery(org, project, repo);
    const r = await call(org, `${p(project)}/_apis/build/definitions?${rq}includeLatestBuilds=true&queryOrder=lastModifiedDescending&$top=1000`);
    return r.value.map((d) => ({
        id: d.id,
        name: d.name,
        path: d.path,
        webUrl: d._links?.web?.href,
        latest: d.latestBuild ? slimBuild(d.latestBuild) : null,
    }));
}

export async function listBuilds(org, project, { definitionId, top = 25, repo } = {}) {
    const def = definitionId ? `definitions=${p(definitionId)}&` : "";
    const rq = definitionId ? "" : await repoQuery(org, project, repo);
    const r = await call(org, `${p(project)}/_apis/build/builds?${def}${rq}queryOrder=queueTimeDescending&$top=${top}`);
    return r.value.map(slimBuild);
}

export async function getDefinition(org, project, definitionId) {
    const d = await call(org, `${p(project)}/_apis/build/definitions/${p(definitionId)}`);
    return {
        id: d.id,
        name: d.name,
        path: d.path,
        defaultBranch: d.repository?.defaultBranch || null,
        repository: d.repository?.name,
        webUrl: d._links?.web?.href,
    };
}

const toRef = (branch) => (branch.startsWith("refs/") ? branch : `refs/heads/${branch}`);

export async function queueBuild(org, project, definitionId, branch) {
    const body = { definition: { id: Number(definitionId) } };
    if (branch) body.sourceBranch = toRef(branch.trim());
    return slimBuild(await call(org, `${p(project)}/_apis/build/builds`, { method: "POST", body }));
}

export async function getBuild(org, project, buildId) {
    return slimBuild(await call(org, `${p(project)}/_apis/build/builds/${p(buildId)}`));
}

export async function getTimeline(org, project, buildId) {
    const r = await call(org, `${p(project)}/_apis/build/builds/${p(buildId)}/timeline`);
    return (r?.records || []).map((x) => ({
        id: x.id,
        parentId: x.parentId,
        type: x.type,
        name: x.name,
        order: x.order,
        state: x.state,
        result: x.result,
        startTime: x.startTime,
        finishTime: x.finishTime,
        logId: x.log?.id,
        errorCount: x.errorCount,
        warningCount: x.warningCount,
        issues: (x.issues || []).slice(0, 20).map((i) => ({ type: i.type, message: i.message })),
    }));
}

export async function getLog(org, project, buildId, logId) {
    return call(org, `${p(project)}/_apis/build/builds/${p(buildId)}/logs/${p(logId)}`, { text: true });
}
