import { expect, test } from "@playwright/test";
import { completeChallenge, expireTenant, provisionTenantAndContinue, tenantHostUrl } from "./helpers";

test("Should_ExerciseAdminNormalForbiddenAndLogoutTenantFlows_InBrowser", async ({ page }) => {
  const provisionedTenant = await provisionTenantAndContinue(page, `Acme CP14 ${Date.now()}`);
  const readerEmail = `reader.${Date.now()}@${provisionedTenant.tenantSlug}.local`;
  let readerPassword = "";

  await expect(page.getByRole("heading", { level: 2, name: "Workspace dashboard", exact: true })).toBeVisible();
  await expect(page.getByText("0 of 3", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Extend lease" })).toBeVisible();

  await page.getByRole("button", { name: "Extend lease" }).click();
  await expect(page.getByText(/1 of 3/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Extend lease" })).not.toBeVisible();

  await page.getByRole("link", { name: /Binders/ }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Binders", exact: true })).toBeVisible();

  const binderCreateRequest = page.waitForRequest(
    (request) => request.url().endsWith("/api/binders") && request.method() === "POST"
  );
  const binderCreateResponse = page.waitForResponse(
    (response) => response.url().endsWith("/api/binders") && response.request().method() === "POST"
  );

  await page.getByLabel("Binder name").fill("Operations");
  await page.getByRole("button", { name: "Add binder" }).click();

  expect((await binderCreateRequest).headers()["x-api-version"]).toBe("1");
  expect((await binderCreateResponse).headers()["x-correlation-id"]).toBeTruthy();

  await expect(page.getByText("Binder added.")).toBeVisible();
  await page.getByRole("link", { name: "Open binder", exact: true }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Operations", exact: true })).toBeVisible();

  await page.getByLabel("Document title").fill("Runbook");
  await page.getByLabel("Document source").fill("# Runbook\n\nTenant-host browser path");
  await page.getByRole("button", { name: "Add document" }).click();
  await expect(page.getByText("Document added.")).toBeVisible();
  await page.getByRole("link", { name: "Open document" }).last().click();
  await expect(page.getByRole("heading", { level: 2, name: "Runbook", exact: true })).toBeVisible();
  await expect(page.getByText("Tenant-host browser path")).toBeVisible();
  await page.getByRole("link", { name: "Back to binder" }).click();

  await page.getByRole("link", { name: /Users/ }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Users and access", exact: true })).toBeVisible();

  await page.getByLabel("Email", { exact: true }).fill(readerEmail);
  await page.getByLabel("Role", { exact: true }).selectOption("BinderRead");
  await page.getByRole("button", { name: "Add user" }).click();
  await expect(page.getByText("User added.")).toBeVisible();
  readerPassword = await page.getByRole("textbox", { name: "Workspace password", exact: true }).inputValue();
  expect(readerPassword).not.toBe("");

  await page.goto(tenantHostUrl(provisionedTenant.tenantSlug, "/app/binders"));
  await page.getByRole("link", { name: "Open binder", exact: true }).click();
  await page.getByLabel("Access mode").selectOption("restricted_roles");
  await page.getByLabel("Tenant admin").check();
  await page.getByLabel("Binder read").check();
  await page.getByRole("button", { name: "Save policy" }).click();
  await expect(page.getByText("Binder access saved.")).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL("http://paperbinder.localhost:5081/login");
  await expect(page.getByRole("heading", { name: "Sign in to a demo workspace", exact: true })).toBeVisible();

  await page.getByLabel("Email").fill(readerEmail);
  await page.getByLabel("Password").fill(readerPassword);
  await completeChallenge(page);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL(tenantHostUrl(provisionedTenant.tenantSlug));
  await expect(page.getByRole("heading", { level: 2, name: "Workspace dashboard", exact: true })).toBeVisible();

  await page.getByRole("link", { name: /Binders/ }).click();
  await page.getByRole("link", { name: "Open binder", exact: true }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Operations", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Open document" }).first().click();
  await expect(page.getByRole("heading", { level: 2, name: "Runbook", exact: true })).toBeVisible();

  await page.goto(tenantHostUrl(provisionedTenant.tenantSlug, "/app/users"));
  await expect(page.getByRole("heading", { level: 2, name: "Access is not allowed." })).toBeVisible();
});

test("Should_RenderExpiredTenantState_InBrowser_When_TenantLeaseHasExpired", async ({ page }) => {
  const provisionedTenant = await provisionTenantAndContinue(page, `Expired CP14 ${Date.now()}`);

  await expect(page.getByRole("heading", { level: 2, name: "Workspace dashboard", exact: true })).toBeVisible();

  expireTenant(provisionedTenant.tenantSlug);
  await page.goto(tenantHostUrl(provisionedTenant.tenantSlug, "/app"));

  await expect(page.getByRole("heading", { name: "Demo expired", exact: true })).toBeVisible();
  await expect(
    page.getByText(
      /paperbinder is keeping it briefly because there was recent activity, but access is already closed and cleanup will remove it soon/i
    )
  ).toBeVisible();
});

test("Should_StartViewAsFromUsersRoute_AndReturnToAdminSession_InBrowser", async ({ page }) => {
  const provisionedTenant = await provisionTenantAndContinue(page, `Acme CP15 ${Date.now()}`);
  const readerEmail = `reader.${Date.now()}@${provisionedTenant.tenantSlug}.local`;

  await page.getByRole("link", { name: /Users/ }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Users and access", exact: true })).toBeVisible();

  await page.getByLabel("Email", { exact: true }).fill(readerEmail);
  await page.getByLabel("Role", { exact: true }).selectOption("BinderRead");
  await page.getByRole("button", { name: "Add user" }).click();
  await expect(page.getByText("User added.")).toBeVisible();

  const impersonationStartResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/tenant/impersonation") &&
      response.request().method() === "POST"
  );

  await page.getByRole("button", { name: `Manage user ${readerEmail}` }).click();
  await page.getByRole("button", { name: "View as this user" }).click();

  expect((await impersonationStartResponse).status()).toBe(200);
  await expect(page).toHaveURL(tenantHostUrl(provisionedTenant.tenantSlug));
  await expect(page.getByText("Viewing as")).toBeVisible();
  await expect(page.getByText(readerEmail, { exact: true })).toBeVisible();

  await page.getByRole("link", { name: /Users/ }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Access is not allowed.", exact: true })).toBeVisible();

  const impersonationStopResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/tenant/impersonation") &&
      response.request().method() === "DELETE"
  );

  await page.getByRole("button", { name: "Stop view as" }).click();

  expect((await impersonationStopResponse).status()).toBe(200);
  await expect(page.getByRole("heading", { level: 2, name: "Users and access", exact: true })).toBeVisible();
  await expect(page.getByText("Viewing as")).not.toBeVisible();
  await expect(page.getByRole("button", { name: `Manage user ${readerEmail}` })).toBeVisible();
});
