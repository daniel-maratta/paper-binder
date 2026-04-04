[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

$repoRoot = Get-RepoRoot

function Get-JsonDocument {
  param(
    [Parameter(Mandatory = $true)]
    [string]$RelativePath
  )

  $fullPath = Join-Path $repoRoot $RelativePath
  return Get-Content -LiteralPath $fullPath -Raw | ConvertFrom-Json
}

function Assert-Equal {
  param(
    [Parameter(Mandatory = $true)]
    $Actual,

    [Parameter(Mandatory = $true)]
    $Expected,

    [Parameter(Mandatory = $true)]
    [string]$Message
  )

  if ($Actual -ne $Expected) {
    throw "$Message Expected '$Expected' but found '$Actual'."
  }
}

function Assert-SequenceEqual {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Actual,

    [Parameter(Mandatory = $true)]
    [string[]]$Expected,

    [Parameter(Mandatory = $true)]
    [string]$Message
  )

  if ($Actual.Count -ne $Expected.Count) {
    throw "$Message Expected [$($Expected -join ', ')] but found [$($Actual -join ', ')]."
  }

  for ($i = 0; $i -lt $Expected.Count; $i++) {
    if ($Actual[$i] -ne $Expected[$i]) {
      throw "$Message Expected [$($Expected -join ', ')] but found [$($Actual -join ', ')]."
    }
  }
}

function Assert-FileExists {
  param(
    [Parameter(Mandatory = $true)]
    [string]$RelativePath
  )

  $fullPath = Join-Path $repoRoot $RelativePath
  if (-not (Test-Path -LiteralPath $fullPath)) {
    throw "Missing required file: $RelativePath"
  }
}

Assert-FileExists -RelativePath "scripts/reviewer-full-stack.ps1"
Assert-FileExists -RelativePath "scripts/start-local.ps1"
Assert-FileExists -RelativePath "src/PaperBinder.Api/Properties/launchSettings.json"
Assert-FileExists -RelativePath "src/PaperBinder.Worker/Properties/launchSettings.json"
Assert-FileExists -RelativePath "PaperBinder.slnLaunch"
Assert-FileExists -RelativePath ".vscode/launch.json"
Assert-FileExists -RelativePath ".vscode/tasks.json"

$solutionLaunchProfiles = Get-JsonDocument -RelativePath "PaperBinder.slnLaunch"

$reviewerSolutionMatches = @($solutionLaunchProfiles | Where-Object { $_.Name -eq "Reviewer Full Stack" })
Assert-Equal -Actual $reviewerSolutionMatches.Count -Expected 1 -Message "Reviewer Full Stack solution profile must exist exactly once."
$reviewerSolutionProjects = $reviewerSolutionMatches[0].Projects
Assert-Equal -Actual $reviewerSolutionProjects.Count -Expected 1 -Message "Reviewer Full Stack solution profile must start exactly one project."
Assert-Equal -Actual $reviewerSolutionProjects[0].Path -Expected "src\PaperBinder.Api\PaperBinder.Api.csproj" -Message "Reviewer Full Stack solution profile must target the API project."
Assert-Equal -Actual $reviewerSolutionProjects[0].Action -Expected "Start" -Message "Reviewer Full Stack solution profile must start the API project."
Assert-Equal -Actual $reviewerSolutionProjects[0].DebugTarget -Expected "Reviewer Full Stack" -Message "Reviewer Full Stack solution profile must use the matching API debug target."

