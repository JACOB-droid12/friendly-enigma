$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$python = Join-Path $root "backend\.venv\Scripts\python.exe"
$localCmd = Join-Path $root "cmd.exe"
$localNpm = Join-Path $root "npm.cmd"
$localUvExe = Join-Path $root "uv.exe"
$frontendNpm = Join-Path $root "frontend\npm.cmd"
$systemCmd = Join-Path $env:SystemRoot "System32\cmd.exe"
$npmCmd = (Get-Command npm.cmd -ErrorAction Stop).Source
$nodeDir = Split-Path -Parent $npmCmd
$buildDrive = "W:"

if (-not (Test-Path -LiteralPath $python)) {
    throw "Expected Python 3.12.13 release interpreter was not found at backend\.venv\Scripts\python.exe."
}

if (-not (Test-Path -LiteralPath $systemCmd)) {
    throw "Expected Windows command processor was not found at $systemCmd."
}

& $python --version
& $python -m pip install uv
& $python -m uv --version
$venvUvExe = Join-Path (Split-Path -Parent $python) "uv.exe"

if (-not (Test-Path -LiteralPath $localCmd)) {
    Copy-Item -LiteralPath $systemCmd -Destination $localCmd
    Write-Host "Created ignored local cmd.exe shim for Vercel's Windows static-build sandbox."
}

Copy-Item -LiteralPath $venvUvExe -Destination $localUvExe -Force
Write-Host "Wrote ignored local uv.exe shim for Vercel's Windows Python builder."

$npmCmdEscaped = $npmCmd.Replace("%", "%%")
$nodeDirEscaped = $nodeDir.Replace("%", "%%")
Set-Content -LiteralPath $localNpm -Encoding ASCII -Value @(
    "@echo off",
    "set `"PATH=$nodeDirEscaped;%PATH%`"",
    "`"$npmCmdEscaped`" %*",
    "exit /b %ERRORLEVEL%"
)
Write-Host "Wrote ignored local npm.cmd shim for Vercel's Windows static-build sandbox."

Copy-Item -LiteralPath $localNpm -Destination $frontendNpm -Force
Write-Host "Wrote ignored frontend npm.cmd shim for Vercel's Windows static-build sandbox."

$substOutput = & subst
$expectedSubst = "${buildDrive}\: => $root"
$currentSubst = $substOutput | Where-Object { $_ -like "${buildDrive}\: => *" }
if ($currentSubst -and $currentSubst -ne $expectedSubst) {
    throw "$buildDrive is already mapped to another path: $currentSubst"
}
if (-not $currentSubst) {
    & subst $buildDrive $root
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create $buildDrive subst mapping for $root."
    }
    Write-Host "Created $buildDrive subst mapping for Vercel local builds."
}

Write-Host "Release environment ready."
Write-Host "Run local Vercel build from $buildDrive with: npx vercel build --yes"
