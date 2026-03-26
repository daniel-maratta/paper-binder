[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

Set-PaperBinderDotNetEnvironment

$repoRoot = Get-RepoRoot
$frontendRoot = Join-Path $repoRoot "src/PaperBinder.Web"

Invoke-ExternalCommand -FilePath "dotnet" -Arguments @("restore", "PaperBinder.sln") -WorkingDirectory $repoRoot
Invoke-ExternalCommand -FilePath (Get-NpmCommand) -Arguments @("ci") -WorkingDirectory $frontendRoot
