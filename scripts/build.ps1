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
$envPath = Join-Path $repoRoot ".env"
$envExamplePath = Join-Path $repoRoot ".env.example"
$createdTemporaryEnv = $false

if (-not (Test-Path $envPath)) {
  if (-not (Test-Path $envExamplePath)) {
    throw "Missing .env and .env.example at the repo root."
  }

  Copy-Item -LiteralPath $envExamplePath -Destination $envPath
  $createdTemporaryEnv = $true
}

try {
  Invoke-ExternalCommand -FilePath (Get-NpmCommand) -Arguments @("run", "build") -WorkingDirectory $frontendRoot
  Invoke-ExternalCommand -FilePath "dotnet" -Arguments @("build", "PaperBinder.sln", "-c", $Configuration, "--no-restore") -WorkingDirectory $repoRoot
}
finally {
  if ($createdTemporaryEnv -and (Test-Path $envPath)) {
    Remove-Item -LiteralPath $envPath -Force
  }
}
