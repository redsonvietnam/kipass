$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$source = Get-Content (Join-Path $root 'versions\1.1.1-preview\content.js') -Raw -Encoding UTF8
$checks = [ordered]@{
    'Hidden buttons are excluded from theme styling' = $source.Contains('button:not([hidden])')
    'Smartlink gate is detected' = $source.Contains('function hasSmartlinkGate()')
    'Smartlink gate blocks auto-Continue' = $source.Contains('hasChallenge() || hasSmartlinkGate()')
    'Ready indicator is suppressed on smartlink gate' = $source.Contains("!hasSmartlinkGate() && continueState()")
    'Manual smartlink status is displayed' = $source.Contains('SMARTLINK ACTIONS STAY MANUAL')
}
$failed = $false
foreach($item in $checks.GetEnumerator()){
    if($item.Value){Write-Host "PASS: $($item.Key)"}
    else{Write-Host "FAIL: $($item.Key)";$failed=$true}
}
if($failed){exit 1}
Write-Host '1.1.1 PREVIEW REGRESSION CHECKS PASS.'