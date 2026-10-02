# Azure DevOps Skill for GitHub Copilot

Check pipeline status, read build logs, queue runs, and query work items directly from Copilot chat — no PAT, no MCP server, no browser.

Uses your existing `az login` to mint a token, then calls the Azure DevOps REST API. It inherits exactly your permissions and nothing broader.

## What it can do

**Pipelines & builds**
- Recent runs of a pipeline, or runs on a given branch
- Stage and job breakdown with durations
- Build logs, including the failing step
- Queue a pipeline run on a chosen branch
- List pipelines and their YAML files

**Repos**
- List repositories
- List pull requests

**Boards**
- Get a work item by ID
- Run WIQL queries

## Why not `az devops`?

The `az devops` extension is the obvious tool, and where it works this skill is unnecessary. It frequently does not:

- Corporate TLS inspection makes `az extension add` fail with `CERTIFICATE_VERIFY_FAILED`, so the extension cannot be installed at all.
- On Windows, a DLP or backup agent that flags `~/.azure` as Hidden kills `az` on startup with `PermissionError`.

This skill calls the REST API directly, which sidesteps the first problem entirely, and carries the fix for the second.

## Install

Pick your client and paste the matching prompt into your Copilot chat (Agent mode):

### VS Code Copilot Chat

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/azure-devops/vscode/install.prompt.md
```

### GitHub Copilot CLI

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/azure-devops/copilot-cli/install.prompt.md
```

### GitHub Copilot Desktop App

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/azure-devops/copilot-app/install.prompt.md
```

### Claude Code

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/azure-devops/claude-code/install.prompt.md
```

The agent reads the file, installs the skill to the correct folder for your client, and verifies your Azure login.

> Requires **Agent mode** (terminal access).

For manual install steps, see [INSTALL.md](./INSTALL.md).

## Usage

Ask in plain language — the skill is model-invoked, so it fires on its own:

```
check the pipeline status
did the develop build pass?
show me the failing step's log for build 63711
trigger the preprod pipeline on develop
what pipelines exist in this project?
summarise work item 1234
```

## Requirements

- **Azure CLI** installed and logged in (`az login`) — https://aka.ms/installazurecli
- Access to the Azure DevOps organisation you're querying
- `jq` for the Mac/Linux examples (optional — PowerShell parses JSON natively)

No PAT is needed. Nothing is written to disk and no credentials are stored: the token is minted per use and lives only for the life of the shell command.
