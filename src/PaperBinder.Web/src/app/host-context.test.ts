import { describe, expect, it } from "vitest";
import { resolveHostContext } from "./host-context";
import { createLocationLike, testEnvironment } from "../test/test-helpers";

describe("host context", () => {
  it("Should_ResolveRootOrTenantHostContext_When_LocationMatchesConfiguredDomains", () => {
    const rootHost = resolveHostContext(
      createLocationLike({
        pathname: "/login"
      }),
      testEnvironment
    );

    const tenantHost = resolveHostContext(
      createLocationLike({
        origin: "https://acme.paperbinder.example.test",
        host: "acme.paperbinder.example.test",
        hostname: "acme.paperbinder.example.test",
        pathname: "/app"
      }),
      testEnvironment
    );

    const loopbackRoot = resolveHostContext(
      createLocationLike({
        origin: "http://localhost:5080",
        host: "localhost:5080",
        hostname: "localhost",
        pathname: "/"
      }),
      testEnvironment
    );

    expect(rootHost).toMatchObject({
      kind: "root",
      currentPath: "/login",
      debugAlias: false
    });
    expect(tenantHost).toMatchObject({
      kind: "tenant",
      tenantSlug: "acme",
      currentPath: "/app"
    });
    expect(loopbackRoot).toMatchObject({
      kind: "root",
      debugAlias: true
    });
  });
});
