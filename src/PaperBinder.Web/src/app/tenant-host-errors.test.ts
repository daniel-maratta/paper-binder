import { describe, expect, it } from "vitest";
import { PaperBinderApiError } from "../api/client";
import { mapTenantHostError } from "./tenant-host-errors";

function createApiError(errorCode: string, status: number, detail: string, retryAfterSeconds: number | null = null) {
  return new PaperBinderApiError({
    message: detail,
    status,
    errorCode,
    detail,
    correlationId: "corr-test",
    retryAfterSeconds,
    traceId: null,
    validationErrors: null
  });
}

describe("tenant-host error mapping", () => {
  it("Should_MapSharedAndRouteSpecificProblemDetailsCodes_ToSafeUiMessages", () => {
    expect(mapTenantHostError(createApiError("BINDER_POLICY_DENIED", 403, "Denied."))).toMatchObject({
      title: "Binder access denied.",
      correlationId: "corr-test"
    });

    expect(mapTenantHostError(createApiError("DOCUMENT_TITLE_INVALID", 400, "Invalid title."))).toMatchObject({
      title: "Document title is required.",
      field: "documentTitle"
    });

    expect(mapTenantHostError(createApiError("TENANT_USER_EMAIL_CONFLICT", 409, "Duplicate email."))).toMatchObject({
      title: "Email already exists.",
      field: "tenantUserEmail"
    });

    expect(
      mapTenantHostError(
        createApiError("TENANT_IMPERSONATION_ALREADY_ACTIVE", 409, "Already impersonating.")
      )
    ).toMatchObject({
      title: "View-as is already active."
    });

    expect(
      mapTenantHostError(
        createApiError("TENANT_IMPERSONATION_SELF_TARGET_REJECTED", 409, "Self target rejected.")
      )
    ).toMatchObject({
      title: "View-as target is not eligible."
    });

    expect(mapTenantHostError(createApiError("TENANT_LEASE_EXTENSION_LIMIT_REACHED", 409, "Limit reached."))).toMatchObject({
      title: "Lease extension limit reached."
    });
  });

  it("Should_IncludeRetryGuidance_When_RateLimitedResponseIncludesRetryAfter", () => {
    expect(mapTenantHostError(createApiError("RATE_LIMITED", 429, "Retry later.", 90))).toMatchObject({
      title: "Too many attempts.",
      retryAfterLabel: "Retry in about 2 minutes."
    });
  });

  it("Should_MapGenericForbiddenResponses_ToSafeAccessDeniedCopy", () => {
    const error = new PaperBinderApiError({
      message: "Forbidden",
      status: 403,
      errorCode: null,
      detail: "The request is not authorized.",
      correlationId: "corr-403",
      retryAfterSeconds: null,
      traceId: null,
      validationErrors: null
    });

    expect(mapTenantHostError(error)).toMatchObject({
      title: "Access is not allowed.",
      detail: "The request is not authorized.",
      correlationId: "corr-403"
    });
  });

  it("Should_RenderGenericNetworkCopy_When_RequestDoesNotReachApi", () => {
    const error = new PaperBinderApiError({
      message: "Failed to fetch",
      status: null,
      errorCode: null,
      detail: "Failed to fetch",
      correlationId: null,
      retryAfterSeconds: null,
      traceId: null,
      validationErrors: null
    });

    expect(mapTenantHostError(error)).toMatchObject({
      title: "Network request failed.",
      field: null,
      correlationId: null
    });
  });
});