$appAndWorkerSolutionMatches = @($solutionLaunchProfiles | Where-Object { $_.Name -eq "App + Worker (Process)" })
Assert-Equal -Actual $appAndWorkerSolutionMatches.Count -Expected 1 -Message "App + Worker (Process) solution profile must exist exactly once."
$appAndWorkerProjects = $appAndWorkerSolutionMatches[0].Projects
Assert-Equal -Actual $appAndWorkerProjects.Count -Expected 2 -Message "App + Worker (Process) solution profile must contain API and worker launches."
Assert-Equal -Actual $appAndWorkerProjects[0].Path -Expected "src\PaperBinder.Api\PaperBinder.Api.csproj" -Message "App + Worker (Process) must target the API project first."
Assert-Equal -Actual $appAndWorkerProjects[0].Action -Expected "Start" -Message "App + Worker (Process) must debug the API project."
Assert-Equal -Actual $appAndWorkerProjects[0].DebugTarget -Expected "UI Only" -Message "App + Worker (Process) must use the UI Only API profile."
Assert-Equal -Actual $appAndWorkerProjects[1].Path -Expected "src\PaperBinder.Worker\PaperBinder.Worker.csproj" -Message "App + Worker (Process) must target the worker project second."
Assert-Equal -Actual $appAndWorkerProjects[1].Action -Expected "StartWithoutDebugging" -Message "App + Worker (Process) must start the worker without debugging."
Assert-Equal -Actual $appAndWorkerProjects[1].DebugTarget -Expected "Worker Only" -Message "App + Worker (Process) must use the Worker Only worker profile."

$apiOnlySolutionMatches = @($solutionLaunchProfiles | Where-Object { $_.Name -eq "API Only" })
Assert-Equal -Actual $apiOnlySolutionMatches.Count -Expected 1 -Message "API Only solution profile must exist exactly once."
$apiOnlySolutionProjects = $apiOnlySolutionMatches[0].Projects
Assert-Equal -Actual $apiOnlySolutionProjects.Count -Expected 1 -Message "API Only solution profile must contain exactly one project."
Assert-Equal -Actual $apiOnlySolutionProjects[0].Path -Expected "src\PaperBinder.Api\PaperBinder.Api.csproj" -Message "API Only solution profile must target the API project."
Assert-Equal -Actual $apiOnlySolutionProjects[0].DebugTarget -Expected "API Only" -Message "API Only solution profile must use the matching API debug target."

$uiOnlySolutionMatches = @($solutionLaunchProfiles | Where-Object { $_.Name -eq "UI Only" })
Assert-Equal -Actual $uiOnlySolutionMatches.Count -Expected 1 -Message "UI Only solution profile must exist exactly once."
$uiOnlySolutionProjects = $uiOnlySolutionMatches[0].Projects
Assert-Equal -Actual $uiOnlySolutionProjects.Count -Expected 1 -Message "UI Only solution profile must contain exactly one project."
Assert-Equal -Actual $uiOnlySolutionProjects[0].Path -Expected "src\PaperBinder.Api\PaperBinder.Api.csproj" -Message "UI Only solution profile must target the API project."
Assert-Equal -Actual $uiOnlySolutionProjects[0].DebugTarget -Expected "UI Only" -Message "UI Only solution profile must use the matching API debug target."

$workerOnlySolutionMatches = @($solutionLaunchProfiles | Where-Object { $_.Name -eq "Worker Only" })
Assert-Equal -Actual $workerOnlySolutionMatches.Count -Expected 1 -Message "Worker Only solution profile must exist exactly once."
$workerOnlySolutionProjects = $workerOnlySolutionMatches[0].Projects
Assert-Equal -Actual $workerOnlySolutionProjects.Count -Expected 1 -Message "Worker Only solution profile must contain exactly one project."
Assert-Equal -Actual $workerOnlySolutionProjects[0].Path -Expected "src\PaperBinder.Worker\PaperBinder.Worker.csproj" -Message "Worker Only solution profile must target the worker project."
Assert-Equal -Actual $workerOnlySolutionProjects[0].DebugTarget -Expected "Worker Only" -Message "Worker Only solution profile must use the matching worker debug target."

$vscodeLaunch = Get-JsonDocument -RelativePath ".vscode/launch.json"
$vscodeConfigurations = $vscodeLaunch.configurations
$vscodeCompounds = $vscodeLaunch.compounds

