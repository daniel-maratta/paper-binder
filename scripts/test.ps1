[CmdletBinding()]
param(
  [ValidateSet("Debug", "Release")]
  [string]$Configuration = "Release",

  [ValidateSet("Auto", "Require", "Skip")]
  [string]$DockerIntegrationMode = "Auto"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

Set-PaperBinderDotNetEnvironment

$repoRoot = Get-RepoRoot

Assert-PaperBinderDotNetSdkAvailable

Write-Host "Running unit tests..."
Invoke-ExternalCommand `
  -FilePath "dotnet" `
  -Arguments @("test", "tests/PaperBinder.UnitTests/PaperBinder.UnitTests.csproj", "-c", $Configuration, "--no-build", "--no-restore") `
  -WorkingDirectory $repoRoot

Write-Host "Running integration tests (non-Docker)..."
Invoke-ExternalCommand `
  -FilePath "dotnet" `
  -Arguments @(
    "test",
    "tests/PaperBinder.IntegrationTests/PaperBinder.IntegrationTests.csproj",
    "-c",
    $Configuration,
    "--no-build",
    "--no-restore",
    "--filter",
    "Category=NonDocker"
  ) `
  -WorkingDirectory $repoRoot

if ($DockerIntegrationMode -eq "Skip") {
  Write-Host "Skipping Docker-backed integration tests because -DockerIntegrationMode Skip was requested."
  return
}

$dockerAvailability = Get-PaperBinderDockerAvailability
if (-not $dockerAvailability.Available) {
  if ($DockerIntegrationMode -eq "Require") {
    throw "Docker-backed integration tests were required, but Docker is unavailable.`n$($dockerAvailability.Reason)"
  }

  Write-Warning "Skipping Docker-backed integration tests because Docker is unavailable. $($dockerAvailability.Reason)"
  return
}

Write-Host "Running integration tests (Docker-backed)..."
Invoke-ExternalCommand `
  -FilePath "dotnet" `
  -Arguments @(
    "test",
    "tests/PaperBinder.IntegrationTests/PaperBinder.IntegrationTests.csproj",
    "-c",
    $Configuration,
    "--no-build",
    "--no-restore",
    "--filter",
    "Category=Docker"
  ) `
  -WorkingDirectory $repoRoot
