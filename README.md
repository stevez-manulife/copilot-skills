# Copilot Skills

A collection of GitHub Copilot agent skills for enterprise tooling.

## Available Skills

| Skill | Description |
|-------|-------------|
| [atlassian](./skills/atlassian/) | Query and update Jira issues and Confluence pages via Atlassian API |

---

## Quick Install

### One-shot install prompt (VS Code Copilot Chat, Agent mode)

Copy this into your VS Code Copilot Chat (Agent mode):

```
Set up the Atlassian Copilot skill for me using the guide at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/atlassian/INSTALL.md
and the prompt file at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/atlassian/vscode/atlassian.prompt.md.
Install it to my VS Code user prompts folder, then start the /atlassian setup
flow so I can enter my Atlassian email, API token, and site URL.
```

Copilot Agent will:
1. Fetch the prompt file from GitHub
2. Copy it to `%APPDATA%\Code\User\prompts\atlassian.prompt.md` (or the Mac equivalent)
3. Trigger `/atlassian setup` interactively so you can enter credentials

> Requires **Agent mode** in VS Code Copilot Chat (with terminal access) — not Ask mode.

### Manual install

Each skill has its own install guide — see [skills/atlassian/INSTALL.md](./skills/atlassian/INSTALL.md).

---

## Requirements

- GitHub Copilot Chat in **VS Code** (Agent mode for the one-shot install)
- Atlassian Cloud account (`*.atlassian.net`)
- Atlassian API token — see [token generation steps](./skills/atlassian/INSTALL.md#step-1--generate-an-atlassian-api-token)

---

## Usage

Once installed, invoke in Copilot Chat:

```
/atlassian
```

This shows the full menu. You can also use natural language:

```
/atlassian list my open jira issues
/atlassian create a bug in MYPROJECT
/atlassian search confluence for "deployment guide"
```

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
