# ADO Pipelines canvas

A side-panel dashboard of Azure DevOps pipelines for the **GitHub Copilot desktop app**.

This is an **extension**, not a skill. A skill teaches the agent how to do something; an extension adds a canvas (an interactive panel next to chat) that you can click through yourself, and that the agent can drive too.

## What it does

- **Pipelines** — every pipeline in a project with its latest status, branch and time, grouped by folder. Star pipelines to pin them.
- **Recent runs** — the latest 50 runs across the project.
- **Run detail** — stages and jobs with durations and error messages; click a job to read its log.
- **Repo filter** — in a session opened on a git repository, only pipelines that build that repository are shown (GitHub and Azure Repos). Click ✕ on the **Repo** chip to see every pipeline, or **Only <repo>** to filter again.
- **Run pipeline** — pick a branch, confirm, and the new run appears and updates live.
- Filter, switch organization or project, 30-second auto-refresh, and "Open in ADO ↗" links.

From chat you can ask things like `show pipeline <name>`, `why did build <id> fail?`, or `run <pipeline> on develop`. The agent always confirms with you before queueing a run.

## Install

In the GitHub Copilot desktop app, paste this into chat:

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/extensions/ado-pipelines/copilot-app/install.prompt.md
```

To update, paste the same prompt again.

### Manual install

Copy `extension.mjs`, `ado.mjs`, `repo.mjs` and `ui.html` into `~/.copilot/extensions/ado-pipelines/` (or `$COPILOT_HOME/extensions/ado-pipelines/`), then ask Copilot to reload extensions and open the ADO Pipelines canvas.

## Requirements

- GitHub Copilot desktop app (canvases don't render in the CLI or VS Code).
- Azure CLI, logged in with `az login`. The canvas uses it only to mint short-lived Azure DevOps tokens; no PAT is stored, and it has exactly your permissions.

## How it works

| File | Role |
|------|------|
| `extension.mjs` | Declares the canvas and its agent actions, and serves the UI from a loopback-only HTTP server |
| `ado.mjs` | Azure DevOps REST client (`api-version=7.1`), token via `az account get-access-token` |
| `repo.mjs` | Detects the session's git repository from its `origin` remote |
| `ui.html` | The panel UI, styled with the app's theme tokens |

Your organization, project and starred pipelines are saved in `~/.copilot/extensions/ado-pipelines/artifacts/prefs.json`.

Requests that change anything (queueing a run, saving settings) must carry a random per-panel token embedded in the served page, so other web pages on your machine can't trigger runs through the local server.

### Agent actions

| Action | Purpose |
|--------|---------|
| `show_pipeline` | Select a pipeline by ID or name |
| `show_build` | Show a run's stages, jobs and errors |
| `set_project` | Switch organization/project |
| `set_repo_filter` | Filter to a repository (`owner/repo`, a remote URL, `auto` for the session repo) or `all` |
| `queue_build` | Queue a run (agent must confirm with you first) |
| `refresh` | Reload the panel |
| `get_view` | Return what's shown, including failed jobs and error messages |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Panel says "Azure CLI token failed" | Run `az login`. |
| `PermissionError ... az.sess` on Windows | See the fix in [skills/azure-devops/INSTALL.md](../../skills/azure-devops/INSTALL.md#troubleshooting). |
| `ADO 401` / `203` | Your account can't access that organization, or `az` is signed in to the wrong tenant. |
| Canvas doesn't appear | Ask Copilot to run `extensions_manage` `inspect` on `ado-pipelines` and show the log. |
