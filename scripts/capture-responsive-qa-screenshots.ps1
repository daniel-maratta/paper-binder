[CmdletBinding()]
param(
  [string]$OutputDirectory = (Join-Path ([System.IO.Path]::GetTempPath()) "paperbinder-responsive-qa")
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

$repoRoot = Get-RepoRoot
$frontendRoot = Join-Path $repoRoot "src/PaperBinder.Web"
$e2eRootUrl = "http://paperbinder.localhost:5081"
$originalPublicRootUrl = $env:PAPERBINDER_PUBLIC_ROOT_URL
$originalDbHostPort = $env:PAPERBINDER_DB_HOST_PORT
$originalE2EBaseUrl = $env:PAPERBINDER_E2E_BASE_URL
$runnerPath = Join-Path $frontendRoot ".tmp-capture-responsive-qa-screenshots.mjs"
$composeBaseArguments = @(
  "compose",
  "-p",
  "paperbinder-e2e",
  "-f",
  "docker-compose.yml",
  "-f",
  "docker-compose.e2e.yml"
)

function Get-NpxCommand {
  if ($env:OS -eq "Windows_NT") {
    return "npx.cmd"
  }

  return "npx"
}

function Invoke-QACompose {
  param(
    [string[]]$Arguments = @()
  )

  Invoke-ExternalCommand -FilePath "docker" -Arguments ($composeBaseArguments + $Arguments) -WorkingDirectory $repoRoot
}

function Wait-ForUrl {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Url,

    [Parameter(Mandatory = $true)]
    [int[]]$AllowedStatusCodes
  )

  $deadline = [DateTimeOffset]::UtcNow.AddSeconds(90)
  $lastObservation = $null

  while ([DateTimeOffset]::UtcNow -lt $deadline) {
    $statusCode = $null
    $observation = $null

    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
      $statusCode = [int]$response.StatusCode
    }
    catch {
      $exception = $_.Exception
      $responseProperty = $exception.PSObject.Properties["Response"]
      if ($null -ne $responseProperty) {
        $response = $responseProperty.Value
        try {
          if ($null -ne $response) {
            $statusCode = [int]$response.StatusCode
          }
        }
        catch {
          $statusCode = $null
        }
      }

      if (-not [string]::IsNullOrWhiteSpace($exception.Message)) {
        $observation = $exception.Message
      }
    }

    if ($null -ne $statusCode) {
      $observation = "HTTP $statusCode"
    }

    if ($null -ne $statusCode -and $AllowedStatusCodes -contains $statusCode) {
      return
    }

    if (-not [string]::IsNullOrWhiteSpace($observation) -and $observation -ne $lastObservation) {
      Write-Host "Wait-ForUrl: $Url not ready yet ($observation)."
      $lastObservation = $observation
    }

    Start-Sleep -Milliseconds 500
  }

  if (-not [string]::IsNullOrWhiteSpace($lastObservation)) {
    throw "Timed out waiting for $Url. Last observed result: $lastObservation."
  }

  throw "Timed out waiting for $Url."
}

function Start-QARuntime {
  Write-Host "Starting isolated responsive QA runtime..."
  Invoke-QACompose -Arguments @("up", "-d", "--build", "db", "migrations", "app", "worker")

  Wait-ForUrl -Url "$e2eRootUrl/health/live" -AllowedStatusCodes @(200)
  Wait-ForUrl -Url "$e2eRootUrl/health/ready" -AllowedStatusCodes @(200)
}

function Stop-QARuntime {
  Write-Host "Stopping isolated responsive QA runtime..."
  Invoke-QACompose -Arguments @("down", "--volumes", "--remove-orphans")
}

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$normalizedOutputDirectory = ($OutputDirectory -replace '\\', '/')

$runnerSource = @'
import { chromium, expect } from "@playwright/test";
import fs from "node:fs";

const baseUrl = process.env.PAPERBINDER_E2E_BASE_URL ?? "http://paperbinder.localhost:5081";
const outputDir = process.env.PAPERBINDER_QA_OUTPUT_DIR;
const challengePassToken = "paperbinder-test-challenge-pass";

const viewports = {
  narrow: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  shellBreakLow: { width: 1100, height: 800 },
  shellBreakHigh: { width: 1280, height: 832 },
  desktop: { width: 1440, height: 900 }
};

fs.mkdirSync(outputDir, { recursive: true });

function tenantHostUrl(tenantSlug, pathname = "/app") {
  return `http://${tenantSlug}.paperbinder.localhost:5081${pathname}`;
}

async function shoot(page, name) {
  await page.screenshot({ path: `${outputDir}/${name}.png`, fullPage: true });
  console.log(`captured ${name}`);
}

async function completeChallenge(page) {
  const localBypassHeading = page.getByRole("heading", { name: "Local challenge bypass enabled" });

  if (await localBypassHeading.isVisible().catch(() => false)) {
    return;
  }

  await page.evaluate((nextToken) => {
    globalThis.__paperbinderTurnstileNextToken = nextToken;
  }, challengePassToken);

  await page.getByRole("button", { name: "Complete challenge" }).click();
  await expect(page.getByText("Challenge complete.")).toBeVisible();
}

