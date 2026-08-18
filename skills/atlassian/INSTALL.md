# Installation Guide — Atlassian Skill for VS Code

This guide installs the Atlassian skill as a **VS Code Copilot Chat prompt file**, so you can invoke `/atlassian` in VS Code's Copilot chat panel.

> Other Copilot clients (CLI, desktop app) will be documented in follow-up guides. For now: **VS Code only**.

---

## Prerequisites

1. **VS Code** with **GitHub Copilot** and **GitHub Copilot Chat** extensions installed
2. **Atlassian Cloud account** (`*.atlassian.net` — not Data Center/Server)
3. **PowerShell** (Windows, pre-installed) or **bash** (Mac/Linux)

---

## Step 1 — Generate an Atlassian API token

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click **Create API token with scopes**
3. Fill in:
   - **Name** — e.g. `VS Code Copilot Skill`
   - **App** — select **Jira** and **Confluence**
   - **Scopes** — check all four:
     - `read:jira-work`
     - `write:jira-work`
     - `read:confluence-content.all`
     - `write:confluence-content`
   - **Expires in** — set to **90 days** (or your team's max)
4. Click **Create**
5. **Copy the token immediately** — starts with `ATATT3xFfGF0...`
   > ⚠️ You cannot view it again after closing the dialog. If lost, revoke and create a new one.

Keep this token in a safe place — you'll paste it into the config file in Step 3.

---

## Step 2 — Install the prompt file

VS Code prompt files can be installed in two places:

| Scope | Location | Available in |
|-------|----------|--------------|
| **User-wide (recommended)** | `%APPDATA%\Code\User\prompts\atlassian.prompt.md` | All your VS Code workspaces |
| **Project-only** | `<repo>/.github/prompts/atlassian.prompt.md` | Just this repo — teammates get it via git |

### Option A — One-shot install (easiest)

Open VS Code Copilot Chat in **Agent mode** and paste:

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/atlassian/vscode/install.prompt.md
```

Copilot Agent will read the file and walk through the whole install: downloading the prompt file, saving it to your VS Code prompts folder, running `/atlassian setup`, asking for your credentials, and verifying everything works.

> Requires **Agent mode** (terminal + edit tool access). Switch modes from the dropdown at the top of the chat panel.

### Option B — Manual copy (Windows PowerShell)

```powershell
git clone --depth 1 https://github.com/stevez-manulife/copilot-skills.git $env:TEMP\cs
New-Item -ItemType Directory -Path "$env:APPDATA\Code\User\prompts" -Force
Copy-Item "$env:TEMP\cs\skills\atlassian\vscode\atlassian.prompt.md" "$env:APPDATA\Code\User\prompts\atlassian.prompt.md"
Remove-Item "$env:TEMP\cs" -Recurse -Force
```

### Option C — Manual copy (Mac/Linux)

```bash
git clone --depth 1 https://github.com/stevez-manulife/copilot-skills.git /tmp/cs
mkdir -p ~/Library/Application\ Support/Code/User/prompts
cp /tmp/cs/skills/atlassian/vscode/atlassian.prompt.md ~/Library/Application\ Support/Code/User/prompts/atlassian.prompt.md
rm -rf /tmp/cs
```

### Option D — Project-only install (committed to a repo)

Use this if you want the skill to be available for a specific project and shared with teammates via git:

```powershell
# From your repo root:
git clone --depth 1 https://github.com/stevez-manulife/copilot-skills.git $env:TEMP\cs
New-Item -ItemType Directory -Path ".\.github\prompts" -Force
Copy-Item "$env:TEMP\cs\skills\atlassian\vscode\atlassian.prompt.md" ".\.github\prompts\atlassian.prompt.md"
Remove-Item "$env:TEMP\cs" -Recurse -Force
git add .github/prompts/atlassian.prompt.md
git commit -m "Add /atlassian Copilot skill for Jira & Confluence"
```

VS Code automatically discovers `.prompt.md` files in `Code/User/prompts/` and `.github/prompts/`. No restart needed.

---

## Step 3 — First run: configure credentials

> If you used **Step 2 Option A** (one-shot install prompt), Copilot already ran this step for you interactively. Skip to Step 4.

If you used a manual install (Options B/C/D), configure credentials now:

1. Open VS Code Copilot Chat (`Ctrl+Alt+I` or the chat icon in the sidebar).
2. In the chat input, type:
   ```
   /atlassian setup
   ```
3. Copilot will read the prompt file and **interactively ask you** for:
   - **Email** — your Atlassian account email
   - **API token** — the `ATATT...` token from Step 1
   - **Site** — e.g. `your-org.atlassian.net`
4. Copilot then runs a PowerShell (or bash) snippet that:
   - Base64-encodes your credentials
   - Fetches your `cloudId` from Atlassian
   - Saves everything to `~/.copilot/atlassian-config.json`

Your API token is only stored **locally on your machine** in `~/.copilot/atlassian-config.json` — never sent to the repo, never uploaded anywhere except direct calls to `*.atlassian.net`.

---

## Step 4 — Verify

Type in Copilot Chat:

```
/atlassian status
```

You should see your `site` and `cloudId`. Try a real command:

```
/atlassian my issues
```

---

## Usage Examples

```
/atlassian my issues
/atlassian issue PROJ-123
/atlassian comment PROJ-123
/atlassian search "assignee = currentUser() AND status = 'In Review'"
/atlassian search confluence for "onboarding guide"
/atlassian page 17867538466
```

---

## Rotating an Expired Token

When your API token expires (~90 days):

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens and create a new token
2. Open `~/.copilot/atlassian-config.json` in any editor (VS Code, notepad, etc.)
3. Replace the `api_token` value with the new token
4. Set `token` to `""` (empty) — the skill will re-derive it
5. Save

Next call regenerates the Basic auth header from the new token. No re-setup needed.

---

## Updating the skill

To pull the latest version, re-run the install command from Step 2 (Option A or B) — it overwrites the prompt file.

Your credentials in `~/.copilot/atlassian-config.json` are untouched.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `/atlassian` doesn't appear in Copilot Chat autocomplete | Check the file exists at `%APPDATA%\Code\User\prompts\atlassian.prompt.md` (Windows) or `~/Library/Application Support/Code/User/prompts/atlassian.prompt.md` (Mac). Restart the Copilot Chat panel. |
| `401 Unauthorized` / `403 Forbidden` | Token expired or wrong — see [Rotating an Expired Token](#rotating-an-expired-token). |
| `~/.copilot/atlassian-config.json not found` | Run `/atlassian setup` in Copilot Chat. |
| `410 Gone` on search | You're hitting deprecated Jira v2 API. The prompt file uses `/rest/api/3/search/jql` (POST) — make sure you have the latest version. |
| Prompt file not detected | Check VS Code setting `chat.promptFiles` is enabled: `Ctrl+,` → search "prompt files" → tick the box. |
