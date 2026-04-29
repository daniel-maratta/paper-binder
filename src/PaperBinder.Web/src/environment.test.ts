import { describe, expect, it } from "vitest";
import { readFrontendEnvironment } from "./environment";

describe("frontend environment", () => {
  it("Should_ReadFrontendEnvironment_When_RuntimeEnvUsesConfiguredFallbackValues", () => {
    const environment = readFrontendEnvironment(
      {},
      {
        VITE_PAPERBINDER_ROOT_URL: "https://paperbinder.example.test",
        VITE_PAPERBINDER_API_BASE_URL: "https://paperbinder.example.test",
        VITE_PAPERBINDER_TENANT_BASE_DOMAIN: "paperbinder.example.test",
        VITE_PAPERBINDER_CHALLENGE_SITE_KEY: "demo-site-key",
        VITE_PAPERBINDER_CHALLENGE_SCRIPT_URL: "https://challenge.example.test/api.js",
        VITE_PAPERBINDER_CHALLENGE_LOCAL_BYPASS_ENABLED: "false"
      }
    );

    expect(environment).toMatchObject({
      rootUrl: "https://paperbinder.example.test",
      apiBaseUrl: "https://paperbinder.example.test",
      tenantBaseDomain: "paperbinder.example.test",
      rootHost: "paperbinder.example.test",
      apiOrigin: "https://paperbinder.example.test",
      challengeSiteKey: "demo-site-key",
      challengeScriptUrl: "https://challenge.example.test/api.js",
      challengeLocalBypassEnabled: false
    });
  });
});
