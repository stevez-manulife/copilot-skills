# Install instructions for VS Code (GitHub Copilot Agent Skills)

You are installing the Windows UI Automation skill for **VS Code** (Windows only). VS Code Copilot discovers Agent Skills in `~/.agents/skills`, which can bundle the script (a single `.prompt.md` file cannot). **Minimize shell command approvals.** Target: **2 shell commands total**.

## 0. Derive the raw base URL from where you fetched this file

You were told to follow instructions at a URL like:

```
https://github.com/{OWNER}/{REPO}/blob/{BRANCH}/skills/windows-ui-automation/vscode/install.prompt.md
```

Extract `{OWNER}`, `{REPO}`, `{BRANCH}` from that URL. Define:

```
RAW_BASE = https://raw.githubusercontent.com/{OWNER}/{REPO}/{BRANCH}
```

Use `{RAW_BASE}` in every download below — **do not hardcode any GitHub org name**. This lets the same instructions work for any fork.

## 1. Install the skill files (1 command)

The last step rewrites the script path inside `SKILL.md` to the install location.

```powershell
$d="$env:USERPROFILE\.agents\skills\windows-ui-automation"; $b="{RAW_BASE}/skills/windows-ui-automation"; New-Item -ItemType Directory -Path $d,"$d\agents" -Force | Out-Null; Invoke-WebRequest "$b/SKILL.md" -OutFile "$d\SKILL.md"; Invoke-WebRequest "$b/uia.ps1" -OutFile "$d\uia.ps1"; Invoke-WebRequest "$b/agents/openai.yaml" -OutFile "$d\agents\openai.yaml"; [IO.File]::WriteAllText("$d\SKILL.md", [IO.File]::ReadAllText("$d\SKILL.md").Replace('C:\Users\zhanste\.agents\skills\windows-ui-automation', $d), (New-Object Text.UTF8Encoding($false)))
```

To scope the skill to one repo instead, install it under `<repo>\.github\skills\windows-ui-automation` and commit it.

## 2. Verify (1 command, read-only)

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.agents\skills\windows-ui-automation\uia.ps1" windows
```

- **Prints `{"ok":true,"data":[...]}`** — installed and ready. Go to step 3.
- **Script blocked by execution policy** — run `Unblock-File` on `uia.ps1`, or keep using `-ExecutionPolicy Bypass`.

## 3. Show status summary (no shell)

```
✅ Windows UI Automation skill installed

Start a new chat session for the skill to register, then try:
  list my open windows
  open Notepad and type "hello"
  what buttons are in the Calculator window?
```

If the skill isn't picked up, check that the VS Code setting `chat.useAgentSkills` is enabled. Mention that it only works on Windows and that the agent confirms before destructive actions.
