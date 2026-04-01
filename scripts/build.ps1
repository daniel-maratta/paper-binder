[CmdletBinding()]
param(
  [ValidateSet("Debug", "Release")]
  [string]$Configuration = "Release"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

Set-PaperBinderDotNetEnvironment

$repoRoot = Get-RepoRoot

Assert-PaperBinderDotNetSdkAvailable
Assert-PaperBinderFrontendToolchainAvailable

Invoke-ExternalCommand -FilePath "dotnet" -Arguments @("build", "PaperBinder.sln", "-c", $Configuration, "--no-restore") -WorkingDirectory $repoRoot
