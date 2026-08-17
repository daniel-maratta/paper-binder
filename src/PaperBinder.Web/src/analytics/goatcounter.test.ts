import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveHostContext } from "../app/host-context";
import { publicLoginRoutePath, rootRouteDefinitions } from "../app/route-registry";
import { flagshipArticle } from "../content/articles/flagship-article";
import { legalDocuments } from "../content/legal/legal-documents";
import { createLocationLike, testEnvironment } from "../test/test-helpers";
import {
  publicAnalyticsEventNames,
  publicAnalyticsRouteDefinitions,
  resetPaperBinderAnalyticsForTests,
  resolvePaperBinderAnalyticsPath,
  resolvePaperBinderAnalyticsReferrer,
  shouldEnablePaperBinderAnalytics,
  trackPaperBinderEvent,
  trackPaperBinderPageview
} from "./goatcounter";

const createdImageUrls: string[] = [];
const createdImageReferrerPolicies: string[] = [];

class TestImage {
  private storedReferrerPolicy = "";

  set referrerPolicy(value: string) {
    this.storedReferrerPolicy = value;
    createdImageReferrerPolicies.push(value);
  }

  get referrerPolicy() {
    return this.storedReferrerPolicy;
  }

  set src(value: string) {
    createdImageUrls.push(value);
  }
}

function installAnalyticsRequestStub() {
  createdImageUrls.length = 0;
  createdImageReferrerPolicies.length = 0;
  vi.stubGlobal("Image", TestImage);
  vi.stubGlobal("crypto", {
    randomUUID: () => "00000000-0000-4000-8000-000000000000"
  });
}

function createPublicHostContext() {
  const hostContext = resolveHostContext(createLocationLike(), testEnvironment);
  if (hostContext.kind !== "root") {
    throw new Error("Expected root host context.");
  }

  return hostContext;
}

function createTenantHostContext(pathname = "/app") {
  const hostContext = resolveHostContext(
    createLocationLike({
      origin: "https://acme.paperbinder.example.test",
      host: "acme.paperbinder.example.test",
      hostname: "acme.paperbinder.example.test",
      pathname
    }),
    testEnvironment
  );
  if (hostContext.kind !== "tenant") {
    throw new Error("Expected tenant host context.");
  }

  return hostContext;
}

function getOnlyRequestUrl(): URL {
  expect(createdImageUrls).toHaveLength(1);
  return new URL(createdImageUrls[0]);
}

