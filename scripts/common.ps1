Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-RepoRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

function Get-PaperBinderExpectedDotNetSdkVersion {
  $globalJsonPath = Join-Path (Get-RepoRoot) "global.json"
  $globalJson = Get-Content -LiteralPath $globalJsonPath -Raw | ConvertFrom-Json

  return [string]$globalJson.sdk.version
}

function Get-PaperBinderDotNetRollForwardPolicy {
  $globalJsonPath = Join-Path (Get-RepoRoot) "global.json"
  $globalJson = Get-Content -LiteralPath $globalJsonPath -Raw | ConvertFrom-Json

  return [string]$globalJson.sdk.rollForward
}

function Get-PaperBinderExpectedNodeVersion {
  $nvmrcPath = Join-Path (Get-RepoRoot) ".nvmrc"

  return (Get-Content -LiteralPath $nvmrcPath -Raw).Trim()
}

function Get-PaperBinderExpectedNpmVersion {
  $packageJsonPath = Join-Path (Join-Path (Get-RepoRoot) "src/PaperBinder.Web") "package.json"
  $packageJson = Get-Content -LiteralPath $packageJsonPath -Raw | ConvertFrom-Json

  if ([string]::IsNullOrWhiteSpace($packageJson.packageManager)) {
    return $null
  }

  if ($packageJson.packageManager -match "^npm@(.+)$") {
    return $Matches[1]
  }

  return $null
}

function Test-CommandAvailable {
  param(
    [Parameter(Mandatory = $true)]
    [string]$CommandName
  )

  return $null -ne (Get-Command $CommandName -ErrorAction SilentlyContinue)
}

function ConvertTo-CommandArgumentString {
  param(
    [string[]]$Arguments = @()
  )

  $escapedArguments = foreach ($argument in $Arguments) {
    if ($argument -match '[\s"]') {
      '"' + $argument.Replace('"', '\"') + '"'
    }
    else {
      $argument
    }
  }

  return ($escapedArguments -join " ").Trim()
}

function Invoke-CapturedCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,

    [string[]]$Arguments = @(),

    [string]$WorkingDirectory = (Get-RepoRoot)
  )

  $resolvedCommand = Get-Command $FilePath -ErrorAction SilentlyContinue
  $startInfo = New-Object System.Diagnostics.ProcessStartInfo
  $startInfo.WorkingDirectory = $WorkingDirectory
  $startInfo.UseShellExecute = $false
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true

  foreach ($environmentVariable in Get-ChildItem Env:) {
    $startInfo.EnvironmentVariables[$environmentVariable.Name] = $environmentVariable.Value
  }

  if ($null -ne $resolvedCommand -and $resolvedCommand.Path -match '\.(cmd|bat)$') {
    $commandLine = '"' + $resolvedCommand.Path + '"'
    $argumentString = ConvertTo-CommandArgumentString -Arguments $Arguments
    if (-not [string]::IsNullOrWhiteSpace($argumentString)) {
      $commandLine = "$commandLine $argumentString"
    }

    $startInfo.FileName = $env:ComSpec
    $startInfo.Arguments = "/d /s /c `"$commandLine`""
  }
  else {
    $startInfo.FileName = if ($null -ne $resolvedCommand) {
      $resolvedCommand.Path
    }
    else {
      $FilePath
    }

    $startInfo.Arguments = ConvertTo-CommandArgumentString -Arguments $Arguments
  }

  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $startInfo

  try {
    [void]$process.Start()
  }
  catch {
    return [pscustomobject]@{
      ExitCode = -1
      StdOut = ""
      StdErr = $_.Exception.Message
      Output = $_.Exception.Message
    }
  }

  try {
    $stdOut = $process.StandardOutput.ReadToEnd()
    $stdErr = $process.StandardError.ReadToEnd()
    $process.WaitForExit()
    $exitCode = $process.ExitCode
  }
  finally {
    $process.Dispose()
  }

  $trimmedStdOut = $stdOut.TrimEnd()
  $trimmedStdErr = $stdErr.TrimEnd()
  $combinedOutput = @($trimmedStdOut, $trimmedStdErr) |
    Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

  return [pscustomobject]@{
    ExitCode = $exitCode
    StdOut = $trimmedStdOut
    StdErr = $trimmedStdErr
    Output = ($combinedOutput -join [Environment]::NewLine)
  }
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

function Assert-PaperBinderDotNetSdkAvailable {
  $expectedVersion = Get-PaperBinderExpectedDotNetSdkVersion
  $rollForwardPolicy = Get-PaperBinderDotNetRollForwardPolicy
  $result = Invoke-CapturedCommand -FilePath "dotnet" -Arguments @("--version")

  if ($result.ExitCode -ne 0) {
    $details = if ([string]::IsNullOrWhiteSpace($result.Output)) {
      "dotnet --version failed with no output."
    }
    else {
      $result.Output
    }

    throw "Preflight failed: .NET SDK resolution failed for global.json version $expectedVersion (rollForward $rollForwardPolicy).`n$details"
  }

  Write-Host "Preflight: .NET SDK $($result.StdOut) resolved for global.json $expectedVersion (rollForward $rollForwardPolicy)."
}

