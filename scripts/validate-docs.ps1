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

function Test-IsInlineLocalPathLiteral {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Literal
  )

  if ([string]::IsNullOrWhiteSpace($Literal) -or $Literal -match '\s') {
    return $false
  }

  $normalized = $Literal.Replace('\', '/')

  if ($normalized.Contains('*') -or $normalized.Contains('?')) {
    return $false
  }

  if ($normalized -match '^[.]{1,2}/') {
    return $true
  }

  if ($normalized -match '^(docs|review|scripts|src|tests|deploy|\.vscode)/') {
    return $true
  }

  return $normalized -match '^(AGENTS\.md|README\.md|REVIEWERS\.md|CHANGELOG\.md|CLAUDE\.md|PaperBinder\.sln|PaperBinder\.slnLaunch|docker-compose\.yml|package\.json|global\.json|\.nvmrc|\.env|\.env\.example)$'
}

function Test-IsOptionalInlineLocalPathLiteral {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Literal
  )

  $normalized = $Literal.Replace('\', '/')

  return $normalized -match '^(\.env)$'
}

function Resolve-InlineLocalTarget {
  param(
    [Parameter(Mandatory = $true)]
    [string]$CurrentFilePath,

    [Parameter(Mandatory = $true)]
    [string]$RawTarget
  )

  $normalized = $RawTarget.Replace('\', '/')

  if ($normalized -match '^[.]{1,2}/') {
    $baseDirectory = Split-Path -Parent $CurrentFilePath
    return (Resolve-Path -LiteralPath (Join-Path $baseDirectory $RawTarget) -ErrorAction Stop).Path
  }

  return (Resolve-Path -LiteralPath (Join-Path $repoRoot $normalized) -ErrorAction Stop).Path
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
$inlineCodePattern = [regex]'`([^`\r\n]+)`'

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

  foreach ($match in $inlineCodePattern.Matches($content)) {
    $target = $match.Groups[1].Value.Trim()

    if (-not (Test-IsInlineLocalPathLiteral -Literal $target)) {
      continue
    }

    if ((Test-IsOptionalInlineLocalPathLiteral -Literal $target) -and -not (Test-Path -LiteralPath (Join-Path $repoRoot $target))) {
      continue
    }

    try {
      [void](Resolve-InlineLocalTarget -CurrentFilePath $file.FullName -RawTarget $target)
    }
    catch {
      throw "Broken inline path reference in $($file.FullName): $target"
    }
  }
}

Write-Host "Documentation validation passed."
