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
$browserE2EScript = Join-Path $PSScriptRoot "run-browser-e2e.ps1"

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

function Invoke-ValidationSearch {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments
  )

  $result = Invoke-CapturedCommand -FilePath "rg" -Arguments $Arguments -WorkingDirectory (Get-RepoRoot)
  Write-CommandOutput -StdOut $result.StdOut -StdErr $result.StdErr

  return $result
}

function Assert-PbEnvIsolation {
  $result = Invoke-ValidationSearch -Arguments @(
    "-n",
    "PB_ENV\s*=\s*Test|PB_ENV=Test",
    "docker-compose.yml",
    "docker-compose.e2e.yml",
    "scripts",
    "src"
  )

  if ($result.ExitCode -gt 1) {
    throw "PB_ENV isolation search failed."
  }

  if ($result.ExitCode -eq 1) {
    throw "Expected PB_ENV=Test to remain isolated to the browser E2E runtime, but no occurrences were found."
  }

  $violations = @(
    $result.StdOut -split "\r?\n" |
      Where-Object {
        -not [string]::IsNullOrWhiteSpace($_) -and
        $_ -notmatch 'docker-compose\.e2e\.yml:' -and
        $_ -notmatch 'scripts[\\/](run-browser-e2e\.ps1):' -and
        $_ -notmatch 'scripts[\\/](validate-checkpoint\.ps1):'
      }
  )

  if ($violations.Count -gt 0) {
    throw "PB_ENV=Test leaked outside the dedicated browser E2E runtime:`n$($violations -join [Environment]::NewLine)"
  }
}

function Assert-E2EFixtureAbsent {
  $repoRoot = Get-RepoRoot
  $frontendDist = Join-Path $repoRoot "src/PaperBinder.Web/dist"
  $apiWwwroot = Join-Path $repoRoot "src/PaperBinder.Api/wwwroot"

  if (-not (Test-Path $frontendDist)) {
    throw "Expected frontend build output at $frontendDist before fixture-absence validation."
  }

  $result = Invoke-ValidationSearch -Arguments @("-n", "e2e-turnstile", $frontendDist, $apiWwwroot)

  if ($result.ExitCode -eq 0) {
    throw "The E2E-only challenge fixture leaked into the default frontend build output or committed wwwroot tree."
  }

  if ($result.ExitCode -gt 1) {
    throw "Fixture-absence validation failed."
  }
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

Write-Host ""
Write-Host "Checkpoint validation: browser runtime isolation"
Assert-PbEnvIsolation
Assert-E2EFixtureAbsent

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
Write-Host "Checkpoint-specific browser E2E suites are not bundled here; run $browserE2EScript separately when the active checkpoint requires it."
Write-Host "Manual VS Code and Visual Studio launch verification must still be recorded separately before checkpoint closeout."
