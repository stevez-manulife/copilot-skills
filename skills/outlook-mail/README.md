# Outlook Mail Skill for GitHub Copilot

Check your inbox, search mail, and read messages directly from Copilot chat — no MCP server, no Microsoft Graph, no sign-in prompts. **Read-only.**

It drives the **classic Outlook** desktop app already on your PC through COM, reading the mailbox Outlook keeps synced. It inherits exactly what Outlook can see.

## What it can do

- List the folder tree with item and unread counts
- List the latest N messages in any folder (Inbox by default)
- Search by subject, sender, and date range
- Read one message body (truncated by default, adjustable)

It cannot send, draft, reply, move, or delete — those are deliberately not implemented.

## Why COM?

On locked-down corporate tenants the usual routes are closed:

| Route | Problem |
|-------|---------|
| MCP server | Not permitted by policy |
| Microsoft Graph with an Azure CLI token | `403 Forbidden` — the tenant blocks `Mail.Read` for the Azure CLI app |
| New Outlook | No COM interface and no local mail file |

Classic Outlook, if installed alongside, syncs the same mailbox and exposes COM — no extra authentication.

## Install

Paste the matching prompt into your Copilot chat (Agent mode):

### GitHub Copilot CLI

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/outlook-mail/copilot-cli/install.prompt.md
```

### GitHub Copilot Desktop App

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/outlook-mail/copilot-app/install.prompt.md
```

### Claude Code

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/outlook-mail/claude-code/install.prompt.md
```

VS Code prompt files are a single file and cannot bundle the script, so VS Code is not supported. For manual steps, see [INSTALL.md](./INSTALL.md).

## Usage

Ask in plain language — the skill is model-invoked:

```
what's in my inbox today?
find emails from Sia about Smart Assistant this week
read the latest unread email
summarize my Sent Items from yesterday
```

Or run the script directly (see [SKILL.md](./SKILL.md) for all actions):

```powershell
.\scripts\outlook.ps1 list -Folder Inbox -Count 10
```

## Requirements

- **Windows** with **classic Outlook** installed (`C:\Program Files\Microsoft Office\Root\Office16\OUTLOOK.EXE`), signed in to your mailbox
- Windows PowerShell 5.1 or later (pre-installed)

## Good to know

- **Stale sync:** just after Outlook starts, the first read may return old mail while the OST is still syncing. The Inbox `list` action warns if the newest item is over 2 days old — wait a minute and retry.
- **Untrusted content:** the agent treats email text as data and does not follow instructions found in messages.
- Nothing is stored or sent anywhere by the skill itself; mail content is read into the chat session only.
