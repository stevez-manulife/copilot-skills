# Install instructions for Copilot Agent (VS Code)

You are installing the Figma Copilot skill in VS Code. **Minimize shell command approvals.** Target: **2 shell commands total**.

## 0. Derive the raw base URL from where you fetched this file

You were told to follow instructions at a URL like:

```
https://github.com/{OWNER}/{REPO}/blob/{BRANCH}/skills/figma/vscode/install.prompt.md
```

Extract `{OWNER}`, `{REPO}`, `{BRANCH}` from that URL. Define:

```
RAW_BASE = https://raw.githubusercontent.com/{OWNER}/{REPO}/{BRANCH}
```

Use `{RAW_BASE}` in every download below. **Do not hardcode any GitHub org name.** This lets the same instructions work for any fork.

## 1. Download the prompt file (1 command)

```powershell
# Windows
$dir = "$env:APPDATA\Code\User\prompts"; New-Item -ItemType Directory -Path $dir -Force | Out-Null; Invoke-WebRequest "{RAW_BASE}/skills/figma/vscode/figma.prompt.md" -OutFile "$dir\figma.prompt.md"
```

```bash
# Mac
DIR="$HOME/Library/Application Support/Code/User/prompts"; mkdir -p "$DIR" && curl -fsSL "{RAW_BASE}/skills/figma/vscode/figma.prompt.md" -o "$DIR/figma.prompt.md"
```

```bash
# Linux
DIR="$HOME/.config/Code/User/prompts"; mkdir -p "$DIR" && curl -fsSL "{RAW_BASE}/skills/figma/vscode/figma.prompt.md" -o "$DIR/figma.prompt.md"
```

To scope the skill to one repo instead of your whole profile, write it to `<repo>/.github/prompts/figma.prompt.md` and commit it; teammates then get it via git.

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
- **`NO_TOKEN`** or **`FAIL ... 403`**: tell the user to create a token and set it themselves, then restart VS Code (so its terminal picks up the variable) and rerun the verify:
  1. Figma > Settings > Security > **Personal access tokens** > Generate, scope **File content: Read-only**.
  2. Windows: `[Environment]::SetEnvironmentVariable('FIGMA_TOKEN','<token>','User')`
     Mac/Linux: add `export FIGMA_TOKEN=<token>` to `~/.zshrc` or `~/.bashrc`.
- **Network / TLS error**: the machine can't reach `api.figma.com`; the user needs to check proxy or firewall access.

## 3. Show status summary (no shell)

```
✅ Figma skill installed

  Signed in: <handle> <email>

Try these next:
  /figma implement https://www.figma.com/design/<key>/<name>?node-id=12-345
  /figma what colors and fonts does this frame use? <figma link>
  /figma export the icons in this frame as SVG: <figma link>
```

VS Code discovers `.prompt.md` files automatically; no restart needed. If `/figma` doesn't autocomplete, check the setting `chat.promptFiles` is enabled (`Ctrl+,` > search "prompt files").

Mention that the skill needs a Figma link with a `node-id` (right-click a frame > **Copy link to selection**) and that the file must be shared with the token owner.
