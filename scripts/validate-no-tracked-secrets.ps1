[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

$repoRoot = Get-RepoRoot

# ASP.NET Core Data Protection persists an unencrypted master key XML file per key ring
# (key-<guid>.xml) under the configured PAPERBINDER_AUTH_KEY_RING_PATH. The default local
# path (.env.example) is a relative "paperbinder-local-keys" directory, which must never be
# committed. See docs/30-security/public-repo-safety.md.
$forbiddenPathspecs = @(
  "*paperbinder-local-keys*",
  "*/key-*.xml"
)

$result = Invoke-CapturedCommand -FilePath "git" -Arguments (@("ls-files", "--") + $forbiddenPathspecs) -WorkingDirectory $repoRoot

if ($result.ExitCode -ne 0) {
  $details = if ([string]::IsNullOrWhiteSpace($result.Output)) {
    "git ls-files failed with no output."
  }
  else {
    $result.Output
  }

  throw "Secrets validation failed: could not scan the git index for tracked local Data Protection key material.`n$details"
}

$trackedFiles = @($result.StdOut -split "`r?`n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })

if ($trackedFiles.Count -gt 0) {
  throw ("Secrets validation failed: local ASP.NET Data Protection key material is tracked in git. " +
    "Remove it with `git rm` and confirm `paperbinder-local-keys/` stays covered by .gitignore " +
    "(see docs/30-security/public-repo-safety.md).`n" + ($trackedFiles -join "`n"))
}

Write-Host "Secrets validation passed: no tracked local Data Protection key material found."