$reviewerVscodeMatches = @($vscodeConfigurations | Where-Object { $_.name -eq "Reviewer Full Stack" })
Assert-Equal -Actual $reviewerVscodeMatches.Count -Expected 1 -Message "VS Code Reviewer Full Stack launch must exist exactly once."
$reviewerVscodeConfig = $reviewerVscodeMatches[0]
Assert-Equal -Actual $reviewerVscodeConfig.type -Expected "node-terminal" -Message "VS Code Reviewer Full Stack launch must use a terminal-backed command."
Assert-Equal -Actual $reviewerVscodeConfig.command -Expected "powershell -ExecutionPolicy Bypass -File ./scripts/reviewer-full-stack.ps1" -Message "VS Code Reviewer Full Stack launch must use the canonical reviewer script."
Assert-Equal -Actual $reviewerVscodeConfig.cwd -Expected '${workspaceFolder}' -Message "VS Code Reviewer Full Stack launch must run from the workspace root."

$uiOnlyVscodeMatches = @($vscodeConfigurations | Where-Object { $_.name -eq "UI Only" })
Assert-Equal -Actual $uiOnlyVscodeMatches.Count -Expected 1 -Message "VS Code UI Only launch must exist exactly once."
$uiOnlyVscodeConfig = $uiOnlyVscodeMatches[0]
Assert-Equal -Actual $uiOnlyVscodeConfig.preLaunchTask -Expected "Build" -Message "VS Code UI Only launch must build before starting."
Assert-Equal -Actual $uiOnlyVscodeConfig.program -Expected '${workspaceFolder}/src/PaperBinder.Api/bin/Debug/net10.0/PaperBinder.Api.dll' -Message "VS Code UI Only launch must run the API host."
Assert-Equal -Actual $uiOnlyVscodeConfig.cwd -Expected '${workspaceFolder}/src/PaperBinder.Api' -Message "VS Code UI Only launch must run from the API project."
Assert-Equal -Actual $uiOnlyVscodeConfig.env.ASPNETCORE_URLS -Expected "http://localhost:5080" -Message "VS Code UI Only launch must bind the API host to localhost:5080."
Assert-Equal -Actual $uiOnlyVscodeConfig.env.PAPERBINDER_FRONTEND_HOSTING_MODE -Expected "compiled" -Message "VS Code UI Only launch must force compiled frontend hosting."

$apiOnlyVscodeMatches = @($vscodeConfigurations | Where-Object { $_.name -eq "API Only" })
Assert-Equal -Actual $apiOnlyVscodeMatches.Count -Expected 1 -Message "VS Code API Only launch must exist exactly once."
$apiOnlyVscodeConfig = $apiOnlyVscodeMatches[0]
Assert-Equal -Actual $apiOnlyVscodeConfig.preLaunchTask -Expected "Build" -Message "VS Code API Only launch must build before starting."
Assert-Equal -Actual $apiOnlyVscodeConfig.program -Expected '${workspaceFolder}/src/PaperBinder.Api/bin/Debug/net10.0/PaperBinder.Api.dll' -Message "VS Code API Only launch must run the API host."
Assert-Equal -Actual $apiOnlyVscodeConfig.cwd -Expected '${workspaceFolder}/src/PaperBinder.Api' -Message "VS Code API Only launch must run from the API project."
Assert-Equal -Actual $apiOnlyVscodeConfig.env.ASPNETCORE_URLS -Expected "http://localhost:5080" -Message "VS Code API Only launch must bind the API host to localhost:5080."

