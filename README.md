# Copilot Skills

A collection of GitHub Copilot agent skills for enterprise tooling.

## Available Skills

| Skill | Description |
|-------|-------------|
| [atlassian](./skills/atlassian/) | Query and update Jira issues and Confluence pages via Atlassian API |

See each skill's README for install instructions.

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
