// Extension: ado-pipelines
// Azure DevOps pipelines dashboard canvas (user scope).

import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { joinSession, createCanvas, CanvasError } from "@github/copilot-sdk/extension";
import * as ado from "./ado.mjs";
import { detectRepo, parseRepo } from "./repo.mjs";

// Session working directory; hooks keep it current if the session's cwd changes.
let cwd = process.cwd();
let detected = detectRepo(cwd);
function setCwd(dir) {
    if (dir && dir !== cwd) {
        cwd = dir;
        detected = detectRepo(dir);
    }
}

// "all"/"none" clears the filter, "auto" uses the session repo, anything else is parsed.
async function resolveRepoInput(value) {
    if (value === undefined) return undefined;
    const v = String(value).trim().toLowerCase();
    if (v === "all" || v === "none" || v === "") return null;
    if (v === "auto") return await detected;
    const r = parseRepo(value);
    if (!r) throw new CanvasError("invalid_repository", `Unrecognised repository "${value}". Use owner/repo, a git remote URL, "auto" or "all".`);
    return r;
}

const UI_PATH = fileURLToPath(new URL("./ui.html", import.meta.url));
const ARTIFACTS = join(process.env.COPILOT_HOME || join(homedir(), ".copilot"), "extensions", "ado-pipelines", "artifacts");
const PREFS_PATH = join(ARTIFACTS, "prefs.json");
const DEFAULT_PREFS = { org: "", project: "", favorites: [] };

async function loadPrefs() {
    try {
        return { ...DEFAULT_PREFS, ...JSON.parse(await readFile(PREFS_PATH, "utf8")) };
    } catch {
        return { ...DEFAULT_PREFS };
    }
}
async function savePrefs(prefs) {
    await mkdir(ARTIFACTS, { recursive: true });
    await writeFile(PREFS_PATH, JSON.stringify(prefs, null, 2));
}

// instanceId -> { server, url, nav, clients:Set<res> }. Only ephemeral view state lives here.
const instances = new Map();

function readBody(req) {
    return new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (c) => (data += c));
        req.on("end", () => {
            try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); }
        });
        req.on("error", reject);
    });
}

function json(res, status, body) {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(body));
}

function broadcast(inst, msg) {
    const line = `data: ${JSON.stringify(msg)}\n\n`;
    for (const c of inst.clients) c.write(line);
}

function makeHandler(inst) {
    return async (req, res) => {
        const url = new URL(req.url, "http://127.0.0.1");
        const qs = url.searchParams;
        const org = qs.get("org") || inst.nav.org;
        const project = qs.get("project") || inst.nav.project;
        try {
            // Mutating requests must carry the per-instance token embedded in the served page.
            if (req.method !== "GET" && req.headers["x-canvas-token"] !== inst.token) {
                return json(res, 403, { error: "Forbidden" });
            }
            switch (url.pathname) {
                case "/": {
                    const html = (await readFile(UI_PATH, "utf8")).replace("__CANVAS_TOKEN__", inst.token);
                    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
                    return res.end(html);
                }
                case "/events": {
                    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
                    res.write(": connected\n\n");
                    inst.clients.add(res);
                    req.on("close", () => inst.clients.delete(res));
                    return;
                }
                case "/api/state": {
                    const prefs = await loadPrefs();
                    return json(res, 200, { ...inst.nav, favorites: prefs.favorites, detectedRepo: await detected });
                }
                case "/api/repo": {
                    const body = await readBody(req);
                    inst.nav.repo = body.useDetected ? await detected : null;
                    return json(res, 200, { repo: inst.nav.repo });
                }
                case "/api/prefs": {
                    const body = await readBody(req);
                    const prefs = { ...(await loadPrefs()), ...body };
                    await savePrefs(prefs);
                    inst.nav.org = prefs.org;
                    inst.nav.project = prefs.project;
                    return json(res, 200, prefs);
                }
                case "/api/nav": {
                    Object.assign(inst.nav, await readBody(req));
                    return json(res, 200, inst.nav);
                }
                case "/api/projects":
                    return json(res, 200, await ado.listProjects(org));
                case "/api/definitions":
                    return json(res, 200, await ado.listDefinitions(org, project, inst.nav.repo));
                case "/api/builds":
                    return json(res, 200, await ado.listBuilds(org, project, {
                        definitionId: qs.get("definitionId") || undefined,
                        top: Math.min(+qs.get("top") || 25, 200),
                        repo: inst.nav.repo,
                    }));
                case "/api/build":
                    return json(res, 200, await ado.getBuild(org, project, qs.get("buildId")));
                case "/api/definition":
                    return json(res, 200, await ado.getDefinition(org, project, qs.get("definitionId")));
                case "/api/queue": {
                    if (req.method !== "POST") return json(res, 405, { error: "POST required" });
                    const body = await readBody(req);
                    if (!body.definitionId) return json(res, 400, { error: "definitionId required" });
                    const b = await ado.queueBuild(body.org || org, body.project || project, body.definitionId, body.branch);
                    Object.assign(inst.nav, { buildId: b.id, definitionId: b.definition?.id ?? body.definitionId, logId: null });
                    return json(res, 200, b);
                }
                case "/api/timeline":
                    return json(res, 200, await ado.getTimeline(org, project, qs.get("buildId")));
                case "/api/log": {
                    const text = await ado.getLog(org, project, qs.get("buildId"), qs.get("logId"));
                    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
                    return res.end(text);
                }
                default:
                    res.writeHead(404);
                    return res.end("Not found");
            }
        } catch (e) {
            return json(res, 500, { error: e.message });
        }
    };
}