const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({ viewport: viewports.desktop });
  const page = await context.newPage();

  // --- Public route sweep ---
  for (const [vpName, vp] of Object.entries({
    narrow: viewports.narrow,
    tablet: viewports.tablet,
    desktop: viewports.desktop
  })) {
    await page.setViewportSize(vp);

    await page.goto(`${baseUrl}/`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await shoot(page, `public-landing-${vpName}`);

    await page.goto(`${baseUrl}/about`);
    await expect(page.getByRole("heading", { level: 1, name: "About PaperBinder" })).toBeVisible();
    await shoot(page, `public-about-${vpName}`);

    await page.goto(`${baseUrl}/start-demo`);
    await expect(page.getByLabel("Workspace name")).toBeVisible();
    await shoot(page, `public-start-demo-${vpName}`);

    await page.goto(`${baseUrl}/login`);
    await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
    await shoot(page, `public-login-${vpName}`);
  }

  // --- Provision workspace (narrow viewport captures the success panel) ---
  await page.setViewportSize(viewports.narrow);
  const tenantName = `Responsive QA ${Date.now()}`;
  const provisionResponse = page.waitForResponse((response) => response.url().endsWith("/api/provision"));

  await page.goto(`${baseUrl}/start-demo`);
  await page.getByLabel("Workspace name").fill(tenantName);
  await completeChallenge(page);
  await page.getByRole("button", { name: "Start demo workspace" }).click();

  const response = await provisionResponse;
  const payload = await response.json();
  if (response.status() !== 201) {
    throw new Error(`Provisioning failed with HTTP ${response.status()}.`);
  }

  await expect(page.getByRole("button", { name: "Open workspace" })).toBeVisible();
  await shoot(page, "public-start-demo-success-narrow");
  await page.getByRole("button", { name: "Open workspace" }).click();

  const tenantSlug = payload.tenantSlug;
  await expect(page.getByRole("heading", { level: 2, name: "Workspace dashboard", exact: true })).toBeVisible();

  // --- Dashboard across the full viewport sweep (shell grid/breakpoint check) ---
  for (const [vpName, vp] of Object.entries(viewports)) {
    await page.setViewportSize(vp);
    await page.goto(tenantHostUrl(tenantSlug, "/app"));
    await expect(page.getByRole("heading", { level: 2, name: "Workspace dashboard", exact: true })).toBeVisible();
    await shoot(page, `auth-dashboard-${vpName}`);
  }

  // --- Binders: create then sweep narrow/tablet/desktop ---
  await page.setViewportSize(viewports.narrow);
  await page.goto(tenantHostUrl(tenantSlug, "/app/binders"));
  await expect(page.getByRole("heading", { level: 2, name: "Binders", exact: true })).toBeVisible();
  await page.getByLabel("Binder name").fill("Operations");
  await page.getByRole("button", { name: "Add binder" }).click();
  await expect(page.getByText("Binder added.")).toBeVisible();
  await shoot(page, "auth-binders-narrow");

  await page.getByRole("link", { name: "Open binder", exact: true }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Operations", exact: true })).toBeVisible();
  const binderUrl = page.url();
  await shoot(page, "auth-binder-detail-narrow");

  await page.getByLabel("Document title").fill("Runbook");
  await page.getByLabel("Document source").fill("# Runbook\n\nResponsive QA sweep\n\n- Confirm owner access\n- Confirm reader visibility");
  await page.getByRole("button", { name: "Add document" }).click();
  await expect(page.getByText("Document added.")).toBeVisible();
  await page.getByRole("link", { name: "Open document" }).last().click();
  await expect(page.getByRole("heading", { level: 2, name: "Runbook", exact: true })).toBeVisible();
  const documentUrl = page.url();
  await shoot(page, "auth-document-detail-narrow");

  for (const vpName of ["tablet", "desktop"]) {
    await page.setViewportSize(viewports[vpName]);

    await page.goto(tenantHostUrl(tenantSlug, "/app/binders"));
    await expect(page.getByRole("heading", { level: 2, name: "Binders", exact: true })).toBeVisible();
    await shoot(page, `auth-binders-${vpName}`);

    await page.goto(binderUrl);
    await expect(page.getByRole("heading", { level: 2, name: "Operations", exact: true })).toBeVisible();
    await shoot(page, `auth-binder-detail-${vpName}`);

    await page.goto(documentUrl);
    await expect(page.getByRole("heading", { level: 2, name: "Runbook", exact: true })).toBeVisible();
    await shoot(page, `auth-document-detail-${vpName}`);
  }

  // --- Mobile menu open state ---
  for (const vpName of ["narrow", "tablet"]) {
    await page.setViewportSize(viewports[vpName]);
    await page.goto(tenantHostUrl(tenantSlug, "/app"));
    await expect(page.getByRole("heading", { level: 2, name: "Workspace dashboard", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Open workspace menu" }).click();
    await expect(page.getByRole("button", { name: "Close workspace menu" })).toBeVisible();
    await shoot(page, `auth-mobile-menu-${vpName}`);
  }

  // --- Users: default list sweep, then add a reader and open the manage panel ---
  for (const vpName of ["narrow", "tablet", "desktop"]) {
    await page.setViewportSize(viewports[vpName]);
    await page.goto(tenantHostUrl(tenantSlug, "/app/users"));
    await expect(page.getByRole("heading", { level: 2, name: "Users and access", exact: true })).toBeVisible();
    await shoot(page, `auth-users-${vpName}`);
  }

  await page.setViewportSize(viewports.tablet);
  await page.goto(tenantHostUrl(tenantSlug, "/app/users"));
  const readerEmail = `reader.${Date.now()}@${tenantSlug}.local`;
  await page.getByLabel("Email", { exact: true }).fill(readerEmail);
  await page.getByLabel("Role", { exact: true }).selectOption("BinderRead");
  await page.getByRole("button", { name: "Add user" }).click();
  await expect(page.getByText("User added.")).toBeVisible();
  const readerPassword = await page.getByRole("textbox", { name: "Workspace password", exact: true }).inputValue();

  await page.getByRole("button", { name: `Manage user ${readerEmail}` }).click();
  await expect(page.getByRole("button", { name: "View as this user" })).toBeVisible();
  await shoot(page, "auth-users-selected-tablet");

  await page.setViewportSize(viewports.desktop);
  await page.goto(tenantHostUrl(tenantSlug, "/app/users"));
  await page.getByRole("button", { name: `Manage user ${readerEmail}` }).click();
  await expect(page.getByRole("button", { name: "View as this user" })).toBeVisible();
  await shoot(page, "auth-users-selected-desktop");

  // --- Impersonation ("view as") state ---
  await page.getByRole("button", { name: "View as this user" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Workspace dashboard", exact: true })).toBeVisible();
  await expect(page.getByText("Viewing as")).toBeVisible();
  await shoot(page, "auth-dashboard-viewing-as-desktop");

  await page.getByRole("button", { name: "Stop view as" }).click();
  await expect(page.getByText("Viewing as")).toHaveCount(0);

  // --- Reader sees users route denied ---
  await page.setViewportSize(viewports.narrow);
  await context.clearCookies();
  await page.goto(`${baseUrl}/login`);
  await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
  await page.getByLabel("Email").fill(readerEmail);
  await page.getByLabel("Password").fill(readerPassword);
  await completeChallenge(page);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(tenantHostUrl(tenantSlug));
  await page.goto(tenantHostUrl(tenantSlug, "/app/users"));
  await expect(page.getByRole("heading", { level: 2, name: "Access is not allowed.", exact: true })).toBeVisible();
  await shoot(page, "auth-users-denied-reader-narrow");

  await context.close();
}
finally {
  await browser.close();
}
'@

Assert-PaperBinderEnvFileExists
Assert-PaperBinderFrontendToolchainAvailable
[void](Assert-PaperBinderDockerAvailable)
Assert-PaperBinderComposeAccess

$env:PAPERBINDER_PUBLIC_ROOT_URL = $e2eRootUrl
$env:PAPERBINDER_DB_HOST_PORT = "5433"
$env:PAPERBINDER_E2E_BASE_URL = $e2eRootUrl
$env:PAPERBINDER_QA_OUTPUT_DIR = $normalizedOutputDirectory

Invoke-QACompose -Arguments @("down", "--volumes", "--remove-orphans")

try {
  Write-Host "Ensuring Playwright Chromium is available..."
  Invoke-ExternalCommand `
    -FilePath (Get-NpxCommand) `
    -Arguments @("playwright", "install", "chromium") `
    -WorkingDirectory $frontendRoot

  Start-QARuntime

  Set-Content -LiteralPath $runnerPath -Value $runnerSource -Encoding utf8

  Invoke-ExternalCommand `
    -FilePath "node" `
    -Arguments @($runnerPath) `
    -WorkingDirectory $frontendRoot

  Write-Host "Responsive QA screenshots written to $OutputDirectory"
}
finally {
  Stop-QARuntime

  Remove-Item -LiteralPath $runnerPath -ErrorAction SilentlyContinue

  if ($null -ne $originalPublicRootUrl) {
    $env:PAPERBINDER_PUBLIC_ROOT_URL = $originalPublicRootUrl
  }
  else {
    Remove-Item Env:\PAPERBINDER_PUBLIC_ROOT_URL -ErrorAction SilentlyContinue
  }

  if ($null -ne $originalDbHostPort) {
    $env:PAPERBINDER_DB_HOST_PORT = $originalDbHostPort
  }
  else {
    Remove-Item Env:\PAPERBINDER_DB_HOST_PORT -ErrorAction SilentlyContinue
  }

  if ($null -ne $originalE2EBaseUrl) {
    $env:PAPERBINDER_E2E_BASE_URL = $originalE2EBaseUrl
  }
  else {
    Remove-Item Env:\PAPERBINDER_E2E_BASE_URL -ErrorAction SilentlyContinue
  }

  Remove-Item Env:\PAPERBINDER_QA_OUTPUT_DIR -ErrorAction SilentlyContinue
}
