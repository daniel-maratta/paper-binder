import { expect, test } from "@playwright/test";
import {
  challengeFailToken,
  completeChallenge,
  provisionTenantAndContinue,
  submitLoginAndWaitForResponse,
  tenantHostUrl
} from "./helpers";

let provisionedEmail: string | null = null;
let provisionedPassword: string | null = null;
let provisionedTenantSlug: string | null = null;

test.describe.configure({ mode: "serial" });

test("Should_ProvisionAndAutoLogin_FromRootHost_InBrowser_AgainstTheExplicitE2ERuntime", async ({ page }) => {
  const provisionedTenant = await provisionTenantAndContinue(page, `Acme CP13 ${Date.now()}`);

  expect(provisionedTenant.request.headers()["x-api-version"]).toBe("1");
  expect(provisionedTenant.response.headers()["x-correlation-id"]).toBeTruthy();

  provisionedEmail = provisionedTenant.email;
  provisionedPassword = provisionedTenant.password;
  provisionedTenantSlug = provisionedTenant.tenantSlug;

  await expect(page).toHaveURL(tenantHostUrl(provisionedTenant.tenantSlug));
  await expect(page.getByRole("heading", { name: "Tenant dashboard" })).toBeVisible();
});

test("Should_SubmitLoginRequest_AndRedirectUsingServerProvidedUrl_When_RootHostLoginSucceeds", async ({
  context,
  page
}) => {
  test.skip(provisionedEmail === null || provisionedPassword === null || provisionedTenantSlug === null);

  await context.clearCookies();
  await page.goto("/login");
  await page.getByLabel("Email").fill(provisionedEmail!);
  await page.getByLabel("Password").fill(provisionedPassword!);
  await completeChallenge(page);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL(tenantHostUrl(provisionedTenantSlug!));
  await expect(page.getByRole("heading", { name: "Tenant dashboard" })).toBeVisible();
});

test("Should_SurfaceChallengeFailureInvalidCredentialsAndRateLimit_InBrowserWithoutLeakingInternals", async ({
  context,
  page
}) => {
  test.skip(provisionedEmail === null || provisionedPassword === null);

  await context.clearCookies();
  await page.goto("/login");
  await page.getByLabel("Email").fill(provisionedEmail!);
  await page.getByLabel("Password").fill(provisionedPassword!);
  await completeChallenge(page, challengeFailToken);
  expect((await submitLoginAndWaitForResponse(page)).status()).toBe(403);
  await expect(page.getByRole("heading", { name: "Challenge verification failed." })).toBeVisible();

  await completeChallenge(page);
  await page.getByLabel("Password").fill("wrong-password");
  expect((await submitLoginAndWaitForResponse(page)).status()).toBe(401);
  await expect(page.getByRole("heading", { name: "Credentials were not accepted." })).toBeVisible();

  let rateLimited = false;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    await completeChallenge(page);
    const status = (await submitLoginAndWaitForResponse(page)).status();

    if (status === 429) {
      await expect(page.getByRole("heading", { name: "Too many attempts." })).toBeVisible();
      rateLimited = true;
      break;
    }

    expect(status).toBe(401);
    await expect(page.getByRole("heading", { name: "Credentials were not accepted." })).toBeVisible();
  }

  expect(rateLimited).toBe(true);
  await expect(page.getByText(/Retry in about/i)).toBeVisible();
});
