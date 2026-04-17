import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppRouter } from "../App";
import type { PaperBinderApiClient } from "../api/client";
import { resolveHostContext } from "./host-context";
import { createLocationLike, createRootHostContext, createTenantHostContext, testEnvironment } from "../test/test-helpers";

function createApiClientStub(): PaperBinderApiClient {
  return {
    request: vi.fn(async () => ({
      data: undefined,
      correlationId: null,
      response: new Response()
    })) as PaperBinderApiClient["request"],
    getTenantLease: vi.fn(async () => ({
      expiresAt: "2026-04-15T12:00:00Z",
      secondsRemaining: 1800,
      extensionCount: 1,
      maxExtensions: 3,
      canExtend: false
    })) as PaperBinderApiClient["getTenantLease"],
    provision: vi.fn(async () => ({
      tenantId: "tenant-1",
      tenantSlug: "acme-demo",
      expiresAt: "2026-04-16T12:00:00Z",
      redirectUrl: "https://acme-demo.paperbinder.example.test/app",
      credentials: {
        email: "owner@acme-demo.local",
        password: "generated-password"
      }
    })) as PaperBinderApiClient["provision"],
    login: vi.fn(async () => ({
      redirectUrl: "https://acme-demo.paperbinder.example.test/app"
    })) as PaperBinderApiClient["login"]
  };
}

describe("app router", () => {
  it("Should_RenderCanonicalRouteSkeleton_ForCurrentHostContext", async () => {
    const apiClient = createApiClientStub();

    const rootView = render(
      <MemoryRouter initialEntries={["/login"]}>
        <AppRouter apiClient={apiClient} hostContext={createRootHostContext("/login")} />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Log in to an existing tenant" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /About/ })).toBeInTheDocument();

    rootView.unmount();

    render(
      <MemoryRouter initialEntries={["/app/binders/1234"]}>
        <AppRouter apiClient={apiClient} hostContext={createTenantHostContext("/app/binders/1234")} />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Binder detail placeholder" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Binders/ })).toBeInTheDocument();
  });

  it("Should_RenderSafeFallback_When_HostContextIsInvalid", () => {
    const apiClient = createApiClientStub();
    const invalidHostContext = resolveHostContext(
      createLocationLike({
        origin: "https://unexpected.example.net",
        host: "unexpected.example.net",
        hostname: "unexpected.example.net",
        pathname: "/stray"
      }),
      testEnvironment
    );

    render(
      <MemoryRouter initialEntries={["/stray"]}>
        <AppRouter apiClient={apiClient} hostContext={invalidHostContext} />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Host context is not recognized" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Safe fallback only" })).toBeInTheDocument();
    expect(screen.getByText("unexpected.example.net")).toBeInTheDocument();
    expect(apiClient.getTenantLease).not.toHaveBeenCalled();
  });
});
