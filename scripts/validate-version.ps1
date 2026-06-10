param(
    [string] $ExpectedVersion
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Web.Extensions

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$directoryBuildPropsPath = Join-Path $root "Directory.Build.props"
$webPackageJsonPath = Join-Path $root "src/PaperBinder.Web/package.json"
$webPackageLockPath = Join-Path $root "src/PaperBinder.Web/package-lock.json"

function Read-JsonFile($path) {
    try {
        $serializer = New-Object System.Web.Script.Serialization.JavaScriptSerializer
        $serializer.MaxJsonLength = [int]::MaxValue
        return $serializer.DeserializeObject((Get-Content $path -Raw))
    }
    catch {
        throw "Unable to parse JSON file '$path'. $_"
    }
}

function Get-JsonPropertyValue($inputObject, [string] $propertyName) {
    if ($null -eq $inputObject) {
        return $null
    }

    if ($inputObject -is [System.Collections.IDictionary]) {
        return $inputObject[$propertyName]
    }

    return $null
}

function Read-JsonValue($inputObject, $selector) {
    $current = $inputObject
    foreach ($segment in $selector.Split(".")) {
        $current = Get-JsonPropertyValue $current $segment
        if ($null -eq $current) {
            return $null
        }
    }

    return $current
}

[xml] $directoryBuildProps = Get-Content $directoryBuildPropsPath -Raw
$webPackageJson = Read-JsonFile $webPackageJsonPath
$webPackageLock = Read-JsonFile $webPackageLockPath
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

$webPackageJsonVersion = Read-JsonValue $webPackageJson "version"
if ($webPackageJsonVersion -ne $ExpectedVersion) {
    throw "src/PaperBinder.Web/package.json version '$webPackageJsonVersion' does not match expected version '$ExpectedVersion'."
}

$webPackageLockVersion = Read-JsonValue $webPackageLock "version"
if ($webPackageLockVersion -ne $ExpectedVersion) {
    throw "src/PaperBinder.Web/package-lock.json version '$webPackageLockVersion' does not match expected version '$ExpectedVersion'."
}

$webPackageLockPackages = Read-JsonValue $webPackageLock "packages"
$webPackageLockRootPackage = Get-JsonPropertyValue $webPackageLockPackages ""
$webPackageLockRootVersion = Get-JsonPropertyValue $webPackageLockRootPackage "version"

if ($webPackageLockRootVersion -ne $ExpectedVersion) {
    throw "src/PaperBinder.Web/package-lock.json root package version '$webPackageLockRootVersion' does not match expected version '$ExpectedVersion'."
}

Write-Host "Version validation passed for $ExpectedVersion."
