<#
.SYNOPSIS
  Read-only access to the classic Outlook mailbox via COM. JSON output.
.EXAMPLE
  .\outlook.ps1 list-folders
  .\outlook.ps1 list -Folder Inbox -Count 10
  .\outlook.ps1 search -Subject invoice -From alice -Since 2026-11-01 -Count 20
  .\outlook.ps1 read -Id <EntryID> -MaxChars 4000
#>
param(
  [Parameter(Mandatory, Position = 0)]
  [ValidateSet('list-folders', 'list', 'search', 'read')]
  [string]$Action,
  [string]$Folder = 'Inbox',
  [int]$Count = 10,
  [string]$Subject,
  [string]$From,
  [string]$Since,
  [string]$Until,
  [string]$Id,
  [int]$MaxChars = 2000
)

$ErrorActionPreference = 'Stop'

$exe = 'C:\Program Files\Microsoft Office\Root\Office16\OUTLOOK.EXE'
if (-not (Test-Path $exe) -and -not (Get-Process OUTLOOK -ErrorAction SilentlyContinue)) {
  Write-Error 'Classic Outlook not found. This skill needs classic Outlook (not New Outlook).'
}

try { $outlook = New-Object -ComObject Outlook.Application }
catch { Write-Error "Cannot start Outlook COM: $($_.Exception.Message)" }
$ns = $outlook.GetNamespace('MAPI')

$defaults = @{
  inbox = 6; sentitems = 5; sent = 5; drafts = 16; deleteditems = 3; deleted = 3
  outbox = 4; junk = 23; junkemail = 23
}

function Resolve-Folder([string]$name) {
  $key = $name.ToLower().Replace(' ', '')
  if ($defaults.ContainsKey($key)) { return $ns.GetDefaultFolder($defaults[$key]) }
  $root = $ns.GetDefaultFolder(6).Parent
  $parts = @($name -split '[\\/]' | Where-Object { $_ })
  $suffix = '\' + ($parts -join '\')
  $queue = New-Object System.Collections.Queue
  foreach ($f in $root.Folders) { $queue.Enqueue($f) }
  while ($queue.Count) {
    $f = $queue.Dequeue()
    if ($f.FolderPath.EndsWith($suffix, [StringComparison]::OrdinalIgnoreCase)) { return $f }
    foreach ($c in $f.Folders) { $queue.Enqueue($c) }
  }
  Write-Error "Folder not found: $name"
}

function Format-Item($m, [bool]$withBody, [int]$max) {
  $o = [ordered]@{
    id          = $m.EntryID
    received    = if ($m.ReceivedTime) { $m.ReceivedTime.ToString('yyyy-MM-dd HH:mm') } else { $null }
    from        = $m.SenderName
    fromAddress = $null
    subject     = $m.Subject
    unread      = [bool]$m.UnRead
    attachments = $m.Attachments.Count
  }
  try { $o.fromAddress = $m.SenderEmailAddress } catch {}
  if ($withBody) {
    $o.to = $m.To
    $o.cc = $m.CC
    $body = [string]$m.Body
    $o.bodyLength = $body.Length
    $o.truncated = $body.Length -gt $max
    $o.body = if ($o.truncated) { $body.Substring(0, $max) } else { $body }
    $o.attachmentNames = @($m.Attachments | ForEach-Object { $_.FileName })
  }
  $o
}

function Esc([string]$s) { $s.Replace("'", "''") }
function Fmt-Date([datetime]$d) { $d.ToString('MM/dd/yyyy hh:mm tt', [Globalization.CultureInfo]::InvariantCulture) }

switch ($Action) {
  'list-folders' {
    $root = $ns.GetDefaultFolder(6).Parent
    $out = New-Object System.Collections.ArrayList
    function Walk($f, $depth) {
      [void]$out.Add([ordered]@{ path = ($f.FolderPath -replace '^\\\\[^\\]+\\', ''); items = $f.Items.Count; unread = $f.UnReadItemCount })
      if ($depth -lt 3) { foreach ($c in $f.Folders) { Walk $c ($depth + 1) } }
    }
    foreach ($f in $root.Folders) { Walk $f 0 }
    ConvertTo-Json -InputObject @($out) -Depth 4
  }
  { $_ -in 'list', 'search' } {
    $f = Resolve-Folder $Folder
    $items = $f.Items
    if ($Action -eq 'search') {
      $dasl = @()
      if ($Subject) { $dasl += """urn:schemas:httpmail:subject"" LIKE '%$(Esc $Subject)%'" }
      if ($From)    { $dasl += """urn:schemas:httpmail:fromname"" LIKE '%$(Esc $From)%'" }
      if ($Since)   { $dasl += """urn:schemas:httpmail:datereceived"" >= '$(Fmt-Date ([datetime]::Parse($Since)))'" }
      if ($Until)   { $dasl += """urn:schemas:httpmail:datereceived"" < '$(Fmt-Date ([datetime]::Parse($Until).AddDays(1)))'" }
      if (-not $dasl) { Write-Error 'search needs at least one of -Subject, -From, -Since, -Until' }
      $items = $items.Restrict('@SQL=' + ($dasl -join ' AND '))
    }
    $items.Sort('[ReceivedTime]', $true)
    $results = New-Object System.Collections.ArrayList
    $m = $items.GetFirst()
    while ($m -and $results.Count -lt $Count) {
      if ($m.Class -eq 43) { [void]$results.Add((Format-Item $m $false 0)) }
      $m = $items.GetNext()
    }
    if ($Action -eq 'list' -and $Folder -eq 'Inbox' -and $results.Count) {
      $newest = [datetime]$results[0].received
      if (((Get-Date) - $newest).TotalDays -gt 2) {
        [Console]::Error.WriteLine("WARNING: newest Inbox item is from $($results[0].received). Outlook may still be syncing the OST; wait and re-run before trusting this.")
      }
    }
    ConvertTo-Json -InputObject @($results) -Depth 4
  }
  'read' {
    if (-not $Id) { Write-Error 'read needs -Id <EntryID>' }
    $m = $ns.GetItemFromID($Id)
    Format-Item $m $true $MaxChars | ConvertTo-Json -Depth 4
  }
}
