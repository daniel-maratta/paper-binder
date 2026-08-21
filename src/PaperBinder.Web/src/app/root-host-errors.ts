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
    return createGenericError("Something went wrong. Try again.");
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
        title: "Demo expired.",
        detail: error.detail ?? "This demo workspace is no longer available.",
        field: null,
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "TENANT_NAME_INVALID":
      return {
        title: "Workspace name is not available.",
        detail: "Choose a workspace name that can be used for this demo.",
        field: "tenantName",
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "TENANT_NAME_CONFLICT":
      return {
        title: "Workspace name already exists.",
        detail: "Choose a different workspace name and retry.",
        field: "tenantName",
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "RATE_LIMITED":
      return {
        title: "Too many attempts.",
        detail: error.detail ?? "Too many requests were submitted from this page. Wait a moment and try again.",
        field: null,
        correlationId: error.correlationId,
        retryAfterLabel
      };
    default:
      if (error.status === null) {
        return {
          title: "PaperBinder is unavailable right now.",
          detail: "The request did not reach PaperBinder. Check your connection and try again in a moment.",
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
