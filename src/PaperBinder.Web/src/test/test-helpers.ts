import type { BrowserLocationLike } from "../app/host-context";
import { resolveHostContext, type HostContext } from "../app/host-context";
import type { FrontendEnvironment } from "../environment";

export const testEnvironment: FrontendEnvironment = {
  rootUrl: "https://paperbinder.example.test",
  apiBaseUrl: "https://paperbinder.example.test",
  tenantBaseDomain: "paperbinder.example.test",
  rootHost: "paperbinder.example.test",
  apiOrigin: "https://paperbinder.example.test",
  challengeSiteKey: "demo-site-key",
  challengeScriptUrl: "https://challenge.example.test/api.js"
};

export function createLocationLike(
  overrides: Partial<BrowserLocationLike> = {}
): BrowserLocationLike {
  return {
    origin: "https://paperbinder.example.test",
    host: "paperbinder.example.test",
    hostname: "paperbinder.example.test",
    pathname: "/",
    search: "",
    hash: "",
    ...overrides
  };
}

export function createRootHostContext(pathname = "/"): HostContext {
  return resolveHostContext(createLocationLike({ pathname }), testEnvironment);
}

export function createTenantHostContext(pathname = "/app"): HostContext {
  return resolveHostContext(
    createLocationLike({
      origin: "https://acme.paperbinder.example.test",
      host: "acme.paperbinder.example.test",
      hostname: "acme.paperbinder.example.test",
      pathname
    }),
    testEnvironment
  );
}
