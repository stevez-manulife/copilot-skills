# Install instructions for Copilot Agent (VS Code)

You are installing the Azure DevOps Copilot skill in VS Code. **Minimize shell command approvals** — target **2 shell commands total**.

## 0. Derive the raw base URL from where you fetched this file

You were told to follow instructions at a URL like:

```
https://github.com/{OWNER}/{REPO}/blob/{BRANCH}/skills/azure-devops/vscode/install.prompt.md
```

Extract `{OWNER}`, `{REPO}`, `{BRANCH}` from that URL. Define:

```
RAW_BASE = https://raw.githubusercontent.com/{OWNER}/{REPO}/{BRANCH}
```

Use `{RAW_BASE}` in every download below — **do not hardcode any GitHub org name**. This lets the same instructions work for any fork.

## 1. Download the prompt file (1 command)

```powershell
# Windows
$dir = "$env:APPDATA\Code\User\prompts"; New-Item -ItemType Directory -Path $dir -Force | Out-Null; Invoke-WebRequest "{RAW_BASE}/skills/azure-devops/vscode/azure-devops.prompt.md" -OutFile "$dir\azure-devops.prompt.md"
```

```bash
# Mac
DIR="$HOME/Library/Application Support/Code/User/prompts"; mkdir -p "$DIR" && curl -fsSL "{RAW_BASE}/skills/azure-devops/vscode/azure-devops.prompt.md" -o "$DIR/azure-devops.prompt.md"
```

```bash
# Linux
DIR="$HOME/.config/Code/User/prompts"; mkdir -p "$DIR" && curl -fsSL "{RAW_BASE}/skills/azure-devops/vscode/azure-devops.prompt.md" -o "$DIR/azure-devops.prompt.md"
```

To scope the skill to one repo instead of your whole profile, write it to `<repo>/.github/prompts/azure-devops.prompt.md` and commit it — teammates then get it via git.

## 2. Verify the Azure CLI login (1 command)

No credentials are collected — the skill reuses the user's existing `az login`.

```powershell
az account show --query "{user:user.name, tenant:tenantId}" -o json
```

Handle the outcome:

- **Prints a user and tenant** — installed and ready. Go to step 3.
- **`az` not recognised** — tell the user to install from https://aka.ms/installazurecli, then reopen the terminal and rerun.
- **`Please run 'az login'`** — tell the user to run `az login`, then rerun.
- **`PermissionError: [Errno 13] ... \.azure\az.sess`** (Windows) — files in `~/.azure` are flagged Hidden, which breaks Python's writes. Offer to fix it, then rerun the verify:

  ```powershell
  Get-ChildItem "$env:USERPROFILE\.azure" -Force -File | ForEach-Object { $_.Attributes = $_.Attributes -band (-bnot [IO.FileAttributes]::Hidden) }
  ```

  The login survives this, so no re-authentication is needed.

## 3. Show status summary (no shell)

```
✅ Azure DevOps skill installed

  Signed in: <user.name>
  Tenant:    <tenantId>

Try these next:
  /azure-devops pipelines                   — list pipelines in a project
  /azure-devops status <pipeline>           — recent runs
  /azure-devops build <id>                  — stages and result
  /azure-devops logs <id>                   — logs, failing step first
  /azure-devops trigger <pipeline> <branch> — queue a run
```

VS Code discovers `.prompt.md` files automatically — no restart needed. If `/azure-devops` doesn't autocomplete, check the setting `chat.promptFiles` is enabled (`Ctrl+,` → search "prompt files").

Mention that the skill needs the Azure DevOps **organisation** and **project** name, and will ask for them on first use.
