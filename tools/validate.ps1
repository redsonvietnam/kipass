$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$failed = $false
Get-ChildItem (Join-Path $root 'versions') -Directory | Sort-Object Name | ForEach-Object {
    $dir = $_.FullName
    $js = Join-Path $dir 'content.js'
    $manifest = Join-Path $dir 'manifest.json'
    if (Test-Path $js) {
        node --check $js
        if ($LASTEXITCODE -ne 0) {
            Write-Host "JS syntax FAIL: $($_.Name)"
            $failed = $true
        } else {
            Write-Host "JS syntax PASS: $($_.Name)"
        }
    }
    if (Test-Path $manifest) {
        try {
            $m = Get-Content $manifest -Raw -Encoding UTF8 | ConvertFrom-Json
            if ($m.manifest_version -ne 3) { throw 'manifest_version must be 3' }
            if ($m.version -ne $_.Name.Replace('-preview','').Replace('-stable','')) { throw 'manifest version does not match folder version' }
            Write-Host "Manifest JSON PASS: $($_.Name)"
        } catch {
            Write-Host "Manifest FAIL: $($_.Name) - $($_.Exception.Message)"
            $failed = $true
        }
    } else {
        Write-Host "Manifest absent; source archive only: $($_.Name)"
    }
}
if ($failed) { exit 1 }
Write-Host 'STATIC VALIDATION PASS. Browser behavior is not tested by this script.'