[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$anchorCache = @{}

function Convert-ToMarkdownAnchor {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Heading
  )

  $normalized = $Heading.Trim().ToLowerInvariant()
  $normalized = [regex]::Replace($normalized, '\s+#*$', '')
  $normalized = [regex]::Replace($normalized, '[^\p{L}\p{Nd}\-_ ]', '')
  $normalized = [regex]::Replace($normalized, '\s+', '-')

  return $normalized
}

function Get-MarkdownAnchors {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  if ($anchorCache.ContainsKey($Path)) {
    return $anchorCache[$Path]
  }

  $anchors = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)

  foreach ($line in Get-Content -Path $Path) {
    if ($line -match "^\s{0,3}#{1,6}\s+(.+?)\s*$") {
      $anchor = Convert-ToMarkdownAnchor -Heading $Matches[1]
      if (-not [string]::IsNullOrWhiteSpace($anchor)) {
        $anchors.Add($anchor) | Out-Null
      }
    }
  }

  $anchorCache[$Path] = $anchors
  return $anchors
}

function Resolve-LocalTarget {
  param(
    [Parameter(Mandatory = $true)]
    [string]$CurrentFilePath,

    [Parameter(Mandatory = $true)]
    [string]$RawTarget
  )

  $hashIndex = $RawTarget.IndexOf("#")
  $pathPart = if ($hashIndex -ge 0) { $RawTarget.Substring(0, $hashIndex) } else { $RawTarget }
  $anchorPart = if ($hashIndex -ge 0) { $RawTarget.Substring($hashIndex + 1) } else { $null }

  $resolvedPath = if ([string]::IsNullOrWhiteSpace($pathPart)) {
    $CurrentFilePath
  }
  else {
    $baseDirectory = Split-Path -Parent $CurrentFilePath
    $candidatePath = Join-Path $baseDirectory $pathPart
    (Resolve-Path -LiteralPath $candidatePath -ErrorAction Stop).Path
  }

  return @{
    Path = $resolvedPath
    Anchor = $anchorPart
  }
}

function Assert-PathExists {
  param(
    [Parameter(Mandatory = $true)]
    [string]$RelativePath
  )

  $fullPath = Join-Path $repoRoot $RelativePath
  if (-not (Test-Path -LiteralPath $fullPath)) {
    throw "Missing required documentation target: $RelativePath"
  }
}

$repoMapPath = Join-Path $repoRoot "docs/repo-map.json"
$repoMap = Get-Content -Path $repoMapPath -Raw | ConvertFrom-Json

foreach ($property in $repoMap.canonicalEntryPoints.PSObject.Properties) {
  Assert-PathExists -RelativePath $property.Value
}

foreach ($node in $repoMap.nodes) {
  if ($null -ne $node.path) {
    Assert-PathExists -RelativePath $node.path
  }
}

$markdownFiles = @(
  $(Get-Item -Path (Join-Path $repoRoot "AGENTS.md"))
  $(Get-Item -Path (Join-Path $repoRoot "README.md"))
  $(Get-Item -Path (Join-Path $repoRoot "REVIEWERS.md"))
) + @(Get-ChildItem -Path (Join-Path $repoRoot "docs") -Recurse -File -Filter "*.md")

$linkPattern = [regex]'\[[^\]]+\]\(([^)]+)\)'

foreach ($file in $markdownFiles) {
  $content = Get-Content -Path $file.FullName -Raw
  $content = [regex]::Replace($content, '(?s)```.*?```', '')

  foreach ($match in $linkPattern.Matches($content)) {
    $target = $match.Groups[1].Value.Trim().Replace('<', '').Replace('>', '')

    if ([string]::IsNullOrWhiteSpace($target)) {
      continue
    }

    if ($target -match '^(https?|mailto):') {
      continue
    }

    if ($target.StartsWith("#")) {
      $anchor = $target.TrimStart("#")
      $anchors = Get-MarkdownAnchors -Path $file.FullName
      if (-not $anchors.Contains($anchor)) {
        throw "Broken heading anchor in $($file.FullName): $target"
      }

      continue
    }

    $resolved = Resolve-LocalTarget -CurrentFilePath $file.FullName -RawTarget $target

    if (-not (Test-Path -LiteralPath $resolved.Path)) {
      throw "Broken link in $($file.FullName): $target"
    }

    if (-not [string]::IsNullOrWhiteSpace($resolved.Anchor)) {
      if ([System.IO.Path]::GetExtension($resolved.Path) -ne ".md") {
        throw "Anchor target must be a markdown file: $target in $($file.FullName)"
      }

      $anchors = Get-MarkdownAnchors -Path $resolved.Path
      if (-not $anchors.Contains($resolved.Anchor)) {
        throw "Broken linked anchor in $($file.FullName): $target"
      }
    }
  }
}

Write-Host "Documentation validation passed."
