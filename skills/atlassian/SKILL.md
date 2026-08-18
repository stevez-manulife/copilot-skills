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

If ~/.copilot/atlassian-config.json does not exist, or user types "setup", ask for:
1. Email address � Atlassian account email
2. API token � generate at https://id.atlassian.com/manage-profile/security/api-tokens
3. Atlassian site URL � e.g. https://your-org.atlassian.net

Then automatically:
- Encode email:token as Base64 -> Authorization: Basic <base64>
- Fetch cloudId from https://your-org.atlassian.net/_edge/tenant_info
- Save to ~/.copilot/atlassian-config.json

Config format:
```json
{
  "mcp_url": "https://mcp.atlassian.com/v1/mcp/authv2",
  "token": "Basic <base64(email:apitoken)>",
  "cloudId": "<cloudId>",
  "site": "your-org.atlassian.net"
}
```

On subsequent uses, load config automatically � never ask again unless "setup" or config missing.

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
