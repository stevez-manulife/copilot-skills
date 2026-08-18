# Installation Guide

## Prerequisites

1. **GitHub Copilot desktop app** installed and signed in
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

### Option B: Manual

1. Find your Copilot skills folder:
   - **Windows:** `%APPDATA%\com.github.githubapp\app-skills\`
   - **Mac:** `~/Library/Application Support/com.github.githubapp/app-skills/`

2. Create a folder named `atlassian` inside it.

3. Download [SKILL.md](./SKILL.md) and place it in that folder.

4. Restart the Copilot desktop app.

---

## Step 2 — First-time setup

In Copilot chat, run:

```
/atlassian setup
```

You will be prompted for:

| Field | Example |
|-------|---------|
| Email | `you@yourcompany.com` |
| API Token | `ATATT3x...` (from Atlassian token page) |
| Site URL | `https://your-org.atlassian.net` |

The skill will:
- Encode your credentials as Basic auth
- Auto-fetch your `cloudId` from Atlassian
- Save config to `~/.copilot/atlassian-config.json`

> **Security note:** Your credentials are stored locally on your machine only — never sent anywhere except directly to `atlassian.net` APIs.

---

## Step 3 — Verify

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
| `403 Forbidden` | API token is wrong or expired — re-run `/atlassian setup` |
| `~/.copilot/atlassian-config.json not found` | Run `/atlassian setup` first |
| `User-Agent` errors | Skill handles this automatically — update to latest version |
| Token expired | Generate a new token at https://id.atlassian.com/manage-profile/security/api-tokens |

---

## Updating

To update to the latest version of the skill, re-run the install command in Copilot chat:

```
install skill from https://github.com/stevez-manulife/copilot-skills/tree/main/skills/atlassian
```
