[CmdletBinding()]
param(
  [ValidateSet("Restore", "Build", "Test", "LocalStack", "Migrate", "Full")]
  [string]$Profile = "Full",

  [ValidateSet("Auto", "Require", "Skip")]
  [string]$DockerIntegrationMode = "Auto"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

Set-PaperBinderDotNetEnvironment

Write-Host "Running PaperBinder preflight ($Profile)..."

switch ($Profile) {
  "Restore" {
    Assert-PaperBinderDotNetSdkAvailable
    Assert-PaperBinderFrontendToolchainAvailable
  }

  "Build" {
    Assert-PaperBinderDotNetSdkAvailable
    Assert-PaperBinderFrontendToolchainAvailable
  }

  "Test" {
    Assert-PaperBinderDotNetSdkAvailable

    if ($DockerIntegrationMode -eq "Require") {
      [void](Assert-PaperBinderDockerAvailable)
    }
    elseif ($DockerIntegrationMode -eq "Auto") {
      $availability = Get-PaperBinderDockerAvailability
      if ($availability.Available) {
        Write-Host "Preflight: $($availability.Reason)"
      }
      else {
        Write-Warning "Preflight: Docker-backed integration tests will be skipped because Docker is unavailable. $($availability.Reason)"
      }
    }
  }

  "LocalStack" {
    Assert-PaperBinderEnvFileExists
    [void](Assert-PaperBinderDockerAvailable)
    Assert-PaperBinderComposeAccess
  }

  "Migrate" {
    Assert-PaperBinderEnvFileExists
    [void](Assert-PaperBinderDockerAvailable)
    Assert-PaperBinderComposeAccess
  }

  "Full" {
    Assert-PaperBinderDotNetSdkAvailable
    Assert-PaperBinderFrontendToolchainAvailable
    Assert-PaperBinderEnvFileExists
    [void](Assert-PaperBinderDockerAvailable)
    Assert-PaperBinderComposeAccess
  }
}

Write-Host "Preflight passed."
