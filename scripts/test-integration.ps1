[CmdletBinding()]
param(
  [ValidateSet("Debug", "Release")]
  [string]$Configuration = "Release",

  [ValidateSet("Any", "Docker", "NonDocker")]
  [string]$Category = "Any",

  [string]$Filter = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

Set-PaperBinderDotNetEnvironment

$repoRoot = Get-RepoRoot

Assert-PaperBinderDotNetSdkAvailable

if ($Category -eq "Docker") {
  Assert-PaperBinderDockerAvailable | Out-Null
}

$arguments = @(
  "test",
  "tests/PaperBinder.IntegrationTests/PaperBinder.IntegrationTests.csproj",
  "-c",
  $Configuration,
  "--no-build",
  "--no-restore"
)

$filterParts = @()
switch ($Category) {
  "Docker" {
    $filterParts += "Category=Docker"
    break
  }
  "NonDocker" {
    $filterParts += "Category=NonDocker"
    break
  }
}

if (-not [string]::IsNullOrWhiteSpace($Filter)) {
  $filterParts += $Filter.Trim()
}

if ($filterParts.Count -eq 1) {
  $arguments += @("--filter", $filterParts[0])
}
elseif ($filterParts.Count -gt 1) {
  $combinedFilter = (($filterParts | ForEach-Object { "($_)" }) -join "&")
  $arguments += @("--filter", $combinedFilter)
}

Invoke-DotNetCommand -Arguments $arguments -WorkingDirectory $repoRoot
