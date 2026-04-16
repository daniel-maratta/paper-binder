import { describe, expect, it } from "vitest";
import { PaperBinderApiError } from "../api/client";
import { mapRootHostError } from "./root-host-errors";

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

describe("root-host error mapping", () => {
  it("Should_MapStableProblemDetailsCodes_ToSafeUiMessages", () => {
    expect(mapRootHostError(createApiError("CHALLENGE_FAILED", 403, "Challenge failed."))).toMatchObject({
      title: "Challenge verification failed.",
      field: "challenge",
      correlationId: "corr-test"
    });

    expect(mapRootHostError(createApiError("TENANT_NAME_CONFLICT", 409, "Conflict."))).toMatchObject({
      title: "Tenant name already exists.",
      field: "tenantName"
    });

    expect(mapRootHostError(createApiError("INVALID_CREDENTIALS", 401, "Invalid credentials."))).toMatchObject({
      title: "Credentials were not accepted.",
      field: "email"
    });
  });

  it("Should_IncludeRetryGuidance_When_RateLimitedResponseIncludesRetryAfter", () => {
    expect(mapRootHostError(createApiError("RATE_LIMITED", 429, "Too many attempts.", 120))).toMatchObject({
      title: "Too many attempts.",
      retryAfterLabel: "Retry in about 2 minutes."
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

    expect(mapRootHostError(error)).toMatchObject({
      title: "Network request failed.",
      field: null,
      correlationId: null
    });
  });
});
