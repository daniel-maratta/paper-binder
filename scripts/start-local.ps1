[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

$repoRoot = Get-RepoRoot
$envFile = Join-Path $repoRoot ".env"

Assert-PaperBinderEnvFileExists

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

$rootUrl = Get-DotEnvValue -Path $envFile -Key "PAPERBINDER_PUBLIC_ROOT_URL"
if ([string]::IsNullOrWhiteSpace($rootUrl)) {
  $rootUrl = Get-DotEnvValue -Path $envFile -Key "VITE_PAPERBINDER_ROOT_URL"
}

if ([string]::IsNullOrWhiteSpace($rootUrl)) {
  throw "PAPERBINDER_PUBLIC_ROOT_URL (or VITE_PAPERBINDER_ROOT_URL fallback) must be present in .env."
}

if ([string]::IsNullOrWhiteSpace($env:PAPERBINDER_PUBLIC_ROOT_URL)) {
  $env:PAPERBINDER_PUBLIC_ROOT_URL = $rootUrl
}

[void](Assert-PaperBinderDockerAvailable)
Assert-PaperBinderComposeAccess

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