function Assert-PaperBinderFrontendToolchainAvailable {
  $expectedNodeVersion = Get-PaperBinderExpectedNodeVersion
  $expectedNpmVersion = Get-PaperBinderExpectedNpmVersion

  $nodeResult = Invoke-CapturedCommand -FilePath "node" -Arguments @("--version")
  if ($nodeResult.ExitCode -ne 0) {
    $details = if ([string]::IsNullOrWhiteSpace($nodeResult.Output)) {
      "node --version failed with no output."
    }
    else {
      $nodeResult.Output
    }

    throw "Preflight failed: Node.js $expectedNodeVersion is required by .nvmrc.`n$details"
  }

  $actualNodeVersion = $nodeResult.StdOut.Trim().TrimStart("v")
  if ($actualNodeVersion -ne $expectedNodeVersion) {
    throw "Preflight failed: expected Node.js $expectedNodeVersion from .nvmrc, but found $actualNodeVersion."
  }

  $npmResult = Invoke-CapturedCommand -FilePath (Get-NpmCommand) -Arguments @("--version")
  if ($npmResult.ExitCode -ne 0) {
    $details = if ([string]::IsNullOrWhiteSpace($npmResult.Output)) {
      "npm --version failed with no output."
    }
    else {
      $npmResult.Output
    }

    throw "Preflight failed: npm $expectedNpmVersion is required by src/PaperBinder.Web/package.json.`n$details"
  }

  if (-not [string]::IsNullOrWhiteSpace($expectedNpmVersion) -and $npmResult.StdOut.Trim() -ne $expectedNpmVersion) {
    throw "Preflight failed: expected npm $expectedNpmVersion from src/PaperBinder.Web/package.json, but found $($npmResult.StdOut.Trim())."
  }

  $npmSummaryVersion = if ([string]::IsNullOrWhiteSpace($expectedNpmVersion)) {
    $npmResult.StdOut.Trim()
  }
  else {
    $expectedNpmVersion
  }

  Write-Host "Preflight: Node.js $actualNodeVersion and npm $npmSummaryVersion are available."
}

function Get-PaperBinderDockerAvailability {
  if (-not (Test-CommandAvailable -CommandName "docker")) {
    return [pscustomobject]@{
      Available = $false
      Version = $null
      Reason = "docker is not available on PATH."
    }
  }

  $result = Invoke-CapturedCommand -FilePath "docker" -Arguments @("version", "--format", "{{.Server.Version}}")
  if ($result.ExitCode -ne 0 -or [string]::IsNullOrWhiteSpace($result.StdOut)) {
    $reason = if ([string]::IsNullOrWhiteSpace($result.Output)) {
      "Docker daemon did not return a server version."
    }
    else {
      $result.Output
    }

    return [pscustomobject]@{
      Available = $false
      Version = $null
      Reason = $reason
    }
  }

  return [pscustomobject]@{
    Available = $true
    Version = $result.StdOut.Trim()
    Reason = "Docker daemon $($result.StdOut.Trim()) is available."
  }
}

function Assert-PaperBinderDockerAvailable {
  $availability = Get-PaperBinderDockerAvailability

  if (-not $availability.Available) {
    throw "Preflight failed: Docker is required, but the daemon is unavailable.`n$($availability.Reason)"
  }

  Write-Host "Preflight: Docker daemon $($availability.Version) is available."
  return $availability
}

function Assert-PaperBinderEnvFileExists {
  $envPath = Join-Path (Get-RepoRoot) ".env"

  if (-not (Test-Path -LiteralPath $envPath)) {
    throw "Preflight failed: missing .env at $envPath. Copy .env.example to .env before running Docker-backed local commands."
  }

  Write-Host "Preflight: found .env at $envPath."
}

function Assert-PaperBinderComposeAccess {
  $result = Invoke-CapturedCommand -FilePath "docker" -Arguments @("compose", "config")

  if ($result.ExitCode -ne 0) {
    $details = if ([string]::IsNullOrWhiteSpace($result.Output)) {
      "docker compose config failed with no output."
    }
    else {
      $result.Output
    }

    throw "Preflight failed: docker compose config could not resolve the local stack.`n$details"
  }

  Write-Host "Preflight: docker compose config resolved successfully."
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
    $global:LASTEXITCODE = 0
    & $FilePath @Arguments
    $exitCode = $LASTEXITCODE
  }
  finally {
    Pop-Location
  }

  if ($exitCode -ne 0) {
    throw "Command failed with exit code ${exitCode}: $FilePath $argumentDisplay`nWorking directory: $WorkingDirectory`nIf the tool emitted no body, rerun the printed command directly from that directory for tool-native diagnostics."
  }
}
