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

$testProjects = @(
  "tests/PaperBinder.UnitTests/PaperBinder.UnitTests.csproj",
  "tests/PaperBinder.IntegrationTests/PaperBinder.IntegrationTests.csproj"
)

foreach ($testProject in $testProjects) {
  Invoke-ExternalCommand `
    -FilePath "dotnet" `
    -Arguments @("test", $testProject, "-c", $Configuration, "--no-build", "--no-restore") `
    -WorkingDirectory $repoRoot
}