function navFromInput(input = {}) {
    const nav = {};
    const org = input.organization || input.org;
    if (org) nav.org = org;
    if (input.project) nav.project = input.project;
    if (input.buildId) Object.assign(nav, { buildId: input.buildId, logId: null });
    if (input.definitionId) Object.assign(nav, { definitionId: input.definitionId, view: "pipelines" });
    if (input.definitionId && !input.buildId) Object.assign(nav, { buildId: null, logId: null });
    return nav;
}

async function ensureInstance(instanceId, input) {
    let inst = instances.get(instanceId);
    if (!inst) {
        const prefs = await loadPrefs();
        inst = {
            nav: { org: prefs.org, project: prefs.project, view: "pipelines", definitionId: null, buildId: null, logId: null, repo: await detected },
            clients: new Set(),
            token: randomBytes(24).toString("hex"),
        };
        inst.server = createServer(makeHandler(inst));
        await new Promise((r) => inst.server.listen(0, "127.0.0.1", r));
        inst.url = `http://127.0.0.1:${inst.server.address().port}/`;
        instances.set(instanceId, inst);
    }
    const nav = navFromInput(input);
    const repo = await resolveRepoInput(input.repository);
    if (repo !== undefined) Object.assign(nav, { repo, definitionId: nav.definitionId ?? null });
    if (Object.keys(nav).length) {
        Object.assign(inst.nav, nav);
        broadcast(inst, { type: "navigate", nav: inst.nav });
    }
    return inst;
}

function getInst(ctx) {
    const inst = instances.get(ctx.instanceId);
    if (!inst) throw new CanvasError("not_open", `Canvas instance ${ctx.instanceId} is not open.`);
    return inst;
}

function target(ctx, inst) {
    const org = ctx.input?.organization || inst.nav.org;
    const project = ctx.input?.project || inst.nav.project;
    if (!org || !project) {
        throw new CanvasError("not_configured", "No Azure DevOps organization/project set. Pass organization and project, or call set_project first.");
    }
    return { org, project };
}

function navigate(inst, nav) {
    Object.assign(inst.nav, nav);
    broadcast(inst, { type: "navigate", nav: inst.nav });
}

const orgProjectProps = {
    organization: { type: "string", minLength: 1, description: "ADO organization (the {org} in dev.azure.com/{org})" },
    project: { type: "string", minLength: 1, description: "ADO project name" },
};

const repositoryProp = {
    type: "string",
    minLength: 1,
    description: 'Filter to pipelines building this repo: "owner/repo" (GitHub), a git remote URL, "auto" (session repo) or "all" (no filter)',
};

