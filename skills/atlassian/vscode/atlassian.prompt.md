---
description: "Query and update Jira issues and Confluence pages via Atlassian REST API"
name: "atlassian"
argument-hint: "e.g. 'my issues', 'issue PROJ-123', 'setup', 'update', 'search bugs'"
---

# Atlassian Skill (VS Code)

Direct REST API access to Jira and Confluence — no MCP, no proxies. Uses a Personal Access Token (PAT) via HTTP Basic auth.

> **Scope: Atlassian Cloud only** (`*.atlassian.net`). Not compatible with Data Center or Server.

## Menu

When invoked with no arguments (`/atlassian`), show:

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

File location: `%USERPROFILE%\.copilot\atlassian-config.json` (Windows) or `~/.copilot/atlassian-config.json` (Mac/Linux).

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

`email`, `api_token`, `site` are source-of-truth. `token` and `cloudId` are derived and cached.

### First-time setup (`/atlassian setup`)

Ask the user for `email`, `api_token`, `site` in chat (not shell prompts). Then run **one** PowerShell script that computes the token, fetches `cloudId`, writes the config (including `source_repo_raw_base` so `/atlassian update` works from any fork), and verifies:

```powershell
$e="<EMAIL>"; $t="<TOKEN>"; $s="<SITE>"; $src="<SOURCE_REPO_RAW_BASE>"
$auth = "Basic " + [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("$e`:$t"))
$h = @{ Authorization=$auth; "User-Agent"="atlassian-skill" }
$cid = (Invoke-RestMethod "https://$s/_edge/tenant_info" -Headers $h).cloudId
$me  = Invoke-RestMethod "https://$s/rest/api/3/myself" -Headers $h
New-Item -ItemType Directory -Path "$env:USERPROFILE\.copilot" -Force | Out-Null
(@{ email=$e; api_token=$t; site=$s; token=$auth; cloudId=$cid; source_repo_raw_base=$src } | ConvertTo-Json) | Set-Content "$env:USERPROFILE\.copilot\atlassian-config.json"
Write-Host "OK site=$s user=$($me.displayName) cloudId=$cid"
```

`<SOURCE_REPO_RAW_BASE>` is the raw base URL of the fork the skill was installed from, e.g. `https://raw.githubusercontent.com/stevez-manulife/copilot-skills/main`. The install prompt sets it automatically; leave it blank only if you didn't come from an install prompt.

Bash/Python equivalent for Mac/Linux — same shape but uses `python3 -c`.

### Update the skill (`/atlassian update`)

Re-download the latest prompt file from the same fork/branch it was originally installed from. **Preserves the user's config** — only overwrites the skill definition.

Read `source_repo_raw_base` from `~/.copilot/atlassian-config.json`. If missing, ask the user for their fork's raw base URL and save it. Then:

```powershell
# Windows
$c = Get-Content "$env:USERPROFILE\.copilot\atlassian-config.json" -Raw | ConvertFrom-Json
$dir = "$env:APPDATA\Code\User\prompts"
Invoke-WebRequest "$($c.source_repo_raw_base)/skills/atlassian/vscode/atlassian.prompt.md" -OutFile "$dir\atlassian.prompt.md"
Write-Host "✅ atlassian.prompt.md updated from $($c.source_repo_raw_base). Start a new chat to load the new version."
```

```bash
# Mac
BASE=$(python3 -c "import json,os;print(json.load(open(os.path.expanduser('~/.copilot/atlassian-config.json')))['source_repo_raw_base'])")
DIR="$HOME/Library/Application Support/Code/User/prompts"
curl -fsSL "$BASE/skills/atlassian/vscode/atlassian.prompt.md" -o "$DIR/atlassian.prompt.md"
echo "✅ atlassian.prompt.md updated from $BASE. Start a new chat to load the new version."
```

```bash
# Linux
BASE=$(python3 -c "import json,os;print(json.load(open(os.path.expanduser('~/.copilot/atlassian-config.json')))['source_repo_raw_base'])")
DIR="$HOME/.config/Code/User/prompts"
curl -fsSL "$BASE/skills/atlassian/vscode/atlassian.prompt.md" -o "$DIR/atlassian.prompt.md"
echo "✅ atlassian.prompt.md updated from $BASE. Start a new chat to load the new version."
```

### Expired token (401/403)

1. Tell the user: "Your Atlassian API token appears expired or invalid."
2. Point them at: https://id.atlassian.com/manage-profile/security/api-tokens
3. Have them run `/atlassian setup` again with the new token, or edit `api_token` in the config file directly and blank out `token` so it re-derives.

## How to call the API

**No MCP. No `tools/call`.** Just direct HTTPS to `https://{site}/rest/api/3/*` (Jira) or `https://{site}/wiki/api/v2/*` (Confluence) with the Basic auth header from the config.

### PowerShell (preferred on Windows)

```powershell
$c = Get-Content "$env:USERPROFILE\.copilot\atlassian-config.json" -Raw | ConvertFrom-Json
$h = @{ Authorization = $c.token; "User-Agent" = "atlassian-skill"; Accept = "application/json" }

# Example: search my open issues (POST — GET /search was removed May 2025)
$body = @{ jql = "assignee = currentUser() AND resolution = Unresolved"; fields = @("summary","status","priority"); maxResults = 20 } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "https://$($c.site)/rest/api/3/search/jql" -Headers $h -ContentType "application/json" -Body $body
```

### Python (Mac/Linux fallback)

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
- `GET /rest/api/3/search` was removed — use `POST /rest/api/3/search/jql` with a JSON body.
- Comment bodies and issue descriptions in v3 require **ADF** (see below), not plain text.

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

| Action | Method | Endpoint | Notes |
|---|---|---|---|
| Search pages | GET | `/wiki/rest/api/search?cql=<cql>` | e.g. `text ~ "deployment"` |
| Get page | GET | `/wiki/api/v2/pages/{pageId}?body-format=storage` | |
| Create page | POST | `/wiki/api/v2/pages` | body: `{spaceId, title, body:{representation:"storage", value:"<html>"}}` |
| Update page | PUT | `/wiki/api/v2/pages/{pageId}` | must include current `version.number + 1` |

Space ID (for create) can be fetched from `/wiki/api/v2/spaces?keys=<SPACE_KEY>`.

## Atlassian Document Format (ADF)

Jira v3 does **not** accept plain-text descriptions or comments — wrap the text in ADF. Minimal doc:

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

Use as the `body` field when adding a comment, or `description` when creating/updating an issue.

## Notes

- Basic auth with an API token has the same permissions as the user who created the token.
- Prefer PowerShell on Windows (VS Code Agent default shell) — only fall back to Python on Mac/Linux.
- Print concise results — filter to `key`, `summary`, `status.name`, `assignee.displayName` when a response has many fields.
