// Detect and parse the git repository of the session's working directory.
import { execFile } from "node:child_process";

// Returns { type: "GitHub", id: "owner/repo", label } or
// { type: "TfsGit", name, org, project, label } or null.
export function parseRepo(spec) {
    if (!spec) return null;
    const s = spec.trim().replace(/\.git$/i, "");
    let m = s.match(/github\.com[:/]+([^/]+)\/([^/?#]+)/i);
    if (m) return { type: "GitHub", id: `${m[1]}/${m[2]}`, label: `${m[1]}/${m[2]}` };
    m = s.match(/dev\.azure\.com\/([^/]+)\/([^/]+)\/_git\/([^/?#]+)/i)
        || s.match(/ssh\.dev\.azure\.com:v3\/([^/]+)\/([^/]+)\/([^/?#]+)/i)
        || s.match(/vs-ssh\.visualstudio\.com:v3\/([^/]+)\/([^/]+)\/([^/?#]+)/i);
    if (m) return tfs(m[1], m[2], m[3]);
    m = s.match(/([^/.@]+)\.visualstudio\.com\/(?:DefaultCollection\/)?([^/]+)\/_git\/([^/?#]+)/i);
    if (m) return tfs(m[1], m[2], m[3]);
    // Bare "owner/repo" means a GitHub repository.
    m = s.match(/^([\w.-]+)\/([\w.-]+)$/);
    if (m) return { type: "GitHub", id: `${m[1]}/${m[2]}`, label: `${m[1]}/${m[2]}` };
    return null;
}

function tfs(org, project, name) {
    const d = (x) => decodeURIComponent(x);
    return { type: "TfsGit", org: d(org), project: d(project), name: d(name), label: d(name) };
}

export function detectRepo(dir) {
    if (!dir) return Promise.resolve(null);
    return new Promise((resolve) => {
        execFile("git", ["-C", dir, "remote", "get-url", "origin"], { windowsHide: true, timeout: 10_000 }, (err, stdout) => {
            resolve(err ? null : parseRepo(stdout));
        });
    });
}