await joinSession({
    hooks: {
        onSessionStart: async (input) => { setCwd(input?.cwd || input?.workingDirectory); },
        onUserPromptSubmitted: async (input) => { setCwd(input?.cwd || input?.workingDirectory); },
    },
    canvases: [
        createCanvas({
            id: "ado-pipelines",
            displayName: "ADO Pipelines",
            description: "Dashboard of Azure DevOps pipelines: latest status, recent runs, stages/jobs and logs.",
            inputSchema: {
                type: "object",
                additionalProperties: false,
                properties: {
                    ...orgProjectProps,
                    definitionId: { type: "number", minimum: 1, description: "Pipeline (build definition) ID to select" },
                    buildId: { type: "number", minimum: 1, description: "Build/run ID to show" },
                    repository: repositoryProp,
                },
            },
            actions: [
                {
                    name: "set_repo_filter",
                    description: "Limit pipelines and runs to those building from one repository, or clear the filter. By default the canvas filters to the session's git repo.",
                    inputSchema: {
                        type: "object",
                        additionalProperties: false,
                        required: ["repository"],
                        properties: { repository: repositoryProp },
                    },
                    handler: async (ctx) => {
                        const inst = getInst(ctx);
                        const repo = await resolveRepoInput(ctx.input.repository);
                        navigate(inst, { repo, definitionId: null, buildId: null, logId: null });
                        return { repo };
                    },
                },
                {
                    name: "show_pipeline",
                    description: "Select a pipeline by definition ID or (partial) name and show its recent runs.",
                    inputSchema: {
                        type: "object",
                        additionalProperties: false,
                        anyOf: [{ required: ["definitionId"] }, { required: ["name"] }],
                        properties: {
                            ...orgProjectProps,
                            definitionId: { type: "number", minimum: 1 },
                            name: { type: "string", minLength: 1 },
                        },
                    },
                    handler: async (ctx) => {
                        const inst = getInst(ctx);
                        const { org, project } = target(ctx, inst);
                        let id = ctx.input.definitionId;
                        let matched;
                        if (!id) {
                            const defs = await ado.listDefinitions(org, project);
                            const n = ctx.input.name.toLowerCase();
                            const hits = defs.filter((d) => d.name.toLowerCase() === n);
                            const partial = hits.length ? hits : defs.filter((d) => d.name.toLowerCase().includes(n));
                            if (!partial.length) throw new CanvasError("not_found", `No pipeline matching "${ctx.input.name}".`);
                            if (partial.length > 1 && !hits.length) {
                                return { ambiguous: true, candidates: partial.slice(0, 20).map((d) => ({ id: d.id, name: d.name, path: d.path })) };
                            }
                            matched = partial[0];
                            id = matched.id;
                        }
                        navigate(inst, { org, project, view: "pipelines", definitionId: id, buildId: null, logId: null });
                        return { shown: { definitionId: id, name: matched?.name } };
                    },
                },
                {
                    name: "show_build",
                    description: "Show one pipeline run (build) with its stages, jobs and errors.",
                    inputSchema: {
                        type: "object",
                        additionalProperties: false,
                        required: ["buildId"],
                        properties: { ...orgProjectProps, buildId: { type: "number", minimum: 1 } },
                    },
                    handler: async (ctx) => {
                        const inst = getInst(ctx);
                        const { org, project } = target(ctx, inst);
                        const b = await ado.getBuild(org, project, ctx.input.buildId);
                        navigate(inst, { org, project, buildId: b.id, definitionId: b.definition?.id ?? null, logId: null });
                        return b;
                    },
                },
                {
                    name: "set_project",
                    description: "Switch the canvas to another organization/project.",
                    inputSchema: {
                        type: "object",
                        additionalProperties: false,
                        required: ["project"],
                        properties: orgProjectProps,
                    },
                    handler: async (ctx) => {
                        const inst = getInst(ctx);
                        const org = ctx.input.organization || inst.nav.org;
                        if (!org) throw new CanvasError("not_configured", "Pass organization (no organization is set yet).");
                        const prefs = await loadPrefs();
                        await savePrefs({ ...prefs, org, project: ctx.input.project });
                        navigate(inst, { org, project: ctx.input.project, view: "pipelines", definitionId: null, buildId: null, logId: null });
                        return { org, project: ctx.input.project };
                    },
                },
                {
                    name: "queue_build",
                    description: "Queue (trigger) a new run of a pipeline. Runs may deploy to shared environments: ALWAYS get explicit user confirmation of pipeline and branch before calling.",
                    inputSchema: {
                        type: "object",
                        additionalProperties: false,
                        required: ["definitionId"],
                        properties: {
                            ...orgProjectProps,
                            definitionId: { type: "number", minimum: 1 },
                            branch: { type: "string", minLength: 1, description: "Branch name or full ref; defaults to the pipeline's default branch" },
                        },
                    },
                    handler: async (ctx) => {
                        const inst = getInst(ctx);
                        const { org, project } = target(ctx, inst);
                        const b = await ado.queueBuild(org, project, ctx.input.definitionId, ctx.input.branch);
                        navigate(inst, { org, project, buildId: b.id, definitionId: b.definition?.id ?? ctx.input.definitionId, logId: null });
                        return b;
                    },
                },
                {
                    name: "refresh",
                    description: "Reload data shown in the canvas.",
                    handler: async (ctx) => {
                        broadcast(getInst(ctx), { type: "refresh" });
                        return { refreshed: true };
                    },
                },
                {
                    name: "get_view",
                    description: "Return what the canvas currently shows, including failed jobs and errors for a selected run.",
                    handler: async (ctx) => {
                        const { nav } = getInst(ctx);
                        const out = { ...nav };
                        if (nav.buildId) {
                            const [build, tl] = await Promise.all([
                                ado.getBuild(nav.org, nav.project, nav.buildId),
                                ado.getTimeline(nav.org, nav.project, nav.buildId),
                            ]);
                            out.build = build;
                            out.failedRecords = tl
                                .filter((r) => r.result === "failed" || r.errorCount > 0)
                                .map((r) => ({ type: r.type, name: r.name, result: r.result, logId: r.logId, issues: r.issues }));
                        } else if (nav.definitionId) {
                            out.recentRuns = await ado.listBuilds(nav.org, nav.project, { definitionId: nav.definitionId, top: 10 });
                        }
                        return out;
                    },
                },
            ],
            open: async (ctx) => {
                const inst = await ensureInstance(ctx.instanceId, ctx.input || {});
                const where = inst.nav.org ? `${inst.nav.org}/${inst.nav.project}` : "Not configured";
                const status = inst.nav.org && inst.nav.repo ? `${where} · ${inst.nav.repo.label}` : where;
                return { title: "ADO Pipelines", status, url: inst.url };
            },
            onClose: async (ctx) => {
                const inst = instances.get(ctx.instanceId);
                if (!inst) return;
                instances.delete(ctx.instanceId);
                for (const c of inst.clients) c.end();
                await new Promise((r) => inst.server.close(() => r()));
            },
        }),
    ],
});
