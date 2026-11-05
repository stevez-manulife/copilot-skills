#requires -Version 5.1
<#
.SYNOPSIS
  Agent-friendly Windows UI Automation CLI (no external binaries). Every command prints one JSON object.

.EXAMPLE
  .\uia.ps1 windows
  .\uia.ps1 snapshot -App notepad -Interactive
  .\uia.ps1 click 'e12'
  .\uia.ps1 set-value 'e5' 'hello'
#>
param(
  [Parameter(Position = 0, Mandatory = $true)]
  [ValidateSet('windows', 'snapshot', 'click', 'set-value', 'get', 'type', 'press', 'focus', 'screenshot', 'launch')]
  [string]$Command,
  [Parameter(Position = 1)][string]$Target,
  [Parameter(Position = 2)][string]$Value,
  [string]$App,
  [string]$Title,
  [int]$Depth = 8,
  [int]$MaxNodes = 1500,
  [switch]$Interactive,
  [switch]$Physical
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes, System.Windows.Forms, System.Drawing
$AE = [System.Windows.Automation.AutomationElement]
$walker = [System.Windows.Automation.TreeWalker]::ControlViewWalker
$stateFile = Join-Path $env:TEMP 'uia-refs.json'

Add-Type -Namespace Win -Name Native -MemberDefinition @'
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(System.IntPtr h);
[DllImport("user32.dll")] public static extern bool ShowWindow(System.IntPtr h, int n);
[DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
[DllImport("user32.dll")] public static extern void mouse_event(uint f, uint dx, uint dy, uint d, System.UIntPtr e);
'@

function Out-Json($ok, $data, $err) {
  $o = [ordered]@{ ok = $ok }
  if ($ok) { $o.data = $data } else { $o.error = $err }
  $o | ConvertTo-Json -Depth 12 -Compress
  if (-not $ok) { exit 1 }
}

function Get-Windows {
  $root = $AE::RootElement
  foreach ($w in $root.FindAll('Children', [System.Windows.Automation.Condition]::TrueCondition)) {
    $c = $w.Current
    if (-not $c.Name -and -not $c.NativeWindowHandle) { continue }
    $proc = try { (Get-Process -Id $c.ProcessId -ErrorAction Stop).ProcessName } catch { '' }
    [pscustomobject]@{ el = $w; name = $c.Name; process = $proc; pid = $c.ProcessId; handle = $c.NativeWindowHandle }
  }
}

function Select-Window {
  $ws = @(Get-Windows | Where-Object { $_.handle -ne 0 })
  if ($App) { $ws = @($ws | Where-Object { $_.process -like "*$App*" }) }
  if ($Title) { $ws = @($ws | Where-Object { $_.name -like "*$Title*" }) }
  if ($ws.Count -eq 0) { Out-Json $false $null @{ code = 'WINDOW_NOT_FOUND'; message = 'No window matched; run `windows` to list.' } }
  if ($ws.Count -gt 1 -and -not $Title) {
    Out-Json $false $null @{ code = 'AMBIGUOUS_TARGET'; message = 'Multiple windows matched; add -Title.'; candidates = @($ws | ForEach-Object { @{ name = $_.name; process = $_.process; handle = $_.handle } }) }
  }
  $ws[0]
}

function Is-Interactive($el) {
  $t = $el.Current.ControlType.ProgrammaticName -replace '^ControlType\.', ''
  return ($t -in 'Button', 'CheckBox', 'ComboBox', 'Edit', 'Hyperlink', 'ListItem', 'MenuItem', 'RadioButton', 'Slider', 'Spinner', 'Tab', 'TabItem', 'TreeItem', 'SplitButton', 'Document')
}

function Save-State($handle, $refs) {
  @{ handle = $handle; refs = $refs } | ConvertTo-Json -Depth 5 -Compress | Set-Content -Path $stateFile -Encoding UTF8
}

function Get-State {
  if (-not (Test-Path $stateFile)) { Out-Json $false $null @{ code = 'STALE_REF'; message = 'No snapshot yet; run `snapshot` first.' } }
  Get-Content $stateFile -Raw | ConvertFrom-Json
}

function Resolve-Ref($ref) {
  $st = Get-State
  $want = $st.refs.$ref
  if (-not $want) { Out-Json $false $null @{ code = 'INVALID_ARGS'; message = "Unknown ref '$ref'. Refs come from the latest snapshot." } }
  $win = $AE::FromHandle([IntPtr][int]$st.handle)
  $count = 0
  $stack = New-Object System.Collections.Stack
  $stack.Push($win)
  while ($stack.Count -gt 0 -and $count -lt 8000) {
    $n = $stack.Pop(); $count++
    if ((($n.GetRuntimeId()) -join ',') -eq $want) { return $n }
    $ch = $walker.GetFirstChild($n)
    while ($ch) { $stack.Push($ch); $ch = $walker.GetNextSibling($ch) }
  }
  Out-Json $false $null @{ code = 'STALE_REF'; message = 'Element no longer exists; take a new snapshot.' }
}

function Focus-Handle($h) {
  [Win.Native]::ShowWindow([IntPtr]$h, 9) | Out-Null
  [Win.Native]::SetForegroundWindow([IntPtr]$h) | Out-Null
  Start-Sleep -Milliseconds 200
}

$script:i = 0
$script:refs = @{}
function Walk($el, $d) {
  if ($script:i -ge $MaxNodes -or $d -gt $Depth) { return $null }
  $c = $el.Current
  $type = $c.ControlType.ProgrammaticName -replace '^ControlType\.', ''
  $node = $null
  if ((-not $Interactive) -or (Is-Interactive $el)) {
    $script:i++
    $ref = "e$($script:i)"
    $script:refs[$ref] = ($el.GetRuntimeId()) -join ','
    $node = [ordered]@{ ref = $ref; role = $type; name = $c.Name }
    if ($c.AutomationId) { $node.id = $c.AutomationId }
    if (-not $c.IsEnabled) { $node.disabled = $true }
    if ($c.IsOffscreen) { $node.offscreen = $true }
    $p = $null
    if ($el.TryGetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern, [ref]$p)) { $node.value = $p.Current.Value }
  }
  $kids = @()
  $ch = $walker.GetFirstChild($el)
  while ($ch) {
    $k = Walk $ch ($d + 1)
    if ($k) { $kids += $k }
    $ch = $walker.GetNextSibling($ch)
  }
  if ($node) {
    if ($kids) { $node.children = $kids }
    return $node
  }
  if ($kids) { return , $kids }
  return $null
}

switch ($Command) {
  'windows' {
    Out-Json $true @(Get-Windows | Where-Object { $_.handle -ne 0 } | ForEach-Object { @{ name = $_.name; process = $_.process; pid = $_.pid; handle = $_.handle } }) $null
  }

  'launch' {
    if (-not $Target) { Out-Json $false $null @{ code = 'INVALID_ARGS'; message = 'launch <path-or-name>' } }
    $p = Start-Process -FilePath $Target -PassThru
    Start-Sleep -Seconds 2
    Out-Json $true @{ pid = $p.Id } $null
  }

  'snapshot' {
    $w = Select-Window
    $tree = Walk $w.el 0
    Save-State $w.handle $script:refs
    Out-Json $true @{ window = $w.name; process = $w.process; handle = $w.handle; ref_count = $script:refs.Count; truncated = ($script:i -ge $MaxNodes); tree = $tree } $null
  }

  'click' {
    $el = Resolve-Ref $Target
    $used = $null
    foreach ($pair in @(
        @([System.Windows.Automation.InvokePattern]::Pattern, 'Invoke'),
        @([System.Windows.Automation.SelectionItemPattern]::Pattern, 'Select'),
        @([System.Windows.Automation.TogglePattern]::Pattern, 'Toggle'),
        @([System.Windows.Automation.ExpandCollapsePattern]::Pattern, 'Expand'))) {
      $p = $null
      if ($el.TryGetCurrentPattern($pair[0], [ref]$p)) {
        switch ($pair[1]) { 'Invoke' { $p.Invoke() } 'Select' { $p.Select() } 'Toggle' { $p.Toggle() } 'Expand' { $p.Expand() } }
        $used = $pair[1]; break
      }
    }
    if (-not $used -and $Physical) {
      Focus-Handle (Get-State).handle
      $r = $el.Current.BoundingRectangle
      [Win.Native]::SetCursorPos([int]($r.X + $r.Width / 2), [int]($r.Y + $r.Height / 2)) | Out-Null
      [Win.Native]::mouse_event(2, 0, 0, 0, [UIntPtr]::Zero); [Win.Native]::mouse_event(4, 0, 0, 0, [UIntPtr]::Zero)
      $used = 'PhysicalClick'
    }
    if (-not $used) { Out-Json $false $null @{ code = 'ACTION_NOT_SUPPORTED'; message = 'No semantic pattern; retry with -Physical (moves the real mouse).' } }
    Out-Json $true @{ action = $used } $null
  }

  'set-value' {
    $el = Resolve-Ref $Target
    $p = $null
    if ($el.TryGetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern, [ref]$p)) {
      $p.SetValue($Value); Out-Json $true @{ action = 'SetValue' } $null
      exit 0
    }
    Out-Json $false $null @{ code = 'ACTION_NOT_SUPPORTED'; message = 'Element has no ValuePattern; focus it and use `type`.' }
  }

  'get' {
    $el = Resolve-Ref $Target
    $c = $el.Current
    $d = [ordered]@{ name = $c.Name; role = ($c.ControlType.ProgrammaticName -replace '^ControlType\.', ''); enabled = $c.IsEnabled }
    $p = $null
    if ($el.TryGetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern, [ref]$p)) { $d.value = $p.Current.Value }
    if ($el.TryGetCurrentPattern([System.Windows.Automation.TextPattern]::Pattern, [ref]$p)) { $d.text = $p.DocumentRange.GetText(20000) }
    Out-Json $true $d $null
  }

  'focus' {
    if ($Target -match '^e\d+$') { (Resolve-Ref $Target).SetFocus() }
    else { $w = Select-Window; Focus-Handle $w.handle }
    Out-Json $true @{ action = 'Focus' } $null
  }

  'type' {
    $w = Select-Window; Focus-Handle $w.handle
    [System.Windows.Forms.SendKeys]::SendWait([regex]::Replace($Target, '[+^%~(){}\[\]]', '{$0}'))
    Out-Json $true @{ action = 'Type' } $null
  }

  'press' {
    $w = Select-Window; Focus-Handle $w.handle
    [System.Windows.Forms.SendKeys]::SendWait($Target)
    Out-Json $true @{ action = 'Press' } $null
  }

  'screenshot' {
    $w = Select-Window
    $r = $w.el.Current.BoundingRectangle
    $path = if ($Target) { $Target } else { Join-Path $env:TEMP 'uia-shot.png' }
    $bmp = New-Object System.Drawing.Bitmap ([int]$r.Width), ([int]$r.Height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CopyFromScreen([int]$r.X, [int]$r.Y, 0, 0, $bmp.Size)
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png); $g.Dispose(); $bmp.Dispose()
    Out-Json $true @{ path = $path } $null
  }
}
