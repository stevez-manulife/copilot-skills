# Atlassian Skill for GitHub Copilot

Query and update **Jira issues** and **Confluence pages** directly from GitHub Copilot chat — no browser, no MCP server required.

Works via direct Atlassian REST API calls using your Personal Access Token (PAT).

## What it can do

**Jira**
- List your open issues
- Get issue details
- Create issues
- Update summary / description / status
- Add comments
- Transition issues (move to In Progress, Done, etc.)
- Search with custom JQL

**Confluence**
- Search pages by text
- Get a specific page
- Create new pages
- Update existing pages

## Install

See [../../INSTALL.md](../../INSTALL.md) for full setup instructions.

**TL;DR:**
```
install skill from https://github.com/stevez-manulife/copilot-skills/tree/main/skills/atlassian
```

Then run `/atlassian setup` to configure your credentials.

## Usage

```
/atlassian                          # show menu
/atlassian my issues                # list open issues assigned to you
/atlassian issue PROJ-123           # get issue details
/atlassian comment PROJ-123         # add a comment
/atlassian search "login bug"       # search Jira
/atlassian search confluence docs   # search Confluence
```

## Requirements

- Atlassian Cloud (`*.atlassian.net`) — not compatible with Data Center/Server
- Atlassian API token: https://id.atlassian.com/manage-profile/security/api-tokens
