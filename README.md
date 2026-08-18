# Copilot Skills

A collection of GitHub Copilot agent skills for enterprise tooling.

## Available Skills

| Skill | Description |
|-------|-------------|
| [atlassian](./skills/atlassian/) | Query and update Jira issues and Confluence pages via Atlassian API |

---

## Quick Install

### Using GitHub Copilot (Recommended)

Open GitHub Copilot chat and run:

```
install skill from https://github.com/stevez-manulife/copilot-skills/tree/main/skills/atlassian
```

### Manual Install

Each skill has its own install guide — see the skill's folder (e.g. [skills/atlassian/INSTALL.md](./skills/atlassian/INSTALL.md)).

---

## Requirements

- GitHub Copilot app (desktop)
- Atlassian Cloud account (`*.atlassian.net`)
- Atlassian API token (Personal Access Token)

---

## Usage

Once installed, invoke in Copilot chat:

```
/atlassian
```

This shows the full menu. You can also use natural language:

```
/atlassian list my open jira issues
/atlassian create a bug in MYPROJECT
/atlassian search confluence for "deployment guide"
```
