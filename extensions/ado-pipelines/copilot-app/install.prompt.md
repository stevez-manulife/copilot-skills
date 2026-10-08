# Install instructions for GitHub Copilot Desktop App

You are installing the **ADO Pipelines canvas** for the **GitHub Copilot desktop app**. It is an extension (not a skill): a side-panel dashboard of Azure DevOps pipelines, runs, stages, jobs and logs, with a button to queue new runs. **Minimize shell command approvals.** Target: **2 shell commands total**.

Canvases render only in the desktop app. If you are not running in the GitHub Copilot desktop app, stop and tell the user.

## 0. Derive the raw base URL from where you fetched this file

You were told to follow instructions at a URL like:

```
https://github.com/{OWNER}/{REPO}/blob/{BRANCH}/extensions/ado-pipelines/copilot-app/install.prompt.md
```

Extract `{OWNER}`, `{REPO}`, `{BRANCH}` from that URL. Define:

```
RAW_BASE = https://raw.githubusercontent.com/{OWNER}/{REPO}/{BRANCH}
```

Use `{RAW_BASE}` in every download below — **do not hardcode any GitHub org name**. This lets the same instructions work for any fork.

## 1. Install the extension files (1 command)

The files go in the user extensions directory, `$COPILOT_HOME/extensions/ado-pipelines/` (`COPILOT_HOME` defaults to `~/.copilot`). Do not add a `package.json`; the app provides the SDK. Existing settings in the `artifacts/` subfolder are left alone, so rerunning this updates the extension in place.

```powershell
# Windows
$h = if ($env:COPILOT_HOME) { $env:COPILOT_HOME } else { "$env:USERPROFILE\.copilot" }; $d="$h\extensions\ado-pipelines"; $b="{RAW_BASE}/extensions/ado-pipelines"; New-Item -ItemType Directory -Path $d -Force | Out-Null; foreach ($f in "extension.mjs","ado.mjs","repo.mjs","ui.html") { Invoke-WebRequest "$b/$f" -OutFile "$d\$f" }; Get-ChildItem $d -File | Select-Object Name, Length
```

```bash
# Mac/Linux
H="${COPILOT_HOME:-$HOME/.copilot}"; D="$H/extensions/ado-pipelines"; B="{RAW_BASE}/extensions/ado-pipelines"; mkdir -p "$D" && for f in extension.mjs ado.mjs repo.mjs ui.html; do curl -fsSL "$B/$f" -o "$D/$f" || exit 1; done; ls -l "$D"
```

## 2. Verify the Azure CLI login (1 command)

No credentials are collected — the canvas reuses the user's existing `az login` to mint short-lived Azure DevOps tokens.

```powershell
az account show --query "{user:user.name, tenant:tenantId}" -o json
```

Handle the outcome:

- **Prints a user and tenant** — go to step 3.
- **`az` not recognised** — tell the user to install from https://aka.ms/installazurecli, reopen the app, and rerun.
- **`Please run 'az login'`** — tell the user to run `az login`, then rerun.
- **`PermissionError: [Errno 13] ... \.azure\az.sess`** (Windows) — files in `~/.azure` are flagged Hidden, which breaks Python's writes. Offer to fix it, then rerun the verify:

  ```powershell
  Get-ChildItem "$env:USERPROFILE\.azure" -Force -File | ForEach-Object { $_.Attributes = $_.Attributes -band (-bnot [IO.FileAttributes]::Hidden) }
  ```

## 3. Load and open the canvas (no shell)

1. Call the `extensions_reload` tool (search for it with the tool search tool if it isn't loaded). Confirm `ado-pipelines` is listed as **ready**. If it is **failed**, call `extensions_manage` with `operation: "inspect"`, `name: "ado-pipelines"` and report the log tail.
2. Ask the user for their Azure DevOps **organization** (the `{org}` in `dev.azure.com/{org}`) and **project**.
3. Open the canvas: `open_canvas` with `canvasId: "ado-pipelines"`, any `instanceId` (e.g. `ado-pipelines`), and `input: { "organization": "<org>", "project": "<project>" }`. The choice is remembered for next time.

## 4. Show status summary (no shell)

```
✅ ADO Pipelines canvas installed

  Signed in: <user.name>
  Showing:   <org>/<project>

Open it any time by asking:
  open the ADO pipelines canvas
  show pipeline <name>
  show build <id>
  why did build <id> fail?
  run <pipeline> on <branch>
```

Mention that queueing a run always asks for confirmation first, because pipelines often deploy to shared environments.

Also mention that when a session is in a git repository, the canvas shows only pipelines that build that repository. The **Repo** chip in the header clears the filter.
