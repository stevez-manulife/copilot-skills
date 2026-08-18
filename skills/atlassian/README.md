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

Pick your client and paste the matching prompt into your Copilot chat (Agent mode):

### VS Code Copilot Chat

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/atlassian/vscode/install.prompt.md
```

### GitHub Copilot CLI

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/atlassian/copilot-cli/install.prompt.md
```

### GitHub Copilot Desktop App

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/atlassian/copilot-app/install.prompt.md
```

### Claude Code

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/atlassian/claude-code/install.prompt.md
```

The agent reads the file, installs the skill to the correct folder for your client, and walks you through interactive setup (email, API token, site URL).

> Requires **Agent mode** (terminal + edit tool access).

For manual install steps, see [INSTALL.md](./INSTALL.md).

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
