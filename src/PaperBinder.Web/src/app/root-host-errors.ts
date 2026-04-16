import { PaperBinderApiError } from "../api/client";

export type RootHostErrorField = "tenantName" | "email" | "password" | "challenge";

export type RootHostErrorViewModel = {
  title: string;
  detail: string;
  field: RootHostErrorField | null;
  correlationId: string | null;
  retryAfterLabel: string | null;
};

function formatRetryAfterLabel(seconds: number | null): string | null {
  if (seconds === null) {
    return null;
  }

  if (seconds < 60) {
    return `Retry in about ${seconds} second${seconds === 1 ? "" : "s"}.`;
  }

  const minutes = Math.ceil(seconds / 60);
  return `Retry in about ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

function createGenericError(detail: string): RootHostErrorViewModel {
  return {
    title: "Request could not be completed.",
    detail,
    field: null,
    correlationId: null,
    retryAfterLabel: null
  };
}

export function mapRootHostError(error: unknown): RootHostErrorViewModel {
  if (!(error instanceof PaperBinderApiError)) {
    return createGenericError("An unexpected error occurred. Retry the request.");
  }

  const retryAfterLabel = formatRetryAfterLabel(error.retryAfterSeconds);

  switch (error.errorCode) {
    case "CHALLENGE_REQUIRED":
      return {
        title: "Complete the challenge.",
        detail: "Finish the challenge before submitting the form.",
        field: "challenge",
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "CHALLENGE_FAILED":
      return {
        title: "Challenge verification failed.",
        detail: "The submitted challenge could not be verified. Complete it again and retry.",
        field: "challenge",
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "INVALID_CREDENTIALS":
      return {
        title: "Credentials were not accepted.",
        detail: "The supplied email or password is invalid.",
        field: "email",
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "TENANT_EXPIRED":
      return {
        title: "Tenant expired.",
        detail: error.detail ?? "The tenant has expired and can no longer be accessed.",
        field: null,
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "TENANT_NAME_INVALID":
      return {
        title: "Tenant name is not available.",
        detail: error.detail ?? "Provide a tenant name that can be normalized into a valid tenant slug.",
        field: "tenantName",
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "TENANT_NAME_CONFLICT":
      return {
        title: "Tenant name already exists.",
        detail: error.detail ?? "Choose a different tenant name and retry.",
        field: "tenantName",
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "RATE_LIMITED":
      return {
        title: "Too many attempts.",
        detail: error.detail ?? "The root-host pre-auth request limit was exceeded.",
        field: null,
        correlationId: error.correlationId,
        retryAfterLabel
      };
    default:
      if (error.status === null) {
        return {
          title: "Network request failed.",
          detail: "The browser could not reach PaperBinder. Check the local stack and retry.",
          field: null,
          correlationId: null,
          retryAfterLabel: null
        };
      }

      return {
        title: "Request could not be completed.",
        detail: error.detail ?? "Retry the request.",
        field: null,
        correlationId: error.correlationId,
        retryAfterLabel
      };
  }
}
