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

function Get-PowerShellInvocation {
  $isWindowsHost = $env:OS -eq "Windows_NT" -or $PSVersionTable.PSEdition -eq "Desktop"

  if ($isWindowsHost) {
    return @{
      FilePath = "powershell"
      BaseArguments = @("-ExecutionPolicy", "Bypass")
    }
  }

  return @{
    FilePath = "pwsh"
    BaseArguments = @()
  }
}

function Invoke-PaperBinderScript {
  param(
    [Parameter(Mandatory = $true)]
    [string]$ScriptPath,

    [string[]]$Arguments = @()
  )

  $powerShellInvocation = Get-PowerShellInvocation
  $commandArguments = @()
  $commandArguments += $powerShellInvocation.BaseArguments
  $commandArguments += @("-File", $ScriptPath)
  $commandArguments += $Arguments

  Invoke-ExternalCommand -FilePath $powerShellInvocation.FilePath -Arguments $commandArguments -WorkingDirectory (Get-RepoRoot)
}

Write-Host "Checkpoint validation: build"
Invoke-PaperBinderScript -ScriptPath $buildScript -Arguments @("-Configuration", $Configuration)

Write-Host ""
Write-Host "Checkpoint validation: tests"
Invoke-PaperBinderScript -ScriptPath $testScript -Arguments @("-Configuration", $Configuration, "-DockerIntegrationMode", $DockerIntegrationMode)

Write-Host ""
Write-Host "Checkpoint validation: docs"
Invoke-PaperBinderScript -ScriptPath $validateDocsScript

Write-Host ""
Write-Host "Checkpoint validation: launch profiles"
Invoke-PaperBinderScript -ScriptPath $validateLaunchProfilesScript

if ($RunReviewerFullStack) {
  Write-Host ""
  Write-Host "Checkpoint validation: reviewer full stack"
  Invoke-PaperBinderScript -ScriptPath $reviewerFullStackScript -Arguments @("-NoBrowser")
}
else {
  Write-Host ""
  Write-Host "Checkpoint validation: skipping reviewer full stack smoke check."
  Write-Host "Use -RunReviewerFullStack when the checkpoint changes runtime or launch behavior."
}

Write-Host ""
Write-Host "Checkpoint validation passed."
Write-Host "Manual VS Code and Visual Studio launch verification must still be recorded separately before checkpoint closeout."
