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

function createBootstrapViewModel(error: unknown): TenantBootstrapViewModel {
  if (error instanceof PaperBinderApiError) {
    switch (error.errorCode) {
      case "AUTHENTICATION_REQUIRED":
        return {
          title: "Authentication required",
          detail: error.detail ?? "Log in again from the root host before returning to this tenant.",
          correlationId: error.correlationId,
          retryAfterLabel: null
        };
      case "TENANT_FORBIDDEN":
        return {
          title: "Tenant access denied",
          detail: error.detail ?? "This tenant session is not allowed to access the requested tenant host.",
          correlationId: error.correlationId,
          retryAfterLabel: null
        };
      case "TENANT_EXPIRED":
        return {
          title: "Tenant expired",
          detail: error.detail ?? "This demo tenant has expired and can no longer serve tenant-host requests.",
          correlationId: error.correlationId,
          retryAfterLabel: null
        };
      case "TENANT_NOT_FOUND":
        return {
          title: "Tenant not found",
          detail: error.detail ?? "The current tenant host no longer resolves to an active demo tenant.",
          correlationId: error.correlationId,
          retryAfterLabel: null
        };
      default: {
        const mappedError = mapTenantHostError(error);
        return {
          title: error.status === 401 ? "Authentication required" : "Tenant host could not be loaded",
          detail: mappedError.detail,
          correlationId: mappedError.correlationId,
          retryAfterLabel: mappedError.retryAfterLabel
        };
      }
    }
  }

  return {
    title: "Tenant host could not be loaded",
    detail: "PaperBinder could not load the tenant shell. Check the local stack and retry.",
    correlationId: null,
    retryAfterLabel: null
  };
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
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 lg:px-10">
        <header className="flex flex-col gap-4 rounded-[var(--pb-radius-lg)] border border-white/70 bg-white/85 px-6 py-5 shadow-[var(--pb-shadow-card)] backdrop-blur lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--pb-color-text-subtle)]">
              PaperBinder
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">Tenant workspace</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--pb-color-text-muted)]">
              Authenticated tenant-host flows stay inside the single SPA, rely on server-authoritative
              route contracts, and use the shared API client for every `/api/*` request.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="rounded-[var(--pb-radius-md)] bg-[var(--pb-color-panel-muted)] px-4 py-3 text-sm text-[var(--pb-color-text-muted)]">
              <p className="font-semibold text-[var(--pb-color-text)]">Tenant host</p>
              <p className="mt-1 break-all">{hostContext.currentOrigin}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--pb-color-text-subtle)]">
                {hostContext.tenantSlug}
              </p>
            </div>
            <Button isLoading={isLoggingOut} onClick={() => void handleLogout()} type="button" variant="secondary">
              Log out
            </Button>
          </div>
        </header>

        <div className="mt-6 grid flex-1 gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="space-y-4 rounded-[var(--pb-radius-lg)] border border-white/70 bg-white/80 p-4 shadow-[var(--pb-shadow-card)] backdrop-blur">
            <nav aria-label="Tenant host navigation" className="space-y-1">
              {tenantNavigationItems.map((route) => (
                <NavLink
                  className={({ isActive }) =>
                    cn(
                      "block rounded-[var(--pb-radius-md)] px-4 py-3 text-sm transition",
                      isActive
                        ? "bg-[var(--pb-color-primary)] text-white"
                        : "text-[var(--pb-color-text-muted)] hover:bg-[var(--pb-color-panel-muted)] hover:text-[var(--pb-color-text)]"
                    )
                  }
                  end={route.path === "/app"}
                  key={route.path}
                  to={route.path}
                >
                  <span className="block font-semibold">{route.label}</span>
                  <span className="mt-1 block text-xs opacity-80">{route.description}</span>
                </NavLink>
              ))}
            </nav>

            <Card className="border-none bg-[var(--pb-color-panel-muted)] p-4 shadow-none">
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">Tenant boundary</CardTitle>
                <CardDescription>
                  Tenant identity comes from the current host and stays immutable for the request.
                </CardDescription>
              </CardHeader>
            </Card>
          </aside>

          <main className="space-y-6 pb-10">
            <TenantImpersonationBanner
              impersonation={impersonation}
              isStopping={isStoppingImpersonation}
              onStop={handleStopImpersonation}
            />
            <TenantLeaseBanner
              countdownSeconds={countdownSeconds}
              isExtending={isExtending}
              lease={lease}
              onExtend={handleExtendLease}
            />
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
          </main>
        </div>
      </div>
    </div>
  );
}
