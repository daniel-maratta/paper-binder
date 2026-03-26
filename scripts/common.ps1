Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-RepoRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

function Set-PaperBinderDotNetEnvironment {
  $repoRoot = Get-RepoRoot
  $dotnetCliHome = Join-Path $repoRoot ".dotnet"

  New-Item -ItemType Directory -Force -Path $dotnetCliHome | Out-Null

  $env:DOTNET_CLI_HOME = $dotnetCliHome
  $env:DOTNET_SKIP_FIRST_TIME_EXPERIENCE = "1"
  $env:DOTNET_CLI_TELEMETRY_OPTOUT = "1"
}

function Get-NpmCommand {
  if ($env:OS -eq "Windows_NT") {
    return "npm.cmd"
  }

  return "npm"
}

function Invoke-ExternalCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,

    [string[]]$Arguments = @(),

    [string]$WorkingDirectory = (Get-RepoRoot)
  )

  $argumentDisplay = ($Arguments -join " ").Trim()
  if ([string]::IsNullOrWhiteSpace($argumentDisplay)) {
    Write-Host "> $FilePath"
  }
  else {
    Write-Host "> $FilePath $argumentDisplay"
  }

  Push-Location $WorkingDirectory
  try {
    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
      throw "Command failed with exit code ${LASTEXITCODE}: $FilePath $argumentDisplay"
    }
  }
  finally {
    Pop-Location
  }
}
