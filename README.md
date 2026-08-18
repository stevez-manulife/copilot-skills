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
