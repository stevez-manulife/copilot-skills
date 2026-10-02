# Installation Guide — Azure DevOps Skill

Installs the Azure DevOps skill so your Copilot agent can query pipelines, builds, logs, and work items through the Azure DevOps REST API.

---

## Prerequisites

1. **Azure CLI** — https://aka.ms/installazurecli
2. **Logged in** — run `az login` once; the skill reuses that session
3. Access to the Azure DevOps organisation you want to query
4. **PowerShell** (Windows, pre-installed) or **bash** (Mac/Linux)

No Personal Access Token is required, and nothing is stored on disk.

Verify the prerequisites:

```bash
az account show --query user.name -o tsv
```

If this prints your email, you're ready. If it throws `PermissionError` on Windows, see [Troubleshooting](#troubleshooting) — it's a known and quickly fixed problem.

---

## Step 1 — Install the skill

### Option A — One-shot install (easiest)

Open your Copilot client in **Agent mode** and paste the line for your client:

**VS Code Copilot Chat**
```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/azure-devops/vscode/install.prompt.md
```

**GitHub Copilot CLI**
```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/azure-devops/copilot-cli/install.prompt.md
```

**GitHub Copilot Desktop App**
```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/azure-devops/copilot-app/install.prompt.md
```

**Claude Code**
```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/azure-devops/claude-code/install.prompt.md
```

### Option B — Manual copy

Pick the directory matching your client:

| Client | Directory |
|--------|-----------|
| GitHub Copilot CLI | `~/.agents/skills/azure-devops/` |
| GitHub Copilot Desktop App (Windows) | `%APPDATA%\com.github.githubapp\app-skills\azure-devops\` |
| GitHub Copilot Desktop App (Mac) | `~/Library/Application Support/com.github.githubapp/app-skills/azure-devops/` |
| Claude Code | `~/.claude/skills/azure-devops/` |
| VS Code Copilot Chat | `%APPDATA%\Code\User\prompts\azure-devops.prompt.md` (single file) |

```powershell
# Windows — Copilot CLI
git clone --depth 1 https://github.com/stevez-manulife/copilot-skills.git $env:TEMP\cs
$d = "$env:USERPROFILE\.agents\skills\azure-devops"
New-Item -ItemType Directory -Path $d, "$d\agents" -Force
Copy-Item "$env:TEMP\cs\skills\azure-devops\SKILL.md" "$d\SKILL.md"
Copy-Item "$env:TEMP\cs\skills\azure-devops\agents\openai.yaml" "$d\agents\openai.yaml"
Remove-Item "$env:TEMP\cs" -Recurse -Force
```

```bash
# Mac/Linux — Copilot CLI
git clone --depth 1 https://github.com/stevez-manulife/copilot-skills.git /tmp/cs
D="$HOME/.agents/skills/azure-devops"; mkdir -p "$D/agents"
cp /tmp/cs/skills/azure-devops/SKILL.md "$D/SKILL.md"
cp /tmp/cs/skills/azure-devops/agents/openai.yaml "$D/agents/openai.yaml"
rm -rf /tmp/cs
```

---

## Step 2 — Restart your client

Skills are enumerated when a session starts, so start a new chat session for the skill to register.

---

## Step 3 — Verify

Ask your agent:

```
what Azure DevOps projects can I see in org <your-org>?
```

It should mint a token and list your projects. If you know your org and project already, try:

```
show me the last 5 builds of the <pipeline-name> pipeline
```

---

## Usage Examples

The skill is model-invoked, so plain language works:

```
check the pipeline status
did the develop build pass?
show the failing step's log for build 63711
trigger the preprod pipeline on develop
which pipelines exist in this project?
summarise work item 1234
```

Tell it your organisation and project once and it will carry them through the conversation.

---

## Updating the skill

Re-run the install command from Step 1. It overwrites `SKILL.md` in place. Nothing else is stored, so there is no config to preserve.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `az` not recognised | Install from https://aka.ms/installazurecli and reopen your terminal. |
| `Please run 'az login'` | Run `az login`. The skill reuses the interactive session. |
| `PermissionError: [Errno 13] ... \.azure\az.sess` | Files in `~/.azure` are flagged Hidden, which breaks Python's file writes. Clear it: `Get-ChildItem "$env:USERPROFILE\.azure" -Force -File \| ForEach-Object { $_.Attributes = $_.Attributes -band (-bnot [IO.FileAttributes]::Hidden) }`. Your login survives. |
| `az extension add` fails with `CERTIFICATE_VERIFY_FAILED` | Corporate TLS inspection. You don't need the extension — this skill calls REST directly. |
| `401` / `203 Non-Authoritative` from the API | Your account lacks access to that organisation, or the token was minted against the wrong tenant. Check `az account show` and `az account set --subscription <id>`. |
| An HTML login page comes back instead of JSON | The `Authorization` header is missing or malformed. Re-mint the token — they expire after about an hour. |
| PowerShell returns a malformed-query error | `$top` / `$filter` / `$skip` were interpolated by PowerShell. Backtick-escape them: `` `$top ``. |
| Skill doesn't appear | Skills register at session start — begin a new chat session. |
