import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppRouter } from "../App";
import type { PaperBinderApiClient } from "../api/client";
import { PaperBinderApiError } from "../api/client";
import { createTenantHostContext } from "../test/test-helpers";

function createRejectingApiClient(error: PaperBinderApiError): PaperBinderApiClient {
  return {
    request: vi.fn(async () => {
      throw error;
    }) as PaperBinderApiClient["request"],
    getTenantLease: vi.fn(async () => {
      throw error;
    }) as PaperBinderApiClient["getTenantLease"]
  };
}

describe("tenant shell", () => {
  it("Should_RenderAuthenticationRequired_When_TenantBootstrapReturnsUnauthorized", async () => {
    const error = new PaperBinderApiError({
      message: "Unauthorized",
      status: 401,
      errorCode: "AUTHENTICATION_REQUIRED",
      detail: "Unauthorized",
      correlationId: "corr-401",
      retryAfterSeconds: null,
      traceId: null,
      validationErrors: null
    });

    render(
      <MemoryRouter initialEntries={["/app"]}>
        <AppRouter apiClient={createRejectingApiClient(error)} hostContext={createTenantHostContext("/app")} />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Authentication required" })).toBeInTheDocument();
    expect(screen.getByText(/AUTHENTICATION_REQUIRED/i)).toBeInTheDocument();
  });

  it("Should_RenderSafeTenantShellStates_When_BootstrapFailsWithoutFeatureData", async () => {
    const cases = [
      {
        error: new PaperBinderApiError({
          message: "Forbidden",
          status: 403,
          errorCode: "TENANT_FORBIDDEN",
          detail: "Forbidden",
          correlationId: "corr-403",
          retryAfterSeconds: null,
          traceId: null,
          validationErrors: null
        }),
        heading: "Tenant access denied"
      },
      {
        error: new PaperBinderApiError({
          message: "Expired",
          status: 410,
          errorCode: "TENANT_EXPIRED",
          detail: "Expired",
          correlationId: "corr-410",
          retryAfterSeconds: null,
          traceId: null,
          validationErrors: null
        }),
        heading: "Tenant expired"
      },
      {
        error: new PaperBinderApiError({
          message: "Unknown tenant",
          status: 404,
          errorCode: "TENANT_NOT_FOUND",
          detail: "Unknown tenant",
          correlationId: "corr-404",
          retryAfterSeconds: null,
          traceId: null,
          validationErrors: null
        }),
        heading: "Tenant not found"
      }
    ];

    for (const testCase of cases) {
      const view = render(
        <MemoryRouter initialEntries={["/app"]}>
          <AppRouter
            apiClient={createRejectingApiClient(testCase.error)}
            hostContext={createTenantHostContext("/app")}
          />
        </MemoryRouter>
      );

      expect(await screen.findByRole("heading", { name: testCase.heading })).toBeInTheDocument();
      expect(screen.getByText(new RegExp(testCase.error.errorCode ?? "", "i"))).toBeInTheDocument();

      view.unmount();
    }
  });
});
