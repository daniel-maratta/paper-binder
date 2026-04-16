import { describe, expect, it } from "vitest";
import { readFrontendEnvironment } from "./environment";

describe("frontend environment", () => {
  it("Should_ReadFrontendEnvironment_When_RuntimeEnvUsesConfiguredFallbackValues", () => {
    const environment = readFrontendEnvironment(
      {},
      {
        VITE_PAPERBINDER_ROOT_URL: "https://paperbinder.example.test",
        VITE_PAPERBINDER_API_BASE_URL: "https://paperbinder.example.test",
        VITE_PAPERBINDER_TENANT_BASE_DOMAIN: "paperbinder.example.test"
      }
    );

    expect(environment).toMatchObject({
      rootUrl: "https://paperbinder.example.test",
      apiBaseUrl: "https://paperbinder.example.test",
      tenantBaseDomain: "paperbinder.example.test",
      rootHost: "paperbinder.example.test",
      apiOrigin: "https://paperbinder.example.test"
    });
  });
});
