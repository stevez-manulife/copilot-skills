---
name: atlassian
description: Query and update Jira issues and Confluence pages using the Atlassian MCP API. Atlassian Cloud only. Works on Windows and Mac.
disable-model-invocation: true
allowed-tools: PowerShell(*) Bash(python:*) Bash(python3:*)
---

# Atlassian Jira & Confluence Skill

> **Scope: Atlassian Cloud only** (`*.atlassian.net`). Not compatible with Atlassian Data Center or Server.

Access Jira and Confluence directly via the Atlassian MCP API using Python. Works on Windows and Mac.

## Menu

When the user invokes `/atlassian` without a specific request, show this menu:

```
Atlassian Skill � What would you like to do?

JIRA
  1. my issues          � list my open Jira issues
  2. issue <KEY-123>    � get details of a specific issue
  3. create issue       � create a new Jira issue
  4. update <KEY-123>   � update summary, description, or status
  5. comment <KEY-123>  � add a comment to an issue
  6. move <KEY-123>     � transition issue to a new status
  7. search <jql>       � search issues with custom JQL

CONFLUENCE
  8. search <query>     � search Confluence pages
  9. page <pageId>      � get a specific page by ID
 10. create page        � create a new Confluence page

SETUP
 11. setup              � configure credentials (first-time or reset)
 12. status             � show current config (site, cloudId)

Just type a number or describe what you want naturally.
```

## First-time setup

The skill uses a config file at:
- **Windows:** `%USERPROFILE%\.copilot\atlassian-config.json`
- **Mac/Linux:** `~/.copilot/atlassian-config.json`

### Two ways to set it up

**Option 1 — Edit the file directly (recommended for token rotation)**

If the user prefers to fill in credentials themselves, or is rotating an expired token:

1. Copy the template `atlassian-config.example.json` from the skill folder to `~/.copilot/atlassian-config.json`
2. Open it in a text editor and fill in `email`, `api_token`, `site`
3. Save

The skill will auto-derive `token` (Base64 Basic auth) and `cloudId` on next run if left blank.

**Option 2 — Interactive setup (`/atlassian setup`)**

If user invokes `/atlassian` and config is missing, or types "setup", walk them through:
1. Email address — Atlassian account email
2. API token — generate at https://id.atlassian.com/manage-profile/security/api-tokens
3. Atlassian site URL — e.g. `https://your-org.atlassian.net`

Then automatically:
- Encode `email:api_token` as Base64 → `Authorization: Basic <base64>`
- Fetch `cloudId` from `https://your-org.atlassian.net/_edge/tenant_info`
- Save to `~/.copilot/atlassian-config.json` (schema below)

### Config file schema

```json
{
  "email": "you@yourcompany.com",
  "api_token": "ATATT3x...",
  "site": "your-org.atlassian.net",
  "mcp_url": "https://mcp.atlassian.com/v1/mcp/authv2",
  "token": "Basic <base64(email:api_token)>",
  "cloudId": "<uuid>"
}
```

`email`, `api_token`, and `site` are the source-of-truth fields. `token` and `cloudId` are cached; if missing, the skill regenerates them from the source fields.

### Handling expired tokens

If any API call returns 401/403 and `email` + `api_token` are present:
1. Notify user: "Your Atlassian API token appears to be expired or invalid."
2. Point to file: "Edit `~/.copilot/atlassian-config.json` and update `api_token`, or generate a new token at https://id.atlassian.com/manage-profile/security/api-tokens"
3. After user updates, clear the cached `token` field so it re-derives from the new `api_token`.

On subsequent uses, load config automatically — never ask again unless config is missing, user types "setup", or authentication fails.

## How to call the API

Write Python to a temp file and execute it.
- Windows: write to %TEMP%\atlassian_query.py, run: python %TEMP%\atlassian_query.py
- Mac/Linux: write to /tmp/atlassian_query.py, run: python3 /tmp/atlassian_query.py

```python
import json, urllib.request, os

# Load config (cross-platform)
cfg = json.load(open(os.path.expanduser("~/.copilot/atlassian-config.json")))
url, cloud_id = cfg["mcp_url"], cfg["cloudId"]
headers = {
    "Authorization": cfg["token"],
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream",
    "User-Agent": "python-urllib/3.11"
}

# Initialize MCP session
res = urllib.request.urlopen(urllib.request.Request(url,
    json.dumps({"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"copilot","version":"1.0"}}}).encode(), headers))
headers["Mcp-Session-Id"] = res.headers["Mcp-Session-Id"]

# Call tool
body = json.dumps({"jsonrpc":"2.0","id":2,"method":"tools/call","params":{
    "name": "<TOOL_NAME>",
    "arguments": {"cloudId": cloud_id, "<ARG>": "<VALUE>"}
}}).encode()
raw = urllib.request.urlopen(urllib.request.Request(url, body, headers)).read().decode()

# Parse SSE response
data = next(line[6:] for line in raw.splitlines() if line.startswith("data:"))
print(json.loads(data)["result"]["content"][0]["text"])
```

## Jira Tools

| Tool | Key Arguments |
|---|---|
| searchJiraIssuesUsingJql | jql, limit |
| getJiraIssue | issueKey |
| createJiraIssue | projectKey, summary, issueType, description |
| updateJiraIssue | issueKey, summary |
| addCommentToJiraIssue | issueKey, comment |
| transitionJiraIssue | issueKey, transition |

Common JQL queries:
- My open issues: assignee = currentUser() AND resolution = Unresolved
- By project: project = <KEY> AND resolution = Unresolved
- In Review: assignee = currentUser() AND status = "In Review"
- Recent: assignee = currentUser() ORDER BY updated DESC

## Confluence Tools

| Tool | Key Arguments |
|---|---|
| searchConfluenceByText | query, limit |
| getConfluencePage | pageId |
| createConfluencePage | spaceKey, title, content (HTML) |
| updateConfluencePage | pageId, title, content (HTML) |

## Notes

- Config file: ~/.copilot/atlassian-config.json � cross-platform, created on first use.
- API token scope: Basic auth with API token gives limited tools. For full Jira/Confluence access, OAuth bearer token is needed.
- User-Agent header is required � Atlassian MCP blocks requests without it (returns 403).
- SSE response: Always extract the data: line before JSON parsing.
- cloudId: Auto-fetched from https://your-org.atlassian.net/_edge/tenant_info during setup.
