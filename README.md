# Copilot Skills

A collection of GitHub Copilot agent skills for enterprise tooling.

## Available Skills

| Skill | Description |
|-------|-------------|
| [atlassian](./skills/atlassian/) | Query and update Jira issues and Confluence pages via Atlassian API |

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
