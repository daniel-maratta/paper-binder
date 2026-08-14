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

test("Should_RenderFlagshipArticleRoute_InBrowserAcrossResponsiveWidths", async ({ page }) => {
  const articleResponse = await page.request.get("/articles/building-paperbinder-production-shaped-saas-demo");
  expect(articleResponse.status()).toBe(200);
  const articleHtml = await articleResponse.text();
  expect(articleHtml).toContain(
    "<title>Building PaperBinder: From AI-Generated Code to Shippable Software | PaperBinder</title>"
  );
  expect(articleHtml).toContain('<meta property="og:type" content="article" />');
  expect(articleHtml).toContain(
    '<link rel="canonical" href="https://paperbinder.danielmaratta.com/articles/building-paperbinder-production-shaped-saas-demo" />'
  );
  expect(articleHtml).toContain('<script id="paperbinder-flagship-article-jsonld" type="application/ld+json">');
  expect(articleHtml).toContain('"@type":"Article"');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/articles/building-paperbinder-production-shaped-saas-demo");

  await expect(
    page.getByRole("heading", { name: "Building PaperBinder: From AI-Generated Code to Shippable Software" })
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Introduction" })).toBeVisible();
  await expect(
    page.getByRole("img", {
      name: "PaperBinder public interface after the v1.1 frontend redesign."
    })
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(
    true
  );
  expect(await page.evaluate(() => document.querySelectorAll("#paperbinder-flagship-article-jsonld").length)).toBe(1);

  await page.setViewportSize({ width: 1180, height: 768 });
  await page.reload();

  const sectionsToggle = page.getByRole("button", { name: /Sections/ });
  await expect(sectionsToggle).toBeVisible();
  await expect(sectionsToggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("link", { name: "Where AI Helped" })).toBeHidden();

  await sectionsToggle.click();

  await expect(sectionsToggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("link", { name: "Where AI Helped" })).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(sectionsToggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("link", { name: "Where AI Helped" })).toBeHidden();

  await page.setViewportSize({ width: 1181, height: 768 });
  await page.reload();

  await expect(page.getByRole("button", { name: /Sections/ })).toBeHidden();
  await expect(page.getByRole("link", { name: "Where AI Helped" })).toBeVisible();

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.reload();

  await expect(page.getByRole("heading", { name: "Conclusion" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open live demo" }).first()).toHaveAttribute(
    "href",
    "https://paperbinder.danielmaratta.com"
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(
    true
  );
});

test("Should_ProvisionAndAutoLogin_FromRootHost_InBrowser_AgainstTheExplicitE2ERuntime", async ({ page }) => {
  const provisionedTenant = await provisionTenantAndContinue(page, `Acme CP13 ${Date.now()}`);

  expect(provisionedTenant.request.headers()["x-api-version"]).toBe("1");
  expect(provisionedTenant.response.headers()["x-correlation-id"]).toBeTruthy();

  provisionedEmail = provisionedTenant.email;
  provisionedPassword = provisionedTenant.password;
  provisionedTenantSlug = provisionedTenant.tenantSlug;

  await expect(page).toHaveURL(tenantHostUrl(provisionedTenant.tenantSlug));
  await expect(page.getByRole("heading", { name: "Workspace dashboard" })).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "Workspace dashboard" })).toBeVisible();
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
