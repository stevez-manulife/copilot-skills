---
description: "Read Figma designs via the Figma REST API and implement them as code"
name: "figma"
argument-hint: "Paste a Figma link, e.g. 'implement https://www.figma.com/design/<key>/<name>?node-id=12-345'"
---

# Figma Skill (VS Code)

The official Figma MCP server is often **blocked** by enterprise MCP policy. This skill calls the Figma REST API directly with a personal access token stored in the `FIGMA_TOKEN` environment variable.

```
FIGMA_TOKEN (env var)  ->  X-Figma-Token header  ->  https://api.figma.com/v1
```

**Never print, echo, or log the token**, and never ask the user to paste it into chat.

## Setup (every shell)

Each shell call may be a fresh process that predates the variable, so read it from the User scope on Windows:

```powershell
# Windows
$h = @{ 'X-Figma-Token' = [Environment]::GetEnvironmentVariable('FIGMA_TOKEN','User') }
$api = 'https://api.figma.com/v1'
```

```bash
# Mac/Linux (token exported in ~/.zshrc or ~/.bashrc)
H="X-Figma-Token: $FIGMA_TOKEN"; API=https://api.figma.com/v1
```

If the token is missing, or `GET /me` returns 403, stop and tell the user to:

1. Create a token: Figma > Settings > Security > Personal access tokens, scope **File content: Read-only**.
2. Set it themselves (not in chat):
   - Windows: `[Environment]::SetEnvironmentVariable('FIGMA_TOKEN','<token>','User')`
   - Mac/Linux: add `export FIGMA_TOKEN=<token>` to `~/.zshrc` or `~/.bashrc`
3. Start a new session.

## Parse the link

`https://www.figma.com/design/<FILE_KEY>/<name>?node-id=12-345`

- `FILE_KEY` = path segment after `/design/` (or `/file/`, `/proto/`).
- `node-id` in URLs uses `-`; the API uses `:`, so `12-345` becomes `12:345`.
- Branch links (`/design/<FILE_KEY>/branch/<BRANCH_KEY>/...`): use `BRANCH_KEY` as the file key.
- No `node-id`? Fetch `GET /files/{key}?depth=2` to list pages and top-level frames, then ask which frame to implement.

## Workflow

1. **Get the node tree.** Always scope to a node; whole files are huge.
   ```powershell
   $n = Invoke-RestMethod "$api/files/$($key)/nodes?ids=$id&depth=6" -Headers $h
   $n.nodes.$id.document | ConvertTo-Json -Depth 50 | Set-Content "$env:TEMP\figma-node.json"
   ```
   ```bash
   curl -fsS -H "$H" "$API/files/$KEY/nodes?ids=$ID&depth=6" -o /tmp/figma-node.json
   ```
   Read the saved file selectively; it is large. Increase `depth` only if needed.

2. **Render a reference image** and `view` it to see the design:
   ```powershell
   $img = Invoke-RestMethod "$api/images/$($key)?ids=$id&format=png&scale=2" -Headers $h
   Invoke-WebRequest $img.images.$id -OutFile "$env:TEMP\figma-$($id -replace ':','-').png"
   ```
   ```bash
   URL=$(curl -fsS -H "$H" "$API/images/$KEY?ids=$ID&format=png&scale=2" | jq -r ".images[\"$ID\"]")
   curl -fsS "$URL" -o /tmp/figma.png
   ```

3. **Extract design data** from the node JSON:
   - **Layout**: `layoutMode` (HORIZONTAL/VERTICAL = flex row/column), `itemSpacing` (gap), `paddingLeft/Right/Top/Bottom`, `primaryAxisAlignItems` (justify), `counterAxisAlignItems` (align), `layoutSizingHorizontal/Vertical` (FILL/HUG/FIXED), `absoluteBoundingBox` (size).
   - **Color**: `fills[].color` is `{r,g,b,a}` in 0-1; multiply by 255 for hex. Also `strokes`, `strokeWeight`, `cornerRadius`, `effects` (shadows, blurs).
   - **Text**: `characters`, `style.fontFamily`, `fontSize`, `fontWeight`, `lineHeightPx`, `letterSpacing`, `textAlignHorizontal`.
   - **Components**: `type == INSTANCE` with `componentId`; map to existing components in the repo before writing new ones.
   - Skip layers with `visible: false`.

4. **Export icons/assets** as SVG (`ids` is comma-separated):
   ```powershell
   $svg = Invoke-RestMethod "$api/images/$($key)?ids=$iconIds&format=svg" -Headers $h
   $svg.images.PSObject.Properties | % { Invoke-WebRequest $_.Value -OutFile "$($_.Name -replace ':','-').svg" }
   ```

5. **Implement** using the target repo's existing stack, design tokens, and components. Prefer repo tokens over raw hex values. Compare the result visually against the reference PNG.

## Other useful endpoints

| Need | Endpoint |
|---|---|
| Verify token | `GET /me` |
| File outline (pages, frames) | `GET /files/{key}?depth=2` |
| Published styles (colors/text) | `GET /files/{key}/styles` |
| Published components | `GET /files/{key}/components` |
| Variables / design tokens (Enterprise plan only) | `GET /files/{key}/variables/local` |
| Comments | `GET /files/{key}/comments` |
| Image fills used in the file | `GET /files/{key}/images` |

## Gotchas

- PowerShell: write `$($key)?ids=` not `$key?ids=`, so `?` isn't parsed as part of the variable name.
- PowerShell: `ConvertTo-Json` defaults to depth 2; always pass `-Depth 50`.
- `429 Too Many Requests`: wait and retry. Don't fetch whole files.
- Image URLs from `/images` expire; download them immediately.
- `403`: token missing, expired, revoked, or lacks access to that file (it must be shared with the token owner).
