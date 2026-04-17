import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppRouter } from "../App";
import { PaperBinderApiError, type PaperBinderApiClient } from "../api/client";
import {
  createApiClientStub,
  createTenantHostContext,
  createTenantLeaseSummary
} from "../test/test-helpers";

function renderTenantRoute({
  route = "/app",
  apiClient = createApiClientStub(),
  navigator = vi.fn<(redirectUrl: string) => void>()
}: {
  route?: string;
  apiClient?: PaperBinderApiClient;
  navigator?: (redirectUrl: string) => void;
}) {
  const view = render(
    <MemoryRouter initialEntries={[route]}>
      <AppRouter
        apiClient={apiClient}
        hostContext={createTenantHostContext(route)}
        tenantHostNavigator={navigator}
      />
    </MemoryRouter>
  );

  return {
    ...view,
    apiClient,
    navigator
  };
}

afterEach(() => {
  vi.useRealTimers();
});

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

    renderTenantRoute({
      apiClient: createApiClientStub({
        getTenantLease: vi.fn(async () => {
          throw error;
        }) as PaperBinderApiClient["getTenantLease"]
      })
    });

    expect(await screen.findByRole("heading", { name: "Authentication required" })).toBeInTheDocument();
    expect(screen.getByText(/safe fallback only/i)).toBeInTheDocument();
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
      const view = renderTenantRoute({
        apiClient: createApiClientStub({
          getTenantLease: vi.fn(async () => {
            throw testCase.error;
          }) as PaperBinderApiClient["getTenantLease"]
        })
      });

      expect(await screen.findByRole("heading", { name: testCase.heading })).toBeInTheDocument();
      expect(screen.getByText(/return to root-host login/i)).toBeInTheDocument();

      view.unmount();
    }
  });

  it("Should_RenderLiveTenantDashboard_When_TenantBootstrapAndSummaryReadsSucceed", async () => {
    renderTenantRoute({
      apiClient: createApiClientStub({
        listBinders: vi.fn(async () => [
          {
            binderId: "binder-1",
            name: "Operations",
            createdAt: "2026-04-16T11:00:00Z"
          }
        ]) as PaperBinderApiClient["listBinders"]
      })
    });

    expect(await screen.findByRole("heading", { name: "Tenant dashboard" })).toBeInTheDocument();
    expect(await screen.findByText("Operations")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Review binders" })).toBeInTheDocument();
  });

  it("Should_ListVisibleBinders_AndCreateBinder_When_BinderRouteActionsSucceed", async () => {
    const createBinder = vi.fn(async () => ({
      binderId: "binder-2",
      name: "Operations",
      createdAt: "2026-04-16T11:00:00Z"
    }));

    renderTenantRoute({
      route: "/app/binders",
      apiClient: createApiClientStub({
        listBinders: vi.fn(async () => []) as PaperBinderApiClient["listBinders"],
        createBinder: createBinder as PaperBinderApiClient["createBinder"]
      })
    });

    expect(await screen.findByRole("heading", { name: "Binders" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Binder name"), {
      target: { value: "Operations" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create binder" }));

    await waitFor(() => expect(createBinder).toHaveBeenCalledWith({ name: "Operations" }));
    expect(await screen.findByText("Binder created.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open binder" })).toBeInTheDocument();
  });

  it("Should_RenderBinderDetail_CreateDocument_AndUpdateBinderPolicy_When_RouteActionsSucceed", async () => {
    const updateBinderPolicy = vi.fn(async () => ({
      mode: "restricted_roles" as const,
      allowedRoles: ["BinderRead" as const]
    }));
    const createDocument = vi.fn(async () => ({
      documentId: "document-2",
      binderId: "binder-1",
      title: "Replacement handbook",
      contentType: "markdown",
      content: "# Replacement",
      supersedesDocumentId: "document-1",
      createdAt: "2026-04-16T11:20:00Z",
      archivedAt: null
    }));

    renderTenantRoute({
      route: "/app/binders/binder-1",
      apiClient: createApiClientStub({
        getBinderDetail: vi.fn(async () => ({
          binderId: "binder-1",
          name: "Operations",
          createdAt: "2026-04-16T11:00:00Z",
          documents: [
            {
              documentId: "document-1",
              binderId: "binder-1",
              title: "Incident handbook",
              contentType: "markdown",
              supersedesDocumentId: null,
              createdAt: "2026-04-16T11:10:00Z",
              archivedAt: null
            }
          ]
        })) as PaperBinderApiClient["getBinderDetail"],
        getBinderPolicy: vi.fn(async () => ({
          mode: "inherit",
          allowedRoles: []
        })) as PaperBinderApiClient["getBinderPolicy"],
        updateBinderPolicy: updateBinderPolicy as PaperBinderApiClient["updateBinderPolicy"],
        createDocument: createDocument as PaperBinderApiClient["createDocument"]
      })
    });

    expect(await screen.findByRole("heading", { name: "Operations" })).toBeInTheDocument();
    expect((await screen.findAllByText("Incident handbook")).length).toBeGreaterThan(0);

    await screen.findByRole("button", { name: "Save policy" });
    fireEvent.change((await screen.findAllByRole("combobox"))[0], {
      target: { value: "restricted_roles" }
    });
    fireEvent.click(screen.getByLabelText("Binder read"));
    fireEvent.click(screen.getByRole("button", { name: "Save policy" }));

    await waitFor(() =>
      expect(updateBinderPolicy).toHaveBeenCalledWith("binder-1", {
        mode: "restricted_roles",
        allowedRoles: ["BinderRead"]
      })
    );
    expect(await screen.findByText("Binder policy saved.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Document title"), {
      target: { value: "Replacement handbook" }
    });
    fireEvent.change(screen.getByLabelText("Markdown content"), {
      target: { value: "# Replacement" }
    });
    fireEvent.change(screen.getByLabelText("Supersedes"), {
      target: { value: "document-1" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create document" }));

    await waitFor(() =>
      expect(createDocument).toHaveBeenCalledWith({
        binderId: "binder-1",
        title: "Replacement handbook",
        contentType: "markdown",
        content: "# Replacement",
        supersedesDocumentId: "document-1"
      })
    );
    expect(await screen.findByText("Document created.")).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: "Open document" })
        .some((link) => link.getAttribute("href") === "/app/documents/document-2")
    ).toBe(true);
  });

  it("Should_RenderReadOnlyArchivedDocument_When_DocumentDetailSucceeds", async () => {
    renderTenantRoute({
      route: "/app/documents/document-1",
      apiClient: createApiClientStub({
        getDocumentDetail: vi.fn(async () => ({
          documentId: "document-1",
          binderId: "binder-1",
          title: "Archived handbook",
          contentType: "markdown",
          content: "# archived detail",
          supersedesDocumentId: null,
          createdAt: "2026-04-16T11:20:00Z",
          archivedAt: "2026-04-16T12:20:00Z"
        })) as PaperBinderApiClient["getDocumentDetail"]
      })
    });

    expect(await screen.findByRole("heading", { name: "Archived handbook" })).toBeInTheDocument();
    expect(screen.getByText("Archived")).toBeInTheDocument();
    expect(screen.getByText("# archived detail")).toBeInTheDocument();
    expect(screen.getByText(/direct reads remain available/i)).toBeInTheDocument();
  });

  it("Should_RenderTenantUsersAndApplyMutations_When_AdminActionsSucceed", async () => {
    const createTenantUser = vi.fn(async () => ({
      userId: "user-2",
      email: "member@acme-demo.local",
      role: "BinderRead" as const,
      isOwner: false
    }));
    const updateTenantUserRole = vi.fn(async () => ({
      userId: "user-2",
      email: "member@acme-demo.local",
      role: "BinderWrite" as const,
      isOwner: false
    }));

    renderTenantRoute({
      route: "/app/users",
      apiClient: createApiClientStub({
        listTenantUsers: vi.fn(async () => [
          {
            userId: "user-1",
            email: "owner@acme-demo.local",
            role: "TenantAdmin",
            isOwner: true
          }
        ]) as PaperBinderApiClient["listTenantUsers"],
        createTenantUser: createTenantUser as PaperBinderApiClient["createTenantUser"],
        updateTenantUserRole: updateTenantUserRole as PaperBinderApiClient["updateTenantUserRole"]
      })
    });

    expect(await screen.findByRole("heading", { name: "Tenant users" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "member@acme-demo.local" }
    });
    fireEvent.change(screen.getByLabelText("Temporary password"), {
      target: { value: "checkpoint-password-1" }
    });
    fireEvent.change(screen.getByLabelText("Role"), {
      target: { value: "BinderRead" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create tenant user" }));

    await waitFor(() =>
      expect(createTenantUser).toHaveBeenCalledWith({
        email: "member@acme-demo.local",
        password: "checkpoint-password-1",
        role: "BinderRead"
      })
    );
    expect(await screen.findByText("Tenant user created.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Role for member@acme-demo.local"), {
      target: { value: "BinderWrite" }
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Save role" })[1]);

    await waitFor(() =>
      expect(updateTenantUserRole).toHaveBeenCalledWith("user-2", {
        role: "BinderWrite"
      })
    );
  });

  it("Should_ExtendLeaseAndLogout_FromTenantShell_When_ActionsSucceed", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-17T12:00:00Z"));

    const extendTenantLease = vi.fn(async () =>
      createTenantLeaseSummary({
        expiresAt: "2026-04-17T12:11:00Z",
        secondsRemaining: 660,
        extensionCount: 2,
        canExtend: false
      })
    );
    const logout = vi.fn(async () => {});
    const navigator = vi.fn();

    renderTenantRoute({
      apiClient: createApiClientStub({
        getTenantLease: vi.fn(async () =>
          createTenantLeaseSummary({
            expiresAt: "2026-04-17T12:01:00Z",
            secondsRemaining: 60,
            extensionCount: 1,
            canExtend: true
          })
        ) as PaperBinderApiClient["getTenantLease"],
        extendTenantLease: extendTenantLease as PaperBinderApiClient["extendTenantLease"],
        logout: logout as PaperBinderApiClient["logout"]
      }),
      navigator
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByRole("heading", { name: "Tenant dashboard" })).toBeInTheDocument();
    expect(screen.getByText("1m 0s")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByText("0m 59s")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Extend lease" }));
      await Promise.resolve();
    });
    expect(extendTenantLease).toHaveBeenCalledTimes(1);
    expect(screen.getByText("10m 59s")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Log out" }));
      await Promise.resolve();
    });
    expect(logout).toHaveBeenCalledTimes(1);
    expect(navigator).toHaveBeenCalledWith("https://paperbinder.example.test/login");
  });

  it("Should_RenderSafeDeniedState_When_NonAdminRequestsUsersRoute", async () => {
    renderTenantRoute({
      route: "/app/users",
      apiClient: createApiClientStub({
        listTenantUsers: vi.fn(async () => {
          throw new PaperBinderApiError({
            message: "Forbidden",
            status: 403,
            errorCode: "TENANT_FORBIDDEN",
            detail: "The current tenant session is not allowed to perform this action.",
            correlationId: "corr-403",
            retryAfterSeconds: null,
            traceId: null,
            validationErrors: null
          });
        }) as PaperBinderApiClient["listTenantUsers"]
      })
    });

    expect(await screen.findByRole("heading", { level: 2, name: "Access is not allowed." })).toBeInTheDocument();
    expect(screen.getByText(/current tenant session is not allowed/i)).toBeInTheDocument();
  });
});
