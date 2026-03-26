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
$frontendRoot = Join-Path $repoRoot "src/PaperBinder.Web"

Invoke-ExternalCommand -FilePath (Get-NpmCommand) -Arguments @("run", "build") -WorkingDirectory $frontendRoot
Invoke-ExternalCommand -FilePath "dotnet" -Arguments @("build", "PaperBinder.sln", "-c", $Configuration, "--no-restore") -WorkingDirectory $repoRoot
