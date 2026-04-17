import {
  Fragment,
  type FormEvent,
  useEffect,
  useEffectEvent,
  useRef,
  useState
} from "react";
import {
  Link,
  NavLink,
  Outlet,
  Route,
  useLocation,
  useOutletContext,
  useParams
} from "react-router-dom";
import type React from "react";
import {
  type BinderDetail,
  type BinderPolicy,
  type BinderSummary,
  type DocumentDetail,
  type DocumentSummary,
  type PaperBinderApiClient,
  PaperBinderApiError,
  type TenantLeaseSummary,
  type TenantRole,
  type TenantUser
} from "../api/client";
import { Alert, AlertBody, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardMeta,
  CardTitle
} from "../components/ui/card";
import { Field } from "../components/ui/field";
import { StatusBadge } from "../components/ui/status-badge";
import { DataTable, type DataTableColumn, type DataTableRow } from "../components/ui/table";
import { cn } from "../lib/cn";
import type { TenantHostContext } from "./host-context";
import { tenantNavigationItems } from "./route-registry";
import {
  mapTenantHostError,
  type TenantHostErrorViewModel
} from "./tenant-host-errors";

type TenantShellOutletContext = {
  apiClient: PaperBinderApiClient;
  hostContext: TenantHostContext;
  lease: TenantLeaseSummary;
  countdownSeconds: number;
};

type TenantBootstrapViewModel = {
  title: string;
  detail: string;
  correlationId: string | null;
  retryAfterLabel: string | null;
};

type BinderFieldErrors = Partial<Record<"binderName", string>>;
type DocumentFieldErrors = Partial<
  Record<"documentTitle" | "documentContent" | "documentSupersedesDocumentId", string>
>;
type TenantUserFieldErrors = Partial<
  Record<"tenantUserEmail" | "tenantUserPassword" | "tenantUserRole", string>
>;
type BinderPolicyFieldErrors = Partial<Record<"binderPolicy", string>>;

const roleOptions: readonly TenantRole[] = ["TenantAdmin", "BinderWrite", "BinderRead"];

export type TenantHostNavigator = (redirectUrl: string) => void;

