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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "../components/ui/card";
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
    <div className="min-h-screen bg-[var(--pb-surface-gradient)] px-6 py-6 text-[var(--pb-color-text)] lg:px-10">
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>{error.title}</CardTitle>
            <CardDescription>
              Tenant-host requests remain host-derived and server-authoritative even when bootstrap fails.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
          <CardFooter>
            <Button asChild type="button">
              <a href={rootLoginUrl}>Return to root-host login</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function TenantShellLoadingPage() {
  return (
    <div className="min-h-screen bg-[var(--pb-surface-gradient)] px-6 py-6 text-[var(--pb-color-text)] lg:px-10">
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Loading tenant workspace</CardTitle>
            <CardDescription>
              PaperBinder is reloading the current tenant shell with the current host-derived context.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
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
    <Card>
      <CardHeader>
        <CardTitle>{error.title}</CardTitle>
        <CardDescription>PaperBinder kept the route inside the current tenant host.</CardDescription>
      </CardHeader>
      <CardContent>
        <TenantHostErrorNotice error={error} />
      </CardContent>
      {action ? <CardFooter>{action}</CardFooter> : null}
    </Card>
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
    <div className="min-h-screen bg-[var(--pb-surface-gradient)] text-[var(--pb-color-text)]">
      <div className="mx-auto grid min-h-screen max-w-[1450px] gap-5 px-4 py-4 sm:px-6 lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:px-6 lg:py-5">
        <aside className="flex flex-col rounded-[30px] border border-white/12 bg-[var(--pb-sidebar-shell)] p-4 text-white shadow-[0_34px_84px_-46px_rgba(5,11,22,0.92)]">
          <div className="rounded-[24px] border border-white/12 bg-white/[0.08] px-4 py-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/62">
              PaperBinder
            </p>
            <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">Workspace</p>
            <p className="mt-2 text-sm leading-6 text-white/78">
              Binders, immutable source documents, role-aware access, and live lease state.
            </p>
          </div>

          <nav aria-label="Workspace navigation" className="mt-5 space-y-2">
            {tenantNavigationItems.map((route) => (
              <NavLink
                className={({ isActive }) =>
                  cn(
                    "block rounded-[22px] px-4 py-3 text-sm transition",
                    isActive
                      ? "bg-white/14 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_18px_32px_-24px_rgba(0,0,0,0.9)]"
                      : "text-white/88 hover:bg-white/[0.09] hover:text-white"
                  )
                }
                end={route.path === "/app"}
                key={route.path}
                to={route.path}
              >
                <span className="block font-semibold">{route.label}</span>
                <span className="mt-1 block text-xs leading-5 text-current/72">{route.description}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto rounded-[24px] border border-white/12 bg-white/[0.07] p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/60">
              Workspace context
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/58">Tenant slug</p>
                <p className="mt-1 break-all text-sm font-semibold text-white">{hostContext.tenantSlug}</p>
              </div>
              <div className="h-px bg-white/10" />
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/58">Current host</p>
                <p className="mt-1 break-all text-xs leading-5 text-white/74">{hostContext.currentOrigin}</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 space-y-5 pb-10 pt-2">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="px-1">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--pb-color-text-subtle)]">
                Current workspace
              </p>
              <h1 className="mt-2 text-[2.6rem] font-semibold tracking-[-0.05em] text-[var(--pb-color-text)]">
                Workspace
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--pb-color-text-muted)]">
                Review binders, immutable source documents, workspace access, and lease state inside the
                current isolated tenant workspace.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden rounded-[20px] border border-[var(--pb-border-subtle)] bg-white/72 px-4 py-3 text-sm shadow-[var(--pb-shadow-card)] xl:block">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--pb-color-text-subtle)]">
                  Tenant slug
                </p>
                <p className="mt-1 font-semibold text-[var(--pb-color-text)]">{hostContext.tenantSlug}</p>
              </div>
              <Button isLoading={isLoggingOut} onClick={() => void handleLogout()} type="button" variant="secondary">
                Log out
              </Button>
            </div>
          </header>

          <div className="space-y-5">
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
