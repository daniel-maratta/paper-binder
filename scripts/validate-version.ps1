param(
    [string] $ExpectedVersion
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$directoryBuildPropsPath = Join-Path $root "Directory.Build.props"
$webPackageJsonPath = Join-Path $root "src/PaperBinder.Web/package.json"
$webPackageLockPath = Join-Path $root "src/PaperBinder.Web/package-lock.json"

function Read-FileText([string] $path) {
    try {
        return Get-Content $path -Raw
    }
    catch {
        throw "Unable to read file '$path'. $_"
    }
}

function Read-TopLevelJsonStringProperty([string] $path, [string] $propertyName) {
    $content = Read-FileText $path
    $escapedPropertyName = [regex]::Escape($propertyName)
    $match = [regex]::Match(
        $content,
        "(?ms)^\s*`"$escapedPropertyName`"\s*:\s*`"(?<value>[^`"]+)`""
    )

    if (-not $match.Success) {
        throw "Unable to find top-level JSON string property '$propertyName' in '$path'."
    }

    return $match.Groups["value"].Value
}

function Read-PackageLockRootPackageVersion([string] $path) {
    $content = Read-FileText $path
    $match = [regex]::Match(
        $content,
        '(?ms)"packages"\s*:\s*\{\s*""\s*:\s*\{.*?"version"\s*:\s*"(?<value>[^"]+)"'
    )

    if (-not $match.Success) {
        throw "Unable to find package-lock root package version in '$path'."
    }

    return $match.Groups["value"].Value
}

[xml] $directoryBuildProps = Get-Content $directoryBuildPropsPath -Raw
$versionPrefix = $directoryBuildProps.Project.PropertyGroup.VersionPrefix | Where-Object { $_ } | Select-Object -First 1

if ([string]::IsNullOrWhiteSpace($versionPrefix)) {
    throw "Directory.Build.props must define VersionPrefix."
}

if ([string]::IsNullOrWhiteSpace($ExpectedVersion)) {
    $refName = $env:GITHUB_REF_NAME
    if ($refName -match '^v(?<version>\d+\.\d+\.\d+)$') {
        $ExpectedVersion = $Matches.version
    }
    else {
        $ExpectedVersion = $versionPrefix
    }
}

if ($ExpectedVersion -notmatch '^\d+\.\d+\.\d+$') {
    throw "ExpectedVersion '$ExpectedVersion' is not a stable SemVer core version."
}

if ($versionPrefix -ne $ExpectedVersion) {
    throw "Directory.Build.props VersionPrefix '$versionPrefix' does not match expected version '$ExpectedVersion'."
}

$webPackageJsonVersion = Read-TopLevelJsonStringProperty $webPackageJsonPath "version"
if ($webPackageJsonVersion -ne $ExpectedVersion) {
    throw "src/PaperBinder.Web/package.json version '$webPackageJsonVersion' does not match expected version '$ExpectedVersion'."
}

$webPackageLockVersion = Read-TopLevelJsonStringProperty $webPackageLockPath "version"
if ($webPackageLockVersion -ne $ExpectedVersion) {
    throw "src/PaperBinder.Web/package-lock.json version '$webPackageLockVersion' does not match expected version '$ExpectedVersion'."
}

$webPackageLockRootVersion = Read-PackageLockRootPackageVersion $webPackageLockPath

if ($webPackageLockRootVersion -ne $ExpectedVersion) {
    throw "src/PaperBinder.Web/package-lock.json root package version '$webPackageLockRootVersion' does not match expected version '$ExpectedVersion'."
}

Write-Host "Version validation passed for $ExpectedVersion."
