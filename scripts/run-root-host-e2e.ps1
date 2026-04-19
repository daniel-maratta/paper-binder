[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "scripts/run-root-host-e2e.ps1 is a historical compatibility shim. Use scripts/run-browser-e2e.ps1 as the canonical browser E2E entrypoint."

& (Join-Path $PSScriptRoot "run-browser-e2e.ps1")
