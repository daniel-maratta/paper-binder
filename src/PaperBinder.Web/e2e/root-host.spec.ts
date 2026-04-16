import { expect, test, type Page } from "@playwright/test";

const challengePassToken = "paperbinder-test-challenge-pass";
const challengeFailToken = "paperbinder-test-challenge-fail";

let provisionedEmail: string | null = null;
let provisionedPassword: string | null = null;
let provisionedTenantSlug: string | null = null;

async function completeChallenge(page: Page, token = challengePassToken) {
  await page.evaluate((nextToken) => {
    (window as Window & { __paperbinderTurnstileNextToken?: string | null }).__paperbinderTurnstileNextToken =
      nextToken;
  }, token);

  await page.getByRole("button", { name: "Complete challenge" }).click();
  await expect(page.getByText("Challenge complete.")).toBeVisible();
}

async function submitLoginAndWaitForResponse(page: Page) {
  const loginResponse = page.waitForResponse((response) => response.url().endsWith("/api/auth/login"));
  await page.getByRole("button", { name: "Log in" }).click();
  return loginResponse;
}

test.describe.configure({ mode: "serial" });

test("Should_ProvisionAndAutoLogin_FromRootHost_InBrowser_AgainstTheExplicitE2ERuntime", async ({ page }) => {
  const tenantName = `Acme CP13 ${Date.now()}`;
  const provisionRequest = page.waitForRequest((request) => request.url().endsWith("/api/provision"));
  const provisionResponse = page.waitForResponse((response) => response.url().endsWith("/api/provision"));

  await page.goto("/");
  await page.getByLabel("Tenant name").fill(tenantName);
  await completeChallenge(page);
  await page.getByRole("button", { name: "Provision new demo tenant and log in" }).click();

  const request = await provisionRequest;
  const response = await provisionResponse;

  expect(request.headers()["x-api-version"]).toBe("1");
  expect(response.headers()["x-correlation-id"]).toBeTruthy();

  await expect(page.getByRole("heading", { name: "Tenant provisioned." })).toBeVisible();

  provisionedEmail = await page.getByLabel("Email").inputValue();
  provisionedPassword = await page.getByLabel("Password").inputValue();
  provisionedTenantSlug = provisionedEmail.split("@")[1].replace(".local", "");

  await page.getByRole("button", { name: "Continue to tenant" }).click();
  await expect(page).toHaveURL(`http://${provisionedTenantSlug}.paperbinder.localhost:5081/app`);
  await expect(page.getByRole("heading", { name: "Tenant dashboard placeholder" })).toBeVisible();
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

  await expect(page).toHaveURL(`http://${provisionedTenantSlug}.paperbinder.localhost:5081/app`);
  await expect(page.getByRole("heading", { name: "Tenant dashboard placeholder" })).toBeVisible();
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
