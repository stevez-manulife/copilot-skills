# Copilot Skills

A collection of GitHub Copilot agent skills for enterprise tooling.

## Available Skills

| Skill | Description |
|-------|-------------|
| [atlassian](./skills/atlassian/) | Query and update Jira issues and Confluence pages via Atlassian API |
| [azure-devops](./skills/azure-devops/) | Check pipelines, builds, logs and work items via the Azure DevOps REST API |
| [figma](./skills/figma/) | Read Figma designs and implement them as code via the Figma REST API |
---

## Atlassian

Query and update Jira issues and Confluence pages directly from your Copilot chat — no browser, no MCP server required. Works via direct REST API calls using your Atlassian Personal Access Token.

Pick your client and paste the matching prompt into your Copilot chat (**Agent mode**):

**VS Code Copilot Chat**

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/atlassian/vscode/install.prompt.md
```

**GitHub Copilot CLI**

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/atlassian/copilot-cli/install.prompt.md
```

**GitHub Copilot Desktop App**

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/atlassian/copilot-app/install.prompt.md
```

**Claude Code**

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/atlassian/claude-code/install.prompt.md
```

The agent reads the file, installs the skill to the correct folder for your client, and walks you through interactive setup (email, API token, site URL).

For manual install steps or usage docs, see [skills/atlassian/](./skills/atlassian/).

### Forking

The install prompts derive their download URL from **where you fetched them**. Fork this repo (e.g. to `manulife-innersource/copilot-skills`) and share the equivalent URL:

```
Follow the install instructions at
https://github.com/manulife-innersource/copilot-skills/blob/main/skills/atlassian/vscode/install.prompt.md
```

No find-replace, no config edits. The skill will also remember which fork it came from (`source_repo_raw_base` in `~/.copilot/atlassian-config.json`), so `/atlassian update` pulls from the same fork.

---

## Alternative: Official Atlassian MCP Server

If your organization allows local MCP proxies (Node.js `mcp-remote`), you can use the **official Atlassian Rovo MCP Server** instead — it exposes richer Jira/Confluence/JSM/Bitbucket/Compass tools and ships six ready-made agent skills:

- Repo: https://github.com/atlassian/atlassian-mcp-server
- Getting started: https://support.atlassian.com/atlassian-rovo-mcp-server/docs/getting-started-with-the-atlassian-remote-mcp-server/
- Endpoint: `https://mcp.atlassian.com/v1/mcp/authv2`
- Auth: OAuth 2.1 or API token (Basic auth with PAT)
- Official skills: https://github.com/atlassian/atlassian-mcp-server/tree/main/skills

**When to use which:**

| Situation | Use |
|-----------|-----|
| Enterprise policy blocks local MCP servers (like Manulife) | This repo's `/atlassian` skill (REST + PAT, no MCP) |
| No MCP restrictions + want full product coverage | Official Atlassian MCP + their skills |
| Want both — this repo handles what MCP can't, MCP handles the rest | Install both |

---

## Azure DevOps

Check pipeline status, read build logs, queue runs, and query work items from your Copilot chat — no PAT, no MCP server, no browser.

It reuses your existing `az login` to mint a short-lived token, then calls the Azure DevOps REST API directly. Nothing is written to disk, and it inherits exactly your permissions.

Pick your client and paste the matching prompt into your Copilot chat (**Agent mode**):

**VS Code Copilot Chat**

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/azure-devops/vscode/install.prompt.md
```

**GitHub Copilot CLI**

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/azure-devops/copilot-cli/install.prompt.md
```

**GitHub Copilot Desktop App**

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/azure-devops/copilot-app/install.prompt.md
```

**Claude Code**

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/azure-devops/claude-code/install.prompt.md
```

Then just ask — the skill is model-invoked, so it fires on its own:

```
check the pipeline status
did the develop build pass?
show the failing step's log for build 63711
trigger the preprod pipeline on develop
```

### Why not `az devops`?

The `az devops` extension is the obvious tool, and where it works this skill is unnecessary. On a locked-down corporate machine it often doesn't:

| Symptom | Cause |
|---------|-------|
| `az extension add` fails with `CERTIFICATE_VERIFY_FAILED` | TLS-inspection proxy; `az` is Python and rejects the inspection CA, so the extension can't install at all |
| `az` dies with `PermissionError` on `~/.azure/az.sess` | A DLP or backup agent flagged `~/.azure` as Hidden, which breaks Python's file writes on Windows |

This skill calls REST directly, which sidesteps the first entirely, and carries the one-line fix for the second.

For manual install steps or the full endpoint reference, see [skills/azure-devops/](./skills/azure-devops/).

---

## Figma

Turn Figma designs into code from your Copilot chat, with no MCP server. Paste a frame link and the agent pulls layout, colors, typography, and a rendered reference image, then implements it with your repo's components.

It calls the Figma REST API with a read-only personal access token stored in the `FIGMA_TOKEN` environment variable (never pasted into chat).

**First, set up your token:**

1. In Figma, click your avatar > **Settings > Security > Personal access tokens > Generate new token**. Scope: **File content: Read-only**. Copy the token (shown only once).
2. Store it on your computer:
   - Windows (PowerShell): `[Environment]::SetEnvironmentVariable('FIGMA_TOKEN','<token>','User')`
   - Mac: `echo 'export FIGMA_TOKEN=<token>' >> ~/.zshrc`
   - Linux: `echo 'export FIGMA_TOKEN=<token>' >> ~/.bashrc`
3. Restart your Copilot client.

See [skills/figma/INSTALL.md](./skills/figma/INSTALL.md#step-1-create-and-store-a-figma-token) for detailed steps.

Pick your client and paste the matching prompt into your Copilot chat (**Agent mode**):

**VS Code Copilot Chat**

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/figma/vscode/install.prompt.md
```

**GitHub Copilot CLI**

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/figma/copilot-cli/install.prompt.md
```

**GitHub Copilot Desktop App**

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/figma/copilot-app/install.prompt.md
```

**Claude Code**

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/figma/claude-code/install.prompt.md
```

Then paste a Figma link (right-click a frame > **Copy link to selection**):

```
implement this design as a React component: <figma link>
what colors and fonts does this frame use? <figma link>
export the icons in this frame as SVG: <figma link>
```

If your organisation allows MCP servers, Figma's official MCP server (`https://mcp.figma.com/mcp`) is the richer alternative.

For manual install steps or token setup, see [skills/figma/](./skills/figma/).