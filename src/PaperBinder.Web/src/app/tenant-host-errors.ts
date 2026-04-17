import { PaperBinderApiError } from "../api/client";

export type TenantHostErrorField =
  | "binderName"
  | "documentTitle"
  | "documentContent"
  | "documentSupersedesDocumentId"
  | "tenantUserEmail"
  | "tenantUserPassword"
  | "tenantUserRole"
  | "binderPolicy";

export type TenantHostErrorViewModel = {
  title: string;
  detail: string;
  field: TenantHostErrorField | null;
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

function createGenericError(detail: string): TenantHostErrorViewModel {
  return {
    title: "Request could not be completed.",
    detail,
    field: null,
    correlationId: null,
    retryAfterLabel: null
  };
}

export function mapTenantHostError(error: unknown): TenantHostErrorViewModel {
  if (!(error instanceof PaperBinderApiError)) {
    return createGenericError("An unexpected error occurred. Retry the request.");
  }

  const retryAfterLabel = formatRetryAfterLabel(error.retryAfterSeconds);

  switch (error.errorCode) {
    case "TENANT_FORBIDDEN":
      return {
        title: "Access is not allowed.",
        detail: error.detail ?? "The current tenant session is not allowed to perform this action.",
        field: null,
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "BINDER_POLICY_DENIED":
      return {
        title: "Binder access denied.",
        detail: error.detail ?? "This binder is not available for the current tenant role.",
        field: null,
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "TENANT_EXPIRED":
      return {
        title: "Tenant expired.",
        detail: error.detail ?? "This tenant has expired and can no longer be used.",
        field: null,
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "TENANT_NOT_FOUND":
      return {
        title: "Tenant unavailable.",
        detail: error.detail ?? "This tenant host no longer resolves to an active tenant.",
        field: null,
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "RATE_LIMITED":
      return {
        title: "Too many attempts.",
        detail: error.detail ?? "Retry the request after the current rate-limit window resets.",
        field: null,
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "BINDER_NAME_INVALID":
      return {
        title: "Binder name is required.",
        detail: error.detail ?? "Provide a binder name between 1 and 200 characters.",
        field: "binderName",
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "BINDER_NOT_FOUND":
      return {
        title: "Binder not found.",
        detail: error.detail ?? "The requested binder was not found for the current tenant.",
        field: null,
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "BINDER_POLICY_INVALID":
      return {
        title: "Binder policy is invalid.",
        detail: error.detail ?? "Choose a supported policy mode and role combination.",
        field: "binderPolicy",
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "DOCUMENT_NOT_FOUND":
      return {
        title: "Document not found.",
        detail: error.detail ?? "The requested document was not found for the current tenant.",
        field: null,
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "DOCUMENT_TITLE_INVALID":
      return {
        title: "Document title is required.",
        detail: error.detail ?? "Provide a document title between 1 and 200 characters.",
        field: "documentTitle",
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "DOCUMENT_CONTENT_REQUIRED":
      return {
        title: "Document content is required.",
        detail: error.detail ?? "Provide markdown content for the new document.",
        field: "documentContent",
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "DOCUMENT_CONTENT_TOO_LARGE":
      return {
        title: "Document content is too large.",
        detail: error.detail ?? "Document content must stay within the 50,000 character limit.",
        field: "documentContent",
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "DOCUMENT_CONTENT_TYPE_INVALID":
      return {
        title: "Only markdown documents are supported.",
        detail: error.detail ?? "PaperBinder v1 accepts only markdown document content.",
        field: null,
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "DOCUMENT_BINDER_REQUIRED":
      return {
        title: "A binder is required.",
        detail: error.detail ?? "Documents must be created from a specific binder context.",
        field: null,
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "DOCUMENT_SUPERSEDES_INVALID":
      return {
        title: "Supersedes target is invalid.",
        detail: error.detail ?? "Supersedes must reference an existing document in the same binder.",
        field: "documentSupersedesDocumentId",
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "TENANT_USER_EMAIL_CONFLICT":
      return {
        title: "Email already exists.",
        detail: error.detail ?? "Choose a different email for the tenant user.",
        field: "tenantUserEmail",
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "TENANT_USER_PASSWORD_INVALID":
      return {
        title: "Password does not meet the rules.",
        detail: error.detail ?? "Choose a stronger password for the tenant user.",
        field: "tenantUserPassword",
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "TENANT_ROLE_INVALID":
      return {
        title: "Select a valid role.",
        detail: error.detail ?? "Tenant users and binder policies require a supported PaperBinder role.",
        field: "tenantUserRole",
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "TENANT_USER_NOT_FOUND":
      return {
        title: "Tenant user not found.",
        detail: error.detail ?? "The selected tenant user no longer exists for this tenant.",
        field: null,
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "LAST_TENANT_ADMIN_REQUIRED":
      return {
        title: "At least one tenant admin is required.",
        detail: error.detail ?? "PaperBinder cannot remove the final tenant admin from the tenant.",
        field: null,
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "TENANT_LEASE_EXTENSION_WINDOW_NOT_OPEN":
      return {
        title: "Lease extension is not available yet.",
        detail: error.detail ?? "The tenant lease can be extended only during the final extension window.",
        field: null,
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "TENANT_LEASE_EXTENSION_LIMIT_REACHED":
      return {
        title: "Lease extension limit reached.",
        detail: error.detail ?? "This tenant has already used the maximum number of lease extensions.",
        field: null,
        correlationId: error.correlationId,
        retryAfterLabel
      };
    case "CSRF_TOKEN_INVALID":
      return {
        title: "Request could not be verified.",
        detail: error.detail ?? "Refresh the page and retry the action.",
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

      if (error.status === 403) {
        return {
          title: "Access is not allowed.",
          detail: error.detail ?? "The current tenant session is not allowed to perform this action.",
          field: null,
          correlationId: error.correlationId,
          retryAfterLabel
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
