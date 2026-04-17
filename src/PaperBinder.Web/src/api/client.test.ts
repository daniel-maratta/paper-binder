import { describe, expect, it, vi } from "vitest";
import { createPaperBinderApiClient } from "./client";

describe("api client", () => {
  it("Should_SendCredentialsApiVersionAndCsrfHeader_When_ApiClientMakesRequest", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Correlation-Id": "corr-123"
        }
      })
    );

    const apiClient = createPaperBinderApiClient({
      apiOrigin: "https://paperbinder.example.test",
      fetchFn: fetchMock as typeof fetch,
      cookieSource: () => "paperbinder.auth.csrf=test-token"
    });

    await apiClient.request({
      path: "/api/contracts/probe",
      method: "POST",
      body: { ping: true }
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [requestUrl, requestOptions] = fetchMock.mock.calls[0] as [RequestInfo | URL, RequestInit];
    const requestHeaders = new Headers(requestOptions?.headers);

    expect(String(requestUrl)).toBe("https://paperbinder.example.test/api/contracts/probe");
    expect(requestOptions?.credentials).toBe("include");
    expect(requestHeaders.get("X-Api-Version")).toBe("1");
    expect(requestHeaders.get("X-CSRF-TOKEN")).toBe("test-token");
    expect(requestHeaders.get("Content-Type")).toBe("application/json");
  });

  it("Should_NormalizeProblemDetails_AndExposeErrorCodeCorrelationIdAndRetryAfter", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(
        JSON.stringify({
          title: "Rate limited.",
          status: 429,
          detail: "Retry later.",
          errorCode: "RATE_LIMITED",
          correlationId: "corr-429"
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-Correlation-Id": "corr-429",
            "Retry-After": "120"
          }
        }
      )
    );

    const apiClient = createPaperBinderApiClient({
      apiOrigin: "https://paperbinder.example.test",
      fetchFn: fetchMock as typeof fetch
    });

    await expect(
      apiClient.request({
        path: "/api/tenant/lease"
      })
    ).rejects.toMatchObject({
      status: 429,
      errorCode: "RATE_LIMITED",
      detail: "Retry later.",
      correlationId: "corr-429",
      retryAfterSeconds: 120
    });
  });

  it("Should_CallTypedProvisionAndLoginMethods_ThroughSharedApiRequestPath", async () => {
    const fetchMock = vi
      .fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith("/api/provision")) {
          return new Response(
            JSON.stringify({
              tenantId: "tenant-1",
              tenantSlug: "acme-demo",
              expiresAt: "2026-04-16T12:00:00Z",
              redirectUrl: "https://acme-demo.paperbinder.example.test/app",
              credentials: {
                email: "owner@acme-demo.local",
                password: "generated-password"
              }
            }),
            {
              status: 201,
              headers: {
                "Content-Type": "application/json",
                "X-Correlation-Id": "corr-provision"
              }
            }
          );
        }

        expect(url).toBe("https://paperbinder.example.test/api/auth/login");
        expect(init?.method).toBe("POST");

        return new Response(
          JSON.stringify({
            redirectUrl: "https://acme-demo.paperbinder.example.test/app"
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "X-Correlation-Id": "corr-login"
            }
          }
        );
      });

    const apiClient = createPaperBinderApiClient({
      apiOrigin: "https://paperbinder.example.test",
      fetchFn: fetchMock as typeof fetch,
      cookieSource: () => "paperbinder.auth.csrf=test-token"
    });

    const provisionResponse = await apiClient.provision({
      tenantName: "Acme Demo",
      challengeToken: "challenge-token"
    });
    const loginResponse = await apiClient.login({
      email: "owner@acme-demo.local",
      password: "generated-password",
      challengeToken: "challenge-token"
    });

    expect(provisionResponse.credentials.email).toBe("owner@acme-demo.local");
    expect(loginResponse.redirectUrl).toBe("https://acme-demo.paperbinder.example.test/app");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("Should_CallTypedTenantHostMethods_ThroughSharedApiRequestPath", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/api/tenant/lease/extend")) {
        expect(init?.method).toBe("POST");
        return new Response(
          JSON.stringify({
            expiresAt: "2026-04-16T12:20:00Z",
            secondsRemaining: 1200,
            extensionCount: 1,
            maxExtensions: 3,
            canExtend: false
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "X-Correlation-Id": "corr-lease-extend"
            }
          }
        );
      }

      if (url.endsWith("/api/auth/logout")) {
        expect(init?.method).toBe("POST");
        return new Response(null, {
          status: 204,
          headers: {
            "X-Correlation-Id": "corr-logout"
          }
        });
      }

      if (url.endsWith("/api/binders") && init?.method === "GET") {
        return new Response(
          JSON.stringify({
            binders: [
              {
                binderId: "binder-1",
                name: "Executive Policies",
                createdAt: "2026-04-16T10:00:00Z"
              }
            ]
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "X-Correlation-Id": "corr-binders"
            }
          }
        );
      }

      if (url.endsWith("/api/binders") && init?.method === "POST") {
        return new Response(
          JSON.stringify({
            binderId: "binder-2",
            name: "Operations",
            createdAt: "2026-04-16T11:00:00Z"
          }),
          {
            status: 201,
            headers: {
              "Content-Type": "application/json",
              "X-Correlation-Id": "corr-binder-create"
            }
          }
        );
      }

      if (url.endsWith("/api/binders/binder-2")) {
        return new Response(
          JSON.stringify({
            binderId: "binder-2",
            name: "Operations",
            createdAt: "2026-04-16T11:00:00Z",
            documents: [
              {
                documentId: "document-1",
                binderId: "binder-2",
                title: "Security Handbook",
                contentType: "markdown",
                supersedesDocumentId: null,
                createdAt: "2026-04-16T11:10:00Z",
                archivedAt: null
              }
            ]
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "X-Correlation-Id": "corr-binder-detail"
            }
          }
        );
      }

      if (url.endsWith("/api/binders/binder-2/policy") && init?.method === "GET") {
        return new Response(
          JSON.stringify({
            mode: "inherit",
            allowedRoles: []
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "X-Correlation-Id": "corr-policy-read"
            }
          }
        );
      }

      if (url.endsWith("/api/binders/binder-2/policy") && init?.method === "PUT") {
        return new Response(
          JSON.stringify({
            mode: "restricted_roles",
            allowedRoles: ["TenantAdmin"]
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "X-Correlation-Id": "corr-policy-write"
            }
          }
        );
      }

      if (url.endsWith("/api/documents/document-1")) {
        return new Response(
          JSON.stringify({
            documentId: "document-1",
            binderId: "binder-2",
            title: "Security Handbook",
            contentType: "markdown",
            content: "# Security Handbook",
            supersedesDocumentId: null,
            createdAt: "2026-04-16T11:10:00Z",
            archivedAt: null
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "X-Correlation-Id": "corr-document-detail"
            }
          }
        );
      }

      if (url.endsWith("/api/documents") && init?.method === "POST") {
        return new Response(
          JSON.stringify({
            documentId: "document-2",
            binderId: "binder-2",
            title: "Operations Plan",
            contentType: "markdown",
            content: "# Operations Plan",
            supersedesDocumentId: null,
            createdAt: "2026-04-16T11:20:00Z",
            archivedAt: null
          }),
          {
            status: 201,
            headers: {
              "Content-Type": "application/json",
              "X-Correlation-Id": "corr-document-create"
            }
          }
        );
      }

      if (url.endsWith("/api/tenant/users") && init?.method === "GET") {
        return new Response(
          JSON.stringify({
            users: [
              {
                userId: "user-1",
                email: "owner@acme-demo.local",
                role: "TenantAdmin",
                isOwner: true
              }
            ]
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "X-Correlation-Id": "corr-users"
            }
          }
        );
      }

      if (url.endsWith("/api/tenant/users") && init?.method === "POST") {
        return new Response(
          JSON.stringify({
            userId: "user-2",
            email: "writer@acme-demo.local",
            role: "BinderWrite",
            isOwner: false
          }),
          {
            status: 201,
            headers: {
              "Content-Type": "application/json",
              "X-Correlation-Id": "corr-user-create"
            }
          }
        );
      }

      expect(url).toBe("https://paperbinder.example.test/api/tenant/users/user-2/role");
      expect(init?.method).toBe("POST");

      return new Response(
        JSON.stringify({
          userId: "user-2",
          email: "writer@acme-demo.local",
          role: "BinderRead",
          isOwner: false
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "X-Correlation-Id": "corr-user-role"
          }
        }
      );
    });

    const apiClient = createPaperBinderApiClient({
      apiOrigin: "https://paperbinder.example.test",
      fetchFn: fetchMock as typeof fetch,
      cookieSource: () => "paperbinder.auth.csrf=test-token"
    });

    const extendedLease = await apiClient.extendTenantLease();
    await apiClient.logout();
    const binders = await apiClient.listBinders();
    const createdBinder = await apiClient.createBinder({ name: "Operations" });
    const binderDetail = await apiClient.getBinderDetail("binder-2");
    const binderPolicy = await apiClient.getBinderPolicy("binder-2");
    const updatedBinderPolicy = await apiClient.updateBinderPolicy("binder-2", {
      mode: "restricted_roles",
      allowedRoles: ["TenantAdmin"]
    });
    const documentDetail = await apiClient.getDocumentDetail("document-1");
    const createdDocument = await apiClient.createDocument({
      binderId: "binder-2",
      title: "Operations Plan",
      contentType: "markdown",
      content: "# Operations Plan"
    });
    const tenantUsers = await apiClient.listTenantUsers();
    const createdTenantUser = await apiClient.createTenantUser({
      email: "writer@acme-demo.local",
      password: "temporary-password",
      role: "BinderWrite"
    });
    const updatedTenantUser = await apiClient.updateTenantUserRole("user-2", {
      role: "BinderRead"
    });

    expect(extendedLease.extensionCount).toBe(1);
    expect(binders).toHaveLength(1);
    expect(createdBinder.binderId).toBe("binder-2");
    expect(binderDetail.documents).toHaveLength(1);
    expect(binderPolicy.mode).toBe("inherit");
    expect(updatedBinderPolicy.allowedRoles).toEqual(["TenantAdmin"]);
    expect(documentDetail.documentId).toBe("document-1");
    expect(createdDocument.documentId).toBe("document-2");
    expect(tenantUsers).toHaveLength(1);
    expect(createdTenantUser.role).toBe("BinderWrite");
    expect(updatedTenantUser.role).toBe("BinderRead");
    expect(fetchMock).toHaveBeenCalledTimes(12);
  });
});
