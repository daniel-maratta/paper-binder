[CmdletBinding()]
param(
  [string[]]$TestPath = @()
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

$repoRoot = Get-RepoRoot
$frontendRoot = Join-Path $repoRoot "src/PaperBinder.Web"

Assert-PaperBinderFrontendToolchainAvailable

$arguments = @("run", "test")
if ($TestPath.Count -gt 0) {
  $arguments += "--"
  $arguments += $TestPath
}

Invoke-NpmCommand -Arguments $arguments -WorkingDirectory $frontendRoot
