---
name: windows-ui-automation
description: See and operate native Windows desktop apps (Notepad, Teams, Explorer, etc.) through the UI Automation accessibility tree using a built-in PowerShell script. Use when the user wants the agent to read, click, or type in a desktop app on Windows. No external binaries.
---

# Windows UI Automation

Script: `C:\Users\zhanste\.agents\skills\windows-ui-automation\uia.ps1`. Every command prints one JSON object: `{"ok":true,"data":...}` or `{"ok":false,"error":{"code","message"}}`.

Run as: `powershell -NoProfile -File <script> <command> ...`

## Loop

1. `windows` – list open windows (name, process, handle).
2. `snapshot -App <process> [-Title <substr>] -Interactive` – element tree; each element has a `ref` (`e12`). Drop `-Interactive` for the full tree; narrow with `-Depth`.
3. Act on a ref: `click e12`, `set-value e5 "text"`, `get e5`, `focus e5`.
4. Re-snapshot to verify. Refs are only valid for the latest snapshot; on `STALE_REF` snapshot again.

## Commands

| Command | Notes |
|---|---|
| `windows` | List windows |
| `launch <path>` | Start an app |
| `snapshot` | `-App`, `-Title`, `-Depth` (8), `-MaxNodes` (1500), `-Interactive` |
| `click <ref>` | Semantic (Invoke/Select/Toggle/Expand). `-Physical` moves the real mouse as fallback |
| `set-value <ref> <text>` | Needs ValuePattern; otherwise `focus` then `type` |
| `get <ref>` | Value or text content |
| `type <text> -App x` | Focuses window, sends keystrokes (special chars escaped) |
| `press <keys> -App x` | SendKeys syntax: `^c`, `%{F4}`, `{ENTER}`, `{TAB}` |
| `focus <ref or -App x>` | Brings to foreground |
| `screenshot [path] -App x` | PNG of the window |

## Rules

- `AMBIGUOUS_TARGET`: several windows matched; add `-Title`.
- Prefer `set-value`/`click` (no focus stealing) over `type`/`press`/`-Physical`.
- Chromium apps (Chrome, Edge, Teams, VS Code) build trees lazily: snapshot twice, and prefer Playwright for web content.
- Elevated apps cannot be driven from a non-elevated terminal.
- Confirm with the user before destructive or irreversible actions (sending messages, deleting, submitting forms). Snapshots can contain private content; don't log or upload them.
- Never use `alt+f4`/`win+l`-style system shortcuts without asking.
