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
});
