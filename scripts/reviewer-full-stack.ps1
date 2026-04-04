[CmdletBinding()]
param(
  [switch]$NoBrowser
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

$repoRoot = Get-RepoRoot
$envFile = Join-Path $repoRoot ".env"
$startLocalScript = Join-Path $PSScriptRoot "start-local.ps1"

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

function Get-ComposeServiceContainerId {
  param(
    [Parameter(Mandatory = $true)]
    [string]$ServiceName
  )

  $result = Invoke-CapturedCommand -FilePath "docker" -Arguments @("compose", "ps", "-q", $ServiceName) -WorkingDirectory $repoRoot
  if ($result.ExitCode -ne 0) {
    $details = if ([string]::IsNullOrWhiteSpace($result.Output)) {
      "docker compose ps -q $ServiceName failed with no output."
    }
    else {
      $result.Output
    }

    throw "Could not resolve the container id for compose service `$ServiceName`.`n$details"
  }

  return $result.StdOut.Trim()
}

function Assert-ComposeServiceRunning {
  param(
    [Parameter(Mandatory = $true)]
    [string]$ServiceName
  )

  $containerId = Get-ComposeServiceContainerId -ServiceName $ServiceName
  if ([string]::IsNullOrWhiteSpace($containerId)) {
    throw "Compose service `$ServiceName` is not running."
  }

  $inspect = Invoke-CapturedCommand -FilePath "docker" -Arguments @("inspect", "--format", "{{.State.Status}}", $containerId) -WorkingDirectory $repoRoot
  if ($inspect.ExitCode -ne 0) {
    $details = if ([string]::IsNullOrWhiteSpace($inspect.Output)) {
      "docker inspect failed with no output."
    }
    else {
      $inspect.Output
    }

    throw "Could not inspect compose service `$ServiceName`.`n$details"
  }

  if ($inspect.StdOut.Trim() -ne "running") {
    throw "Compose service `$ServiceName` is not running. Current status: $($inspect.StdOut.Trim())"
  }
}

& $startLocalScript

$rootUrl = Get-DotEnvValue -Path $envFile -Key "VITE_PAPERBINDER_ROOT_URL"
if ([string]::IsNullOrWhiteSpace($rootUrl)) {
  throw "VITE_PAPERBINDER_ROOT_URL must be present in .env."
}

$tenantUrl = "$($rootUrl.Replace('://paperbinder.', '://demo.paperbinder.'))/app"
$liveUrl = "$rootUrl/health/live"
$readyUrl = "$rootUrl/health/ready"

Assert-ComposeServiceRunning -ServiceName "proxy"
Assert-ComposeServiceRunning -ServiceName "app"
Assert-ComposeServiceRunning -ServiceName "db"
Assert-ComposeServiceRunning -ServiceName "worker"

$composeStatus = Invoke-CapturedCommand -FilePath "docker" -Arguments @("compose", "ps") -WorkingDirectory $repoRoot
if ($composeStatus.ExitCode -ne 0) {
  $details = if ([string]::IsNullOrWhiteSpace($composeStatus.Output)) {
    "docker compose ps failed with no output."
  }
  else {
    $composeStatus.Output
  }

  throw "Could not read compose status.`n$details"
}

$workerLogs = Invoke-CapturedCommand -FilePath "docker" -Arguments @("compose", "logs", "--no-color", "--tail", "10", "worker") -WorkingDirectory $repoRoot
if ($workerLogs.ExitCode -ne 0) {
  $details = if ([string]::IsNullOrWhiteSpace($workerLogs.Output)) {
    "docker compose logs worker failed with no output."
  }
  else {
    $workerLogs.Output
  }

  throw "Could not read worker logs.`n$details"
}

Write-Host "Reviewer full stack is ready."
Write-Host "  Reviewer URL: $rootUrl"
Write-Host "  Tenant example: $tenantUrl"
Write-Host "  Health (live): $liveUrl"
Write-Host "  Health (ready): $readyUrl"
Write-Host ""
Write-Host "Compose services:"
Write-Host $composeStatus.StdOut
Write-Host ""
Write-Host "Recent worker logs:"
if ([string]::IsNullOrWhiteSpace($workerLogs.StdOut)) {
  Write-Host "  <no worker log lines were returned>"
}
else {
  Write-Host $workerLogs.StdOut
}

if (-not $NoBrowser) {
  Start-Process $rootUrl
  Start-Process $liveUrl
}
