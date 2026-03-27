[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

$repoRoot = Get-RepoRoot
$envFile = Join-Path $repoRoot ".env"

if (-not (Test-Path $envFile)) {
  throw "Missing .env at $envFile. Copy .env.example to .env before starting the local stack."
}

function Get-DotEnvValue {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,

    [Parameter(Mandatory = $true)]
    [string]$Key
  )

  $line = Select-String -Path $Path -Pattern "^$([Regex]::Escape($Key))=(.*)$" | Select-Object -First 1
  if ($null -eq $line) {
    return $null
  }

  return $line.Matches[0].Groups[1].Value.Trim()
}

function Wait-ForUrl {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Url,

    [Parameter(Mandatory = $true)]
    [int[]]$AllowedStatusCodes
  )

  $deadline = [DateTimeOffset]::UtcNow.AddSeconds(60)

  while ([DateTimeOffset]::UtcNow -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
      if ($AllowedStatusCodes -contains [int]$response.StatusCode) {
        return
      }
    }
    catch {
      $statusCode = $_.Exception.Response.StatusCode.value__
      if ($AllowedStatusCodes -contains $statusCode) {
        return
      }
    }

    Start-Sleep -Milliseconds 500
  }

  throw "Timed out waiting for $Url."
}

$rootUrl = Get-DotEnvValue -Path $envFile -Key "VITE_PAPERBINDER_ROOT_URL"
if ([string]::IsNullOrWhiteSpace($rootUrl)) {
  throw "VITE_PAPERBINDER_ROOT_URL must be present in .env."
}

Invoke-ExternalCommand -FilePath "docker" -Arguments @("compose", "up", "-d", "--build") -WorkingDirectory $repoRoot

$liveUrl = "$rootUrl/health/live"
$readyUrl = "$rootUrl/health/ready"

Wait-ForUrl -Url $liveUrl -AllowedStatusCodes @(200)
Wait-ForUrl -Url $readyUrl -AllowedStatusCodes @(200)

Write-Host "PaperBinder local stack is running."
Write-Host "  Root host: $rootUrl"
Write-Host "  Tenant example: $($rootUrl.Replace('://paperbinder.', '://demo.paperbinder.'))/app"
Write-Host "  Health (live): $liveUrl"
Write-Host "  Health (ready): $readyUrl"