function defaultTenantHostNavigator(redirectUrl: string) {
  window.location.assign(redirectUrl);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function calculateCountdownSeconds(expiresAt: string): number {
  const millisecondsRemaining = Date.parse(expiresAt) - Date.now();
  if (!Number.isFinite(millisecondsRemaining)) {
    return 0;
  }

  return Math.max(0, Math.ceil(millisecondsRemaining / 1000));
}

function formatCountdown(seconds: number): string {
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

function formatRole(role: TenantRole): string {
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

function useTenantShellContext() {
  return useOutletContext<TenantShellOutletContext>();
}

function TenantHostErrorNotice({ error }: { error: TenantHostErrorViewModel | null }) {
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
              PaperBinder is verifying the current tenant host, session, and lease state.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

function TenantRouteFailureCard({
  error,
  action
}: {
  error: TenantHostErrorViewModel;
  action?: React.ReactNode;
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

function TenantLeaseBanner({
  lease,
  countdownSeconds,
  isExtending,
  onExtend
}: {
  lease: TenantLeaseSummary;
  countdownSeconds: number;
  isExtending: boolean;
  onExtend: () => Promise<void>;
}) {
  const variant = countdownSeconds <= 0 ? "danger" : lease.canExtend ? "warning" : "success";
  const title =
    countdownSeconds <= 0
      ? "Lease expired."
      : lease.canExtend
        ? "Lease extension window open."
        : "Lease active.";
  const detail =
    countdownSeconds <= 0
      ? "Tenant routes stay visible, but new activity will fail until an admin extends the lease or the tenant is purged."
      : lease.canExtend
        ? "The current tenant session can request a server-authoritative lease extension now."
        : "Countdown is local presentation only. Extension eligibility remains server-authoritative.";

  return (
    <Alert className="overflow-hidden" variant={variant}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <AlertTitle>{title}</AlertTitle>
          <AlertBody>{detail}</AlertBody>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[28rem]">
          <CardMeta label="Expires" value={formatDateTime(lease.expiresAt)} />
          <CardMeta label="Countdown" value={formatCountdown(countdownSeconds)} />
          <CardMeta
            label="Extensions"
            value={`${lease.extensionCount} of ${lease.maxExtensions}`}
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          disabled={!lease.canExtend && !isExtending}
          isLoading={isExtending}
          onClick={() => {
            void onExtend();
          }}
          type="button"
        >
          {lease.canExtend ? "Extend lease" : "Extend when window opens"}
        </Button>
      </div>
    </Alert>
  );
}

function TenantShell({
  apiClient,
  hostContext,
  navigator
}: {
  apiClient: PaperBinderApiClient;
  hostContext: TenantHostContext;
  navigator: TenantHostNavigator;
}) {
  const [lease, setLease] = useState<TenantLeaseSummary | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [bootstrapError, setBootstrapError] = useState<TenantBootstrapViewModel | null>(null);
  const [shellError, setShellError] = useState<TenantHostErrorViewModel | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isExtending, setIsExtending] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);
  const rootLoginUrl = toRootLoginUrl(hostContext.environment.rootUrl);

  const refreshLease = useEffectEvent(
    async ({ bootstrap = false, signal }: { bootstrap?: boolean; signal?: AbortSignal } = {}) => {
      try {
        const nextLease = await apiClient.getTenantLease(signal);
        if (signal?.aborted) {
          return;
        }

        setLease(nextLease);
        setCountdownSeconds(calculateCountdownSeconds(nextLease.expiresAt));
        setBootstrapError(null);
      } catch (error) {
        if (signal?.aborted) {
          return;
        }

        if (bootstrap || lease === null) {
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
    void refreshLease({ bootstrap: true, signal: abortController.signal });

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
    if (lease === null || isBootstrapping) {
      previousPathRef.current = location.pathname;
      return;
    }

    if (previousPathRef.current === location.pathname) {
      return;
    }

    previousPathRef.current = location.pathname;
    void refreshLease();
  }, [isBootstrapping, lease, location.pathname]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshLease();
      }
    }, 60000);

    const handleFocus = () => {
      void refreshLease();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshLease();
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

  async function handleLogout() {
    setShellError(null);
    setIsLoggingOut(true);

    try {
      await apiClient.logout();
      navigator(rootLoginUrl);
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

  if (bootstrapError !== null || lease === null) {
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
                  countdownSeconds
                } satisfies TenantShellOutletContext
              }
            />
          </main>
        </div>
      </div>
    </div>
  );
}

function DashboardPage() {
  const { apiClient, hostContext, lease, countdownSeconds } = useTenantShellContext();
  const [binders, setBinders] = useState<BinderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<TenantHostErrorViewModel | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadDashboard() {
      setIsLoading(true);

      try {
        const nextBinders = await apiClient.listBinders(abortController.signal);
        if (abortController.signal.aborted) {
          return;
        }

        setBinders(nextBinders);
        setSummaryError(null);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setSummaryError(mapTenantHostError(error));
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      abortController.abort();
    };
  }, [apiClient]);

  const visibleBinderRows = binders.slice(0, 5).map((binder) => (
    <li
      className="flex items-center justify-between gap-3 rounded-[var(--pb-radius-md)] border border-[var(--pb-color-border)] px-4 py-3"
      key={binder.binderId}
    >
      <div>
        <p className="font-medium text-[var(--pb-color-text)]">{binder.name}</p>
        <p className="text-sm text-[var(--pb-color-text-muted)]">{formatDateTime(binder.createdAt)}</p>
      </div>
      <Button asChild type="button" variant="secondary">
        <Link to={`/app/binders/${binder.binderId}`}>Open binder</Link>
      </Button>
    </li>
  ));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tenant dashboard</CardTitle>
          <CardDescription>
            Live summary content is composed from the current lease snapshot plus existing binder reads.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <CardMeta label="Tenant slug" value={hostContext.tenantSlug} />
          <CardMeta
            label="Lease state"
            value={lease.canExtend ? "Extension window open" : countdownSeconds > 0 ? "Active" : "Expired"}
          />
          <CardMeta label="Visible binders" value={isLoading ? "Loading..." : binders.length.toString()} />
          <CardMeta label="Return path" value={<code>/login</code>} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent binders</CardTitle>
            <CardDescription>
              The dashboard stays reviewer-useful without introducing a dashboard-specific backend contract.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summaryError ? (
              <TenantHostErrorNotice error={summaryError} />
            ) : isLoading ? (
              <p className="text-sm text-[var(--pb-color-text-muted)]">Loading visible binders...</p>
            ) : binders.length === 0 ? (
              <Alert variant="info">
                <AlertTitle>No visible binders yet.</AlertTitle>
                <AlertBody>
                  The current tenant session has no binders to review yet. Create one from the binders route.
                </AlertBody>
              </Alert>
            ) : (
              <ul className="space-y-3">{visibleBinderRows}</ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>
              Browser routing remains canonical and tenant-host-only actions stay inside these live routes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild type="button">
              <Link to="/app/binders">Review binders</Link>
            </Button>
            <Button asChild type="button" variant="secondary">
              <Link to="/app/users">Manage tenant users</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BindersPage() {
  const { apiClient } = useTenantShellContext();
  const [binders, setBinders] = useState<BinderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<TenantHostErrorViewModel | null>(null);
  const [binderName, setBinderName] = useState("");
  const [fieldErrors, setFieldErrors] = useState<BinderFieldErrors>({});
  const [createError, setCreateError] = useState<TenantHostErrorViewModel | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadBinders() {
      setIsLoading(true);

      try {
        const nextBinders = await apiClient.listBinders(abortController.signal);
        if (abortController.signal.aborted) {
          return;
        }

        setBinders(nextBinders);
        setPageError(null);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setPageError(mapTenantHostError(error));
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadBinders();

    return () => {
      abortController.abort();
    };
  }, [apiClient]);

  async function handleCreateBinder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!binderName.trim()) {
      setFieldErrors({ binderName: "Binder name is required." });
      setCreateError(null);
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    setCreateSuccess(null);
    setFieldErrors({});

    try {
      const createdBinder = await apiClient.createBinder({
        name: binderName.trim()
      });

      setBinders((currentBinders) => [createdBinder, ...currentBinders]);
      setBinderName("");
      setCreateSuccess(createdBinder.name);
    } catch (error) {
      const mappedError = mapTenantHostError(error);
      setCreateError(mappedError);
      setFieldErrors(
        mappedError.field === "binderName" ? { binderName: mappedError.detail } : {}
      );
    } finally {
      setIsCreating(false);
    }
  }

  if (pageError !== null) {
    return <TenantRouteFailureCard error={pageError} />;
  }

  const rows: DataTableRow[] = binders.map((binder) => ({
    key: binder.binderId,
    cells: [
      <div key={`${binder.binderId}-name`}>
        <p className="font-medium text-[var(--pb-color-text)]">{binder.name}</p>
        <p className="text-xs uppercase tracking-[0.12em] text-[var(--pb-color-text-subtle)]">
          {binder.binderId}
        </p>
      </div>,
      formatDateTime(binder.createdAt),
      <Button asChild key={`${binder.binderId}-action`} type="button" variant="secondary">
        <Link to={`/app/binders/${binder.binderId}`}>Open binder</Link>
      </Button>
    ]
  }));
  const columns: readonly DataTableColumn[] = [
    { key: "name", header: "Binder" },
    { key: "created", header: "Created" },
    { key: "actions", header: "Actions" }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Binders</CardTitle>
          <CardDescription>
            Visible binders come directly from the tenant-scoped list endpoint. Empty state is distinct
            from any forbidden or missing-tenant behavior.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create binder</CardTitle>
            <CardDescription>
              Binder creation stays inline on this route and relies on the existing `BinderWrite` API boundary.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateBinder}>
              <Field
                error={fieldErrors.binderName}
                hint="Provide a reviewer-meaningful name. Server-side validation remains authoritative."
                label="Binder name"
              >
                <input
                  disabled={isCreating}
                  onChange={(event) => {
                    setBinderName(event.target.value);
                    setFieldErrors({});
                    setCreateError(null);
                  }}
                  placeholder="Operations"
                  type="text"
                  value={binderName}
                />
              </Field>
              <TenantHostErrorNotice error={createError} />
              {createSuccess ? (
                <Alert variant="success">
                  <AlertTitle>Binder created.</AlertTitle>
                  <AlertBody>{createSuccess} is now available in the visible binder list.</AlertBody>
                </Alert>
              ) : null}
              <Button isLoading={isCreating} type="submit">
                Create binder
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visible binder list</CardTitle>
            <CardDescription>
              Server-side omission semantics remain authoritative for which binders appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              caption="Visible binders"
              columns={columns}
              emptyMessage="No binders are visible for this tenant session yet."
              isLoading={isLoading}
              loadingLabel="Loading visible binders..."
              rows={rows}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BinderPolicyCard({
  binderId
}: {
  binderId: string;
}) {
  const { apiClient } = useTenantShellContext();
  const [policy, setPolicy] = useState<BinderPolicy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<TenantHostErrorViewModel | null>(null);
  const [fieldErrors, setFieldErrors] = useState<BinderPolicyFieldErrors>({});
  const [submitError, setSubmitError] = useState<TenantHostErrorViewModel | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<BinderPolicy["mode"]>("inherit");
  const [allowedRoles, setAllowedRoles] = useState<TenantRole[]>([]);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadPolicy() {
      setIsLoading(true);

      try {
        const nextPolicy = await apiClient.getBinderPolicy(binderId, abortController.signal);
        if (abortController.signal.aborted) {
          return;
        }

        setPolicy(nextPolicy);
        setMode(nextPolicy.mode);
        setAllowedRoles(nextPolicy.allowedRoles);
        setLoadError(null);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setLoadError(mapTenantHostError(error));
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadPolicy();

    return () => {
      abortController.abort();
    };
  }, [apiClient, binderId]);

  function toggleRole(role: TenantRole, checked: boolean) {
    setAllowedRoles((currentRoles) => {
      if (checked) {
        return currentRoles.includes(role) ? currentRoles : [...currentRoles, role];
      }

      return currentRoles.filter((currentRole) => currentRole !== role);
    });
    setFieldErrors({});
    setSubmitError(null);
    setSubmitSuccess(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      mode,
      allowedRoles: mode === "inherit" ? [] : allowedRoles
    } satisfies BinderPolicy;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    setFieldErrors({});

    try {
      const updatedPolicy = await apiClient.updateBinderPolicy(binderId, payload);
      setPolicy(updatedPolicy);
      setMode(updatedPolicy.mode);
      setAllowedRoles(updatedPolicy.allowedRoles);
      setSubmitSuccess(true);
    } catch (error) {
      const mappedError = mapTenantHostError(error);
      setSubmitError(mappedError);
      setFieldErrors(
        mappedError.field === "binderPolicy" ? { binderPolicy: mappedError.detail } : {}
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Binder policy</CardTitle>
        <CardDescription>
          Tenant admins can switch between inherited access and exact-role allow lists for this binder.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-[var(--pb-color-text-muted)]">Loading binder policy...</p>
        ) : loadError ? (
          <TenantHostErrorNotice error={loadError} />
        ) : policy ? (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Field
              error={fieldErrors.binderPolicy}
              hint="Use inherited access for normal behavior, or restrict the binder to exact roles."
              label="Policy mode"
            >
              <select
                disabled={isSubmitting}
                onChange={(event) => {
                  setMode(event.target.value as BinderPolicy["mode"]);
                  setFieldErrors({});
                  setSubmitError(null);
                  setSubmitSuccess(false);
                }}
                value={mode}
              >
                <option value="inherit">Inherit tenant role access</option>
                <option value="restricted_roles">Restrict to selected roles</option>
              </select>
            </Field>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-[var(--pb-color-text)]">Allowed roles</legend>
              <p className="text-sm text-[var(--pb-color-text-muted)]">
                Exact role evaluation applies. Restricting a binder does not treat roles as interchangeable.
              </p>
              <div className="space-y-2">
                {roleOptions.map((role) => (
                  <label className="flex items-center gap-3 text-sm" key={role}>
                    <input
                      checked={allowedRoles.includes(role)}
                      className="h-4 w-4"
                      disabled={mode === "inherit" || isSubmitting}
                      onChange={(event) => toggleRole(role, event.target.checked)}
                      type="checkbox"
                    />
                    <span>{formatRole(role)}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <TenantHostErrorNotice error={submitError} />
            {submitSuccess ? (
              <Alert variant="success">
                <AlertTitle>Binder policy saved.</AlertTitle>
                <AlertBody>The binder now reflects the latest server-confirmed policy.</AlertBody>
              </Alert>
            ) : null}
            <Button isLoading={isSubmitting} type="submit">
              Save policy
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

function BinderDetailPage() {
  const { binderId = "" } = useParams();
  const { apiClient } = useTenantShellContext();
  const [binder, setBinder] = useState<BinderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<TenantHostErrorViewModel | null>(null);
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentContent, setDocumentContent] = useState("");
  const [documentSupersedesDocumentId, setDocumentSupersedesDocumentId] = useState("");
  const [fieldErrors, setFieldErrors] = useState<DocumentFieldErrors>({});
  const [createError, setCreateError] = useState<TenantHostErrorViewModel | null>(null);
  const [createdDocument, setCreatedDocument] = useState<DocumentDetail | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadBinder() {
      setIsLoading(true);

      try {
        const nextBinder = await apiClient.getBinderDetail(binderId, abortController.signal);
        if (abortController.signal.aborted) {
          return;
        }

        setBinder(nextBinder);
        setPageError(null);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setPageError(mapTenantHostError(error));
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadBinder();

    return () => {
      abortController.abort();
    };
  }, [apiClient, binderId]);

  async function handleCreateDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextFieldErrors: DocumentFieldErrors = {};
    if (!documentTitle.trim()) {
      nextFieldErrors.documentTitle = "Document title is required.";
    }

    if (!documentContent.trim()) {
      nextFieldErrors.documentContent = "Document content is required.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setCreateError(null);
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    setCreatedDocument(null);
    setFieldErrors({});

    try {
      const nextDocument = await apiClient.createDocument({
        binderId,
        title: documentTitle.trim(),
        contentType: "markdown",
        content: documentContent,
        supersedesDocumentId: documentSupersedesDocumentId || null
      });

      setCreatedDocument(nextDocument);
      setDocumentTitle("");
      setDocumentContent("");
      setDocumentSupersedesDocumentId("");
      setBinder((currentBinder) => {
        if (currentBinder === null) {
          return currentBinder;
        }

        const nextSummary: DocumentSummary = {
          documentId: nextDocument.documentId,
          binderId: nextDocument.binderId,
          title: nextDocument.title,
          contentType: nextDocument.contentType,
          supersedesDocumentId: nextDocument.supersedesDocumentId,
          createdAt: nextDocument.createdAt,
          archivedAt: nextDocument.archivedAt
        };

        return {
          ...currentBinder,
          documents: [nextSummary, ...currentBinder.documents]
        };
      });
    } catch (error) {
      const mappedError = mapTenantHostError(error);
      setCreateError(mappedError);
      setFieldErrors(
        mappedError.field === "documentTitle"
          ? { documentTitle: mappedError.detail }
          : mappedError.field === "documentContent"
            ? { documentContent: mappedError.detail }
            : mappedError.field === "documentSupersedesDocumentId"
              ? { documentSupersedesDocumentId: mappedError.detail }
              : {}
      );
    } finally {
      setIsCreating(false);
    }
  }

  if (pageError !== null) {
    return (
      <TenantRouteFailureCard
        action={
          <Button asChild type="button" variant="secondary">
            <Link to="/app/binders">Back to binders</Link>
          </Button>
        }
        error={pageError}
      />
    );
  }

  if (isLoading || binder === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading binder</CardTitle>
          <CardDescription>PaperBinder is resolving binder detail and visible documents.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const documentColumns: readonly DataTableColumn[] = [
    { key: "title", header: "Document" },
    { key: "created", header: "Created" },
    { key: "supersedes", header: "Supersedes" },
    { key: "actions", header: "Actions" }
  ];
  const documentRows: DataTableRow[] = binder.documents.map((document) => ({
    key: document.documentId,
    cells: [
      <div key={`${document.documentId}-title`}>
        <p className="font-medium text-[var(--pb-color-text)]">{document.title}</p>
        <p className="text-sm text-[var(--pb-color-text-muted)]">{document.contentType}</p>
      </div>,
      formatDateTime(document.createdAt),
      document.supersedesDocumentId ? (
        <span className="font-mono text-xs text-[var(--pb-color-text-muted)]">
          {document.supersedesDocumentId}
        </span>
      ) : (
        "None"
      ),
      <Button asChild key={`${document.documentId}-action`} type="button" variant="secondary">
        <Link to={`/app/documents/${document.documentId}`}>Open document</Link>
      </Button>
    ]
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{binder.name}</CardTitle>
          <CardDescription>
            Binder detail combines live binder metadata with the visible document summaries exposed by the current contract.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <CardMeta label="Binder id" value={<span className="font-mono text-xs">{binder.binderId}</span>} />
          <CardMeta label="Created" value={formatDateTime(binder.createdAt)} />
          <CardMeta label="Visible documents" value={binder.documents.length.toString()} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Visible documents</CardTitle>
            <CardDescription>
              Archived documents remain hidden from binder detail and stay readable only by direct document id.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              caption="Visible binder documents"
              columns={documentColumns}
              emptyMessage="No visible documents exist in this binder yet."
              rows={documentRows}
            />
          </CardContent>
        </Card>

        <BinderPolicyCard binderId={binderId} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create document</CardTitle>
          <CardDescription>
            Document creation stays within the binder route and submits the current route binder id through the shared client.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleCreateDocument}>
            <Field
              error={fieldErrors.documentTitle}
              hint="PaperBinder v1 keeps document titles between 1 and 200 characters."
              label="Document title"
            >
              <input
                disabled={isCreating}
                onChange={(event) => {
                  setDocumentTitle(event.target.value);
                  setFieldErrors((currentErrors) => ({
                    ...currentErrors,
                    documentTitle: undefined
                  }));
                  setCreateError(null);
                }}
                placeholder="Security handbook"
                type="text"
                value={documentTitle}
              />
            </Field>
            <Field
              error={fieldErrors.documentContent}
              hint="Markdown only. Content stays immutable after creation in v1."
              label="Markdown content"
            >
              <textarea
                className="min-h-48"
                disabled={isCreating}
                onChange={(event) => {
                  setDocumentContent(event.target.value);
                  setFieldErrors((currentErrors) => ({
                    ...currentErrors,
                    documentContent: undefined
                  }));
                  setCreateError(null);
                }}
                placeholder="# Operations handbook"
                value={documentContent}
              />
            </Field>
            <Field
              error={fieldErrors.documentSupersedesDocumentId}
              hint="Optional. Choose a visible document that this new version supersedes."
              label="Supersedes"
            >
              <select
                disabled={isCreating}
                onChange={(event) => {
                  setDocumentSupersedesDocumentId(event.target.value);
                  setFieldErrors((currentErrors) => ({
                    ...currentErrors,
                    documentSupersedesDocumentId: undefined
                  }));
                  setCreateError(null);
                }}
                value={documentSupersedesDocumentId}
              >
                <option value="">No superseded document</option>
                {binder.documents.map((document) => (
                  <option key={document.documentId} value={document.documentId}>
                    {document.title}
                  </option>
                ))}
              </select>
            </Field>
            <TenantHostErrorNotice error={createError} />
            {createdDocument ? (
              <Alert variant="success">
                <AlertTitle>Document created.</AlertTitle>
                <AlertBody>{createdDocument.title} is now available in this binder.</AlertBody>
                <div className="mt-3">
                  <Button asChild type="button" variant="secondary">
                    <Link to={`/app/documents/${createdDocument.documentId}`}>Open document</Link>
                  </Button>
                </div>
              </Alert>
            ) : null}
            <Button isLoading={isCreating} type="submit">
              Create document
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function DocumentDetailPage() {
  const { documentId = "" } = useParams();
  const { apiClient } = useTenantShellContext();
  const [documentDetail, setDocumentDetail] = useState<DocumentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<TenantHostErrorViewModel | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadDocument() {
      setIsLoading(true);

      try {
        const nextDocument = await apiClient.getDocumentDetail(documentId, abortController.signal);
        if (abortController.signal.aborted) {
          return;
        }

        setDocumentDetail(nextDocument);
        setPageError(null);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setPageError(mapTenantHostError(error));
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadDocument();

    return () => {
      abortController.abort();
    };
  }, [apiClient, documentId]);

  if (pageError !== null) {
    return <TenantRouteFailureCard error={pageError} />;
  }

  if (isLoading || documentDetail === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading document</CardTitle>
          <CardDescription>PaperBinder is resolving the read-only document view.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <CardTitle>{documentDetail.title}</CardTitle>
              <CardDescription>
                Document detail is read-only in v1 and reflects the current server contract directly.
              </CardDescription>
            </div>
            <StatusBadge variant={documentDetail.archivedAt ? "warning" : "success"}>
              {documentDetail.archivedAt ? "Archived" : "Active"}
            </StatusBadge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <CardMeta label="Document id" value={<span className="font-mono text-xs">{documentDetail.documentId}</span>} />
          <CardMeta label="Binder id" value={<span className="font-mono text-xs">{documentDetail.binderId}</span>} />
          <CardMeta label="Created" value={formatDateTime(documentDetail.createdAt)} />
          <CardMeta
            label="Supersedes"
            value={
              documentDetail.supersedesDocumentId ? (
                <span className="font-mono text-xs">{documentDetail.supersedesDocumentId}</span>
              ) : (
                "None"
              )
            }
          />
        </CardContent>
        {documentDetail.archivedAt ? (
          <CardFooter>
            <Alert className="w-full" variant="warning">
              <AlertTitle>Archived document visible by direct id.</AlertTitle>
              <AlertBody>
                Binder detail hides archived documents, but direct reads remain available to allowed callers.
              </AlertBody>
            </Alert>
          </CardFooter>
        ) : null}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Markdown source</CardTitle>
          <CardDescription>
            CP14 keeps document rendering dependency-free and avoids raw HTML injection by showing safe markdown source.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-[var(--pb-radius-md)] bg-[var(--pb-color-panel-muted)] px-4 py-4 text-sm leading-7 whitespace-pre-wrap">
            {documentDetail.content}
          </pre>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button asChild type="button" variant="secondary">
          <Link to={`/app/binders/${documentDetail.binderId}`}>Back to binder</Link>
        </Button>
      </div>
    </div>
  );
}

function UsersPage() {
  const { apiClient } = useTenantShellContext();
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<TenantHostErrorViewModel | null>(null);
  const [tenantUserEmail, setTenantUserEmail] = useState("");
  const [tenantUserPassword, setTenantUserPassword] = useState("");
  const [tenantUserRole, setTenantUserRole] = useState<TenantRole>("BinderRead");
  const [fieldErrors, setFieldErrors] = useState<TenantUserFieldErrors>({});
  const [createError, setCreateError] = useState<TenantHostErrorViewModel | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, TenantRole>>({});
  const [roleUpdateError, setRoleUpdateError] = useState<TenantHostErrorViewModel | null>(null);
  const [isRoleUpdatingForUserId, setIsRoleUpdatingForUserId] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadUsers() {
      setIsLoading(true);

      try {
        const nextUsers = await apiClient.listTenantUsers(abortController.signal);
        if (abortController.signal.aborted) {
          return;
        }

        setUsers(nextUsers);
        setRoleDrafts(Object.fromEntries(nextUsers.map((user) => [user.userId, user.role])));
        setPageError(null);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setPageError(mapTenantHostError(error));
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadUsers();

    return () => {
      abortController.abort();
    };
  }, [apiClient]);

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextFieldErrors: TenantUserFieldErrors = {};
    if (!tenantUserEmail.trim()) {
      nextFieldErrors.tenantUserEmail = "Email is required.";
    }

    if (!tenantUserPassword.trim()) {
      nextFieldErrors.tenantUserPassword = "Password is required.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setCreateError(null);
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    setCreateSuccess(null);
    setFieldErrors({});

    try {
      const createdUser = await apiClient.createTenantUser({
        email: tenantUserEmail.trim(),
        password: tenantUserPassword,
        role: tenantUserRole
      });

      setUsers((currentUsers) => [...currentUsers, createdUser]);
      setRoleDrafts((currentDrafts) => ({
        ...currentDrafts,
        [createdUser.userId]: createdUser.role
      }));
      setCreateSuccess(createdUser.email);
      setTenantUserEmail("");
      setTenantUserPassword("");
      setTenantUserRole("BinderRead");
    } catch (error) {
      const mappedError = mapTenantHostError(error);
      setCreateError(mappedError);
      setFieldErrors(
        mappedError.field === "tenantUserEmail"
          ? { tenantUserEmail: mappedError.detail }
          : mappedError.field === "tenantUserPassword"
            ? { tenantUserPassword: mappedError.detail }
            : mappedError.field === "tenantUserRole"
              ? { tenantUserRole: mappedError.detail }
              : {}
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRoleChange(userId: string) {
    const nextRole = roleDrafts[userId];
    if (!nextRole) {
      return;
    }

    setRoleUpdateError(null);
    setIsRoleUpdatingForUserId(userId);

    try {
      const updatedUser = await apiClient.updateTenantUserRole(userId, {
        role: nextRole
      });

      setUsers((currentUsers) =>
        currentUsers.map((user) => (user.userId === updatedUser.userId ? updatedUser : user))
      );
      setRoleDrafts((currentDrafts) => ({
        ...currentDrafts,
        [updatedUser.userId]: updatedUser.role
      }));
    } catch (error) {
      setRoleUpdateError(mapTenantHostError(error));
    } finally {
      setIsRoleUpdatingForUserId(null);
    }
  }

  if (pageError !== null) {
    return <TenantRouteFailureCard error={pageError} />;
  }

  const columns: readonly DataTableColumn[] = [
    { key: "email", header: "Email" },
    { key: "role", header: "Role" },
    { key: "ownership", header: "Ownership" },
    { key: "actions", header: "Actions" }
  ];
  const rows: DataTableRow[] = users.map((user) => ({
    key: user.userId,
    cells: [
      <div key={`${user.userId}-email`}>
        <p className="font-medium text-[var(--pb-color-text)]">{user.email}</p>
        <p className="text-xs uppercase tracking-[0.12em] text-[var(--pb-color-text-subtle)]">
          {user.userId}
        </p>
      </div>,
      <select
        aria-label={`Role for ${user.email}`}
        disabled={isRoleUpdatingForUserId === user.userId}
        key={`${user.userId}-role`}
        onChange={(event) => {
          setRoleDrafts((currentDrafts) => ({
            ...currentDrafts,
            [user.userId]: event.target.value as TenantRole
          }));
          setRoleUpdateError(null);
        }}
        value={roleDrafts[user.userId] ?? user.role}
      >
        {roleOptions.map((role) => (
          <option key={role} value={role}>
            {formatRole(role)}
          </option>
        ))}
      </select>,
      user.isOwner ? <StatusBadge key={`${user.userId}-owner`}>Owner</StatusBadge> : "Member",
      <Button
        isLoading={isRoleUpdatingForUserId === user.userId}
        key={`${user.userId}-action`}
        onClick={() => void handleRoleChange(user.userId)}
        type="button"
        variant="secondary"
      >
        Save role
      </Button>
    ]
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tenant users</CardTitle>
          <CardDescription>
            Tenant-admin user management stays on this route and submits only the existing user and role contracts.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create tenant user</CardTitle>
            <CardDescription>
              Provide the email, initial password, and role. The browser does not add delete or reset flows in CP14.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateUser}>
              <Field
                error={fieldErrors.tenantUserEmail}
                hint="Email is the canonical v1 identity label."
                label="Email"
              >
                <input
                  disabled={isCreating}
                  onChange={(event) => {
                    setTenantUserEmail(event.target.value);
                    setFieldErrors((currentErrors) => ({
                      ...currentErrors,
                      tenantUserEmail: undefined
                    }));
                    setCreateError(null);
                  }}
                  placeholder="member@tenant.local"
                  type="email"
                  value={tenantUserEmail}
                />
              </Field>
              <Field
                error={fieldErrors.tenantUserPassword}
                hint="Password validation remains server-authoritative."
                label="Temporary password"
              >
                <input
                  disabled={isCreating}
                  onChange={(event) => {
                    setTenantUserPassword(event.target.value);
                    setFieldErrors((currentErrors) => ({
                      ...currentErrors,
                      tenantUserPassword: undefined
                    }));
                    setCreateError(null);
                  }}
                  placeholder="Generated-on-request"
                  type="password"
                  value={tenantUserPassword}
                />
              </Field>
              <Field
                error={fieldErrors.tenantUserRole}
                hint="Each tenant member has one role in v1."
                label="Role"
              >
                <select
                  disabled={isCreating}
                  onChange={(event) => {
                    setTenantUserRole(event.target.value as TenantRole);
                    setFieldErrors((currentErrors) => ({
                      ...currentErrors,
                      tenantUserRole: undefined
                    }));
                    setCreateError(null);
                  }}
                  value={tenantUserRole}
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {formatRole(role)}
                    </option>
                  ))}
                </select>
              </Field>
              <TenantHostErrorNotice error={createError} />
              {createSuccess ? (
                <Alert variant="success">
                  <AlertTitle>Tenant user created.</AlertTitle>
                  <AlertBody>{createSuccess} was added to this tenant.</AlertBody>
                </Alert>
              ) : null}
              <Button isLoading={isCreating} type="submit">
                Create tenant user
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current tenant users</CardTitle>
            <CardDescription>
              Role changes remain subject to the server-side last-admin guard and tenant boundary checks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TenantHostErrorNotice error={roleUpdateError} />
            <DataTable
              caption="Tenant users"
              columns={columns}
              emptyMessage="No tenant users are available."
              isLoading={isLoading}
              loadingLabel="Loading tenant users..."
              rows={rows}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TenantNotFoundPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Route not available on this tenant host</CardTitle>
        <CardDescription>
          Unknown tenant-host routes stay inside the current tenant shell and do not infer new tenant identity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="warning">
          <AlertTitle>Known tenant routes</AlertTitle>
          <AlertBody>
            <code>/app</code>, <code>/app/binders</code>, <code>/app/binders/:binderId</code>,{" "}
            <code>/app/documents/:documentId</code>, and <code>/app/users</code> are the canonical tenant-host routes.
          </AlertBody>
        </Alert>
      </CardContent>
    </Card>
  );
}

export function TenantHostRoutes({
  apiClient,
  hostContext,
  navigator = defaultTenantHostNavigator
}: {
  apiClient: PaperBinderApiClient;
  hostContext: TenantHostContext;
  navigator?: TenantHostNavigator;
}) {
  return (
    <Fragment>
      <Route element={<TenantShell apiClient={apiClient} hostContext={hostContext} navigator={navigator} />}>
        <Route element={<DashboardPage />} path="/app" />
        <Route element={<BindersPage />} path="/app/binders" />
        <Route element={<BinderDetailPage />} path="/app/binders/:binderId" />
        <Route element={<DocumentDetailPage />} path="/app/documents/:documentId" />
        <Route element={<UsersPage />} path="/app/users" />
        <Route element={<TenantNotFoundPage />} path="*" />
      </Route>
    </Fragment>
  );
}