afterEach(() => {
  resetPaperBinderAnalyticsForTests();
  createdImageUrls.length = 0;
  createdImageReferrerPolicies.length = 0;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("GoatCounter analytics", () => {
  it("Should_TrackEveryKnownPublicRoute_WithExplicitSanitizedRoutePath", () => {
    const expectedRoutes = new Set([
      ...rootRouteDefinitions.map((route) => route.path),
      publicLoginRoutePath,
      flagshipArticle.path,
      ...legalDocuments.map((document) => document.path)
    ]);

    expect(new Set(publicAnalyticsRouteDefinitions.map((route) => route.path))).toEqual(expectedRoutes);

    for (const path of expectedRoutes) {
      expect(resolvePaperBinderAnalyticsPath(path, "root")).toBe(path);
      expect(resolvePaperBinderAnalyticsPath(`${path}?workspace=acme#section`, "root")).toBe("/not-found");
    }
  });

  it("Should_TemplateTenantIdentifiers_When_ResolvingTenantRoutePaths", () => {
    expect(resolvePaperBinderAnalyticsPath("/app/binders/binder-1", "tenant")).toBe("/app/binders/:binderId");
    expect(resolvePaperBinderAnalyticsPath("/app/documents/document-1", "tenant")).toBe("/app/documents/:documentId");
    expect(resolvePaperBinderAnalyticsPath("/app/binders", "tenant")).toBe("/app/binders");
    expect(resolvePaperBinderAnalyticsPath("/app/users", "tenant")).toBe("/app/users");
  });

  it("Should_DropUnknownAndInvalidDetails_When_ResolvingAnalyticsPaths", () => {
    expect(resolvePaperBinderAnalyticsPath("/unexpected-user-supplied-path", "root")).toBe("/not-found");
    expect(resolvePaperBinderAnalyticsPath("/app/unexpected-user-supplied-path", "tenant")).toBe("/app/*");
    expect(resolvePaperBinderAnalyticsPath("/privacy/", "root")).toBe("/privacy");
    expect(resolvePaperBinderAnalyticsPath("/anything", "invalid")).toBeNull();
  });

  it("Should_EnableOnlyConfiguredPublicPaperBinderHosts", () => {
    const rootHostContext = createPublicHostContext();
    const tenantHostContext = createTenantHostContext();
    const invalidHostContext = resolveHostContext(
      createLocationLike({
        origin: "https://unexpected.example.test",
        host: "unexpected.example.test",
        hostname: "unexpected.example.test"
      }),
      testEnvironment
    );

    expect(shouldEnablePaperBinderAnalytics(rootHostContext, "paperbinder.example.test")).toBe(true);
    expect(shouldEnablePaperBinderAnalytics(tenantHostContext, "acme.paperbinder.example.test")).toBe(true);
    expect(shouldEnablePaperBinderAnalytics(rootHostContext, "paperbinder.localhost")).toBe(false);
    expect(shouldEnablePaperBinderAnalytics(rootHostContext, "unexpected.example.test")).toBe(false);
    expect(shouldEnablePaperBinderAnalytics(invalidHostContext, "unexpected.example.test")).toBe(false);
  });

  it("Should_DisableAnalytics_When_EnvironmentFlagIsFalseEvenOnConfiguredPublicHosts", () => {
    const hostContext = {
      ...createPublicHostContext(),
      environment: {
        ...testEnvironment,
        analyticsEnabled: false
      }
    };

    expect(shouldEnablePaperBinderAnalytics(hostContext, "paperbinder.example.test")).toBe(false);
  });

  it("Should_StripInternalReferrersQueriesAndFragments", () => {
    expect(
      resolvePaperBinderAnalyticsReferrer(
        "https://acme.paperbinder.example.test/app?workspace=acme#secret",
        testEnvironment
      )
    ).toBe("");

    expect(
      resolvePaperBinderAnalyticsReferrer("https://example.com/article?utm_source=test#section", testEnvironment)
    ).toBe("https://example.com/article");

    expect(resolvePaperBinderAnalyticsReferrer("not a url", testEnvironment)).toBe("");
  });

  it("Should_SendDirectGoatCounterImageRequest_ForPageviewsWithoutRemoteScript", () => {
    installAnalyticsRequestStub();

    trackPaperBinderPageview(createPublicHostContext(), flagshipArticle.path);

    const requestUrl = getOnlyRequestUrl();
    expect(requestUrl.origin).toBe("https://paperbinder.goatcounter.com");
    expect(requestUrl.pathname).toBe("/count");
    expect(requestUrl.searchParams.get("p")).toBe(flagshipArticle.path);
    expect(requestUrl.searchParams.get("t")).toBe(flagshipArticle.title);
    expect(requestUrl.searchParams.get("e")).toBeNull();
    expect(createdImageReferrerPolicies).toEqual(["no-referrer"]);
    expect(document.querySelector('script[src*="goatcounter"], script[src*="gc.zgo.at"]')).toBeNull();
  });

  it("Should_SendStableSyntheticGoatCounterEventNames_ForPublicEvents", () => {
    installAnalyticsRequestStub();

    trackPaperBinderEvent(createPublicHostContext(), publicAnalyticsEventNames.demoSubmitAttempt);

    const requestUrl = getOnlyRequestUrl();
    expect(requestUrl.searchParams.get("p")).toBe("pb_event_public_demo_submit_attempt");
    expect(requestUrl.searchParams.get("t")).toBe("pb_event_public_demo_submit_attempt");
    expect(requestUrl.searchParams.get("e")).toBe("true");
  });

  it("Should_KeepPublicEventNamesNamespacedAndLowCardinality", () => {
    const eventNames = Object.values(publicAnalyticsEventNames);

    expect(new Set(eventNames).size).toBe(eventNames.length);
    for (const eventName of eventNames) {
      expect(eventName).toMatch(/^pb_event_public_[a-z0-9_]+$/);
      expect(eventName).not.toMatch(/:|\/|\?|#|\s/);
    }
  });

  it("Should_NotLeakQueryFragmentsOrTenantIdentifiers_InDirectRequests", () => {
    installAnalyticsRequestStub();

    trackPaperBinderPageview(createTenantHostContext("/app/binders/binder-1?workspace=acme#secret"), "/app/binders/binder-1?workspace=acme#secret");

    const requestUrl = getOnlyRequestUrl();
    expect(requestUrl.searchParams.get("p")).toBe("/app/binders/:binderId");
    expect(requestUrl.toString()).not.toContain("binder-1");
    expect(requestUrl.toString()).not.toContain("workspace=acme");
    expect(requestUrl.toString()).not.toContain("secret");
  });

  it("Should_NotIncludeDemoCreationValues_When_TrackingConversionEvents", () => {
    installAnalyticsRequestStub();

    trackPaperBinderEvent(createPublicHostContext(), publicAnalyticsEventNames.demoSubmitSucceeded);

    const requestUrl = getOnlyRequestUrl();
    expect(requestUrl.searchParams.get("p")).toBe("pb_event_public_demo_submit_succeeded");
    expect(requestUrl.toString()).not.toContain("Acme");
    expect(requestUrl.toString()).not.toContain("owner%40");
    expect(requestUrl.toString()).not.toContain("generated-password");
  });

  it("Should_SuppressConsecutiveDuplicatePageviews", () => {
    installAnalyticsRequestStub();
    const hostContext = createPublicHostContext();

    trackPaperBinderPageview(hostContext, "/");
    trackPaperBinderPageview(hostContext, "/");
    trackPaperBinderPageview(hostContext, "/about");

    expect(createdImageUrls).toHaveLength(2);
    expect(new URL(createdImageUrls[0]).searchParams.get("p")).toBe("/");
    expect(new URL(createdImageUrls[1]).searchParams.get("p")).toBe("/about");
  });

  it("Should_IsolateAnalyticsFailures_FromApplicationBehavior", () => {
    vi.stubGlobal(
      "Image",
      class {
        constructor() {
          throw new Error("Image unavailable.");
        }
      }
    );

    expect(() => trackPaperBinderEvent(createPublicHostContext(), publicAnalyticsEventNames.landingStartDemo)).not.toThrow();
    expect(() => trackPaperBinderPageview(createPublicHostContext(), "/")).not.toThrow();
  });

  it("Should_NotSendAnalyticsRequests_When_AnalyticsIsDisabled", () => {
    installAnalyticsRequestStub();
    const localHostContext = resolveHostContext(
      createLocationLike({
        origin: "http://paperbinder.localhost:8080",
        host: "paperbinder.localhost:8080",
        hostname: "paperbinder.localhost",
        pathname: "/"
      }),
      {
        ...testEnvironment,
        rootUrl: "http://paperbinder.localhost:8080",
        tenantBaseDomain: "paperbinder.localhost:8080",
        rootHost: "paperbinder.localhost:8080"
      }
    );

    trackPaperBinderPageview(localHostContext, "/");
    if (localHostContext.kind === "root") {
      trackPaperBinderEvent(localHostContext, publicAnalyticsEventNames.landingStartDemo);
    }

    expect(createdImageUrls).toHaveLength(0);
  });
});
