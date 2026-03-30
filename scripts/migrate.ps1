[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

$repoRoot = Get-RepoRoot

Assert-PaperBinderEnvFileExists
[void](Assert-PaperBinderDockerAvailable)
Assert-PaperBinderComposeAccess

Invoke-ExternalCommand -FilePath "docker" -Arguments @("compose", "run", "--rm", "migrations") -WorkingDirectory $repoRoot
