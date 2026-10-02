# Install instructions for Claude Code

You are installing the Azure DevOps skill for **Claude Code**. **Minimize shell command approvals.** Target: **2 shell commands total**.

## 0. Derive the raw base URL from where you fetched this file

You were told to follow instructions at a URL like:

```
https://github.com/{OWNER}/{REPO}/blob/{BRANCH}/skills/azure-devops/claude-code/install.prompt.md
```

Extract `{OWNER}`, `{REPO}`, `{BRANCH}` from that URL. Define:

```
RAW_BASE = https://raw.githubusercontent.com/{OWNER}/{REPO}/{BRANCH}
```

Use `{RAW_BASE}` in every download below â€” **do not hardcode any GitHub org name**. This lets the same instructions work for any fork.

## 1. Install the skill files (1 command)

```powershell
# Windows
$d="$env:USERPROFILE\.claude\skills\azure-devops"; $b="{RAW_BASE}/skills/azure-devops"; New-Item -ItemType Directory -Path $d,"$d\agents" -Force | Out-Null; Invoke-WebRequest "$b/SKILL.md" -OutFile "$d\SKILL.md"; Invoke-WebRequest "$b/agents/openai.yaml" -OutFile "$d\agents\openai.yaml"
```

```bash
# Mac/Linux
D="$HOME/.claude/skills/azure-devops"; B="{RAW_BASE}/skills/azure-devops"; mkdir -p "$D/agents" && curl -fsSL "$B/SKILL.md" -o "$D/SKILL.md" && curl -fsSL "$B/agents/openai.yaml" -o "$D/agents/openai.yaml"
```

## 2. Verify the Azure CLI login (1 command)

No credentials are collected â€” the skill reuses the user's existing `az login`.

```powershell
# Windows
az account show --query "{user:user.name, tenant:tenantId}" -o json
```

```bash
# Mac/Linux
az account show --query "{user:user.name, tenant:tenantId}" -o json
```

Handle the outcome:

- **Prints a user and tenant** â€” installed and ready. Go to step 3.
- **`az` not recognised** â€” tell the user to install from https://aka.ms/installazurecli, then reopen the terminal and rerun.
- **`Please run 'az login'`** â€” tell the user to run `az login`, then rerun.
- **`PermissionError: [Errno 13] ... \.azure\az.sess`** (Windows) â€” files in `~/.azure` are flagged Hidden, which breaks Python's writes. Offer to fix it, then rerun the verify:

  ```powershell
  Get-ChildItem "$env:USERPROFILE\.azure" -Force -File | ForEach-Object { $_.Attributes = $_.Attributes -band (-bnot [IO.FileAttributes]::Hidden) }
  ```

  The login survives this, so no re-authentication is needed.

## 3. Show status summary (no shell)

```
âœ… Azure DevOps skill installed

  Signed in: <user.name>
  Tenant:    <tenantId>

Start a new session for the skill to register, then try:
  check the pipeline status
  did the develop build pass?
  show the failing step's log for build <id>
  which pipelines exist in <org>/<project>?
  trigger the <name> pipeline on develop
```

Mention that the skill needs the Azure DevOps **organisation** and **project** name, and will ask for them on first use if it cannot infer them.
