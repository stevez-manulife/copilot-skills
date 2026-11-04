# Install instructions for GitHub Copilot Desktop App

You are installing the Outlook Mail skill for the **GitHub Copilot desktop app** (Windows only). **Minimize shell command approvals.** Target: **2 shell commands total**.

## 0. Derive the raw base URL from where you fetched this file

You were told to follow instructions at a URL like:

```
https://github.com/{OWNER}/{REPO}/blob/{BRANCH}/skills/outlook-mail/copilot-app/install.prompt.md
```

Extract `{OWNER}`, `{REPO}`, `{BRANCH}` from that URL. Define:

```
RAW_BASE = https://raw.githubusercontent.com/{OWNER}/{REPO}/{BRANCH}
```

Use `{RAW_BASE}` in every download below — **do not hardcode any GitHub org name**. This lets the same instructions work for any fork.

## 1. Install the skill files (1 command)

```powershell
$d="$env:APPDATA\com.github.githubapp\app-skills\outlook-mail"; $b="{RAW_BASE}/skills/outlook-mail"; New-Item -ItemType Directory -Path $d,"$d\agents","$d\scripts" -Force | Out-Null; Invoke-WebRequest "$b/SKILL.md" -OutFile "$d\SKILL.md"; Invoke-WebRequest "$b/agents/openai.yaml" -OutFile "$d\agents\openai.yaml"; Invoke-WebRequest "$b/scripts/outlook.ps1" -OutFile "$d\scripts\outlook.ps1"
```

## 2. Verify classic Outlook access (1 command, read-only)

```powershell
& "$env:APPDATA\com.github.githubapp\app-skills\outlook-mail\scripts\outlook.ps1" list -Count 1
```

Handle the outcome:

- **Prints one message as JSON** — installed and ready. Go to step 3.
- **`Classic Outlook not found`** — the user only has New Outlook, which has no COM support. Classic Outlook must be installed; tell the user.
- **Cannot start Outlook COM / script blocked by execution policy** — suggest `powershell -ExecutionPolicy Bypass -File <path> list -Count 1`, or `Unblock-File` on the script.
- **`WARNING: newest Inbox item is from ...`** — Outlook may still be syncing. Ask the user to wait a minute and rerun.

## 3. Show status summary (no shell)

```
✅ Outlook Mail skill installed (read-only)

Start a new session for the skill to register, then try:
  what's in my inbox today?
  find emails from <name> about <topic> this week
  read the latest email from <name>
```

Mention that it needs classic Outlook installed, and that it cannot send, draft, or delete mail.
