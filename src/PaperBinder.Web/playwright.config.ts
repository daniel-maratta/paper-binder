import { defineConfig } from "@playwright/test";

const baseURL = process.env.PAPERBINDER_E2E_BASE_URL ?? "http://paperbinder.localhost:5081";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  }
});