$workerOnlyVscodeMatches = @($vscodeConfigurations | Where-Object { $_.name -eq "Worker Only" })
Assert-Equal -Actual $workerOnlyVscodeMatches.Count -Expected 1 -Message "VS Code Worker Only launch must exist exactly once."
$workerOnlyVscodeConfig = $workerOnlyVscodeMatches[0]
Assert-Equal -Actual $workerOnlyVscodeConfig.preLaunchTask -Expected "Build" -Message "VS Code Worker Only launch must build before starting."
Assert-Equal -Actual $workerOnlyVscodeConfig.program -Expected '${workspaceFolder}/src/PaperBinder.Worker/bin/Debug/net10.0/PaperBinder.Worker.dll' -Message "VS Code Worker Only launch must run the worker host."
Assert-Equal -Actual $workerOnlyVscodeConfig.cwd -Expected '${workspaceFolder}/src/PaperBinder.Worker' -Message "VS Code Worker Only launch must run from the worker project."
Assert-Equal -Actual $workerOnlyVscodeConfig.env.DOTNET_ENVIRONMENT -Expected "Development" -Message "VS Code Worker Only launch must set Development environment."

$frontendDevServerMatches = @($vscodeConfigurations | Where-Object { $_.name -eq "Launch Frontend Dev Server" })
Assert-Equal -Actual $frontendDevServerMatches.Count -Expected 1 -Message "VS Code Launch Frontend Dev Server must exist exactly once."
$frontendDevServerConfig = $frontendDevServerMatches[0]
Assert-Equal -Actual $frontendDevServerConfig.type -Expected "node-terminal" -Message "VS Code Launch Frontend Dev Server must use a terminal-backed command."
Assert-Equal -Actual $frontendDevServerConfig.command -Expected "npm.cmd run dev" -Message "VS Code Launch Frontend Dev Server must start the Vite dev server."
Assert-Equal -Actual $frontendDevServerConfig.cwd -Expected '${workspaceFolder}/src/PaperBinder.Web' -Message "VS Code Launch Frontend Dev Server must run from the frontend workspace."

$appAndWorkerVscodeCompoundMatches = @($vscodeCompounds | Where-Object { $_.name -eq "App + Worker (Process)" })
Assert-Equal -Actual $appAndWorkerVscodeCompoundMatches.Count -Expected 1 -Message "VS Code App + Worker (Process) compound must exist exactly once."
Assert-SequenceEqual -Actual $appAndWorkerVscodeCompoundMatches[0].configurations -Expected @("UI Only", "Worker Only") -Message "VS Code App + Worker (Process) compound must reference UI Only and Worker Only."

$vscodeTasks = Get-JsonDocument -RelativePath ".vscode/tasks.json"
$taskEntries = $vscodeTasks.tasks

$validateLaunchProfilesTaskMatches = @($taskEntries | Where-Object { $_.label -eq "Validate Launch Profiles" })
Assert-Equal -Actual $validateLaunchProfilesTaskMatches.Count -Expected 1 -Message "VS Code Validate Launch Profiles task must exist exactly once."
$validateLaunchProfilesTask = $validateLaunchProfilesTaskMatches[0]
Assert-Equal -Actual $validateLaunchProfilesTask.command -Expected "powershell" -Message "Validate Launch Profiles task must use PowerShell."
Assert-SequenceEqual -Actual $validateLaunchProfilesTask.args -Expected @("-ExecutionPolicy", "Bypass", "-File", '${workspaceFolder}/scripts/validate-launch-profiles.ps1') -Message "Validate Launch Profiles task must call the canonical validator script."

$startLocalStackTaskMatches = @($taskEntries | Where-Object { $_.label -eq "Start Local Stack" })
Assert-Equal -Actual $startLocalStackTaskMatches.Count -Expected 1 -Message "VS Code Start Local Stack task must exist exactly once."
$startLocalStackTask = $startLocalStackTaskMatches[0]
Assert-Equal -Actual $startLocalStackTask.command -Expected "powershell" -Message "Start Local Stack task must use PowerShell."
Assert-SequenceEqual -Actual $startLocalStackTask.args -Expected @("-ExecutionPolicy", "Bypass", "-File", '${workspaceFolder}/scripts/start-local.ps1') -Message "Start Local Stack task must call the canonical local stack script."

