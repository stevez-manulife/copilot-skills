# Installation Guide

## Prerequisites

1. **GitHub Copilot** — one of:
   - Copilot **desktop app**
   - Copilot **CLI** (`gh copilot` / `~/.agents/skills/`)
   - VS Code Copilot Chat with skill support
2. **Atlassian Cloud account** (e.g. `your-org.atlassian.net`)
3. **Atlassian API token** — generate one at:
   https://id.atlassian.com/manage-profile/security/api-tokens
   > Tip: Set expiry to 90 days (3 months) for long-term use.

---

## Step 1 — Install the skill

### Option A: Via Copilot Chat (easiest)

In the Copilot desktop app chat, type:

```
install skill from https://github.com/stevez-manulife/copilot-skills/tree/main/skills/atlassian
```

Copilot will download and register the skill automatically.

### Option B: Manual — global (all projects, one user)

Install to your user-level skills folder so it's available in every project you open:

- **Windows:** `%USERPROFILE%\.agents\skills\atlassian\`
- **Mac/Linux:** `~/.agents/skills/atlassian/`

Copy the entire `skills/atlassian/` folder contents (including `SKILL.md` and `agents/`) into that location, then restart Copilot.

Quick clone command:
```bash
git clone https://github.com/stevez-manulife/copilot-skills.git /tmp/cs
mkdir -p ~/.agents/skills/atlassian
cp -r /tmp/cs/skills/atlassian/* ~/.agents/skills/atlassian/
```

Windows PowerShell:
```powershell
git clone https://github.com/stevez-manulife/copilot-skills.git $env:TEMP\cs
New-Item -ItemType Directory -Path "$env:USERPROFILE\.agents\skills\atlassian" -Force
Copy-Item "$env:TEMP\cs\skills\atlassian\*" "$env:USERPROFILE\.agents\skills\atlassian\" -Recurse
```

### Option C: Manual — project-only (commit to your repo)

Install into a single repo so only that project sees the skill — and teammates get it automatically when they clone:

```
<your-repo>/.github/skills/atlassian/SKILL.md
```

> This is the official GitHub Copilot project-level skills location. Any repo with a `.github/skills/<name>/SKILL.md` file exposes that skill in Copilot chat when the repo is open.

Alternative project-level location (Copilot CLI / Matt Pocock skills format):

```
<your-repo>/.agents/skills/atlassian/SKILL.md
```

### Copilot desktop app (alternative location)

The desktop app also reads:
- **Windows:** `%APPDATA%\com.github.githubapp\app-skills\atlassian\`
- **Mac:** `~/Library/Application Support/com.github.githubapp/app-skills/atlassian/`

---

---

## Step 2 — Generate an Atlassian API token

Before configuring the skill, you need to generate a personal API token.

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
   > (You'll be signed in with your Atlassian Cloud account)
2. Click **Create API token with scopes**
3. Fill in:
   - **Name** — e.g. `Copilot Skill`
   - **App** — select **Jira** and **Confluence** (both, so the skill has access to each)
   - **Scopes** — select these (all read + write):
     - `read:jira-work`
     - `write:jira-work`
     - `read:confluence-content.all`
     - `write:confluence-content`
   - **Expires in** — set to **90 days** (or your team's max allowed)
4. Click **Create**
5. **Copy the token immediately** — it looks like `ATATT3xFfGF0...` and starts with `ATATT`
   > ⚠️ You will not be able to see the token again after closing the dialog. If lost, revoke and create a new one.
6. Store it somewhere safe temporarily (you'll paste it into the config in the next step).

> **Note:** If your organisation uses SSO for Atlassian, you may need to use `Create API token` (Classic) instead. The scopes above are for the newer scoped-token flow.

---

## Step 3 — Configure the skill

You have **two options** to configure your credentials.

### Option A — Edit the config file directly (best for token rotation)

Copy the template that ships with the skill:

**Windows:**
```powershell
New-Item -ItemType Directory -Path "$env:USERPROFILE\.copilot" -Force
Copy-Item "$env:USERPROFILE\.agents\skills\atlassian\atlassian-config.example.json" "$env:USERPROFILE\.copilot\atlassian-config.json"
notepad "$env:USERPROFILE\.copilot\atlassian-config.json"
```

**Mac/Linux:**
```bash
mkdir -p ~/.copilot
cp ~/.agents/skills/atlassian/atlassian-config.example.json ~/.copilot/atlassian-config.json
$EDITOR ~/.copilot/atlassian-config.json
```

Fill in three fields:
- `email` — your Atlassian account email
- `api_token` — the token you generated in Step 2 (starts with `ATATT...`)
- `site` — e.g. `your-org.atlassian.net`

Leave `token` and `cloudId` empty — the skill auto-fills them on first use.

### Option B — Interactive setup via Copilot chat

In Copilot chat, run:

```
/atlassian setup
```

You will be prompted for:

| Field | Example |
|-------|---------|
| Email | `you@yourcompany.com` |
| API Token | `ATATT3x...` (from Step 2) |
| Site URL | `https://your-org.atlassian.net` |

The skill will:
- Encode your credentials as Basic auth
- Auto-fetch your `cloudId` from Atlassian
- Save config to `~/.copilot/atlassian-config.json`

> **Security note:** Your credentials are stored locally on your machine only — never sent anywhere except directly to `atlassian.net` APIs, and never committed to the skill's git repo.

---

## Step 4 — Verify

```
/atlassian status
```

Should show your site URL and cloudId if setup was successful.

---

## Usage Examples

```
/atlassian my issues
/atlassian issue PROJ-123
/atlassian create issue
/atlassian search open bugs in project GRIP
/atlassian search confluence for onboarding guide
```

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `403 Forbidden` / `401 Unauthorized` | API token expired — edit `~/.copilot/atlassian-config.json` and update `api_token`, then clear the `token` field so the skill regenerates it |
| `~/.copilot/atlassian-config.json not found` | Run `/atlassian setup` or copy the example file (see Step 2 Option A) |
| `User-Agent` errors | Skill handles this automatically — update to latest version |
| Token expired | Generate a new one at https://id.atlassian.com/manage-profile/security/api-tokens and paste it into `api_token` in the config file |

---

## Updating

To update to the latest version of the skill, re-run the install command in Copilot chat:

```
install skill from https://github.com/stevez-manulife/copilot-skills/tree/main/skills/atlassian
```
