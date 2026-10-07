# Install instructions for Copilot CLI

You are installing the Figma skill for **GitHub Copilot CLI**. **Minimize shell command approvals.** Target: **2 shell commands total**.

## 0. Derive the raw base URL from where you fetched this file

You were told to follow instructions at a URL like:

```
https://github.com/{OWNER}/{REPO}/blob/{BRANCH}/skills/figma/copilot-cli/install.prompt.md
```

Extract `{OWNER}`, `{REPO}`, `{BRANCH}` from that URL. Define:

```
RAW_BASE = https://raw.githubusercontent.com/{OWNER}/{REPO}/{BRANCH}
```

Use `{RAW_BASE}` in every download below. **Do not hardcode any GitHub org name.** This lets the same instructions work for any fork.

## 1. Install the skill files (1 command)

```powershell
# Windows
$d="$env:USERPROFILE\.agents\skills\figma"; $b="{RAW_BASE}/skills/figma"; New-Item -ItemType Directory -Path $d,"$d\agents" -Force | Out-Null; Invoke-WebRequest "$b/SKILL.md" -OutFile "$d\SKILL.md"; Invoke-WebRequest "$b/agents/openai.yaml" -OutFile "$d\agents\openai.yaml"
```

```bash
# Mac/Linux
D="$HOME/.agents/skills/figma"; B="{RAW_BASE}/skills/figma"; mkdir -p "$D/agents" && curl -fsSL "$B/SKILL.md" -o "$D/SKILL.md" && curl -fsSL "$B/agents/openai.yaml" -o "$D/agents/openai.yaml"
```

## 2. Verify the Figma token (1 command)

The skill reads a Figma personal access token from the `FIGMA_TOKEN` environment variable. **Never ask the user to paste the token into chat, and never print it.**

```powershell
# Windows
$t=[Environment]::GetEnvironmentVariable('FIGMA_TOKEN','User'); if(-not $t){'NO_TOKEN'} else { try { $r=Invoke-RestMethod https://api.figma.com/v1/me -Headers @{'X-Figma-Token'=$t}; "OK $($r.handle) <$($r.email)>" } catch { "FAIL $($_.Exception.Message)" } }
```

```bash
# Mac/Linux
if [ -z "$FIGMA_TOKEN" ]; then echo NO_TOKEN; else curl -fsS -H "X-Figma-Token: $FIGMA_TOKEN" https://api.figma.com/v1/me | jq -r '"OK \(.handle) <\(.email)>"' || echo FAIL; fi
```

Handle the outcome:

- **`OK <name> <email>`**: installed and ready. Go to step 3.
- **`NO_TOKEN`** or **`FAIL ... 403`**: tell the user to create a token and set it themselves, then rerun the verify:
  1. Figma > Settings > Security > **Personal access tokens** > Generate, scope **File content: Read-only**.
  2. Windows: `[Environment]::SetEnvironmentVariable('FIGMA_TOKEN','<token>','User')`
     Mac/Linux: add `export FIGMA_TOKEN=<token>` to `~/.zshrc` or `~/.bashrc`, then `source` it.
- **Network / TLS error**: the machine can't reach `api.figma.com`; the user needs to check proxy or firewall access.

## 3. Show status summary (no shell)

```
✅ Figma skill installed

  Signed in: <handle> <email>

Start a new session for the skill to register, then try:
  implement this design: https://www.figma.com/design/<key>/<name>?node-id=12-345
  what colors and fonts does this frame use? <figma link>
  export the icons in this frame as SVG: <figma link>
```

Mention that the skill needs a Figma link with a `node-id` (right-click a frame > **Copy link to selection**) and that the file must be shared with the token owner.
