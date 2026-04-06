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

function Write-CommandOutput {
  param(
    [string]$StdOut = "",

    [string]$StdErr = ""
  )

  if (-not [string]::IsNullOrWhiteSpace($StdOut)) {
    Write-Host $StdOut
  }

  if (-not [string]::IsNullOrWhiteSpace($StdErr)) {
    Write-Host $StdErr
  }
}

function Test-DotNetVerbosityArgumentPresent {
  param(
    [string[]]$Arguments = @()
  )

  foreach ($argument in $Arguments) {
    if ($argument -eq "-v" -or $argument -eq "--verbosity" -or $argument.StartsWith("-v:") -or $argument.StartsWith("--verbosity:")) {
      return $true
    }
  }

  return $false
}

function Test-OpaqueDotNetFailure {
  param(
    [string]$Output = ""
  )

  if ([string]::IsNullOrWhiteSpace($Output)) {
    return $true
  }

  $normalized = ($Output -replace '\x1b\[[0-9;]*m', '').Trim()
  if ([string]::IsNullOrWhiteSpace($normalized)) {
    return $true
  }

  $lines = @($normalized -split "\r?\n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
  if ($lines.Count -le 2 -and $normalized -notmatch '(?i)error|exception|warning|MSB\d{4}|NU\d{4}|spawn EPERM|Access to the path') {
    return $true
  }

  return $normalized -match '(?ms)(Build|Restore) FAILED\.\s*0 Warning\(s\)\s*0 Error\(s\)'
}

function Get-DotNetFailureGuidance {
  param(
    [string[]]$Arguments = @(),

    [string]$Output = ""
  )

  if ($Arguments.Count -eq 0 -or -not (Test-OpaqueDotNetFailure -Output $Output)) {
    return ""
  }

  switch ($Arguments[0]) {
    "restore" {
      return "Restore failed without a concrete NuGet or MSBuild error body. If this command is running in a restricted or offline environment, rerun it with normal package-source, network, and filesystem access before treating it as a repo-configuration problem."
    }

    "build" {
      return "Build failed without a concrete MSBuild error body. Rerun the printed command directly with detailed verbosity and make sure no concurrent build, IDE, or runtime process is holding files under obj/ or bin/."
    }

    default {
      return ""
    }
  }
}

function Test-NpmWindowsFileLockFailure {
  param(
    [string]$Output = ""
  )

  if ([string]::IsNullOrWhiteSpace($Output)) {
    return $false
  }

  $normalized = ($Output -replace '\x1b\[[0-9;]*m', '').Trim()
  return $normalized -match '(?i)npm (ERR!|error) code EPERM' -and $normalized -match '(?i)unlink'
}

function Get-NpmFailureGuidance {
  param(
    [string]$Output = ""
  )

  if (Test-NpmWindowsFileLockFailure -Output $Output) {
    return "Windows file-lock detected while npm was updating node_modules. Close Vite, node, IDE, or antivirus-scanning processes that may be holding frontend native modules, then rerun the command. If the lock is transient, retry once more before manually deleting src/PaperBinder.Web/node_modules."
  }

  return ""
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

function Invoke-DotNetCommand {
  param(
    [string[]]$Arguments = @(),

    [string]$WorkingDirectory = (Get-RepoRoot)
  )

  $argumentDisplay = ($Arguments -join " ").Trim()
  if ([string]::IsNullOrWhiteSpace($argumentDisplay)) {
    Write-Host "> dotnet"
  }
  else {
    Write-Host "> dotnet $argumentDisplay"
  }

  $result = Invoke-CapturedCommand -FilePath "dotnet" -Arguments $Arguments -WorkingDirectory $WorkingDirectory
  Write-CommandOutput -StdOut $result.StdOut -StdErr $result.StdErr

  if ($result.ExitCode -eq 0) {
    return
  }

  $details = $result.Output
  if (Test-OpaqueDotNetFailure -Output $details) {
    $diagnosticArguments = @($Arguments)
    if (-not (Test-DotNetVerbosityArgumentPresent -Arguments $diagnosticArguments)) {
      $diagnosticArguments += @("-v", "detailed")
    }

    Write-Host "dotnet returned an opaque failure body; rerunning once with detailed verbosity."
    $diagnosticResult = Invoke-CapturedCommand -FilePath "dotnet" -Arguments $diagnosticArguments -WorkingDirectory $WorkingDirectory
    Write-CommandOutput -StdOut $diagnosticResult.StdOut -StdErr $diagnosticResult.StdErr

    if (-not [string]::IsNullOrWhiteSpace($diagnosticResult.Output)) {
      $details = $diagnosticResult.Output
    }
  }

  if ([string]::IsNullOrWhiteSpace($details)) {
    $details = "dotnet exited non-zero with no captured output."
  }

  $guidance = Get-DotNetFailureGuidance -Arguments $Arguments -Output $details
  if (-not [string]::IsNullOrWhiteSpace($guidance)) {
    $details = "$details`n$guidance"
  }

  throw "Command failed with exit code $($result.ExitCode): dotnet $argumentDisplay`nWorking directory: $WorkingDirectory`n$details"
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

function Invoke-NpmCommand {
  param(
    [string[]]$Arguments = @(),

    [string]$WorkingDirectory = (Get-RepoRoot),

    [int]$RetryCount = 0
  )

  $filePath = Get-NpmCommand
  $argumentDisplay = ($Arguments -join " ").Trim()
  $attempt = 0

  while ($true) {
    if ([string]::IsNullOrWhiteSpace($argumentDisplay)) {
      Write-Host "> $filePath"
    }
    else {
      Write-Host "> $filePath $argumentDisplay"
    }

    $result = Invoke-CapturedCommand -FilePath $filePath -Arguments $Arguments -WorkingDirectory $WorkingDirectory
    Write-CommandOutput -StdOut $result.StdOut -StdErr $result.StdErr

    if ($result.ExitCode -eq 0) {
      return
    }

    $details = if ([string]::IsNullOrWhiteSpace($result.Output)) {
      "npm exited non-zero with no captured output."
    }
    else {
      $result.Output
    }

    if ($attempt -lt $RetryCount -and (Test-NpmWindowsFileLockFailure -Output $details)) {
      $attempt++
      Write-Host "npm reported a transient Windows file-lock while updating node_modules; retrying in 2 seconds (attempt $($attempt + 1) of $($RetryCount + 1))."
      Start-Sleep -Seconds 2
      continue
    }

    $guidance = Get-NpmFailureGuidance -Output $details
    if (-not [string]::IsNullOrWhiteSpace($guidance)) {
      $details = "$details`n$guidance"
    }

    throw "Command failed with exit code $($result.ExitCode): $filePath $argumentDisplay`nWorking directory: $WorkingDirectory`n$details"
  }
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
