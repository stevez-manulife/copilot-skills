# Installation Guide: Figma Skill

Installs the Figma skill so your Copilot agent can read Figma designs through the Figma REST API and implement them as code.

---

## Prerequisites

1. A **Figma account** with access to the files you want to implement
2. **PowerShell** (Windows, pre-installed) or **bash** (Mac/Linux)
3. Outbound HTTPS access to `api.figma.com`

---

## Step 1: Create and store a Figma token

1. In Figma: **Settings > Security > Personal access tokens > Generate new token**.
2. Scope: **File content: Read-only**. Pick an expiry that suits your policy.
3. Store it as an environment variable. **Don't paste it into chat.**

```powershell
# Windows (persists for your user account)
[Environment]::SetEnvironmentVariable('FIGMA_TOKEN','<token>','User')
```

```bash
# Mac/Linux
echo 'export FIGMA_TOKEN=<token>' >> ~/.zshrc   # or ~/.bashrc
source ~/.zshrc
```

Verify:

```powershell
Invoke-RestMethod https://api.figma.com/v1/me -Headers @{'X-Figma-Token'=[Environment]::GetEnvironmentVariable('FIGMA_TOKEN','User')} | Select-Object handle,email
```

```bash
curl -fsS -H "X-Figma-Token: $FIGMA_TOKEN" https://api.figma.com/v1/me | jq '{handle,email}'
```

---

## Step 2: Install the skill

### Option A: One-shot install (easiest)

Open your Copilot client in **Agent mode** and paste the line for your client:

**VS Code Copilot Chat**
```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/figma/vscode/install.prompt.md
```

**GitHub Copilot CLI**
```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/figma/copilot-cli/install.prompt.md
```

**GitHub Copilot Desktop App**
```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/figma/copilot-app/install.prompt.md
```

**Claude Code**
```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/figma/claude-code/install.prompt.md
```

### Option B: Manual copy

Pick the directory matching your client:

| Client | Directory |
|--------|-----------|
| GitHub Copilot CLI | `~/.agents/skills/figma/` |
| GitHub Copilot Desktop App (Windows) | `%APPDATA%\com.github.githubapp\app-skills\figma\` |
| GitHub Copilot Desktop App (Mac) | `~/Library/Application Support/com.github.githubapp/app-skills/figma/` |
| Claude Code | `~/.claude/skills/figma/` |
| VS Code Copilot Chat | `%APPDATA%\Code\User\prompts\figma.prompt.md` (single file, from `vscode/figma.prompt.md`) |

```powershell
# Windows: Copilot CLI
git clone --depth 1 https://github.com/stevez-manulife/copilot-skills.git $env:TEMP\cs
$d = "$env:USERPROFILE\.agents\skills\figma"
New-Item -ItemType Directory -Path $d, "$d\agents" -Force
Copy-Item "$env:TEMP\cs\skills\figma\SKILL.md" "$d\SKILL.md"
Copy-Item "$env:TEMP\cs\skills\figma\agents\openai.yaml" "$d\agents\openai.yaml"
Remove-Item "$env:TEMP\cs" -Recurse -Force
```

```bash
# Mac/Linux: Copilot CLI
git clone --depth 1 https://github.com/stevez-manulife/copilot-skills.git /tmp/cs
D="$HOME/.agents/skills/figma"; mkdir -p "$D/agents"
cp /tmp/cs/skills/figma/SKILL.md "$D/SKILL.md"
cp /tmp/cs/skills/figma/agents/openai.yaml "$D/agents/openai.yaml"
rm -rf /tmp/cs
```

---

## Step 3: Restart your client

Skills are enumerated when a session starts, so start a new chat session for the skill to register. A new session also picks up a newly set `FIGMA_TOKEN`.

---

## Step 4: Verify

In Figma, right-click a frame > **Copy link to selection**, then ask your agent:

```
what colors and fonts does this frame use? <figma link>
```

---

## Updating the skill

Re-run the install command from Step 2. It overwrites `SKILL.md` in place. The token lives in your environment, so nothing else needs preserving.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `403 Forbidden` | Token missing, expired, or revoked, or the file isn't shared with your account. Regenerate the token and re-set `FIGMA_TOKEN`. |
| Agent says `FIGMA_TOKEN` is empty | The session started before the variable was set. Start a new session (restart VS Code for its terminal). |
| `404 Not Found` on a node | Wrong `node-id`. URLs use `12-345`; the API needs `12:345`. Copy the link with **Copy link to selection**. |
| `429 Too Many Requests` | Rate limited. Wait a minute; avoid fetching whole files. |
| TLS / proxy error | Corporate network blocks `api.figma.com`. Ask IT to allow it. |
| Figma MCP tools never appear | Expected under enterprise MCP policy; that's why this skill exists. |
| Skill doesn't appear | Skills register at session start; begin a new chat session. |
