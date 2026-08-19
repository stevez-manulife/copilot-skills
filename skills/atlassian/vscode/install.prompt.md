# Install instructions for Copilot Agent

You are installing the Atlassian Copilot skill in VS Code. **Minimize shell command approvals** — batch work into as few commands as possible. Target: **2 shell commands total**.

## 1. Download the prompt file (1 command)

```powershell
# Windows
$dir = "$env:APPDATA\Code\User\prompts"; New-Item -ItemType Directory -Path $dir -Force | Out-Null; Invoke-WebRequest "https://raw.githubusercontent.com/stevez-manulife/copilot-skills/main/skills/atlassian/vscode/atlassian.prompt.md" -OutFile "$dir\atlassian.prompt.md"
```

```bash
# Mac
DIR="$HOME/Library/Application Support/Code/User/prompts"; mkdir -p "$DIR" && curl -fsSL https://raw.githubusercontent.com/stevez-manulife/copilot-skills/main/skills/atlassian/vscode/atlassian.prompt.md -o "$DIR/atlassian.prompt.md"
```

```bash
# Linux
DIR="$HOME/.config/Code/User/prompts"; mkdir -p "$DIR" && curl -fsSL https://raw.githubusercontent.com/stevez-manulife/copilot-skills/main/skills/atlassian/vscode/atlassian.prompt.md -o "$DIR/atlassian.prompt.md"
```

Tell the user `/atlassian` is now available (after VS Code reloads / new chat).

## 2. Collect credentials in chat (no shell)

Ask the user for these values in the chat — **do not use shell prompts**:

1. **Atlassian email**
2. **API token** — starts with `ATATT`. If they don't have one, tell them to generate it at https://id.atlassian.com/manage-profile/security/api-tokens with scopes `read:jira-work`, `write:jira-work`, `read:confluence-content.all`, `write:confluence-content` and 90-day expiry
3. **Site URL** — e.g. `your-org.atlassian.net` (no `https://` prefix)

## 3. Write config + fetch cloudId + verify (1 combined command)

Substitute `<EMAIL>`, `<TOKEN>`, `<SITE>` with the values from step 2, then run **one** script:

```powershell
# Windows
$e="<EMAIL>"; $t="<TOKEN>"; $s="<SITE>"
$auth = "Basic " + [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("$e`:$t"))
$h = @{ Authorization=$auth; "User-Agent"="atlassian-skill" }
$cid = (Invoke-RestMethod "https://$s/_edge/tenant_info" -Headers $h).cloudId
$me  = Invoke-RestMethod "https://$s/rest/api/3/myself" -Headers $h
$cfg = @{ email=$e; api_token=$t; site=$s; token=$auth; cloudId=$cid } | ConvertTo-Json
New-Item -ItemType Directory -Path "$env:USERPROFILE\.copilot" -Force | Out-Null
$cfg | Set-Content "$env:USERPROFILE\.copilot\atlassian-config.json"
Write-Host "OK site=$s user=$($me.displayName) cloudId=$cid"
```

```bash
# Mac/Linux
E="<EMAIL>"; T="<TOKEN>"; S="<SITE>"
python3 -c "
import json,base64,os,urllib.request
e,t,s='$E','$T','$S'
auth='Basic '+base64.b64encode(f'{e}:{t}'.encode()).decode()
h={'Authorization':auth,'User-Agent':'atlassian-skill'}
def get(u): return json.loads(urllib.request.urlopen(urllib.request.Request(u,headers=h)).read())
cid=get(f'https://{s}/_edge/tenant_info')['cloudId']
me=get(f'https://{s}/rest/api/3/myself')
os.makedirs(os.path.expanduser('~/.copilot'),exist_ok=True)
json.dump({'email':e,'api_token':t,'site':s,'token':auth,'cloudId':cid},open(os.path.expanduser('~/.copilot/atlassian-config.json'),'w'),indent=2)
print(f'OK site={s} user={me[\"displayName\"]} cloudId={cid}')
"
```

## 4. Show status summary (no shell)

Using the values printed by step 3, show the user:

```
✅ Atlassian skill installed and configured

  Site:    <SITE>
  Account: <displayName>
  CloudId: <cloudId>

Try these next:
  /atlassian my issues                          — list Jira issues assigned to you
  /atlassian issue PROJ-123                     — get issue details
  /atlassian comment PROJ-123 "Looking now"     — add a comment
  /atlassian search "login bug"                 — search Jira
  /atlassian search confluence "deployment"     — search Confluence
```

If step 3 fails with 401/403, the token or scopes are wrong — send them back to https://id.atlassian.com/manage-profile/security/api-tokens.
