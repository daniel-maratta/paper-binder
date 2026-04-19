[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

$repoRoot = Get-RepoRoot
$frontendRoot = Join-Path $repoRoot "src/PaperBinder.Web"
$e2eRootUrl = "http://paperbinder.localhost:5081"
$originalPublicRootUrl = $env:PAPERBINDER_PUBLIC_ROOT_URL
$originalDbHostPort = $env:PAPERBINDER_DB_HOST_PORT
$composeBaseArguments = @(
  "compose",
  "-p",
  "paperbinder-e2e",
  "-f",
  "docker-compose.yml",
  "-f",
  "docker-compose.e2e.yml"
)

function Get-NpxCommand {
  if ($env:OS -eq "Windows_NT") {
    return "npx.cmd"
  }

  return "npx"
}

function Invoke-E2ECompose {
  param(
    [string[]]$Arguments = @()
  )

  Invoke-ExternalCommand -FilePath "docker" -Arguments ($composeBaseArguments + $Arguments) -WorkingDirectory $repoRoot
}

function Start-E2ERuntime {
  Write-Host "Starting isolated frontend browser E2E runtime..."
  Invoke-E2ECompose -Arguments @("up", "-d", "--build", "db", "migrations", "app", "worker")

  Wait-ForUrl -Url "$e2eRootUrl/health/live" -AllowedStatusCodes @(200)
  Wait-ForUrl -Url "$e2eRootUrl/health/ready" -AllowedStatusCodes @(200)
}

function Stop-E2ERuntime {
  Write-Host "Stopping isolated frontend browser E2E runtime..."
  Invoke-E2ECompose -Arguments @("down", "--volumes", "--remove-orphans")
}

function Invoke-PlaywrightSpec {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Label,

    [Parameter(Mandatory = $true)]
    [string]$SpecPath
  )

  Start-E2ERuntime

  try {
    Write-Host "Running $Label Playwright suite..."
    Invoke-ExternalCommand `
      -FilePath (Get-NpxCommand) `
      -Arguments @("playwright", "test", $SpecPath) `
      -WorkingDirectory $frontendRoot
  }
  finally {
    Stop-E2ERuntime
  }
}

function Wait-ForUrl {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Url,

    [Parameter(Mandatory = $true)]
    [int[]]$AllowedStatusCodes
  )

  $deadline = [DateTimeOffset]::UtcNow.AddSeconds(90)

  while ([DateTimeOffset]::UtcNow -lt $deadline) {
    $statusCode = $null

    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
      $statusCode = [int]$response.StatusCode
    }
    catch {
      $response = $_.Exception.Response
      if ($null -ne $response) {
        try {
          $statusCode = [int]$response.StatusCode
        }
        catch {
          $statusCode = $null
        }
      }
    }

    if ($null -ne $statusCode -and $AllowedStatusCodes -contains $statusCode) {
      return
    }

    Start-Sleep -Milliseconds 500
  }

  throw "Timed out waiting for $Url."
}

Assert-PaperBinderEnvFileExists
Assert-PaperBinderFrontendToolchainAvailable
[void](Assert-PaperBinderDockerAvailable)
Assert-PaperBinderComposeAccess

$env:PAPERBINDER_PUBLIC_ROOT_URL = $e2eRootUrl
$env:PAPERBINDER_DB_HOST_PORT = "5433"

Invoke-E2ECompose -Arguments @("down", "--volumes", "--remove-orphans")

try {
  Write-Host "Ensuring Playwright Chromium is available..."
  Invoke-ExternalCommand `
    -FilePath (Get-NpxCommand) `
    -Arguments @("playwright", "install", "chromium") `
    -WorkingDirectory $frontendRoot

  $env:PAPERBINDER_E2E_BASE_URL = $e2eRootUrl

  Invoke-PlaywrightSpec -Label "root-host browser" -SpecPath "e2e/root-host.spec.ts"
  Invoke-PlaywrightSpec -Label "tenant-host browser" -SpecPath "e2e/tenant-host.spec.ts"
}
finally {
  Stop-E2ERuntime

  if ($null -ne $originalPublicRootUrl) {
    $env:PAPERBINDER_PUBLIC_ROOT_URL = $originalPublicRootUrl
  }
  else {
    Remove-Item Env:\PAPERBINDER_PUBLIC_ROOT_URL -ErrorAction SilentlyContinue
  }

  if ($null -ne $originalDbHostPort) {
    $env:PAPERBINDER_DB_HOST_PORT = $originalDbHostPort
  }
  else {
    Remove-Item Env:\PAPERBINDER_DB_HOST_PORT -ErrorAction SilentlyContinue
  }
}
