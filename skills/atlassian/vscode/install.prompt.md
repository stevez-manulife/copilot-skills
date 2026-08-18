# Install instructions for Copilot Agent

You are helping the user install the Atlassian Copilot skill in VS Code. Follow every step in order.

## 1. Install the prompt file

Download this file:
https://raw.githubusercontent.com/stevez-manulife/copilot-skills/main/skills/atlassian/vscode/atlassian.prompt.md

Save it to the VS Code user prompts folder:
- **Windows:** `%APPDATA%\Code\User\prompts\atlassian.prompt.md`
- **Mac:** `~/Library/Application Support/Code/User/prompts/atlassian.prompt.md`
- **Linux:** `~/.config/Code/User/prompts/atlassian.prompt.md`

Create the folder if it does not exist. Verify the file was saved and confirm to the user that `/atlassian` is now available.

## 2. Run interactive setup

Trigger `/atlassian setup` and ask the user for these values, one at a time:

1. **Atlassian email** — their Atlassian account email
2. **API token** — starts with `ATATT`. If they don't have one, tell them to generate it at https://id.atlassian.com/manage-profile/security/api-tokens with scopes `read:jira-work`, `write:jira-work`, `read:confluence-content.all`, `write:confluence-content` and 90-day expiry
3. **Site URL** — e.g. `your-org.atlassian.net` (no `https://` prefix)

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

Create the `~/.copilot/` folder if it doesn't exist.

## 4. Verify

Run these two checks and show the user the output:
- `/atlassian status` — should print site and cloudId
- `/atlassian my issues` — should list Jira issues assigned to the user

If either fails, check that the API token is correct and has the required scopes.
