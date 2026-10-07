# Installation Guide: Figma Skill

Installs the Figma skill so your Copilot agent can read Figma designs through the Figma REST API and implement them as code.

---

## Prerequisites

1. A **Figma account** with access to the files you want to implement
2. **PowerShell** (Windows, pre-installed) or **bash** (Mac/Linux)
3. Outbound HTTPS access to `api.figma.com`

---

## Step 1: Create and store a Figma token

### 1a. Create a personal access token in Figma

1. Open Figma in the browser (https://www.figma.com) or the desktop app and sign in.
2. In the file browser, click your **account name / avatar** (top-left) and choose **Settings**.
3. Open the **Security** tab and scroll to **Personal access tokens**.
4. Click **Generate new token** and fill in:
   - **Name**: something recognisable, e.g. `copilot-figma-skill`
   - **Expiration**: the shortest period your team is comfortable with (e.g. 30 or 90 days)
   - **Scopes**: **File content: Read-only**. Leave every other scope at **No access**.
5. Click **Generate token** and **copy it immediately**. Figma shows it only once; if you lose it, generate a new one.

The token starts with `figd_`. Treat it like a password: don't paste it into chat, commit it, or share it.

### 1b. Store the token on your computer

The skill reads the token from the `FIGMA_TOKEN` environment variable. Pick one method.

**Windows: PowerShell (recommended)**

```powershell
# Persists for your user account; no admin rights needed
[Environment]::SetEnvironmentVariable('FIGMA_TOKEN','<paste-token-here>','User')
```

**Windows: GUI**

1. Press **Win**, type **environment variables**, and open **Edit environment variables for your account**.
2. Under **User variables**, click **New...**.
3. Variable name: `FIGMA_TOKEN`. Variable value: your token. Click **OK** twice.

**Mac (zsh, the default shell)**

```bash
echo 'export FIGMA_TOKEN=<paste-token-here>' >> ~/.zshrc
source ~/.zshrc
```

**Linux (bash)**

```bash
echo 'export FIGMA_TOKEN=<paste-token-here>' >> ~/.bashrc
source ~/.bashrc
```

After setting it, **restart your Copilot client** (VS Code, the Copilot app, or your terminal). Programs started before the change won't see the new variable.

### 1c. Verify the token

```powershell
Invoke-RestMethod https://api.figma.com/v1/me -Headers @{'X-Figma-Token'=[Environment]::GetEnvironmentVariable('FIGMA_TOKEN','User')} | Select-Object handle,email
```

```bash
curl -fsS -H "X-Figma-Token: $FIGMA_TOKEN" https://api.figma.com/v1/me | jq '{handle,email}'
```

It should print your Figma name and email.

### Rotating or revoking the token

When the token expires or may have leaked: in Figma **Settings > Security > Personal access tokens**, revoke the old token, generate a new one, and repeat step 1b with the new value.

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
