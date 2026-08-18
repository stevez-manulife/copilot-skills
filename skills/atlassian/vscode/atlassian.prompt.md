---
description: "Query and update Jira issues and Confluence pages via Atlassian REST API"
name: "atlassian"
argument-hint: "e.g. 'my issues', 'issue PROJ-123', 'setup', 'search bugs'"
---

# Atlassian Skill (VS Code)

Query and update **Jira issues** and **Confluence pages** using the Atlassian Cloud REST API with a Personal Access Token (PAT).

> **Scope:** Atlassian Cloud only (`*.atlassian.net`). Not compatible with Data Center/Server.

## Menu

When invoked with no arguments (`/atlassian`), show this menu:

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

Just type a number or describe what you want naturally.
```

## First-time setup

The config file lives at:
- **Windows:** `%USERPROFILE%\.copilot\atlassian-config.json`
- **Mac/Linux:** `~/.copilot/atlassian-config.json`

### If config is missing, or user says "setup":

Interactively ask for:
1. **Email** — Atlassian account email
2. **API token** — from https://id.atlassian.com/manage-profile/security/api-tokens (starts with `ATATT`)
3. **Site** — e.g. `your-org.atlassian.net` (no `https://` prefix)

Then compute and save the config:

```powershell
# Windows example (adjust for Mac/Linux with python3)
$email = "<user email>"
$apiToken = "<user token>"
$site = "<user site>"

$auth = "Basic " + [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("$email`:$apiToken"))

# Fetch cloudId
$cloudId = (Invoke-RestMethod -Uri "https://$site/_edge/tenant_info").cloudId

$config = @{
  email     = $email
  api_token = $apiToken
  site      = $site
  token     = $auth
  cloudId   = $cloudId
} | ConvertTo-Json

New-Item -ItemType Directory -Path "$env:USERPROFILE\.copilot" -Force | Out-Null
$config | Set-Content "$env:USERPROFILE\.copilot\atlassian-config.json"
```

Confirm setup succeeded by calling `/rest/api/3/myself` with the new token.

### Config file schema

```json
{
  "email": "you@yourcompany.com",
  "api_token": "ATATT3x...",
  "site": "your-org.atlassian.net",
  "token": "Basic <base64(email:api_token)>",
  "cloudId": "<uuid>"
}
```

`email`, `api_token`, `site` are source-of-truth. `token` and `cloudId` are derived — regenerate them if missing.

## How to call the API (Jira)

Use direct Atlassian REST endpoints — **not** MCP. PAT auth only works with REST.

```powershell
# Load config
$cfg = Get-Content "$env:USERPROFILE\.copilot\atlassian-config.json" | ConvertFrom-Json
$headers = @{
  Authorization = $cfg.token
  'User-Agent'  = 'copilot-skill/1.0'
  Accept        = 'application/json'
  'Content-Type'= 'application/json'
}

# Example: list my open issues (POST — GET was deprecated May 2025)
$body = @{
  jql = "assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC"
  maxResults = 30
  fields = @("summary","status","priority","project","issuetype")
} | ConvertTo-Json
$result = Invoke-RestMethod -Uri "https://$($cfg.site)/rest/api/3/search/jql" -Method Post -Headers $headers -Body $body
$result.issues | ForEach-Object {
  [PSCustomObject]@{
    Key = $_.key; Status = $_.fields.status.name; Summary = $_.fields.summary
  }
} | Format-Table -AutoSize
```

### Common Jira endpoints

| Task | Method + Endpoint |
|------|-------------------|
| Search issues (JQL) | `POST /rest/api/3/search/jql` — body: `{jql, maxResults, fields}` |
| Get issue | `GET /rest/api/3/issue/{issueKey}?expand=renderedBody,changelog` |
| Create issue | `POST /rest/api/3/issue` — body: `{fields: {project:{key},summary,issuetype:{name},description}}` |
| Update issue | `PUT /rest/api/3/issue/{issueKey}` |
| Add comment | `POST /rest/api/3/issue/{issueKey}/comment` — body: `{body: <ADF>}` |
| Transitions | `GET /rest/api/3/issue/{issueKey}/transitions` |
| Transition issue | `POST /rest/api/3/issue/{issueKey}/transitions` — body: `{transition:{id}}` |
| Current user | `GET /rest/api/3/myself` |
| Attachment content | `GET /rest/api/3/attachment/content/{id}` (auth required, save to file) |

### Comment / description body — ADF (Atlassian Document Format)

Jira v3 API requires ADF, not plain text. Minimal shape:

```json
{
  "type": "doc",
  "version": 1,
  "content": [
    { "type": "paragraph", "content": [ { "type": "text", "text": "Hello" } ] }
  ]
}
```

For headings: `{"type": "heading", "attrs": {"level": 2}, "content": [...]}`.
For bullet lists: `{"type": "bulletList", "content": [{"type":"listItem","content":[...]}]}`.

## How to call the API (Confluence)

```powershell
# Search pages
$results = Invoke-RestMethod -Uri "https://$($cfg.site)/wiki/rest/api/content?title=$([Uri]::EscapeDataString($title))&type=page&expand=space,version&limit=10" -Headers $headers

# Get page
$page = Invoke-RestMethod -Uri "https://$($cfg.site)/wiki/rest/api/content/$pageId`?expand=body.storage,version,ancestors" -Headers $headers

# List spaces (browse)
$spaces = Invoke-RestMethod -Uri "https://$($cfg.site)/wiki/rest/api/space?limit=25&type=global" -Headers $headers

# Create page (storage format = XHTML)
$body = @{
  type = "page"
  title = $title
  space = @{ key = $spaceKey }
  body = @{ storage = @{ value = "<p>Hello</p>"; representation = "storage" } }
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri "https://$($cfg.site)/wiki/rest/api/content" -Method Post -Headers $headers -Body $body
```

### Common Confluence endpoints

| Task | Method + Endpoint |
|------|-------------------|
| Search by title | `GET /wiki/rest/api/content?title=<t>&type=page&expand=space,version` |
| Full-text search | `GET /wiki/rest/api/content/search?cql=<cql>` |
| Get page | `GET /wiki/rest/api/content/{pageId}?expand=body.storage,version,ancestors` |
| List spaces | `GET /wiki/rest/api/space?limit=25&type=global` |
| Create page | `POST /wiki/rest/api/content` — body: `{type:"page",title,space:{key},body:{storage:{value:"<html>",representation:"storage"}}}` |
| Update page | `PUT /wiki/rest/api/content/{pageId}` (version.number must increment) |

## Handling expired tokens

If API call returns **401** or **403** and `email` + `api_token` are set:

1. Tell the user: "Your Atlassian API token appears to be expired or invalid."
2. Point to the config file: "Open `~/.copilot/atlassian-config.json`, replace `api_token`, and clear the `token` field. Or generate a new token at https://id.atlassian.com/manage-profile/security/api-tokens"
3. When re-running, re-derive `token` from `email:api_token` (Base64 Basic auth).

## Notes

- **Config file:** `~/.copilot/atlassian-config.json` — cross-platform, never committed to git.
- **Auth:** Basic auth with PAT (`Authorization: Basic <base64(email:token)>`) — works with Atlassian REST v3.
- **NOT MCP:** The `mcp.atlassian.com` MCP endpoint requires OAuth bearer tokens. PAT auth only works with REST endpoints.
- **User-Agent:** Always include a `User-Agent` header — some Atlassian edges reject requests without it.
- **Jira API v2 is gone:** As of May 2025, `/rest/api/2/*` returns 410. Use `/rest/api/3/*` and `POST /rest/api/3/search/jql` for JQL searches (GET search was removed).
