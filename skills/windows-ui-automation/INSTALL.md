# Installation Guide — Windows UI Automation Skill

Installs a skill so your agent can see and operate native Windows desktop apps through the UI Automation accessibility tree.

---

## Prerequisites

- **Windows** with Windows PowerShell 5.1+ (pre-installed)
- No tokens, binaries, or accounts needed

---

## Step 1 — Install the skill

### Option A — One-shot install (easiest)

Open your client in **Agent mode** and paste the line for your client:

**GitHub Copilot Desktop App**
```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/windows-ui-automation/copilot-app/install.prompt.md
```

**VS Code**
```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/windows-ui-automation/vscode/install.prompt.md
```

**Claude Code / Claude Desktop**
```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/windows-ui-automation/claude-code/install.prompt.md
```

**GitHub Copilot CLI**
```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/windows-ui-automation/copilot-cli/install.prompt.md
```

### Option B — Manual copy

| Client | Directory |
|--------|-----------|
| GitHub Copilot Desktop App | `%APPDATA%\com.github.githubapp\app-skills\windows-ui-automation\` |
| VS Code / GitHub Copilot CLI | `%USERPROFILE%\.agents\skills\windows-ui-automation\` |
| Claude Code / Claude Desktop | `%USERPROFILE%\.claude\skills\windows-ui-automation\` |

Copy `SKILL.md`, `uia.ps1`, and `agents\openai.yaml` into that directory, then edit the script path on the `Script:` line in `SKILL.md` to point at the installed `uia.ps1`.

---

## Step 2 — Restart your client

Skills are enumerated when a session starts, so begin a new chat session.

---

## Step 3 — Verify

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.agents\skills\windows-ui-automation\uia.ps1" windows
```

You should see `{"ok":true,"data":[...]}` listing your open windows (adjust the path for your client).

---

## Updating the skill

Re-run the install command from Step 1. It overwrites the files in place.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "running scripts is disabled" | Use `-ExecutionPolicy Bypass` as above, or `Unblock-File <script>`. |
| `AMBIGUOUS_TARGET` | Several windows matched; add `-Title <substring>`. |
| Can't drive an app | Elevated apps can't be driven from a non-elevated terminal. |
| Chrome/Edge/Teams tree is empty | Chromium builds its tree lazily; snapshot twice. |
| Skill doesn't appear | Skills register at session start — begin a new chat session. |
