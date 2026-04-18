import { expect, test } from "@playwright/test";
import { completeChallenge, expireTenant, provisionTenantAndContinue, tenantHostUrl } from "./helpers";

test("Should_ExerciseAdminNormalForbiddenAndLogoutTenantFlows_InBrowser", async ({ page }) => {
  const provisionedTenant = await provisionTenantAndContinue(page, `Acme CP14 ${Date.now()}`);
  const readerEmail = `reader.${Date.now()}@${provisionedTenant.tenantSlug}.local`;
  const readerPassword = "Checkpoint14-reader!1";

  await expect(page.getByRole("heading", { level: 2, name: "Tenant dashboard", exact: true })).toBeVisible();
  await expect(page.getByText("0 of 3")).toBeVisible();
  await expect(page.getByRole("button", { name: "Extend lease" })).toBeVisible();

  await page.getByRole("button", { name: "Extend lease" }).click();
  await expect(page.getByText("1 of 3")).toBeVisible();
  await expect(page.getByRole("button", { name: "Extend when window opens" })).toBeDisabled();

  await page.getByRole("link", { name: /Binders/ }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Binders", exact: true })).toBeVisible();

  const binderCreateRequest = page.waitForRequest(
    (request) => request.url().endsWith("/api/binders") && request.method() === "POST"
  );
  const binderCreateResponse = page.waitForResponse(
    (response) => response.url().endsWith("/api/binders") && response.request().method() === "POST"
  );

  await page.getByLabel("Binder name").fill("Operations");
  await page.getByRole("button", { name: "Create binder" }).click();

  expect((await binderCreateRequest).headers()["x-api-version"]).toBe("1");
  expect((await binderCreateResponse).headers()["x-correlation-id"]).toBeTruthy();

  await expect(page.getByText("Binder created.")).toBeVisible();
  await page.getByRole("link", { name: "Open binder" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Operations", exact: true })).toBeVisible();

  await page.getByLabel("Document title").fill("Runbook");
  await page.getByLabel("Markdown content").fill("# Runbook\n\nTenant-host browser path");
  await page.getByRole("button", { name: "Create document" }).click();
  await expect(page.getByText("Document created.")).toBeVisible();
  await page.getByRole("link", { name: "Open document" }).last().click();
  await expect(page.getByRole("heading", { level: 2, name: "Runbook", exact: true })).toBeVisible();
  await expect(page.getByText("# Runbook")).toBeVisible();
  await page.getByRole("link", { name: "Back to binder" }).click();

  await page.getByRole("link", { name: /Users/ }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Tenant users", exact: true })).toBeVisible();

  await page.getByLabel("Email", { exact: true }).fill(readerEmail);
  await page.getByLabel("Temporary password", { exact: true }).fill(readerPassword);
  await page.getByLabel("Role", { exact: true }).selectOption("BinderRead");
  await page.getByRole("button", { name: "Create tenant user" }).click();
  await expect(page.getByText("Tenant user created.")).toBeVisible();

  await page.goto(tenantHostUrl(provisionedTenant.tenantSlug, "/app/binders"));
  await page.getByRole("link", { name: "Open binder" }).click();
  await page.getByLabel("Policy mode").selectOption("restricted_roles");
  await page.getByLabel("Binder read").check();
  await page.getByRole("button", { name: "Save policy" }).click();
  await expect(page.getByText("Binder policy saved.")).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL("http://paperbinder.localhost:5081/login");
  await expect(page.getByRole("heading", { level: 2, name: "Log in to an existing tenant", exact: true })).toBeVisible();

  await page.getByLabel("Email").fill(readerEmail);
  await page.getByLabel("Password").fill(readerPassword);
  await completeChallenge(page);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL(tenantHostUrl(provisionedTenant.tenantSlug));
  await expect(page.getByRole("heading", { level: 2, name: "Tenant dashboard", exact: true })).toBeVisible();

  await page.getByRole("link", { name: /Binders/ }).click();
  await page.getByRole("link", { name: "Open binder" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Operations", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Open document" }).first().click();
  await expect(page.getByRole("heading", { level: 2, name: "Runbook", exact: true })).toBeVisible();

  await page.goto(tenantHostUrl(provisionedTenant.tenantSlug, "/app/users"));
  await expect(page.getByRole("heading", { level: 2, name: "Access is not allowed." })).toBeVisible();
});

test("Should_RenderExpiredTenantState_InBrowser_When_TenantLeaseHasExpired", async ({ page }) => {
  const provisionedTenant = await provisionTenantAndContinue(page, `Expired CP14 ${Date.now()}`);

  await expect(page.getByRole("heading", { level: 2, name: "Tenant dashboard", exact: true })).toBeVisible();

  expireTenant(provisionedTenant.tenantSlug);
  await page.goto(tenantHostUrl(provisionedTenant.tenantSlug, "/app"));

  await expect(page.getByRole("heading", { level: 2, name: "Tenant expired", exact: true })).toBeVisible();
  await expect(page.getByText(/safe fallback only/i)).toBeVisible();
});

test("Should_StartViewAsFromUsersRoute_AndReturnToAdminSession_InBrowser", async ({ page }) => {
  const provisionedTenant = await provisionTenantAndContinue(page, `Acme CP15 ${Date.now()}`);
  const readerEmail = `reader.${Date.now()}@${provisionedTenant.tenantSlug}.local`;
  const readerPassword = "Checkpoint15-reader!1";

  await page.getByRole("link", { name: /Users/ }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Tenant users", exact: true })).toBeVisible();

  await page.getByLabel("Email", { exact: true }).fill(readerEmail);
  await page.getByLabel("Temporary password", { exact: true }).fill(readerPassword);
  await page.getByLabel("Role", { exact: true }).selectOption("BinderRead");
  await page.getByRole("button", { name: "Create tenant user" }).click();
  await expect(page.getByText("Tenant user created.")).toBeVisible();

  const impersonationStartResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/tenant/impersonation") &&
      response.request().method() === "POST"
  );

  await page.getByRole("button", { name: "View as" }).click();

  expect((await impersonationStartResponse).status()).toBe(200);
  await expect(page).toHaveURL(tenantHostUrl(provisionedTenant.tenantSlug));
  await expect(page.getByText("Impersonation active.")).toBeVisible();
  await expect(page.getByText(new RegExp(`Authorizing as ${readerEmail}`, "i"))).toBeVisible();

  await page.getByRole("link", { name: /Users/ }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Access is not allowed.", exact: true })).toBeVisible();

  const impersonationStopResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/tenant/impersonation") &&
      response.request().method() === "DELETE"
  );

  await page.getByRole("button", { name: "Stop impersonation" }).click();

  expect((await impersonationStopResponse).status()).toBe(200);
  await expect(page.getByRole("heading", { level: 2, name: "Tenant users", exact: true })).toBeVisible();
  await expect(page.getByText("Impersonation active.")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "View as" })).toBeVisible();
});