$reviewerTaskMatches = @($taskEntries | Where-Object { $_.label -eq "Reviewer Full Stack" })
Assert-Equal -Actual $reviewerTaskMatches.Count -Expected 1 -Message "VS Code Reviewer Full Stack task must exist exactly once."
$reviewerTask = $reviewerTaskMatches[0]
Assert-Equal -Actual $reviewerTask.command -Expected "powershell" -Message "Reviewer Full Stack task must use PowerShell."
Assert-SequenceEqual -Actual $reviewerTask.args -Expected @("-ExecutionPolicy", "Bypass", "-File", '${workspaceFolder}/scripts/reviewer-full-stack.ps1') -Message "Reviewer Full Stack task must call the canonical reviewer script."

$apiLaunchSettings = Get-JsonDocument -RelativePath "src/PaperBinder.Api/Properties/launchSettings.json"
$reviewerApiProfile = $apiLaunchSettings.profiles."Reviewer Full Stack"
if ($null -eq $reviewerApiProfile) {
  throw "Missing API launchSettings profile 'Reviewer Full Stack'."
}

Assert-Equal -Actual $reviewerApiProfile.commandName -Expected "Executable" -Message "API Reviewer Full Stack profile must use the executable launcher."
Assert-Equal -Actual $reviewerApiProfile.executablePath -Expected "powershell" -Message "API Reviewer Full Stack profile must invoke PowerShell."
Assert-Equal -Actual $reviewerApiProfile.commandLineArgs -Expected "-ExecutionPolicy Bypass -File .\scripts\reviewer-full-stack.ps1" -Message "API Reviewer Full Stack profile must point at the repo-root reviewer script."
Assert-Equal -Actual $reviewerApiProfile.workingDirectory -Expected "..\..\" -Message "API Reviewer Full Stack profile must execute from the repo root."

$apiOnlyApiProfile = $apiLaunchSettings.profiles."API Only"
if ($null -eq $apiOnlyApiProfile) {
  throw "Missing API launchSettings profile 'API Only'."
}

Assert-Equal -Actual $apiOnlyApiProfile.commandName -Expected "Project" -Message "API Only launchSettings profile must use project launch."
Assert-Equal -Actual $apiOnlyApiProfile.applicationUrl -Expected "http://localhost:5080" -Message "API Only launchSettings profile must bind to localhost:5080."

$uiOnlyApiProfile = $apiLaunchSettings.profiles."UI Only"
if ($null -eq $uiOnlyApiProfile) {
  throw "Missing API launchSettings profile 'UI Only'."
}

Assert-Equal -Actual $uiOnlyApiProfile.commandName -Expected "Project" -Message "UI Only launchSettings profile must use project launch."
Assert-Equal -Actual $uiOnlyApiProfile.applicationUrl -Expected "http://localhost:5080" -Message "UI Only launchSettings profile must bind to localhost:5080."
Assert-Equal -Actual $uiOnlyApiProfile.environmentVariables.PAPERBINDER_FRONTEND_HOSTING_MODE -Expected "compiled" -Message "UI Only launchSettings profile must force compiled frontend hosting."

$workerLaunchSettings = Get-JsonDocument -RelativePath "src/PaperBinder.Worker/Properties/launchSettings.json"
$workerOnlyProfile = $workerLaunchSettings.profiles."Worker Only"
if ($null -eq $workerOnlyProfile) {
  throw "Missing worker launchSettings profile 'Worker Only'."
}

Assert-Equal -Actual $workerOnlyProfile.commandName -Expected "Project" -Message "Worker Only launchSettings profile must use project launch."
Assert-Equal -Actual $workerOnlyProfile.environmentVariables.DOTNET_ENVIRONMENT -Expected "Development" -Message "Worker Only launchSettings profile must set Development environment."

Write-Host "Launch profile validation passed."
