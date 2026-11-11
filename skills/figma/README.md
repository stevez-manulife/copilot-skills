# Figma Skill for GitHub Copilot

Turn Figma designs into code directly from Copilot chat, with no MCP server. Paste a Figma link and the agent pulls the frame's layout, colors, typography, and a rendered reference image, then implements it with your repo's existing components.

Uses a Figma personal access token (read-only) and calls the Figma REST API directly.

## What it can do

- Fetch a frame's node tree: auto-layout, spacing, padding, sizing
- Extract colors, strokes, corner radii, shadows, and text styles
- Render a frame as PNG for visual reference
- Export icons and assets as SVG
- List a file's pages, frames, published styles, and components
- Read file comments

## Writing to Figma

The token and REST API are **read-only**, so reads and writes work differently. Writing uses the Figma Plugin API with no MCP server. It needs a **Full seat** with edit access to a Design file; a Dev seat cannot write. Pick one method:

### Option A: Figma Desktop bridge (automatic)

A dev plugin in Figma Desktop talks to a small local server (both in `bridge/`), so the agent can write directly and read results back.

One-time setup:

1. In Figma Desktop: **Plugins > Development > Import plugin from manifest...** and choose `bridge/manifest.json` from the installed skill folder.

Each session:

1. Open a Design file you can edit and run **Plugins > Development > Copilot Figma Bridge**. Keep it open.
2. In your Copilot client, ask the agent to start the bridge (`node bridge/server.js`). It prints a token.
3. Paste the token into the plugin window and click **Connect**. The plugin should show "Connected".
4. Ask Copilot to make the change, for example "create a card frame in this file". The agent sends Plugin API scripts to the local server and the plugin runs them.
5. Stop the server when you are done.

Requires Node. The server listens on `127.0.0.1` only and needs the token, but it runs code in your open file, so use it on files you trust.

### Option B: Copilot app browser canvas (no install)

In the **GitHub Copilot app**, the agent opens the file (or a new design) in a browser canvas, signs in through SSO with your Figma account email, and runs `figma.*` JavaScript in the page. Each new panel or session signs in again; complete any password or MFA prompt in the panel yourself, never in chat.

Details for both are in "Writing to Figma" in [SKILL.md](./SKILL.md). For Manulife CDS, pair with the `mux-figma` skill from `manulife-innersource/mux-core`.


## Why not the Figma MCP server?

Figma's official MCP server (remote `https://mcp.figma.com/mcp` or the desktop Dev Mode server) is the richer option where it's allowed. Enterprise Copilot policies (like Manulife's) often block third-party MCP servers, so the Figma tools never appear. This skill needs only outbound HTTPS to `api.figma.com`.

## Before you install: set up your Figma token

1. **Create the token.** In Figma, click your avatar > **Settings > Security > Personal access tokens > Generate new token**. Set scope **File content: Read-only** (everything else **No access**), choose an expiry, and copy the token. It is shown only once.
2. **Store it on your computer** as `FIGMA_TOKEN`. Don't paste it into chat.
   - Windows (PowerShell): `[Environment]::SetEnvironmentVariable('FIGMA_TOKEN','<token>','User')`
   - Mac: `echo 'export FIGMA_TOKEN=<token>' >> ~/.zshrc`
   - Linux: `echo 'export FIGMA_TOKEN=<token>' >> ~/.bashrc`
3. **Restart your Copilot client** so it sees the new variable.

Full steps (including a Windows GUI method, verification, and rotation) are in [INSTALL.md](./INSTALL.md#step-1-create-and-store-a-figma-token).

## Install

Pick your client and paste the matching prompt into your Copilot chat (Agent mode):

### VS Code Copilot Chat

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/figma/vscode/install.prompt.md
```

### GitHub Copilot CLI

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/figma/copilot-cli/install.prompt.md
```

### GitHub Copilot Desktop App

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/figma/copilot-app/install.prompt.md
```

### Claude Code

```
Follow the install instructions at
https://github.com/stevez-manulife/copilot-skills/blob/main/skills/figma/claude-code/install.prompt.md
```

The agent installs the skill to the correct folder for your client and verifies your Figma token.

> Requires **Agent mode** (terminal access).

For manual install steps, see [INSTALL.md](./INSTALL.md).

## Usage

Copy a frame link in Figma (right-click > **Copy link to selection**), then ask:

```
implement this design as a React component: https://www.figma.com/design/<key>/<name>?node-id=12-345
what colors and fonts does this frame use? <figma link>
export the icons in this frame as SVG: <figma link>
```

## Requirements

- A Figma account with access to the file
- A Figma personal access token with **File content: Read-only** scope, stored in the `FIGMA_TOKEN` environment variable (never paste it into chat)
- `jq` for the Mac/Linux examples (optional; PowerShell parses JSON natively)
