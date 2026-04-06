[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

Set-PaperBinderDotNetEnvironment

$repoRoot = Get-RepoRoot
$frontendRoot = Join-Path $repoRoot "src/PaperBinder.Web"
$restoreProjects = @(
  "src/PaperBinder.Worker/PaperBinder.Worker.csproj",
  "src/PaperBinder.Infrastructure/PaperBinder.Infrastructure.csproj",
  "src/PaperBinder.Migrations/PaperBinder.Migrations.csproj",
  "tests/PaperBinder.UnitTests/PaperBinder.UnitTests.csproj",
  "tests/PaperBinder.IntegrationTests/PaperBinder.IntegrationTests.csproj"
)

Assert-PaperBinderDotNetSdkAvailable
Assert-PaperBinderFrontendToolchainAvailable

foreach ($restoreProject in $restoreProjects) {
  Invoke-DotNetCommand -Arguments @("restore", $restoreProject) -WorkingDirectory $repoRoot
}

Invoke-NpmCommand -Arguments @("ci") -WorkingDirectory $frontendRoot -RetryCount 1
