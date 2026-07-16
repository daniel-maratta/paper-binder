import { type ReactNode, useEffect, useEffectEvent, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useOutletContext } from "react-router-dom";
import {
  PaperBinderApiError,
  type PaperBinderApiClient,
  type TenantImpersonationStatus,
  type TenantLeaseSummary,
  type TenantRole
} from "../api/client";
import { Alert, AlertBody, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { cn } from "../lib/cn";
import type { TenantHostContext } from "./host-context";
import { tenantNavigationItems } from "./route-registry";
import {
  mapTenantHostError,
  type TenantHostErrorViewModel
} from "./tenant-host-errors";
import { TenantImpersonationBanner } from "./tenant-impersonation-banner";
import { TenantLeaseBanner } from "./tenant-lease-banner";

export type TenantShellOutletContext = {
  apiClient: PaperBinderApiClient;
  hostContext: TenantHostContext;
  lease: TenantLeaseSummary;
  countdownSeconds: number;
  impersonation: TenantImpersonationStatus;
  startImpersonation: (userId: string) => Promise<TenantImpersonationStatus>;
  stopImpersonation: () => Promise<TenantImpersonationStatus>;
};

type TenantBootstrapViewModel = {
  title: string;
  detail: string;
  correlationId: string | null;
  retryAfterLabel: string | null;
};

export const roleOptions: readonly TenantRole[] = ["TenantAdmin", "BinderWrite", "BinderRead"];

export type TenantHostNavigator = (redirectUrl: string) => void;

export function defaultTenantHostNavigator(redirectUrl: string) {
  window.location.assign(redirectUrl);
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatCountdown(seconds: number): string {
  if (seconds <= 0) {
    return "Expired";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

export function formatRole(role: TenantRole): string {
  switch (role) {
    case "TenantAdmin":
      return "Tenant admin";
    case "BinderWrite":
      return "Binder write";
    case "BinderRead":
      return "Binder read";
    default:
      return role;
  }
}

export function canManageWorkspaceUsers(role: TenantRole): boolean {
  return role === "TenantAdmin";
}

export function hasUsersDashboardAccess(impersonation: TenantImpersonationStatus): boolean {
  return canManageWorkspaceUsers(impersonation.effective.role);
}

function calculateCountdownSeconds(expiresAt: string): number {
  const millisecondsRemaining = Date.parse(expiresAt) - Date.now();
  if (!Number.isFinite(millisecondsRemaining)) {
    return 0;
  }

  return Math.max(0, Math.ceil(millisecondsRemaining / 1000));
}

function toRootLoginUrl(rootUrl: string): string {
  return new URL("/login", rootUrl).toString();
}

function createUnavailableBootstrapViewModel(
  error: PaperBinderApiError | null
): TenantBootstrapViewModel {
  const mappedError = error === null ? null : mapTenantHostError(error);

  return {
    title: "Workspace unavailable",
    detail:
      "This workspace is unavailable or inaccessible from the current tenant host. Return to the root host and try again.",
    correlationId: mappedError?.correlationId ?? error?.correlationId ?? null,
    retryAfterLabel: mappedError?.retryAfterLabel ?? null
  };
}

function createBootstrapViewModel(error: unknown): TenantBootstrapViewModel {
  if (error instanceof PaperBinderApiError) {
    switch (error.errorCode) {
      case "TENANT_EXPIRED":
        return {
          title: "Tenant expired",
          detail: error.detail ?? "This demo tenant has expired and can no longer serve tenant-host requests.",
          correlationId: error.correlationId,
          retryAfterLabel: null
        };
      default:
        return createUnavailableBootstrapViewModel(error);
    }
  }

  return createUnavailableBootstrapViewModel(null);
}

export function useTenantShellContext() {
  return useOutletContext<TenantShellOutletContext>();
}

export function TenantHostErrorNotice({ error }: { error: TenantHostErrorViewModel | null }) {
  if (error === null) {
    return null;
  }

  return (
    <Alert variant="danger">
      <AlertTitle>{error.title}</AlertTitle>
      <AlertBody>{error.detail}</AlertBody>
      {error.retryAfterLabel ? <AlertBody>{error.retryAfterLabel}</AlertBody> : null}
      {error.correlationId ? (
        <AlertBody>
          Correlation id:{" "}
          <span className="font-mono text-xs uppercase tracking-[0.08em]">{error.correlationId}</span>
        </AlertBody>
      ) : null}
    </Alert>
  );
}

function TenantBootstrapFailurePage({
  error,
  rootLoginUrl
}: {
  error: TenantBootstrapViewModel;
  rootLoginUrl: string;
}) {
  return (
    <div className="pb-auth-boot">
      <section className="pb-auth-panel pb-auth-boot-card">
        <div className="pb-auth-panel-header">
          <p className="pb-auth-eyebrow">Workspace routing</p>
          <h1 className="pb-auth-page-title">{error.title}</h1>
          <p className="pb-auth-panel-copy">
            Tenant-host requests remain host-derived and server-authoritative even when bootstrap fails.
          </p>
        </div>
        <div className="pb-auth-panel-body">
          <Alert variant="danger">
            <AlertTitle>Safe fallback only</AlertTitle>
            <AlertBody>{error.detail}</AlertBody>
            {error.retryAfterLabel ? <AlertBody>{error.retryAfterLabel}</AlertBody> : null}
            {error.correlationId ? (
              <AlertBody>
                Correlation id:{" "}
                <span className="font-mono text-xs uppercase tracking-[0.08em]">{error.correlationId}</span>
              </AlertBody>
            ) : null}
          </Alert>
        </div>
        <div className="pb-auth-panel-actions">
          <Button asChild type="button">
            <a href={rootLoginUrl}>Return to root-host login</a>
          </Button>
        </div>
      </section>
    </div>
  );
}

function TenantShellLoadingPage() {
  return (
    <div className="pb-auth-boot">
      <section className="pb-auth-panel pb-auth-boot-card">
        <div className="pb-auth-panel-header">
          <p className="pb-auth-eyebrow">Workspace loading</p>
          <h1 className="pb-auth-page-title">Loading tenant workspace</h1>
          <p className="pb-auth-panel-copy">
            PaperBinder is reloading the current tenant shell with the current host-derived context.
          </p>
        </div>
      </section>
    </div>
  );
}

export function TenantRouteFailureCard({
  error,
  action
}: {
  error: TenantHostErrorViewModel;
  action?: ReactNode;
}) {
  return (
    <section className="pb-auth-panel pb-auth-panel--route">
      <div className="pb-auth-panel-header">
        <p className="pb-auth-eyebrow">Route status</p>
        <h2 className="pb-auth-panel-title pb-auth-panel-title--lg">{error.title}</h2>
        <p className="pb-auth-panel-copy">PaperBinder kept the route inside the current tenant host.</p>
      </div>
      <div className="pb-auth-panel-body">
        <TenantHostErrorNotice error={error} />
      </div>
      {action ? <div className="pb-auth-panel-actions">{action}</div> : null}
    </section>
  );
}

export function TenantShell({
  apiClient,
  hostContext,
  navigator
}: {
  apiClient: PaperBinderApiClient;
  hostContext: TenantHostContext;
  navigator: TenantHostNavigator;
}) {
  const [lease, setLease] = useState<TenantLeaseSummary | null>(null);
  const [impersonation, setImpersonation] = useState<TenantImpersonationStatus | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [bootstrapError, setBootstrapError] = useState<TenantBootstrapViewModel | null>(null);
  const [shellError, setShellError] = useState<TenantHostErrorViewModel | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isExtending, setIsExtending] = useState(false);
  const [isStoppingImpersonation, setIsStoppingImpersonation] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);
  const rootLoginUrl = toRootLoginUrl(hostContext.environment.rootUrl);

  const refreshShellState = useEffectEvent(
    async ({ bootstrap = false, signal }: { bootstrap?: boolean; signal?: AbortSignal } = {}) => {
      try {
        const [nextLease, nextImpersonation] = await Promise.all([
          apiClient.getTenantLease(signal),
          apiClient.getImpersonationStatus(signal)
        ]);
        if (signal?.aborted) {
          return;
        }

        setLease(nextLease);
        setImpersonation(nextImpersonation);
        setCountdownSeconds(calculateCountdownSeconds(nextLease.expiresAt));
        setBootstrapError(null);
      } catch (error) {
        if (signal?.aborted) {
          return;
        }

        if (bootstrap || lease === null || impersonation === null) {
          setBootstrapError(createBootstrapViewModel(error));
          return;
        }

        setShellError(mapTenantHostError(error));
      } finally {
        if (bootstrap) {
          setIsBootstrapping(false);
        }
      }
    }
  );

  useEffect(() => {
    const abortController = new AbortController();
    setIsBootstrapping(true);
    setShellError(null);
    setBootstrapError(null);
    void refreshShellState({ bootstrap: true, signal: abortController.signal });

    return () => {
      abortController.abort();
    };
  }, [hostContext.currentHost]);

  useEffect(() => {
    if (lease === null) {
      return;
    }

    setCountdownSeconds(calculateCountdownSeconds(lease.expiresAt));
    const intervalId = window.setInterval(() => {
      setCountdownSeconds(calculateCountdownSeconds(lease.expiresAt));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [lease]);

  useEffect(() => {
    if (lease === null || impersonation === null || isBootstrapping) {
      previousPathRef.current = location.pathname;
      return;
    }

    if (previousPathRef.current === location.pathname) {
      return;
    }

    previousPathRef.current = location.pathname;
    void refreshShellState();
  }, [impersonation, isBootstrapping, lease, location.pathname]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshShellState();
      }
    }, 60000);

    const handleFocus = () => {
      void refreshShellState();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshShellState();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  async function handleExtendLease() {
    setShellError(null);
    setIsExtending(true);

    try {
      const nextLease = await apiClient.extendTenantLease();
      setLease(nextLease);
      setCountdownSeconds(calculateCountdownSeconds(nextLease.expiresAt));
    } catch (error) {
      setShellError(mapTenantHostError(error));
    } finally {
      setIsExtending(false);
    }
  }

  async function handleStopImpersonation(): Promise<TenantImpersonationStatus> {
    setShellError(null);
    setIsStoppingImpersonation(true);

    try {
      const nextImpersonation = await apiClient.stopImpersonation();
      setImpersonation(nextImpersonation);
      return nextImpersonation;
    } catch (error) {
      setShellError(mapTenantHostError(error));
      throw error;
    } finally {
      setIsStoppingImpersonation(false);
    }
  }

  async function handleStartImpersonation(userId: string) {
    const nextImpersonation = await apiClient.startImpersonation(userId);
    setImpersonation(nextImpersonation);
    return nextImpersonation;
  }

  async function handleLogout() {
    setShellError(null);
    setIsLoggingOut(true);

    try {
      const { redirectUrl } = await apiClient.logout();
      navigator(redirectUrl);
    } catch (error) {
      setShellError(mapTenantHostError(error));
      setIsLoggingOut(false);
      return;
    }

    setIsLoggingOut(false);
  }

  if (isBootstrapping) {
    return <TenantShellLoadingPage />;
  }

  if (bootstrapError !== null || lease === null || impersonation === null) {
    return (
      <TenantBootstrapFailurePage
        error={bootstrapError ?? createBootstrapViewModel(null)}
        rootLoginUrl={rootLoginUrl}
      />
    );
  }

  return (
    <div className="pb-auth-shell">
      <div className="pb-auth-grid">
        <aside className="pb-auth-sidebar">
          <div className="pb-auth-sidebar-panel">
            <p className="pb-auth-sidebar-brand">PaperBinder</p>
            <p className="pb-auth-sidebar-title">Workspace</p>
            <p className="pb-auth-sidebar-copy">
              Binders, immutable source documents, role-aware access, and live lease state.
            </p>
          </div>

          <nav aria-label="Workspace navigation" className="pb-auth-nav">
            {tenantNavigationItems.map((route) => (
              <NavLink
                className={({ isActive }) =>
                  cn(
                    "pb-auth-nav-link",
                    isActive ? "pb-auth-nav-link--active" : null
                  )
                }
                end={route.path === "/app"}
                key={route.path}
                to={route.path}
              >
                <span className="pb-auth-nav-label">{route.label}</span>
                <span className="pb-auth-sidebar-nav-copy">{route.description}</span>
              </NavLink>
            ))}
          </nav>

          <div className="pb-auth-sidebar-panel pb-auth-sidebar-panel--context">
            <div className="pb-auth-sidebar-context-row">
              <p className="pb-auth-sidebar-context-label">Workspace context</p>
            </div>
            <div className="pb-auth-sidebar-context-row">
              <p className="pb-auth-sidebar-context-label">Tenant slug</p>
              <p className="pb-auth-sidebar-context-value">{hostContext.tenantSlug}</p>
            </div>
            <div className="pb-auth-sidebar-context-row">
              <p className="pb-auth-sidebar-context-label">Current host</p>
              <p className="pb-auth-sidebar-context-value pb-auth-sidebar-context-value--host">
                {hostContext.currentOrigin}
              </p>
            </div>
          </div>
        </aside>

        <main className="pb-auth-main">
          <header className="pb-auth-header">
            <div>
              <p className="pb-auth-eyebrow">Current workspace</p>
              <h1 className="pb-auth-header-title">Workspace</h1>
              <p className="pb-auth-page-copy">
                Review binders, immutable source documents, workspace access, and lease state inside the
                current isolated tenant workspace.
              </p>
            </div>

            <div className="pb-auth-header-actions">
              <div className="pb-auth-header-pill">
                <p className="pb-auth-eyebrow">Tenant slug</p>
                <p className="pb-auth-header-pill-value">{hostContext.tenantSlug}</p>
              </div>
              <Button isLoading={isLoggingOut} onClick={() => void handleLogout()} type="button" variant="secondary">
                Log out
              </Button>
            </div>
          </header>

          <div className="pb-auth-shell-body">
            <TenantImpersonationBanner
              impersonation={impersonation}
              isStopping={isStoppingImpersonation}
              onStop={handleStopImpersonation}
            />
            {lease.canExtend ? (
              <TenantLeaseBanner
                countdownSeconds={countdownSeconds}
                isExtending={isExtending}
                lease={lease}
                onExtend={handleExtendLease}
              />
            ) : null}
            <TenantHostErrorNotice error={shellError} />
            <Outlet
              context={
                {
                  apiClient,
                  hostContext,
                  lease,
                  countdownSeconds,
                  impersonation,
                  startImpersonation: handleStartImpersonation,
                  stopImpersonation: handleStopImpersonation
                } satisfies TenantShellOutletContext
              }
            />
          </div>
        </main>
      </div>
    </div>
  );
}
