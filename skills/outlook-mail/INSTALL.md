# Installation Guide — Outlook Mail Skill

Installs a read-only skill so your Copilot agent can list, search, and read mail from your Outlook mailbox via classic Outlook (COM).

---

## Prerequisites

1. **Windows** (the skill does not work on Mac/Linux)
2. **Classic Outlook** installed and signed in to your mailbox. New Outlook alone is not enough — it has no COM interface. Classic Outlook is commonly installed alongside it; check that this exists:

```powershell
Test-Path 'C:\Program Files\Microsoft Office\Root\Office16\OUTLOOK.EXE'
```

3. Windows PowerShell 5.1+ (pre-installed)

No tokens, passwords, or app registrations are needed.

---

## Step 1 — Install the skill

### Option A — One-shot install (easiest)

Open your Copilot client in **Agent mode** and paste the line for your client:

**GitHub Copilot CLI**
```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/outlook-mail/copilot-cli/install.prompt.md
```

**GitHub Copilot Desktop App**
```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/outlook-mail/copilot-app/install.prompt.md
```

**Claude Code**
```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/outlook-mail/claude-code/install.prompt.md
```

### Option B — Manual copy

| Client | Directory |
|--------|-----------|
| GitHub Copilot CLI | `%USERPROFILE%\.agents\skills\outlook-mail\` |
| GitHub Copilot Desktop App | `%APPDATA%\com.github.githubapp\app-skills\outlook-mail\` |
| Claude Code | `%USERPROFILE%\.claude\skills\outlook-mail\` |

```powershell
# Copilot CLI example
git clone --depth 1 https://github.com/stevez-manulife/copilot-skills.git $env:TEMP\cs
$d = "$env:USERPROFILE\.agents\skills\outlook-mail"
New-Item -ItemType Directory -Path $d, "$d\agents", "$d\scripts" -Force
Copy-Item "$env:TEMP\cs\skills\outlook-mail\SKILL.md" "$d\SKILL.md"
Copy-Item "$env:TEMP\cs\skills\outlook-mail\agents\openai.yaml" "$d\agents\openai.yaml"
Copy-Item "$env:TEMP\cs\skills\outlook-mail\scripts\outlook.ps1" "$d\scripts\outlook.ps1"
Remove-Item "$env:TEMP\cs" -Recurse -Force
```

---

## Step 2 — Restart your client

Skills are enumerated when a session starts, so begin a new chat session.

---

## Step 3 — Verify

Run (read-only):

```powershell
& "$env:USERPROFILE\.agents\skills\outlook-mail\scripts\outlook.ps1" list -Count 3
```

You should see JSON for your three newest Inbox messages. Or ask your agent:

```
what are my 3 newest emails?
```

---

## Usage Examples

```
what's in my inbox today?
find emails from <name> about <topic> since Monday
read the latest unread email
list my mail folders
```

---

## Updating the skill

Re-run the install command from Step 1. It overwrites the files in place; there is no config to preserve.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Classic Outlook not found` | Install classic Outlook. New Outlook has no COM support. |
| Script blocked: "running scripts is disabled" | Run once with `powershell -ExecutionPolicy Bypass -File <script> ...`, or `Unblock-File <script>`. |
| Newest items are weeks/months old | Outlook is still syncing its OST. Wait a minute and rerun; the Inbox `list` action warns when this looks likely. |
| Outlook window pops up or the call is slow | The script starts classic Outlook if it isn't running; first call can take a while. |
| Folder not found | Run `list-folders` and use the exact folder name or path (e.g. `Inbox\Projects`). |
| Security prompt about programmatic access | Your admin policy restricts COM access; the skill cannot bypass it. |
| Skill doesn't appear | Skills register at session start — begin a new chat session. |
