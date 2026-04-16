import { startTransition, useEffect, useState, type ReactNode } from "react";
import { NavLink, Outlet, Route, useParams } from "react-router-dom";
import type { PaperBinderApiClient, TenantLeaseSummary } from "../api/client";
import { PaperBinderApiError } from "../api/client";
import { Alert, AlertBody, AlertTitle } from "../components/ui/alert";
import { Banner } from "../components/ui/banner";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardMeta,
  CardTitle
} from "../components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from "../components/ui/dialog";
import { DataTable, type DataTableRow } from "../components/ui/table";
import { StatusBadge } from "../components/ui/status-badge";
import { cn } from "../lib/cn";
import type { TenantHostContext } from "./host-context";
import { tenantNavigationItems } from "./route-registry";

type TenantBootstrapState =
  | { status: "loading" }
  | { status: "ready"; lease: TenantLeaseSummary }
  | { status: "unauthorized"; error: PaperBinderApiError }
  | { status: "forbidden"; error: PaperBinderApiError }
  | { status: "expired"; error: PaperBinderApiError }
  | { status: "not-found"; error: PaperBinderApiError }
  | { status: "error"; error: PaperBinderApiError };

function classifyTenantBootstrapError(error: PaperBinderApiError): TenantBootstrapState {
  switch (error.status) {
    case 401:
      return { status: "unauthorized", error };
    case 403:
      return { status: "forbidden", error };
    case 404:
      return { status: "not-found", error };
    case 410:
      return { status: "expired", error };
    default:
      return { status: "error", error };
  }
}

function formatLeaseRemaining(secondsRemaining: number): string {
  const minutes = Math.max(1, Math.ceil(secondsRemaining / 60));
  return `${minutes} min remaining`;
}

function formatLeaseTimestamp(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function useTenantBootstrap(apiClient: PaperBinderApiClient) {
  const [state, setState] = useState<TenantBootstrapState>({ status: "loading" });

  useEffect(() => {
    const abortController = new AbortController();

    void apiClient
      .getTenantLease(abortController.signal)
      .then((lease) => {
        if (abortController.signal.aborted) {
          return;
        }

        startTransition(() => {
          setState({ status: "ready", lease });
        });
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }

        const clientError =
          error instanceof PaperBinderApiError
            ? error
            : new PaperBinderApiError({
                message: "Unexpected tenant bootstrap failure.",
                status: null,
                errorCode: null,
                detail: error instanceof Error ? error.message : "Unexpected tenant bootstrap failure.",
                correlationId: null,
                retryAfterSeconds: null,
                traceId: null,
                validationErrors: null
              });

        startTransition(() => {
          setState(classifyTenantBootstrapError(clientError));
        });
      });

    return () => {
      abortController.abort();
    };
  }, [apiClient]);

  return state;
}

function TenantShellFrame({
  hostContext,
  banner,
  sidebar,
  children
}: {
  hostContext: TenantHostContext;
  banner: ReactNode;
  sidebar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--pb-surface-gradient)] text-[var(--pb-color-text)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 lg:px-10">
        <header className="rounded-[var(--pb-radius-lg)] border border-white/70 bg-white/88 px-6 py-5 shadow-[var(--pb-shadow-card)] backdrop-blur">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--pb-color-text-subtle)]">
                Tenant host
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-[-0.03em]">{hostContext.tenantSlug}</h1>
                <StatusBadge variant="neutral">host-derived</StatusBadge>
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--pb-color-text-muted)]">
                Tenant identity is derived from the current host and remains server-authoritative. CP12 boots the shell
                with the lease endpoint only.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-[var(--pb-color-text-muted)] sm:grid-cols-2">
              <div className="rounded-[var(--pb-radius-md)] bg-[var(--pb-color-panel-muted)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--pb-color-text-subtle)]">Current host</p>
                <p className="mt-2 font-medium text-[var(--pb-color-text)]">{hostContext.currentHost}</p>
              </div>
              <div className="rounded-[var(--pb-radius-md)] bg-[var(--pb-color-panel-muted)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--pb-color-text-subtle)]">Canonical app</p>
                <p className="mt-2 font-medium text-[var(--pb-color-text)]">/app</p>
              </div>
            </div>
          </div>
        </header>

        <div className="mt-4">{banner}</div>

        <div className="mt-6 grid flex-1 gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="rounded-[var(--pb-radius-lg)] border border-white/70 bg-white/80 p-4 shadow-[var(--pb-shadow-card)] backdrop-blur">
            {sidebar}
          </aside>
          <main className="pb-10">{children}</main>
        </div>
      </div>
    </div>
  );
}

