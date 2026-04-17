import { vi } from "vitest";
import type {
  PaperBinderApiClient,
  ProvisionResponse,
  TenantImpersonationStatus,
  TenantLeaseSummary
} from "../api/client";
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

export function createTenantLeaseSummary(overrides: Partial<TenantLeaseSummary> = {}): TenantLeaseSummary {
  return {
    expiresAt: "2026-06-15T12:00:00Z",
    secondsRemaining: 1800,
    extensionCount: 1,
    maxExtensions: 3,
    canExtend: false,
    ...overrides
  };
}

export function createProvisionResponse(overrides: Partial<ProvisionResponse> = {}): ProvisionResponse {
  return {
    tenantId: "tenant-1",
    tenantSlug: "acme-demo",
    expiresAt: "2026-04-16T12:00:00Z",
    redirectUrl: "https://acme-demo.paperbinder.example.test/app",
    credentials: {
      email: "owner@acme-demo.local",
      password: "generated-password"
    },
    ...overrides
  };
}

export function createTenantImpersonationStatus(
  overrides: Partial<TenantImpersonationStatus> = {}
): TenantImpersonationStatus {
  return {
    isImpersonating: false,
    actor: {
      userId: "user-1",
      email: "owner@acme-demo.local",
      role: "TenantAdmin"
    },
    effective: {
      userId: "user-1",
      email: "owner@acme-demo.local",
      role: "TenantAdmin"
    },
    ...overrides
  };
}

export function createApiClientStub(overrides: Partial<PaperBinderApiClient> = {}): PaperBinderApiClient {
  return {
    request: vi.fn(async () => ({
      data: undefined,
      correlationId: null,
      response: new Response()
    })) as PaperBinderApiClient["request"],
    getTenantLease: vi.fn(async () => createTenantLeaseSummary()) as PaperBinderApiClient["getTenantLease"],
    extendTenantLease: vi.fn(async () => createTenantLeaseSummary()) as PaperBinderApiClient["extendTenantLease"],
    provision: vi.fn(async () => createProvisionResponse()) as PaperBinderApiClient["provision"],
    login: vi.fn(async () => ({
      redirectUrl: "https://acme-demo.paperbinder.example.test/app"
    })) as PaperBinderApiClient["login"],
    logout: vi.fn(async () => {}) as PaperBinderApiClient["logout"],
    getImpersonationStatus:
      vi.fn(async () => createTenantImpersonationStatus()) as PaperBinderApiClient["getImpersonationStatus"],
    startImpersonation:
      vi.fn(async () => createTenantImpersonationStatus()) as PaperBinderApiClient["startImpersonation"],
    stopImpersonation:
      vi.fn(async () => createTenantImpersonationStatus()) as PaperBinderApiClient["stopImpersonation"],
    listBinders: vi.fn(async () => []) as PaperBinderApiClient["listBinders"],
    createBinder: vi.fn(async () => ({
      binderId: "binder-1",
      name: "Operations",
      createdAt: "2026-04-16T11:00:00Z"
    })) as PaperBinderApiClient["createBinder"],
    getBinderDetail: vi.fn(async () => ({
      binderId: "binder-1",
      name: "Operations",
      createdAt: "2026-04-16T11:00:00Z",
      documents: []
    })) as PaperBinderApiClient["getBinderDetail"],
    getBinderPolicy: vi.fn(async () => ({
      mode: "inherit",
      allowedRoles: []
    })) as PaperBinderApiClient["getBinderPolicy"],
    updateBinderPolicy: vi.fn(async () => ({
      mode: "inherit",
      allowedRoles: []
    })) as PaperBinderApiClient["updateBinderPolicy"],
    getDocumentDetail: vi.fn(async () => ({
      documentId: "document-1",
      binderId: "binder-1",
      title: "Security Handbook",
      contentType: "markdown",
      content: "# Security Handbook",
      supersedesDocumentId: null,
      createdAt: "2026-04-16T11:10:00Z",
      archivedAt: null
    })) as PaperBinderApiClient["getDocumentDetail"],
    createDocument: vi.fn(async () => ({
      documentId: "document-2",
      binderId: "binder-1",
      title: "Operations Plan",
      contentType: "markdown",
      content: "# Operations Plan",
      supersedesDocumentId: null,
      createdAt: "2026-04-16T11:20:00Z",
      archivedAt: null
    })) as PaperBinderApiClient["createDocument"],
    listTenantUsers: vi.fn(async () => []) as PaperBinderApiClient["listTenantUsers"],
    createTenantUser: vi.fn(async () => ({
      userId: "user-1",
      email: "owner@acme-demo.local",
      role: "TenantAdmin",
      isOwner: true
    })) as PaperBinderApiClient["createTenantUser"],
    updateTenantUserRole: vi.fn(async () => ({
      userId: "user-1",
      email: "owner@acme-demo.local",
      role: "TenantAdmin",
      isOwner: true
    })) as PaperBinderApiClient["updateTenantUserRole"],
    ...overrides
  };
}
