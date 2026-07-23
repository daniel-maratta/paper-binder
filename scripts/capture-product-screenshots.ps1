[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

$repoRoot = Get-RepoRoot
$frontendRoot = Join-Path $repoRoot "src/PaperBinder.Web"
$e2eRootUrl = "http://paperbinder.localhost:5081"
$originalPublicRootUrl = $env:PAPERBINDER_PUBLIC_ROOT_URL
$originalDbHostPort = $env:PAPERBINDER_DB_HOST_PORT
$originalE2EBaseUrl = $env:PAPERBINDER_E2E_BASE_URL
$runnerPath = Join-Path $frontendRoot ".tmp-capture-product-screenshots.mjs"
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

function Invoke-E2ECompose {
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

function Start-E2ERuntime {
  Write-Host "Starting isolated product screenshot runtime..."
  Invoke-E2ECompose -Arguments @("up", "-d", "--build", "db", "migrations", "app", "worker")

  Wait-ForUrl -Url "$e2eRootUrl/health/live" -AllowedStatusCodes @(200)
  Wait-ForUrl -Url "$e2eRootUrl/health/ready" -AllowedStatusCodes @(200)
}

function Stop-E2ERuntime {
  Write-Host "Stopping isolated product screenshot runtime..."
  Invoke-E2ECompose -Arguments @("down", "--volumes", "--remove-orphans")
}

$runnerSource = @'
import { chromium, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(process.cwd(), "../..");
const baseUrl = process.env.PAPERBINDER_E2E_BASE_URL ?? "http://paperbinder.localhost:5081";
const challengePassToken = "paperbinder-test-challenge-pass";

const proofDir = path.join(repoRoot, "src", "PaperBinder.Web", "public", "presentation");
const mobileDir = path.join(repoRoot, "artifacts", "authenticated-mobile-screenshots");

function tenantHostUrl(tenantSlug, pathname = "/app") {
  return `http://${tenantSlug}.paperbinder.localhost:5081${pathname}`;
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

async function provisionTenantAndContinue(page) {
  const tenantName = `Screenshot ${Date.now()}`;
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
  await page.getByRole("button", { name: "Open workspace" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Workspace dashboard", exact: true })).toBeVisible();

  return {
    tenantSlug: payload.tenantSlug,
    email: payload.credentials.email,
    password: payload.credentials.password
  };
}

async function createRepresentativeWorkspace(page, tenantSlug) {
  await page.goto(tenantHostUrl(tenantSlug, "/app/binders"));
  await expect(page.getByRole("heading", { level: 2, name: "Binders", exact: true })).toBeVisible();

  await page.getByLabel("Binder name").fill("Operations");
  await page.getByRole("button", { name: "Add binder" }).click();
  await expect(page.getByText("Binder added.")).toBeVisible();
  await page.getByRole("link", { name: "Open binder", exact: true }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Operations", exact: true })).toBeVisible();
  const binderUrl = page.url();

  await page.getByLabel("Document title").fill("Runbook");
  await page.getByLabel("Document source").fill("# Runbook\n\nTenant-host browser path\n\n- Confirm owner access\n- Confirm reader visibility");
  await page.getByRole("button", { name: "Add document" }).click();
  await expect(page.getByText("Document added.")).toBeVisible();
  await page.getByRole("link", { name: "Open document" }).last().click();
  await expect(page.getByRole("heading", { level: 2, name: "Runbook", exact: true })).toBeVisible();
  const documentUrl = page.url();

  await page.goto(tenantHostUrl(tenantSlug, "/app/users"));
  await expect(page.getByRole("heading", { level: 2, name: "Users and access", exact: true })).toBeVisible();

  const readerEmail = `reader.${Date.now()}@${tenantSlug}.local`;
  await page.getByLabel("Email", { exact: true }).fill(readerEmail);
  await page.getByLabel("Role", { exact: true }).selectOption("BinderRead");
  await page.getByRole("button", { name: "Add user" }).click();
  await expect(page.getByText("User added.")).toBeVisible();
  const readerPassword = await page.getByRole("textbox", { name: "Workspace password", exact: true }).inputValue();

  return {
    binderUrl,
    documentUrl,
    readerEmail,
    readerPassword
  };
}

async function captureMobile(page, fileName) {
  await page.screenshot({
    path: path.join(mobileDir, fileName),
    fullPage: true
  });
}

fs.mkdirSync(proofDir, { recursive: true });
fs.mkdirSync(mobileDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1080 }
  });
  const page = await context.newPage();
  const tenant = await provisionTenantAndContinue(page);
  const workspace = await createRepresentativeWorkspace(page, tenant.tenantSlug);

  await page.goto(tenantHostUrl(tenant.tenantSlug, "/app"));
  await expect(page.getByRole("heading", { level: 2, name: "Workspace dashboard", exact: true })).toBeVisible();
  await page.screenshot({
    path: path.join(proofDir, "dashboard-proof.png"),
    fullPage: false
  });

  await page.goto(tenantHostUrl(tenant.tenantSlug, "/app/users"));
  await expect(page.getByRole("heading", { level: 2, name: "Users and access", exact: true })).toBeVisible();
  await page.screenshot({
    path: path.join(proofDir, "users-proof.png"),
    fullPage: false
  });

  await page.setViewportSize({ width: 410, height: 932 });
  await page.goto(tenantHostUrl(tenant.tenantSlug, "/app/binders"));
  await expect(page.getByRole("heading", { level: 2, name: "Binders", exact: true })).toBeVisible();
  await page.screenshot({
    path: path.join(proofDir, "binders-proof.png"),
    fullPage: true
  });

  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto(tenantHostUrl(tenant.tenantSlug, "/app"));
  await expect(page.getByRole("heading", { level: 2, name: "Workspace dashboard", exact: true })).toBeVisible();
  await captureMobile(page, "01-dashboard-admin.png");

  await page.getByRole("button", { name: "Open workspace menu" }).click();
  await expect(page.getByRole("button", { name: "Close workspace menu" })).toBeVisible();
  await captureMobile(page, "02-mobile-menu-open.png");

  await page.goto(tenantHostUrl(tenant.tenantSlug, "/app/binders"));
  await expect(page.getByRole("heading", { level: 2, name: "Binders", exact: true })).toBeVisible();
  await captureMobile(page, "03-binders-admin.png");

  await page.goto(workspace.binderUrl);
  await expect(page.getByRole("heading", { level: 2, name: "Operations", exact: true })).toBeVisible();
  await captureMobile(page, "04-binder-detail-admin.png");

  await page.goto(workspace.documentUrl);
  await expect(page.getByRole("heading", { level: 2, name: "Runbook", exact: true })).toBeVisible();
  await captureMobile(page, "05-document-detail-admin.png");

  await page.goto(tenantHostUrl(tenant.tenantSlug, "/app/users"));
  await expect(page.getByRole("heading", { level: 2, name: "Users and access", exact: true })).toBeVisible();
  await captureMobile(page, "06-users-admin.png");

  await context.clearCookies();
  await page.goto(`${baseUrl}/login`);
  await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
  await page.getByLabel("Email").fill(workspace.readerEmail);
  await page.getByLabel("Password").fill(workspace.readerPassword);
  await completeChallenge(page);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(tenantHostUrl(tenant.tenantSlug));
  await page.goto(tenantHostUrl(tenant.tenantSlug, "/app/users"));
  await expect(page.getByRole("heading", { level: 2, name: "Access is not allowed.", exact: true })).toBeVisible();
  await captureMobile(page, "07-users-denied-reader.png");

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

Invoke-E2ECompose -Arguments @("down", "--volumes", "--remove-orphans")

try {
  Write-Host "Ensuring Playwright Chromium is available..."
  Invoke-ExternalCommand `
    -FilePath (Get-NpxCommand) `
    -Arguments @("playwright", "install", "chromium") `
    -WorkingDirectory $frontendRoot

  Start-E2ERuntime

  Set-Content -LiteralPath $runnerPath -Value $runnerSource -Encoding utf8

  Invoke-ExternalCommand `
    -FilePath "node" `
    -Arguments @($runnerPath) `
    -WorkingDirectory $frontendRoot
}
finally {
  Stop-E2ERuntime

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
}
