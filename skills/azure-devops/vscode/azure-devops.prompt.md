---
description: "Query Azure DevOps pipelines, builds, logs and work items via the REST API"
name: "azure-devops"
argument-hint: "e.g. 'pipeline status', 'build 63711 logs', 'trigger preprod on develop', 'list pipelines'"
---

# Azure DevOps Skill (VS Code)

Direct REST API access to Azure DevOps — no PAT, no MCP server. Uses the user's existing `az login` to mint a short-lived bearer token.

## Menu

When invoked with no argument, show this and stop:

```
/azure-devops pipelines                  — list pipelines in a project
/azure-devops status <pipeline>          — recent runs of a pipeline
/azure-devops build <id>                 — one build's stages and result
/azure-devops logs <id>                  — logs for a build, failing step first
/azure-devops trigger <pipeline> <branch>— queue a run (asks for confirmation)
/azure-devops projects                   — list projects in an org
/azure-devops repos                      — list repositories
/azure-devops workitem <id>              — summarise a work item
```

## Authenticate

`499b84ac-1321-427f-aa17-267ca6975798` is the fixed Azure DevOps application ID — the same in every tenant.

```powershell
# Windows
$tok = az account get-access-token --resource 499b84ac-1321-427f-aa17-267ca6975798 --query accessToken -o tsv
$h = @{ Authorization = "Bearer $tok" }
```

```bash
# Mac/Linux
TOK=$(az account get-access-token --resource 499b84ac-1321-427f-aa17-267ca6975798 --query accessToken -o tsv)
curl -s -H "Authorization: Bearer $TOK" "$URL"
```

Tokens last about an hour — mint one per batch of calls. Check the login first with `az account show --query user.name -o tsv`; if it fails, see [Troubleshooting](#troubleshooting).

## Call the API

Every URL is `{org}/{project}/_apis/{area}?api-version=7.1`, where `{org}` is `https://dev.azure.com/{orgName}`.

Ask the user for the organisation and project the first time, then carry them through the conversation.

| Goal | Call |
| --- | --- |
| Recent runs of a pipeline | `GET {org}/{proj}/_apis/build/builds?definitions={defId}&$top=5` |
| Runs on one branch | `GET {org}/{proj}/_apis/build/builds?branchName=refs/heads/main&$top=5` |
| One build | `GET {org}/{proj}/_apis/build/builds/{buildId}` |
| That build's stages and jobs | `GET {org}/{proj}/_apis/build/builds/{buildId}/timeline` |
| List a build's logs | `GET {org}/{proj}/_apis/build/builds/{buildId}/logs` |
| One log's text | `GET {org}/{proj}/_apis/build/builds/{buildId}/logs/{logId}` |
| Pipelines in a project | `GET {org}/{proj}/_apis/build/definitions` |
| One pipeline's YAML path | `GET {org}/{proj}/_apis/build/definitions/{defId}` → `.process.yamlFilename` |
| Projects in an org | `GET {org}/_apis/projects` |
| Repos in a project | `GET {org}/{proj}/_apis/git/repositories` |
| Pull requests | `GET {org}/{proj}/_apis/git/repositories/{repoId}/pullrequests` |
| Work item by ID | `GET {org}/{proj}/_apis/wit/workitems/{id}?$expand=all` |
| Work item query (WIQL) | `POST {org}/{proj}/_apis/wit/wiql` with `{"query":"SELECT [System.Id] FROM workitems WHERE ..."}` |

Stage and job results live in the **timeline**, not the build object. Filter `records` to `type` of `Stage` or `Job`, sort by `order`, and convert `startTime`/`finishTime` from strings before subtracting.

```powershell
$t = Invoke-RestMethod -Uri "$org/$proj/_apis/build/builds/$id/timeline?api-version=7.1" -Headers $h
$t.records | Where-Object { $_.type -eq 'Stage' } | Sort-Object order |
  Select-Object name, result, @{n='secs';e={ [int]((Get-Date $_.finishTime) - (Get-Date $_.startTime)).TotalSeconds }}
```

## Queue a run

```powershell
$body = @{ definition = @{ id = 123 }; sourceBranch = "refs/heads/main" } | ConvertTo-Json
Invoke-RestMethod -Uri "$org/$proj/_apis/build/builds?api-version=7.1" -Headers $h -Method Post -Body $body -ContentType "application/json"
```

Confirm with the user before queueing, and name the environment it targets. A pipeline run usually deploys, and release pipelines often point at shared or production App Services — read the pipeline's variable file for `appName` and the service connection first. `trigger: none` is frequently the sign of a protected environment.

## Escape `$top` in PowerShell

PowerShell interpolates `$top`, `$filter`, `$skip`, and `$expand` inside double-quoted strings, silently truncating the URL. Backtick-escape them:

```powershell
$u = "$org/$proj/_apis/build/builds?definitions=123&`$top=5&api-version=7.1"
```

## Troubleshooting

**`PermissionError: [Errno 13] ... \.azure\az.sess`** (Windows) — files in `~/.azure` carry the Hidden attribute, often set by a backup or DLP agent. Python's `open(path,'w')` uses `CREATE_ALWAYS`, which Windows refuses on a hidden file, so `az` dies before running. ACLs are a red herring. Clear it; the login survives:

```powershell
Get-ChildItem "$env:USERPROFILE\.azure" -Force -File | ForEach-Object {
  $_.Attributes = $_.Attributes -band (-bnot [IO.FileAttributes]::Hidden)
}
```

**`CERTIFICATE_VERIFY_FAILED ... Basic Constraints of CA cert not marked critical`** on `az extension add` — a corporate TLS-inspection proxy, which `az` rejects because it is Python. The extension cannot install until the corporate root CA is exported to a PEM and `REQUESTS_CA_BUNDLE` points at it. The REST calls above still work, because `Invoke-RestMethod` is .NET and trusts the Windows certificate store.

**`Please run 'az login'`** — run `az login`; the skill reuses that session.

**An HTML login page instead of JSON** — the `Authorization` header is missing or the token expired. Re-mint it.
