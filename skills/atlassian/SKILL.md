---
name: atlassian
description: Query and update Jira issues and Confluence pages using the Atlassian Cloud REST API. No MCP required. Uses a Personal Access Token stored in ~/.copilot/atlassian-config.json. Works on Windows (PowerShell), Mac, and Linux.
disable-model-invocation: true
allowed-tools: PowerShell(*) Bash(curl:*) Bash(python:*) Bash(python3:*)
---

# Atlassian Jira & Confluence Skill

> **Scope: Atlassian Cloud only** (`*.atlassian.net`). Not compatible with Data Center or Server.

Direct REST API access to Jira and Confluence — no MCP server, no proxies. Uses a Personal Access Token (PAT) via HTTP Basic auth.

## Menu

When the user invokes `/atlassian` without a specific request, show:

```
Atlassian Skill — What would you like to do?

JIRA
  1. my issues          — list my open Jira issues
  2. issue <KEY-123>    — get details of a specific issue
  3. create issue       — create a new Jira issue
  4. update <KEY-123>   — update summary, description, or status
  5. comment <KEY-123>  — add a comment to an issue
  6. move <KEY-123>     — transition issue to a new status
  7. search <jql>       — search issues with custom JQL

CONFLUENCE
  8. search <query>     — search Confluence pages
  9. page <pageId>      — get a specific page by ID
 10. create page        — create a new Confluence page

SETUP
 11. setup              — configure credentials (first-time or reset)
 12. status             — show current config (site, cloudId)
 13. update             — download the latest version of this skill

Just type a number or describe what you want naturally.
```

## Config

File location:
- **Windows:** `%USERPROFILE%\.copilot\atlassian-config.json`
- **Mac/Linux:** `~/.copilot/atlassian-config.json`

Schema:

```json
{
  "email":     "you@yourcompany.com",
  "api_token": "ATATT3x...",
  "site":      "your-org.atlassian.net",
  "token":     "Basic <base64(email:api_token)>",
  "cloudId":   "<uuid>"
}
```

`email`, `api_token`, `site` are source-of-truth. `token` (auth header) and `cloudId` are derived on first setup and cached.

### First-time setup

If config is missing or user types `setup`, ask for `email`, `api_token`, `site` in chat, then run one PowerShell/bash script to fetch `cloudId`, compute `token`, write the file, and verify with `GET /rest/api/3/myself`. See the install prompts under `vscode/`, `copilot-cli/`, etc. for the exact one-liner.

### Expired token (401/403)

1. Tell the user: "Your Atlassian API token appears expired or invalid."
2. Point them at: https://id.atlassian.com/manage-profile/security/api-tokens
3. After they generate a new one, they can either edit `api_token` in the config file directly (leave `token` blank — the skill will re-derive it), or run `/atlassian setup` again.

### Update the skill (`/atlassian update`)

Re-download the latest `SKILL.md` from the same repo/branch it was originally installed from. **Preserves config** — only overwrites the skill file.

1. Read `source_repo_raw_base` from `~/.copilot/atlassian-config.json`. If missing, ask the user for their fork's raw base URL (e.g. `https://raw.githubusercontent.com/manulife-innersource/copilot-skills/main`) and save it back to the config.
2. Detect where the skill was installed (based on the file path this SKILL.md was loaded from):
   - Copilot CLI: `~/.agents/skills/atlassian/SKILL.md`
   - Copilot Desktop App (Win): `%APPDATA%\com.github.githubapp\app-skills\atlassian\SKILL.md`
   - Copilot Desktop App (Mac): `~/Library/Application Support/com.github.githubapp/app-skills/atlassian/SKILL.md`
   - Claude Code: `~/.claude/skills/atlassian/SKILL.md`
3. Re-download `{source_repo_raw_base}/skills/atlassian/SKILL.md` to that location.

Example (Copilot CLI on Windows):

```powershell
$c = Get-Content "$env:USERPROFILE\.copilot\atlassian-config.json" -Raw | ConvertFrom-Json
Invoke-WebRequest "$($c.source_repo_raw_base)/skills/atlassian/SKILL.md" -OutFile "$env:USERPROFILE\.agents\skills\atlassian\SKILL.md"
Write-Host "✅ SKILL.md updated from $($c.source_repo_raw_base). Start a new chat to load the new version."
```

Bash equivalent:

```bash
BASE=$(python3 -c "import json,os;print(json.load(open(os.path.expanduser('~/.copilot/atlassian-config.json')))['source_repo_raw_base'])")
curl -fsSL "$BASE/skills/atlassian/SKILL.md" -o "$HOME/.agents/skills/atlassian/SKILL.md"
echo "✅ SKILL.md updated from $BASE. Start a new chat to load the new version."
```

## How to call the API

