[CmdletBinding()]
param(
  [ValidateSet("Enable", "Disable", "Status")]
  [string]$Mode = "Status"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

$repoRoot = Get-RepoRoot
$envPath = Join-Path $repoRoot ".env"
$backendKey = "PAPERBINDER_CHALLENGE_LOCAL_BYPASS_ENABLED"
$frontendKey = "VITE_PAPERBINDER_CHALLENGE_LOCAL_BYPASS_ENABLED"

function Get-DotEnvBooleanValue {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Content,

    [Parameter(Mandatory = $true)]
    [string]$Key
  )

  $match = [Regex]::Match($Content, "(?m)^$([Regex]::Escape($Key))=(true|false)\s*$")
  if (-not $match.Success) {
    throw "Expected $Key=true|false in $envPath."
  }

  return $match.Groups[1].Value
}

function Set-DotEnvBooleanValue {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Content,

    [Parameter(Mandatory = $true)]
    [string]$Key,

    [Parameter(Mandatory = $true)]
    [ValidateSet("true", "false")]
    [string]$Value
  )

  $pattern = "(?m)^$([Regex]::Escape($Key))=(true|false)\s*$"
  if (-not [Regex]::IsMatch($Content, $pattern)) {
    throw "Expected $Key=true|false in $envPath."
  }

  return [Regex]::Replace($Content, $pattern, "${Key}=${Value}", 1)
}

Assert-PaperBinderEnvFileExists

$content = Get-Content -LiteralPath $envPath -Raw

if ($Mode -eq "Status") {
  $backendValue = Get-DotEnvBooleanValue -Content $content -Key $backendKey
  $frontendValue = Get-DotEnvBooleanValue -Content $content -Key $frontendKey

  Write-Host "$backendKey=$backendValue"
  Write-Host "$frontendKey=$frontendValue"

  if ($backendValue -ne $frontendValue) {
    Write-Warning "The backend and frontend local challenge bypass flags are out of sync."
  }

  return
}

$targetValue = if ($Mode -eq "Enable") { "true" } else { "false" }
$updatedContent = Set-DotEnvBooleanValue -Content $content -Key $backendKey -Value $targetValue
$updatedContent = Set-DotEnvBooleanValue -Content $updatedContent -Key $frontendKey -Value $targetValue

Set-Content -LiteralPath $envPath -Value $updatedContent -Encoding ascii

Write-Host "Set local challenge bypass to $targetValue in $envPath."
Write-Host "Rebuild or restart the relevant app surface before testing with the updated setting."
