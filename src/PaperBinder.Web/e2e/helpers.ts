import { expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import path from "node:path";

export const challengePassToken = "paperbinder-test-challenge-pass";
export const challengeFailToken = "paperbinder-test-challenge-fail";

type ProvisionPayload = {
  tenantSlug: string;
  credentials: {
    email: string;
    password: string;
  };
};

const repoRoot = path.resolve(process.cwd(), "../..");
const composeBaseArguments = [
  "compose",
  "-p",
  "paperbinder-e2e",
  "-f",
  "docker-compose.yml",
  "-f",
  "docker-compose.e2e.yml"
];

export function tenantHostUrl(tenantSlug: string, pathname = "/app") {
  return `http://${tenantSlug}.paperbinder.localhost:5081${pathname}`;
}

export async function completeChallenge(page: Page, token = challengePassToken) {
  await page.evaluate((nextToken) => {
    (window as Window & { __paperbinderTurnstileNextToken?: string | null }).__paperbinderTurnstileNextToken =
      nextToken;
  }, token);

  await page.getByRole("button", { name: "Complete challenge" }).click();
  await expect(page.getByText("Challenge complete.")).toBeVisible();
}

export async function submitLoginAndWaitForResponse(page: Page) {
  const loginResponse = page.waitForResponse((response) => response.url().endsWith("/api/auth/login"));
  await page.getByRole("button", { name: "Log in" }).click();
  return loginResponse;
}

export async function provisionTenantAndContinue(page: Page, tenantName: string) {
  const provisionRequest = page.waitForRequest((request) => request.url().endsWith("/api/provision"));
  const provisionResponse = page.waitForResponse((response) => response.url().endsWith("/api/provision"));

  await page.goto("/");
  await page.getByLabel("Tenant name").fill(tenantName);
  await completeChallenge(page);
  await page.getByRole("button", { name: "Provision new demo tenant and log in" }).click();

  const request = await provisionRequest;
  const response = await provisionResponse;
  const payload = (await response.json()) as ProvisionPayload;

  expect(response.status()).toBe(201);
  await expect(page.getByRole("button", { name: "Continue to tenant" })).toBeVisible();

  const email = payload.credentials.email;
  const password = payload.credentials.password;
  const tenantSlug = payload.tenantSlug;

  await page.getByRole("button", { name: "Continue to tenant" }).click();

  return {
    request,
    response,
    email,
    password,
    tenantSlug,
    tenantUrl: tenantHostUrl(tenantSlug)
  };
}

export async function loginFromRootHost(page: Page, credentials: { email: string; password: string }) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await completeChallenge(page);
  await page.getByRole("button", { name: "Log in" }).click();
}

export function runTenantSql(sql: string) {
  execFileSync(
    "docker",
    [
      ...composeBaseArguments,
      "exec",
      "-T",
      "db",
      "env",
      "PGPASSWORD=paperbinder_local_password",
      "psql",
      "-U",
      "paperbinder",
      "-d",
      "paperbinder",
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      sql
    ],
    {
      cwd: repoRoot,
      stdio: "pipe"
    }
  );
}

export function expireTenant(tenantSlug: string) {
  const safeTenantSlug = tenantSlug.replaceAll("'", "''");
  runTenantSql(
    `update tenants set expires_at_utc = now() - interval '1 minute' where slug = '${safeTenantSlug}';`
  );
}