**No MCP. No `tools/call` JSON-RPC.** Just direct HTTPS calls to `https://{site}/rest/api/3/*` (Jira) or `https://{site}/wiki/api/v2/*` (Confluence) with the Basic auth header from the config file.

### PowerShell (Windows — preferred)

```powershell
$c = Get-Content "$env:USERPROFILE\.copilot\atlassian-config.json" -Raw | ConvertFrom-Json
$h = @{ Authorization = $c.token; "User-Agent" = "atlassian-skill"; Accept = "application/json" }

# Example: search my open issues (POST because GET /search was removed May 2025)
$body = @{ jql = "assignee = currentUser() AND resolution = Unresolved"; fields = @("summary","status","priority"); maxResults = 20 } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "https://$($c.site)/rest/api/3/search/jql" -Headers $h -ContentType "application/json" -Body $body
```

### Python (Mac / Linux fallback)

```python
import json, urllib.request, os
c = json.load(open(os.path.expanduser("~/.copilot/atlassian-config.json")))
h = {"Authorization": c["token"], "User-Agent": "atlassian-skill",
     "Accept": "application/json", "Content-Type": "application/json"}
body = json.dumps({"jql":"assignee = currentUser() AND resolution = Unresolved",
                   "fields":["summary","status","priority"], "maxResults":20}).encode()
req = urllib.request.Request(f"https://{c['site']}/rest/api/3/search/jql", body, h, method="POST")
print(urllib.request.urlopen(req).read().decode())
```

**Rules:**
- Always send `User-Agent` — Atlassian's edge returns 403 without it.
- Jira REST **v2 is gone (410) as of May 2025** — use `/rest/api/3/*` only.
- `GET /rest/api/3/search` is also removed — use `POST /rest/api/3/search/jql` with a JSON body.
- Comment bodies and issue descriptions in v3 require **ADF** (Atlassian Document Format), not plain text. See ADF section below.

## Jira REST endpoints

| Action | Method | Endpoint | Notes |
|---|---|---|---|
| Search issues | POST | `/rest/api/3/search/jql` | body: `{jql, fields, maxResults}` |
| Get issue | GET | `/rest/api/3/issue/{issueKey}` | |
| Create issue | POST | `/rest/api/3/issue` | body: `{fields:{project,summary,issuetype,description(ADF)}}` |
| Update issue | PUT | `/rest/api/3/issue/{issueKey}` | body: `{fields:{...}}` |
| Add comment | POST | `/rest/api/3/issue/{issueKey}/comment` | body: `{body: <ADF>}` |
| List transitions | GET | `/rest/api/3/issue/{issueKey}/transitions` | returns available transition IDs |
| Transition issue | POST | `/rest/api/3/issue/{issueKey}/transitions` | body: `{transition:{id:"<id>"}}` |
| Current user | GET | `/rest/api/3/myself` | verification / whoami |

### Common JQL

- My open issues: `assignee = currentUser() AND resolution = Unresolved`
- By project: `project = PROJ AND resolution = Unresolved`
- In Review: `assignee = currentUser() AND status = "In Review"`
- Recent: `assignee = currentUser() ORDER BY updated DESC`

## Confluence REST endpoints

Confluence uses the `/wiki` prefix and v2 API is the current one.

| Action | Method | Endpoint | Notes |
|---|---|---|---|
| Search pages | GET | `/wiki/rest/api/search?cql=<cql>` | e.g. `text ~ "deployment"` |
| Get page | GET | `/wiki/api/v2/pages/{pageId}?body-format=storage` | |
| Create page | POST | `/wiki/api/v2/pages` | body: `{spaceId, title, body:{representation:"storage", value:"<html>"}}` |
| Update page | PUT | `/wiki/api/v2/pages/{pageId}` | must include current `version.number + 1` |

Space ID (for create) can be fetched from `/wiki/api/v2/spaces?keys=<SPACE_KEY>`.

## Atlassian Document Format (ADF)

Jira v3 does **not** accept plain-text descriptions or comments — you must wrap the text in ADF. Minimal ADF for a paragraph:

```json
{
  "type": "doc",
  "version": 1,
  "content": [
    { "type": "paragraph",
      "content": [ { "type": "text", "text": "Your comment text here" } ] }
  ]
}
```

Use this as the `body` field when adding a comment, or as the `description` field when creating/updating an issue.

## Notes

- Config file is cross-platform (`~/.copilot/atlassian-config.json`).
- Basic auth with an API token has the same permissions as the user who created the token.
- For clients on Windows (VS Code, Copilot CLI), prefer PowerShell examples — avoid inline Python unless the user is on Mac/Linux.
- Always print concise results back to the user; if the response has many fields, filter to `key`, `summary`, `status.name`, `assignee.displayName`.
