# Windows UI Automation Skill

Let your agent read, click, and type in native Windows desktop apps (Notepad, Teams, Explorer, …) through the UI Automation accessibility tree. One PowerShell script, no external binaries, JSON output.

## What it can do

- List open windows and snapshot an app's element tree with stable refs
- Click, set values, read values, focus, type, and press keys
- Take window screenshots

## Install

Paste the matching prompt into your chat (Agent mode):

### GitHub Copilot Desktop App

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/windows-ui-automation/copilot-app/install.prompt.md
```

### VS Code

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/windows-ui-automation/vscode/install.prompt.md
```

### Claude Code / Claude Desktop

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/windows-ui-automation/claude-code/install.prompt.md
```

### GitHub Copilot CLI

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/windows-ui-automation/copilot-cli/install.prompt.md
```

For manual steps, see [INSTALL.md](./INSTALL.md).

## Usage

```
list my open windows
open Notepad and type "hello"
what buttons are in the Calculator window?
```

See [SKILL.md](./SKILL.md) for all commands.

## Good to know

- Windows only; elevated apps can't be driven from a non-elevated terminal.
- Snapshots can contain private on-screen content; don't log or upload them.
- The agent should confirm before destructive or irreversible actions.
