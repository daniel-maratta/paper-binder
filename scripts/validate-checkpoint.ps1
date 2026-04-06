[CmdletBinding()]
param(
  [ValidateSet("Debug", "Release")]
  [string]$Configuration = "Release",

  [ValidateSet("Auto", "Require", "Skip")]
  [string]$DockerIntegrationMode = "Require",

  [switch]$RunReviewerFullStack
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

$buildScript = Join-Path $PSScriptRoot "build.ps1"
$testScript = Join-Path $PSScriptRoot "test.ps1"
$validateDocsScript = Join-Path $PSScriptRoot "validate-docs.ps1"
$validateLaunchProfilesScript = Join-Path $PSScriptRoot "validate-launch-profiles.ps1"
$reviewerFullStackScript = Join-Path $PSScriptRoot "reviewer-full-stack.ps1"

Write-Host "Checkpoint validation: build"
& $buildScript -Configuration $Configuration

Write-Host ""
Write-Host "Checkpoint validation: tests"
& $testScript -Configuration $Configuration -DockerIntegrationMode $DockerIntegrationMode

Write-Host ""
Write-Host "Checkpoint validation: docs"
& $validateDocsScript

Write-Host ""
Write-Host "Checkpoint validation: launch profiles"
& $validateLaunchProfilesScript

if ($RunReviewerFullStack) {
  Write-Host ""
  Write-Host "Checkpoint validation: reviewer full stack"
  & $reviewerFullStackScript -NoBrowser
}
else {
  Write-Host ""
  Write-Host "Checkpoint validation: skipping reviewer full stack smoke check."
  Write-Host "Use -RunReviewerFullStack when the checkpoint changes runtime or launch behavior."
}

Write-Host ""
Write-Host "Checkpoint validation passed."
Write-Host "Manual VS Code and Visual Studio launch verification must still be recorded separately before checkpoint closeout."