function TenantNavigation() {
  return (
    <nav aria-label="Tenant navigation" className="space-y-1">
      {tenantNavigationItems.map((item) => (
        <NavLink
          className={({ isActive }) =>
            cn(
              "block rounded-[var(--pb-radius-md)] px-4 py-3 text-sm transition",
              isActive
                ? "bg-[var(--pb-color-text)] text-white"
                : "text-[var(--pb-color-text-muted)] hover:bg-[var(--pb-color-panel-muted)] hover:text-[var(--pb-color-text)]"
            )
          }
          end={item.path === "/app"}
          key={item.path}
          to={item.path}
        >
          <span className="block font-semibold">{item.label}</span>
          <span className="mt-1 block text-xs opacity-80">{item.description}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function TenantSafeState({
  hostContext,
  title,
  description,
  badge,
  alert,
  error
}: {
  hostContext: TenantHostContext;
  title: string;
  description: string;
  badge: ReactNode;
  alert: ReactNode;
  error?: PaperBinderApiError;
}) {
  return (
    <TenantShellFrame
      banner={<Banner variant="warning">{alert}</Banner>}
      hostContext={hostContext}
      sidebar={<TenantNavigation />}
    >
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle>{title}</CardTitle>
            {badge}
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="warning">
              <AlertTitle>ProblemDetails summary</AlertTitle>
              <AlertBody>
                <span className="font-semibold">Error code:</span> {error.errorCode ?? "unknown"}.
                {error.correlationId ? (
                  <span className="ml-2 font-mono text-xs uppercase tracking-[0.08em]">
                    correlation {error.correlationId}
                  </span>
                ) : null}
              </AlertBody>
            </Alert>
          ) : (
            <Alert variant="info">
              <AlertTitle>Loading tenant shell</AlertTitle>
              <AlertBody>
                The shared API client is establishing auth-aware shell state through <code>GET /api/tenant/lease</code>.
              </AlertBody>
            </Alert>
          )}
        </CardContent>
      </Card>
    </TenantShellFrame>
  );
}

function TenantShell({
  apiClient,
  hostContext
}: {
  apiClient: PaperBinderApiClient;
  hostContext: TenantHostContext;
}) {
  const bootstrapState = useTenantBootstrap(apiClient);

  if (bootstrapState.status === "loading") {
    return (
      <TenantSafeState
        alert="Tenant-shell bootstrap is in progress. Later checkpoints reuse this same shell slot for lease messaging."
        badge={<StatusBadge variant="neutral">loading</StatusBadge>}
        description="The shared API client is retrieving one safe tenant bootstrap snapshot before placeholder views render."
        hostContext={hostContext}
        title="Loading tenant shell"
      />
    );
  }

  if (bootstrapState.status === "unauthorized") {
    return (
      <TenantSafeState
        alert="The browser session is not authenticated for this tenant host."
        badge={<StatusBadge variant="warning">sign-in required</StatusBadge>}
        description="CP12 does not implement redirect handling or login submission here, but the shell now has a safe unauthorized state."
        error={bootstrapState.error}
        hostContext={hostContext}
        title="Authentication required"
      />
    );
  }

  if (bootstrapState.status === "forbidden") {
    return (
      <TenantSafeState
        alert="The current user does not have access to this tenant shell."
        badge={<StatusBadge variant="danger">forbidden</StatusBadge>}
        description="Tenant membership and role checks remain enforced at the API boundary even when the SPA is only rendering placeholders."
        error={bootstrapState.error}
        hostContext={hostContext}
        title="Tenant access denied"
      />
    );
  }

  if (bootstrapState.status === "expired") {
    return (
      <TenantSafeState
        alert="This tenant has expired. CP12 surfaces the safe expired state without implementing the later lease-extension UI."
        badge={<StatusBadge variant="danger">expired</StatusBadge>}
        description="The tenant shell preserves the host boundary and shows a generic expired message instead of leaking implementation details."
        error={bootstrapState.error}
        hostContext={hostContext}
        title="Tenant expired"
      />
    );
  }

  if (bootstrapState.status === "not-found") {
    return (
      <TenantSafeState
        alert="The current host does not resolve to an active tenant."
        badge={<StatusBadge variant="warning">not found</StatusBadge>}
        description="Unknown or purged tenant hosts continue to fail safely before any feature-specific data calls run."
        error={bootstrapState.error}
        hostContext={hostContext}
        title="Tenant not found"
      />
    );
  }

  if (bootstrapState.status === "error") {
    return (
      <TenantSafeState
        alert="The tenant shell could not complete its bootstrap call."
        badge={<StatusBadge variant="warning">error</StatusBadge>}
        description="Unexpected failures still surface a correlation-friendly, ProblemDetails-aware generic state."
        error={bootstrapState.error}
        hostContext={hostContext}
        title="Tenant shell unavailable"
      />
    );
  }

  const bannerVariant = bootstrapState.lease.canExtend ? "warning" : "notice";
  const badgeVariant = bootstrapState.lease.canExtend ? "warning" : "success";

  return (
    <TenantShellFrame
      banner={
        <Banner variant={bannerVariant}>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge variant={badgeVariant}>
                {bootstrapState.lease.canExtend ? "extension window open" : "lease active"}
              </StatusBadge>
              <span>
                Lease snapshot: {formatLeaseRemaining(bootstrapState.lease.secondsRemaining)}. Countdown and extend
                interaction remain deferred to CP14.
              </span>
            </div>
            <span className="font-medium">
              Expires {formatLeaseTimestamp(bootstrapState.lease.expiresAt)}
            </span>
          </div>
        </Banner>
      }
      hostContext={hostContext}
      sidebar={<TenantNavigation />}
    >
      <Outlet />
    </TenantShellFrame>
  );
}

function TenantDashboardPage({ hostContext }: { hostContext: TenantHostContext }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tenant dashboard placeholder</CardTitle>
          <CardDescription>
            The dashboard route now exists with shell context, lease visibility, and shared primitive composition. Real
            binder and document summaries stay deferred to CP14.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <CardMeta label="Tenant slug" value={hostContext.tenantSlug} />
          <CardMeta label="Shell route" value="/app" />
          <CardMeta label="Bootstrap seam" value="GET /api/tenant/lease" />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Next product checkpoints</CardTitle>
            <CardDescription>CP12 leaves later user flows untouched on purpose.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm leading-6 text-[var(--pb-color-text-muted)]">
              <li>CP13 wires provisioning and login from the root host.</li>
              <li>CP14 wires dashboard, binders, documents, users, and lease interactions on tenant hosts.</li>
              <li>CP12 only guarantees the shells, client plumbing, and primitive baseline those checkpoints build on.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dialog primitive preview</CardTitle>
            <CardDescription>
              Dialog support is part of the CP12 baseline even though no destructive feature actions ship yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" variant="secondary">
                  Open checkpoint notes
                </Button>
              </DialogTrigger>
              <DialogContent
                description="This modal demonstrates the shared dialog primitive rather than a feature-specific workflow."
                title="Tenant-shell checkpoint notes"
              >
                <p className="text-sm leading-6 text-[var(--pb-color-text-muted)]">
                  Route placeholders intentionally avoid binder, document, user, and lease mutation calls. The shared
                  shell and primitives are the real deliverable here.
                </p>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">
                      Close notes
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TenantBindersPage() {
  const rows: DataTableRow[] = [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Binder list placeholder</CardTitle>
        <CardDescription>
          The canonical <code>/app/binders</code> route now renders inside the tenant shell with the shared table
          primitive.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          caption="Binders placeholder table"
          columns={[
            { key: "name", header: "Binder name" },
            { key: "documents", header: "Document count" },
            { key: "created", header: "Created" }
          ]}
          emptyMessage="No binders are rendered in CP12. The table is here so CP14 can wire real tenant-scoped data without replacing the primitive."
          rows={rows}
        />
      </CardContent>
    </Card>
  );
}

function TenantBinderDetailPage() {
  const { binderId } = useParams();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Binder detail placeholder</CardTitle>
        <CardDescription>
          CP12 reserves the canonical binder-detail route and shows the current route parameter without performing the
          later feature read.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="info">
          <AlertTitle>Route parameter captured</AlertTitle>
          <AlertBody>
            Binder id <span className="font-mono text-xs uppercase tracking-[0.08em]">{binderId}</span> is available
            for the later CP14 detail view.
          </AlertBody>
        </Alert>
      </CardContent>
    </Card>
  );
}

function TenantDocumentDetailPage() {
  const { documentId } = useParams();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document detail placeholder</CardTitle>
        <CardDescription>
          The document route exists now so future read-only document rendering can land on top of the shared shell,
          error model, and placeholder state handling.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="info">
          <AlertTitle>Document route reserved</AlertTitle>
          <AlertBody>
            Document id <span className="font-mono text-xs uppercase tracking-[0.08em]">{documentId}</span> is held in
            the route map, but document data fetching stays out of CP12.
          </AlertBody>
        </Alert>
      </CardContent>
    </Card>
  );
}

function TenantUsersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tenant users placeholder</CardTitle>
        <CardDescription>
          This route stays admin-focused and placeholder-only until CP14 wires the real user-management flows.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          caption="Tenant users placeholder table"
          columns={[
            { key: "user", header: "User" },
            { key: "role", header: "Role" },
            { key: "status", header: "Status" }
          ]}
          emptyMessage="User rows are intentionally deferred. CP12 only proves the route, shell, and table baseline."
          rows={[]}
        />
      </CardContent>
    </Card>
  );
}

function TenantNotFoundPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Route not available on this tenant host</CardTitle>
        <CardDescription>
          Unknown tenant-host routes stay local to the tenant shell. The SPA does not redirect across host contexts to
          compensate for invalid paths.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="warning">
          <AlertTitle>Known tenant routes</AlertTitle>
          <AlertBody>
            <code>/app</code>, <code>/app/binders</code>, <code>/app/binders/:binderId</code>,{" "}
            <code>/app/documents/:documentId</code>, and <code>/app/users</code>.
          </AlertBody>
        </Alert>
      </CardContent>
    </Card>
  );
}

export function TenantHostRoutes({
  apiClient,
  hostContext
}: {
  apiClient: PaperBinderApiClient;
  hostContext: TenantHostContext;
}) {
  return (
    <>
      <Route element={<TenantShell apiClient={apiClient} hostContext={hostContext} />}>
        <Route element={<TenantDashboardPage hostContext={hostContext} />} path="/app" />
        <Route element={<TenantBindersPage />} path="/app/binders" />
        <Route element={<TenantBinderDetailPage />} path="/app/binders/:binderId" />
        <Route element={<TenantDocumentDetailPage />} path="/app/documents/:documentId" />
        <Route element={<TenantUsersPage />} path="/app/users" />
        <Route element={<TenantNotFoundPage />} path="*" />
      </Route>
    </>
  );
}
