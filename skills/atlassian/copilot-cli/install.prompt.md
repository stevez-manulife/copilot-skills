# Install instructions — Copilot CLI

You are helping the user install the Atlassian skill for **GitHub Copilot CLI**. Follow every step in order.

## 1. Install the skill

Copilot CLI reads skills from `~/.agents/skills/<name>/`. Download the raw files directly:

```powershell
# Windows
$dest = "$env:USERPROFILE\.agents\skills\atlassian"
New-Item -ItemType Directory -Path $dest,"$dest\agents" -Force | Out-Null
$base = "https://raw.githubusercontent.com/stevez-manulife/copilot-skills/main/skills/atlassian"
Invoke-WebRequest "$base/SKILL.md"                        -OutFile "$dest\SKILL.md"
Invoke-WebRequest "$base/atlassian-config.example.json"   -OutFile "$dest\atlassian-config.example.json"
Invoke-WebRequest "$base/agents/openai.yaml"              -OutFile "$dest\agents\openai.yaml"
```

```bash
# Mac/Linux
DEST="$HOME/.agents/skills/atlassian"
mkdir -p "$DEST/agents"
BASE="https://raw.githubusercontent.com/stevez-manulife/copilot-skills/main/skills/atlassian"
curl -fsSL "$BASE/SKILL.md"                      -o "$DEST/SKILL.md"
curl -fsSL "$BASE/atlassian-config.example.json" -o "$DEST/atlassian-config.example.json"
curl -fsSL "$BASE/agents/openai.yaml"            -o "$DEST/agents/openai.yaml"
```

Verify `~/.agents/skills/atlassian/SKILL.md` exists.

## 2. Run interactive setup

In a Copilot CLI session, trigger `/atlassian setup` and ask the user for these values, one at a time:

1. **Atlassian email**
2. **API token** — starts with `ATATT`. If they don't have one, tell them to generate it at https://id.atlassian.com/manage-profile/security/api-tokens with scopes `read:jira-work`, `write:jira-work`, `read:confluence-content.all`, `write:confluence-content` and 90-day expiry
3. **Site URL** — e.g. `your-org.atlassian.net`

## 3. Save the config

Compute and save `~/.copilot/atlassian-config.json`:

```json
{
  "email": "<email>",
  "api_token": "<token>",
  "site": "<site>",
  "token": "Basic <base64(email:api_token)>",
  "cloudId": "<fetched from https://<site>/_edge/tenant_info>"
}
```

## 4. Verify

- `/atlassian status` — should print site and cloudId
- `/atlassian my issues` — should list Jira issues
