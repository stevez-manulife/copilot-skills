# Install instructions for GitHub Copilot Desktop App

You are installing the Atlassian skill for the **GitHub Copilot desktop app**. **Minimize shell command approvals.** Target: **2 shell commands total**.

## 1. Install the skill files (1 command)

```powershell
# Windows
$d="$env:APPDATA\com.github.githubapp\app-skills\atlassian"; $b="https://raw.githubusercontent.com/stevez-manulife/copilot-skills/main/skills/atlassian"; New-Item -ItemType Directory -Path $d,"$d\agents" -Force | Out-Null; Invoke-WebRequest "$b/SKILL.md" -OutFile "$d\SKILL.md"; Invoke-WebRequest "$b/atlassian-config.example.json" -OutFile "$d\atlassian-config.example.json"; Invoke-WebRequest "$b/agents/openai.yaml" -OutFile "$d\agents\openai.yaml"
```

```bash
# Mac
D="$HOME/Library/Application Support/com.github.githubapp/app-skills/atlassian"; B="https://raw.githubusercontent.com/stevez-manulife/copilot-skills/main/skills/atlassian"; mkdir -p "$D/agents" && curl -fsSL "$B/SKILL.md" -o "$D/SKILL.md" && curl -fsSL "$B/atlassian-config.example.json" -o "$D/atlassian-config.example.json" && curl -fsSL "$B/agents/openai.yaml" -o "$D/agents/openai.yaml"
```

Restart the desktop app so it picks up the new skill.

## 2. Collect credentials in chat (no shell)

Ask the user for:

1. **Atlassian email**
2. **API token** — starts with `ATATT`. If missing, generate at https://id.atlassian.com/manage-profile/security/api-tokens with scopes `read:jira-work`, `write:jira-work`, `read:confluence-content.all`, `write:confluence-content` (90-day expiry).
3. **Site URL** — e.g. `your-org.atlassian.net`

## 3. Write config + fetch cloudId + verify (1 combined command)

Substitute `<EMAIL>`, `<TOKEN>`, `<SITE>`, then run **one** script:

```powershell
# Windows
$e="<EMAIL>"; $t="<TOKEN>"; $s="<SITE>"
$auth = "Basic " + [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("$e`:$t"))
$h = @{ Authorization=$auth; "User-Agent"="atlassian-skill" }
$cid = (Invoke-RestMethod "https://$s/_edge/tenant_info" -Headers $h).cloudId
$me  = Invoke-RestMethod "https://$s/rest/api/3/myself" -Headers $h
New-Item -ItemType Directory -Path "$env:USERPROFILE\.copilot" -Force | Out-Null
(@{ email=$e; api_token=$t; site=$s; token=$auth; cloudId=$cid } | ConvertTo-Json) | Set-Content "$env:USERPROFILE\.copilot\atlassian-config.json"
Write-Host "OK site=$s user=$($me.displayName) cloudId=$cid"
```

```bash
# Mac
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
