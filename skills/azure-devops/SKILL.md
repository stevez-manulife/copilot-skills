---
name: azure-devops
description: Query and control Azure DevOps — pipelines, builds, logs, repos, work items — from the shell via its REST API, authenticated with an Azure CLI token. Use when checking pipeline or build status, reading build logs, queueing a pipeline run, inspecting ADO repos or work items, or when `az devops` commands or the Azure CLI itself fail.
---

# Azure DevOps via REST API

Reach Azure DevOps by calling its REST API directly, using the Azure CLI purely as a token source.

```
az account get-access-token   →  bearer token   (az's only role)
            ↓
curl / Invoke-RestMethod      →  dev.azure.com  (does the real work)
```

This rides the user's existing `az login`, so it inherits exactly their permissions — no PAT to create, store, or rotate.

The REST path works everywhere, including on corporate machines where the `az devops` extension cannot be installed (see [When az itself is broken](#when-az-itself-is-broken)). Where `az devops` is already present it remains a fine shortcut; reach for REST when it is missing or failing.

## Authenticate

`499b84ac-1321-427f-aa17-267ca6975798` is the fixed Azure DevOps application ID — the same value in every tenant.

```powershell
# Windows
$tok = az account get-access-token --resource 499b84ac-1321-427f-aa17-267ca6975798 --query accessToken -o tsv
$h = @{ Authorization = "Bearer $tok" }
```

```bash
# Mac/Linux
TOK=$(az account get-access-token --resource 499b84ac-1321-427f-aa17-267ca6975798 --query accessToken -o tsv)
```

Tokens last about an hour. Mint one at the top of each batch rather than caching it.

Confirm the login first with `az account show --query user.name -o tsv`. If that fails, see [When az itself is broken](#when-az-itself-is-broken).

## Call the API

Every URL is `{org}/{project}/_apis/{area}?api-version=7.1`, where `{org}` is `https://dev.azure.com/{orgName}`.

```powershell
# Windows
$org = "https://dev.azure.com/YOUR-ORG"; $proj = "YOUR-PROJECT"
$r = Invoke-RestMethod -Uri "$org/$proj/_apis/build/builds?api-version=7.1" -Headers $h
$r.value | Select-Object buildNumber, result, sourceBranch
```

```bash
# Mac/Linux
ORG="https://dev.azure.com/YOUR-ORG"; PROJ="YOUR-PROJECT"
curl -s -H "Authorization: Bearer $TOK" \
  "$ORG/$PROJ/_apis/build/builds?api-version=7.1" | jq '.value[] | {buildNumber, result, sourceBranch}'
```

Ask the user for the org and project when they are unknown, or discover them: `GET {org}/_apis/projects` lists projects, and `GET {org}/{proj}/_apis/build/definitions` lists pipelines with their IDs.

### Endpoints

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

Stage and job results live in the **timeline**, not the build object. Filter `records` to `type` of `Stage` or `Job`, sort by `order`, and derive durations from `startTime`/`finishTime` — both are strings, so convert before subtracting.

```powershell
$t = Invoke-RestMethod -Uri "$org/$proj/_apis/build/builds/$id/timeline?api-version=7.1" -Headers $h
$t.records | Where-Object { $_.type -eq 'Stage' } | Sort-Object order |
  Select-Object name, result, @{n='secs';e={ [int]((Get-Date $_.finishTime) - (Get-Date $_.startTime)).TotalSeconds }}
```

### Queue a run

```powershell
$body = @{ definition = @{ id = 123 }; sourceBranch = "refs/heads/main" } | ConvertTo-Json
Invoke-RestMethod -Uri "$org/$proj/_apis/build/builds?api-version=7.1" -Headers $h -Method Post -Body $body -ContentType "application/json"
```

Confirm with the user before queueing, and name the environment it targets. A pipeline run usually deploys, and release pipelines often point at shared or production App Services — read the pipeline's variable file for `appName` and the service connection before assuming the run is isolated. Pipelines with `trigger: none` are manual by design, which is frequently the sign of a protected environment.

## Escape `$top` in PowerShell

PowerShell interpolates `$top`, `$filter`, `$skip`, and `$expand` inside double-quoted strings, silently truncating the URL into a malformed query. Backtick-escape them:

```powershell
$u = "$org/$proj/_apis/build/builds?definitions=123&`$top=5&api-version=7.1"
```

Single-quoted strings keep `$` literal but block `$org` interpolation, so prefer the backtick.

## When az itself is broken

**`PermissionError: [Errno 13] ... \.azure\az.sess` on Windows** — the files in `~/.azure` carry the **Hidden** attribute, often set by a backup or DLP agent. Python's `open(path,'w')` uses `CREATE_ALWAYS`, which Windows refuses on a hidden file, so `az` dies before running any command. File ACLs are a red herring; they read as `FullControl` and a raw write succeeds.

```powershell
Get-ChildItem "$env:USERPROFILE\.azure" -Force -File | ForEach-Object {
  $_.Attributes = $_.Attributes -band (-bnot [IO.FileAttributes]::Hidden)
}
```

The login survives, so no re-authentication is needed. The agent may reapply the attribute later; reapply this fix when the error returns.

**`CERTIFICATE_VERIFY_FAILED ... Basic Constraints of CA cert not marked critical` on `az extension add`** — a corporate TLS-inspection proxy. `az` is Python and rejects the inspection CA, so no extension will install until the corporate root CA is exported to a PEM and `REQUESTS_CA_BUNDLE` points at it. Meanwhile the REST calls above still work, because PowerShell's `Invoke-RestMethod` is .NET and trusts the Windows certificate store.

**`az` missing entirely** — install from https://aka.ms/installazurecli, then `az login`.

## Reading a pipeline from the browser

When the API is unreachable but the user has Azure DevOps open in a browser the agent can drive, read the run off the rendered page as a fallback. Say which method produced the numbers, since screen-reading sees only what the user has navigated to.
