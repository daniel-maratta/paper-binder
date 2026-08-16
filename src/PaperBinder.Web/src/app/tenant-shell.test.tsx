import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import packageJson from "../../package.json";
import { AppRouter } from "../App";
import { PaperBinderApiError, type PaperBinderApiClient } from "../api/client";
import {
  createApiClientStub,
  createTenantHostContext,
  createTenantImpersonationStatus,
  createTenantLeaseSummary
} from "../test/test-helpers";

function setShellViewport(width: number) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => {
      const matches = query === "(min-width: 1024px)" ? width >= 1024 : false;
      return {
        matches,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn()
      };
    })
  });
}

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
  setShellViewport(1280);
});

describe("tenant shell", () => {
  it("Should_RenderDesktopSidebarShell_When_ViewportIsDesktopWidth", async () => {
    setShellViewport(1280);

    renderTenantRoute({});

    expect(await screen.findByRole("heading", { name: "Workspace dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Workspace navigation" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open workspace menu" })).not.toBeInTheDocument();
    expect(screen.getByText("Designed by")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("Should_RenderMobileShellMenuAndFooter_When_ViewportIsBelowDesktopBreakpoint", async () => {
    setShellViewport(390);
    const logout = vi.fn(async () => ({
      redirectUrl: "https://paperbinder.example.test/login"
    }));
    const navigator = vi.fn();

    renderTenantRoute({
      apiClient: createApiClientStub({
        logout: logout as PaperBinderApiClient["logout"]
      }),
      navigator
    });

    expect(await screen.findByRole("heading", { name: "Workspace dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open workspace menu" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Workspace navigation" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open workspace menu" }));

    expect(screen.getByText("owner@acme-demo.local")).toBeInTheDocument();
    expect(screen.getByText("acme")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Workspace navigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Binders" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Users" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Legal" })).toHaveAttribute(
      "href",
      "https://paperbinder.example.test/legal?workspace=acme"
    );
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute(
      "href",
      "https://paperbinder.example.test/privacy?workspace=acme"
    );
    expect(screen.getByRole("link", { name: "Terms of Use" })).toHaveAttribute(
      "href",
      "https://paperbinder.example.test/terms?workspace=acme"
    );
    expect(screen.getByRole("link", { name: "Cookie Notice" })).toHaveAttribute(
      "href",
      "https://paperbinder.example.test/cookies?workspace=acme"
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(navigator).toHaveBeenCalledWith("https://paperbinder.example.test/login"));

    expect(screen.getByText("Copyright")).toBeInTheDocument();
    expect(screen.getByText("Copyright 2026 Daniel Maratta")).toBeInTheDocument();
    expect(screen.getByText("Version")).toBeInTheDocument();
    expect(screen.getByText(`v${packageJson.version}`)).toBeInTheDocument();
    expect(screen.getByText("Designed by")).toBeInTheDocument();
    expect(screen.getByText("Daniel Maratta")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "About PaperBinder" })).toHaveAttribute(
      "href",
      "https://paperbinder.example.test/about?workspace=acme"
    );
  });

  it("Should_CloseMobileMenu_When_PointerDownOccursOutsideMenu", async () => {
    setShellViewport(390);

    renderTenantRoute({});

    expect(await screen.findByRole("heading", { name: "Workspace dashboard" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open workspace menu" }));

    expect(screen.getByRole("navigation", { name: "Workspace navigation" })).toBeInTheDocument();

    fireEvent.pointerDown(document.body);

    await waitFor(() =>
      expect(screen.queryByRole("navigation", { name: "Workspace navigation" })).not.toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: "Open workspace menu" })).toBeInTheDocument();
  });

  it("Should_RenderAuthenticationRequired_When_TenantBootstrapReturnsUnauthorized", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: {
        writeText
      }
    });

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
    expect(screen.getByText(/return to a safe starting point/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to main site" })).toHaveAttribute(
      "href",
      "https://paperbinder.example.test/?workspace=acme"
    );
    expect(screen.getByRole("link", { name: "Return to sign in" })).toHaveAttribute(
      "href",
      "https://paperbinder.example.test/login?workspace=acme"
    );

    fireEvent.click(screen.getByRole("button", { name: "Copy correlation id" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("corr-401"));
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
        heading: "Workspace access denied"
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
        heading: "Demo expired"
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
        heading: "Workspace unavailable"
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
      expect(screen.getByRole("link", { name: "Return to main site" })).toBeInTheDocument();

      view.unmount();
    }
  });

  it("Should_RenderExpiredRetainedFailureCopy_When_TerminalTenantStateIsExplicit", async () => {
    renderTenantRoute({
      apiClient: createApiClientStub({
        getTenantLease: vi.fn(async () => {
          throw new PaperBinderApiError({
            message: "Expired",
            status: 410,
            errorCode: "TENANT_EXPIRED",
            detail: "The requested tenant has expired and can no longer be accessed.",
            correlationId: "corr-410",
            retryAfterSeconds: null,
            traceId: null,
            validationErrors: null,
            extensions: {
              terminalTenantState: "expired_retained_recent_activity"
            }
          });
        }) as PaperBinderApiClient["getTenantLease"]
      })
    });

    expect(await screen.findByRole("heading", { name: "Demo expired" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "This demo workspace has expired. PaperBinder is keeping it briefly because there was recent activity, but access is already closed and cleanup will remove it soon."
      )
    ).toBeInTheDocument();
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

    expect(await screen.findByRole("heading", { name: "Workspace dashboard" })).toBeInTheDocument();
    expect(await screen.findByText("Operations")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Review binders" })).toBeInTheDocument();
    expect(document.title).toBe("Dashboard | PaperBinder");
  });

  it("Should_LinkLogoToLandingPage_AndOpenAboutInNewTab_When_HeaderActionsRender", async () => {
    renderTenantRoute({});

    expect(await screen.findByRole("heading", { name: "Workspace dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "PaperBinder home" })).toHaveAttribute(
      "href",
      "https://paperbinder.example.test/?workspace=acme"
    );
    expect(screen.getByRole("link", { name: "About PaperBinder" })).toHaveAttribute(
      "href",
      "https://paperbinder.example.test/about?workspace=acme"
    );
    expect(screen.getByRole("link", { name: "About PaperBinder" })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "Legal" })).toHaveAttribute(
      "href",
      "https://paperbinder.example.test/legal?workspace=acme"
    );
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute(
      "href",
      "https://paperbinder.example.test/privacy?workspace=acme"
    );
    expect(screen.getByRole("link", { name: "Terms of Use" })).toHaveAttribute(
      "href",
      "https://paperbinder.example.test/terms?workspace=acme"
    );
    expect(screen.getByRole("link", { name: "Cookie Notice" })).toHaveAttribute(
      "href",
      "https://paperbinder.example.test/cookies?workspace=acme"
    );
    expect(screen.getByText("Designed by")).toBeInTheDocument();
    expect(screen.getByText("Daniel Maratta")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "paperbinder.danielmaratta.com" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Daniel Maratta" })).not.toBeInTheDocument();
    expect(screen.getByText("acme")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy tenant slug" })).not.toBeInTheDocument();
  });

  it("Should_RenderAddYourFirstBinder_When_DashboardLoadsWithoutVisibleBinders", async () => {
    renderTenantRoute({
      apiClient: createApiClientStub({
        listBinders: vi.fn(async () => []) as PaperBinderApiClient["listBinders"]
      })
    });

    expect(await screen.findByRole("heading", { name: "Workspace dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add your first binder" })).toHaveAttribute("href", "/app/binders");
    expect(screen.queryByRole("link", { name: "Review binders" })).not.toBeInTheDocument();
  });

  it("Should_RenderWorkspaceDashboard_With_CountdownMetric_And_ExtensionWindowBanner_When_TenantBootstrapSucceeds", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-17T12:00:00Z"));

    renderTenantRoute({
      apiClient: createApiClientStub({
        getTenantLease: vi.fn(async () =>
          createTenantLeaseSummary({
            expiresAt: "2026-04-17T12:01:00Z",
            secondsRemaining: 60,
            extensionCount: 1,
            maxExtensions: 3,
            canExtend: true
          })
        ) as PaperBinderApiClient["getTenantLease"]
      })
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByRole("heading", { name: "Workspace dashboard" })).toBeInTheDocument();
    expect(screen.getByText("Lease extension window open.")).toBeInTheDocument();
    expect(screen.getAllByText("Demo expires in")).toHaveLength(2);
    expect(screen.getAllByText("1m 0s")).toHaveLength(2);
    expect(screen.getByText("1 of 3 used")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Extend lease" })).toBeInTheDocument();
  });

  it("Should_RenderDemoExpiredFailurePage_When_TenantExpiresAfterBootstrap", async () => {
    const expiredError = new PaperBinderApiError({
      message: "Expired",
      status: 410,
      errorCode: "TENANT_EXPIRED",
      detail: "Expired",
      correlationId: "corr-410",
      retryAfterSeconds: null,
      traceId: null,
      validationErrors: null
    });
    let shouldExpireOnLeaseRead = false;

    renderTenantRoute({
      apiClient: createApiClientStub({
        getTenantLease: vi.fn(async () => {
          if (shouldExpireOnLeaseRead) {
            throw expiredError;
          }

          return createTenantLeaseSummary({
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
            secondsRemaining: 60,
            extensionCount: 1,
            maxExtensions: 3,
            canExtend: false
          });
        }) as PaperBinderApiClient["getTenantLease"]
      })
    });

    expect(await screen.findByRole("heading", { name: "Workspace dashboard" })).toBeInTheDocument();

    await act(async () => {
      shouldExpireOnLeaseRead = true;
      window.dispatchEvent(new Event("focus"));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(await screen.findByRole("heading", { name: "Demo expired" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to main site" })).toHaveAttribute(
      "href",
      "https://paperbinder.example.test/?workspace=acme"
    );
  });

  it("Should_HideDashboardUsersEntryPoint_When_EffectiveRoleCannotManageUsers", async () => {
    renderTenantRoute({
      route: "/app",
      apiClient: createApiClientStub({
        getImpersonationStatus: vi.fn(async () =>
          createTenantImpersonationStatus({
            effective: {
              userId: "user-2",
              email: "reader@acme-demo.local",
              role: "BinderRead"
            }
          })
        ) as PaperBinderApiClient["getImpersonationStatus"]
      })
    });

    expect(await screen.findByRole("heading", { name: "Workspace dashboard" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Manage users" })).not.toBeInTheDocument();
    expect(screen.getByText(/user management is available to workspace admins/i)).toBeInTheDocument();
  });

  it("Should_RenderActiveImpersonationStatus_AndStopFromTenantShell_When_ImpersonationIsActive", async () => {
    const stopImpersonation = vi.fn(async () => createTenantImpersonationStatus());

    renderTenantRoute({
      apiClient: createApiClientStub({
        getImpersonationStatus: vi.fn(async () =>
          createTenantImpersonationStatus({
            isImpersonating: true,
            effective: {
              userId: "user-2",
              email: "reader@acme-demo.local",
              role: "BinderRead"
            }
          })
        ) as PaperBinderApiClient["getImpersonationStatus"],
        stopImpersonation: stopImpersonation as PaperBinderApiClient["stopImpersonation"]
      })
    });

    expect(await screen.findByText("Viewing as")).toBeInTheDocument();
    expect(screen.getByText("reader@acme-demo.local")).toBeInTheDocument();
    expect(screen.getByText(/signed in as owner@acme-demo.local/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stop view as" }).className).toContain(
      "border-[var(--pb-status-danger)]"
    );

    fireEvent.click(screen.getByRole("button", { name: "Stop view as" }));

    await waitFor(() => expect(stopImpersonation).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByText("Viewing as")).not.toBeInTheDocument());
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
    fireEvent.click(screen.getByRole("button", { name: "Add binder" }));

    await waitFor(() => expect(createBinder).toHaveBeenCalledWith({ name: "Operations" }));
    expect(await screen.findByText("Binder added.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open binder" })).toBeInTheDocument();
  });

  it("Should_PauseToastAutoDismiss_When_NotificationIsHovered", async () => {
    vi.useFakeTimers();

    const createTenantUser = vi.fn(async () => ({
      userId: "user-2",
      email: "member@acme-demo.local",
      role: "BinderRead" as const,
      isOwner: false,
      credentials: {
        email: "member@acme-demo.local",
        password: "generated-password"
      }
    }));

    renderTenantRoute({
      route: "/app/users",
      apiClient: createApiClientStub({
        listTenantUsers: vi.fn(async () => []) as PaperBinderApiClient["listTenantUsers"],
        createTenantUser: createTenantUser as PaperBinderApiClient["createTenantUser"]
      })
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByRole("heading", { name: "Users and access" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "member@acme-demo.local" }
    });
    fireEvent.change(screen.getByLabelText("Role"), {
      target: { value: "BinderRead" }
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Add user" }));
      await Promise.resolve();
      await Promise.resolve();
    });

    const dismissButton = screen.getByRole("button", { name: "Dismiss notification: User added to workspace." });
    const toast = dismissButton.closest("section");
    if (toast === null) {
      throw new Error("Expected the user-added toast to render.");
    }

    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.mouseEnter(toast);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8000);
    });

    expect(screen.getByRole("button", { name: "Dismiss notification: User added to workspace." })).toBeInTheDocument();

    fireEvent.mouseLeave(toast);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4999);
    });

    expect(screen.getByRole("button", { name: "Dismiss notification: User added to workspace." })).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(
      screen.queryByRole("button", { name: "Dismiss notification: User added to workspace." })
    ).not.toBeInTheDocument();
  });

  it("Should_RenderBinderDetail_CreateDocument_AndUpdateBinderPolicy_When_RouteActionsSucceed", async () => {
    const updateBinderPolicy = vi.fn(async () => ({
      mode: "restricted_roles" as const,
      allowedRoles: ["BinderRead" as const]
    }));
    const createDocument = vi.fn(async () => ({
      documentId: "document-2",
      binderId: "binder-1",
      title: "Incident handbook",
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
    expect(screen.getByText("Visible documents")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Binder access" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Add document" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Demo data warning" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Do not enter confidential, sensitive, regulated, proprietary, personal, medical, financial, credential, or important real business information."
      )
    ).toBeInTheDocument();
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
    expect(await screen.findByText("Binder access saved.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Document title"), {
      target: { value: "Incident handbook" }
    });
    fireEvent.change(screen.getByLabelText("Document source"), {
      target: { value: "# Replacement" }
    });
    fireEvent.change(screen.getByLabelText("Supersedes"), {
      target: { value: "document-1" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Add document" }));

    await waitFor(() =>
      expect(createDocument).toHaveBeenCalledWith({
        binderId: "binder-1",
        title: "Incident handbook",
        contentType: "markdown",
        content: "# Replacement",
        supersedesDocumentId: "document-1"
      })
    );
    expect(await screen.findByText("Document added.")).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: "Open document" })
        .some((link) => link.getAttribute("href") === "/app/documents/document-2")
    ).toBe(true);
  });

  it("Should_RestrictSameNameSupersedesChoices_AndDeleteBinder_When_ConfirmationMatches", async () => {
    const deleteBinder = vi.fn(async () => undefined);

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
            },
            {
              documentId: "document-2",
              binderId: "binder-1",
              title: "Runbook",
              contentType: "markdown",
              supersedesDocumentId: null,
              createdAt: "2026-04-16T11:20:00Z",
              archivedAt: null
            }
          ]
        })) as PaperBinderApiClient["getBinderDetail"],
        getBinderPolicy: vi.fn(async () => ({
          mode: "inherit",
          allowedRoles: []
        })) as PaperBinderApiClient["getBinderPolicy"],
        deleteBinder: deleteBinder as PaperBinderApiClient["deleteBinder"]
      })
    });

    expect(await screen.findByRole("heading", { name: "Operations" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Document title"), {
      target: { value: "incident HANDBOOK" }
    });

    const supersedesSelect = screen.getByLabelText("Supersedes");
    const options = Array.from(supersedesSelect.querySelectorAll("option")).map((option) => option.textContent);
    expect(options).toEqual(["No superseded document", "Incident handbook"]);
    expect(
      screen.getByText(
        "A document with this title already exists. Rename this document or supersede the current document with the same name."
      )
    ).toBeInTheDocument();
    expect(document.title).toBe("Binder | PaperBinder");

    fireEvent.click(screen.getByRole("button", { name: "Delete binder" }));
    fireEvent.change(screen.getByLabelText("Confirm binder name"), {
      target: { value: "Operations" }
    });
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete binder" }));

    await waitFor(() => expect(deleteBinder).toHaveBeenCalledWith("binder-1"));
    expect(await screen.findByRole("heading", { name: "Binders" })).toBeInTheDocument();
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
          content: "# Archived detail\n\n## Review checklist\n\n- Confirm retention policy",
          supersedesDocumentId: null,
          createdAt: "2026-04-16T11:20:00Z",
          archivedAt: "2026-04-16T12:20:00Z"
        })) as PaperBinderApiClient["getDocumentDetail"]
      })
    });

    expect(await screen.findByRole("heading", { name: "Archived handbook" })).toBeInTheDocument();
    const backToBinderLink = screen.getByRole("link", { name: "Back to binder" });
    const pageTitle = screen.getByRole("heading", { name: "Archived handbook" });
    expect(backToBinderLink.compareDocumentPosition(pageTitle) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    expect(screen.getByRole("heading", { name: "Document preview" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Document metadata" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Archived detail" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Review checklist" })).toBeInTheDocument();
    expect(screen.getByText("Confirm retention policy")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View Source" })).toBeInTheDocument();
    expect(screen.getAllByText("Archived")).toHaveLength(2);
    expect(screen.queryByText("# Archived detail")).not.toBeInTheDocument();
    expect(screen.getByText(/direct links still work for allowed users/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "View Source" }));

    expect(screen.getByRole("heading", { name: "Document source" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View Rendered" })).toBeInTheDocument();
    expect(screen.getByText(/# Archived detail/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "View Rendered" }));

    expect(screen.getByRole("heading", { name: "Document preview" })).toBeInTheDocument();
    expect(screen.queryByText("# Archived detail")).not.toBeInTheDocument();
  });

  it("Should_OffsetMarkdownHeadingLevels_When_DocumentContentHasAllHeadingLevels", async () => {
    renderTenantRoute({
      route: "/app/documents/document-1",
      apiClient: createApiClientStub({
        getDocumentDetail: vi.fn(async () => ({
          documentId: "document-1",
          binderId: "binder-1",
          title: "Heading Levels",
          contentType: "markdown",
          content:
            "# Heading One\n\n## Heading Two\n\n### Heading Three\n\n#### Heading Four\n\n##### Heading Five\n\n###### Heading Six",
          supersedesDocumentId: null,
          createdAt: "2026-04-16T11:20:00Z",
          archivedAt: null
        })) as PaperBinderApiClient["getDocumentDetail"]
      })
    });

    expect(await screen.findByRole("heading", { level: 3, name: "Heading One" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4, name: "Heading Two" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 5, name: "Heading Three" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 6, name: "Heading Four" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 6, name: "Heading Five" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 6, name: "Heading Six" })).toBeInTheDocument();

    expect(screen.queryByRole("heading", { level: 1, name: "Heading One" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "Heading One" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1, name: "Heading Two" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "Heading Two" })).not.toBeInTheDocument();
  });

  it("Should_DeleteDocument_When_ConfirmationMatches", async () => {
    const deleteDocument = vi.fn(async () => undefined);

    renderTenantRoute({
      route: "/app/documents/document-1",
      apiClient: createApiClientStub({
        deleteDocument: deleteDocument as PaperBinderApiClient["deleteDocument"]
      })
    });

    expect(await screen.findByRole("heading", { level: 2, name: "Security Handbook" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete document" }));
    fireEvent.change(screen.getByLabelText("Confirm document name"), {
      target: { value: "Security Handbook" }
    });
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete document" }));

    await waitFor(() => expect(deleteDocument).toHaveBeenCalledWith("document-1"));
    expect(await screen.findByRole("heading", { name: "Operations" })).toBeInTheDocument();
  });

  it("Should_RenderTenantUsersAndApplyMutations_When_AdminActionsSucceed", async () => {
    const createTenantUser = vi.fn(async () => ({
      userId: "user-2",
      email: "member@acme-demo.local",
      role: "BinderRead" as const,
      isOwner: false,
      credentials: {
        email: "member@acme-demo.local",
        password: "generated-password"
      }
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

    expect(await screen.findByRole("heading", { name: "Users and access" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "member@acme-demo.local" }
    });
    fireEvent.change(screen.getByLabelText("Role"), {
      target: { value: "BinderRead" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Add user" }));

    await waitFor(() =>
      expect(createTenantUser).toHaveBeenCalledWith({
        email: "member@acme-demo.local",
        role: "BinderRead"
      })
    );
    expect(await screen.findByText("User added to workspace.")).toBeInTheDocument();

    fireEvent.click(await screen.findByRole("button", { name: "Manage user member@acme-demo.local" }));
    expect(await screen.findByRole("heading", { name: "Manage selected user" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Role for member@acme-demo.local"), {
      target: { value: "BinderWrite" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save role" }));

    await waitFor(() =>
      expect(updateTenantUserRole).toHaveBeenCalledWith("user-2", {
        role: "BinderWrite"
      })
    );
    expect(await screen.findByText("Role updated.")).toBeInTheDocument();
  });

  it("Should_KeepOwnerFirst_AndDeleteSelectedWorkspaceUser_When_ConfirmationMatches", async () => {
    const deleteTenantUser = vi.fn(async () => undefined);

    renderTenantRoute({
      route: "/app/users",
      apiClient: createApiClientStub({
        listTenantUsers: vi.fn(async () => [
          {
            userId: "user-2",
            email: "member@acme-demo.local",
            role: "BinderRead",
            isOwner: false
          },
          {
            userId: "user-1",
            email: "owner@acme-demo.local",
            role: "TenantAdmin",
            isOwner: true
          }
        ]) as PaperBinderApiClient["listTenantUsers"],
        deleteTenantUser: deleteTenantUser as PaperBinderApiClient["deleteTenantUser"]
      })
    });

    expect(await screen.findByRole("heading", { name: "Users and access" })).toBeInTheDocument();

    const manageButtons = await screen.findAllByRole("button", { name: /Manage user /i });
    expect(manageButtons[0]).toHaveAttribute("aria-label", "Manage user owner@acme-demo.local");

    fireEvent.click(screen.getByRole("button", { name: "Manage user member@acme-demo.local" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete user" }));
    fireEvent.change(screen.getByLabelText("Confirm email"), {
      target: { value: "member@acme-demo.local" }
    });
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete user" }));

    await waitFor(() => expect(deleteTenantUser).toHaveBeenCalledWith("user-2"));
    expect(await screen.findByText("User deleted.")).toBeInTheDocument();
    expect(screen.queryByText("member@acme-demo.local")).not.toBeInTheDocument();
  });

  it("Should_DisableSelfDeletion_When_CurrentEffectiveUserIsSelected", async () => {
    renderTenantRoute({
      route: "/app/users",
      apiClient: createApiClientStub({
        getImpersonationStatus: vi.fn(async () =>
          createTenantImpersonationStatus({
            isImpersonating: true,
            effective: {
              userId: "user-2",
              email: "admin@acme-demo.local",
              role: "TenantAdmin"
            }
          })
        ) as PaperBinderApiClient["getImpersonationStatus"],
        listTenantUsers: vi.fn(async () => [
          {
            userId: "user-1",
            email: "owner@acme-demo.local",
            role: "TenantAdmin",
            isOwner: true
          },
          {
            userId: "user-2",
            email: "admin@acme-demo.local",
            role: "TenantAdmin",
            isOwner: false
          }
        ]) as PaperBinderApiClient["listTenantUsers"]
      })
    });

    expect(await screen.findByRole("heading", { name: "Users and access" })).toBeInTheDocument();
    expect(document.title).toBe("Users | PaperBinder");

    fireEvent.click(await screen.findByRole("button", { name: "Manage user admin@acme-demo.local" }));

    expect(screen.getByText("Self-deletion is disabled.")).toBeInTheDocument();
    expect(screen.getByText("You cannot remove the current effective user from this screen.")).toBeInTheDocument();
    expect(
      screen.queryByText("PaperBinder will ask for admin@acme-demo.local before removing this user.")
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete user" })).toBeDisabled();
  });

  it("Should_ShowServerIssuedCredentials_When_TenantUserIsCreated", async () => {
    const createTenantUser = vi.fn(async () => ({
      userId: "user-2",
      email: "member@acme-demo.local",
      role: "BinderRead" as const,
      isOwner: false,
      credentials: {
        email: "member@acme-demo.local",
        password: "generated-password"
      }
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
        createTenantUser: createTenantUser as PaperBinderApiClient["createTenantUser"]
      })
    });

    expect(await screen.findByRole("heading", { name: "Users and access" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "member@acme-demo.local" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Add user" }));

    await waitFor(() =>
      expect(createTenantUser).toHaveBeenCalledWith({
        email: "member@acme-demo.local",
        role: "BinderRead"
      })
    );
    expect(await screen.findByText(/save these credentials now/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Copy workspace email for member@acme-demo.local" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Copy workspace password for member@acme-demo.local" })
    ).toBeInTheDocument();
  });

  it("Should_MaskTenantUserPasswordUntilReveal_When_ServerIssuedCredentialsAreShown", async () => {
    const createTenantUser = vi.fn(async () => ({
      userId: "user-2",
      email: "member@acme-demo.local",
      role: "BinderRead" as const,
      isOwner: false,
      credentials: {
        email: "member@acme-demo.local",
        password: "generated-password"
      }
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
        createTenantUser: createTenantUser as PaperBinderApiClient["createTenantUser"]
      })
    });

    expect(await screen.findByRole("heading", { name: "Users and access" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "member@acme-demo.local" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Add user" }));

    await waitFor(() =>
      expect(createTenantUser).toHaveBeenCalledWith({
        email: "member@acme-demo.local",
        role: "BinderRead"
      })
    );

    const passwordField = await screen.findByLabelText("Workspace password") as HTMLInputElement;
    expect(passwordField).toHaveAttribute("type", "password");
    expect(passwordField).toHaveValue("generated-password");

    fireEvent.click(screen.getByRole("button", { name: "Show workspace password" }));
    expect(passwordField).toHaveAttribute("type", "text");

    fireEvent.click(screen.getByRole("button", { name: "Hide workspace password" }));
    expect(passwordField).toHaveAttribute("type", "password");
  });

  it("Should_CopyIdentifiers_FromBinderAndUsersSurfaces_When_CopyChipsAreUsed", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: {
        writeText
      }
    });

    const binderView = renderTenantRoute({
      route: "/app/binders",
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

    expect(await screen.findByRole("heading", { name: "Binders" })).toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: "Copy binder id for Operations" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("binder-1"));
    binderView.unmount();

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
        ]) as PaperBinderApiClient["listTenantUsers"]
      })
    });

    expect(await screen.findByRole("heading", { name: "Users and access" })).toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: "Copy user id for owner@acme-demo.local" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("user-1"));
  });

  it("Should_StartViewAsFromUsersRoute_AndReturnToDashboard_When_TenantAdminTargetsEligibleUser", async () => {
    const activeImpersonation = createTenantImpersonationStatus({
      isImpersonating: true,
      effective: {
        userId: "user-2",
        email: "member@acme-demo.local",
        role: "BinderRead"
      }
    });
    let currentImpersonation = createTenantImpersonationStatus();
    const getImpersonationStatus = vi.fn(async () => currentImpersonation);
    const startImpersonation = vi.fn(async () => {
      currentImpersonation = activeImpersonation;
      return activeImpersonation;
    });

    renderTenantRoute({
      route: "/app/users",
      apiClient: createApiClientStub({
        getImpersonationStatus: getImpersonationStatus as PaperBinderApiClient["getImpersonationStatus"],
        listTenantUsers: vi.fn(async () => [
          {
            userId: "user-1",
            email: "owner@acme-demo.local",
            role: "TenantAdmin",
            isOwner: true
          },
          {
            userId: "user-2",
            email: "member@acme-demo.local",
            role: "BinderRead",
            isOwner: false
          }
        ]) as PaperBinderApiClient["listTenantUsers"],
        startImpersonation: startImpersonation as PaperBinderApiClient["startImpersonation"]
      })
    });

    expect(await screen.findByRole("heading", { name: "Users and access" })).toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: "Manage user owner@acme-demo.local" }));
    expect(await screen.findByText("Not eligible")).toBeInTheDocument();
    expect(screen.getByText(/cannot start view as for the current effective user/i)).toBeInTheDocument();
    expect(screen.getByText("Remove this workspace user.")).toBeInTheDocument();
    expect(screen.getByText("The workspace owner cannot be deleted.")).toBeInTheDocument();
    expect(screen.queryByText("Confirm before removing this user.")).not.toBeInTheDocument();

    fireEvent.click(await screen.findByRole("button", { name: "Manage user member@acme-demo.local" }));
    fireEvent.click(await screen.findByRole("button", { name: "View as this user" }));

    await waitFor(() => expect(startImpersonation).toHaveBeenCalledWith("user-2"));
    expect(await screen.findByRole("heading", { name: "Workspace dashboard" })).toBeInTheDocument();
    expect(await screen.findByText("Viewing as")).toBeInTheDocument();
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
    const logout = vi.fn(async () => ({
      redirectUrl: "https://paperbinder.example.test/login"
    }));
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

    expect(screen.getByRole("heading", { name: "Workspace dashboard" })).toBeInTheDocument();
    expect(screen.getAllByText("1m 0s")).toHaveLength(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getAllByText("0m 59s")).toHaveLength(2);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Extend lease" }));
      await Promise.resolve();
    });
    expect(extendTenantLease).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/11m 0s|10m 59s/)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
      await Promise.resolve();
    });
    expect(logout).toHaveBeenCalledTimes(1);
    expect(navigator).toHaveBeenCalledWith("https://paperbinder.example.test/login");
  });

  it("Should_RenderSafeDeniedState_When_NonAdminRequestsUsersRoute", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: {
        writeText
      }
    });

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

    fireEvent.click(screen.getByRole("button", { name: "Copy correlation id" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("corr-403"));
  });
});
