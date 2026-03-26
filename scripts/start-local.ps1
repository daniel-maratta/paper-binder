[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

Set-PaperBinderDotNetEnvironment

$repoRoot = Get-RepoRoot
$frontendRoot = Join-Path $repoRoot "src/PaperBinder.Web"
$logRoot = Join-Path $repoRoot "logs/local-start"

New-Item -ItemType Directory -Force -Path $logRoot | Out-Null

function Start-BackgroundProcess {
  param(
    [Parameter(Mandatory = $true)]
    [hashtable]$Process,

    [Parameter(Mandatory = $true)]
    [string]$StdoutPath,

    [Parameter(Mandatory = $true)]
    [string]$StderrPath
  )

  $environmentVariables = @{}
  if ($Process.ContainsKey("EnvironmentVariables")) {
    $environmentVariables = $Process.EnvironmentVariables
  }

  $originalEnvironment = @{}
  foreach ($variableName in $environmentVariables.Keys) {
    $originalEnvironment[$variableName] = [Environment]::GetEnvironmentVariable($variableName, "Process")
    [Environment]::SetEnvironmentVariable($variableName, $environmentVariables[$variableName], "Process")
  }

  try {
    return Start-Process `
      -FilePath $Process.FilePath `
      -ArgumentList $Process.Arguments `
      -WorkingDirectory $Process.WorkingDirectory `
      -RedirectStandardOutput $StdoutPath `
      -RedirectStandardError $StderrPath `
      -PassThru
  }
  finally {
    foreach ($variableName in $environmentVariables.Keys) {
      [Environment]::SetEnvironmentVariable($variableName, $originalEnvironment[$variableName], "Process")
    }
  }
}

function Wait-ForProcessReady {
  param(
    [Parameter(Mandatory = $true)]
    [hashtable]$Process,

    [Parameter(Mandatory = $true)]
    [System.Diagnostics.Process]$StartedProcess,

    [Parameter(Mandatory = $true)]
    [string]$StdoutPath
  )

  if (-not $Process.ContainsKey("Readiness")) {
    return
  }

  $deadline = [DateTimeOffset]::UtcNow.AddSeconds(30)

  while ([DateTimeOffset]::UtcNow -lt $deadline) {
    if (-not (Get-Process -Id $StartedProcess.Id -ErrorAction SilentlyContinue)) {
      throw "$($Process.Name) exited before reaching its ready state. Inspect $StdoutPath and the matching stderr log under logs/local-start/."
    }

    $readiness = $Process.Readiness

    if ($readiness.ContainsKey("Url")) {
      try {
        Invoke-WebRequest -Uri $readiness.Url -UseBasicParsing -TimeoutSec 2 | Out-Null
        return
      }
      catch {
        if ($_.Exception.Response) {
          return
        }
      }
    }

    if ($readiness.ContainsKey("StdoutPattern") -and (Test-Path $StdoutPath)) {
      if (Select-String -Path $StdoutPath -Pattern $readiness.StdoutPattern -Quiet) {
        return
      }
    }

    Start-Sleep -Milliseconds 500
  }

  throw "$($Process.Name) did not reach its ready state within 30 seconds. Inspect $StdoutPath and the matching stderr log under logs/local-start/."
}

$processes = @(
  @{
    Name = "api"
    FilePath = "dotnet"
    Arguments = @("run", "--project", "src/PaperBinder.Api", "-c", "Release", "--no-build", "--no-launch-profile")
    WorkingDirectory = $repoRoot
    EnvironmentVariables = @{
      ASPNETCORE_ENVIRONMENT = "Development"
      ASPNETCORE_URLS = "http://localhost:5080"
    }
    Readiness = @{
      Url = "http://localhost:5080"
    }
  },
  @{
    Name = "worker"
    FilePath = "dotnet"
    Arguments = @("run", "--project", "src/PaperBinder.Worker", "-c", "Release", "--no-build", "--no-launch-profile")
    WorkingDirectory = $repoRoot
    EnvironmentVariables = @{
      DOTNET_ENVIRONMENT = "Development"
    }
    Readiness = @{
      StdoutPattern = "Application started\."
    }
  },
  @{
    Name = "web"
    FilePath = Get-NpmCommand
    Arguments = @("run", "dev")
    WorkingDirectory = $frontendRoot
    Readiness = @{
      Url = "http://localhost:5173"
    }
  }
)

foreach ($process in $processes) {
  $stdoutPath = Join-Path $logRoot "$($process.Name).out.log"
  $stderrPath = Join-Path $logRoot "$($process.Name).err.log"

  $startedProcess = Start-BackgroundProcess `
    -Process $process `
    -StdoutPath $stdoutPath `
    -StderrPath $stderrPath

  Write-Host "$($process.Name) started with PID $($startedProcess.Id)."
  Write-Host "  stdout: $stdoutPath"
  Write-Host "  stderr: $stderrPath"

  Wait-ForProcessReady `
    -Process $process `
    -StartedProcess $startedProcess `
    -StdoutPath $stdoutPath
}

Write-Host "API expected at http://localhost:5080 and frontend dev server at http://localhost:5173."
