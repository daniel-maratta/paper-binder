import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { BinderSummary } from "../api/client";
import { Alert, AlertBody, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardMeta, CardTitle } from "../components/ui/card";
import type { TenantHostErrorViewModel } from "./tenant-host-errors";
import { mapTenantHostError } from "./tenant-host-errors";
import { TenantHostErrorNotice, formatDateTime, useTenantShellContext } from "./tenant-shell";

export function DashboardPage() {
  const { apiClient, hostContext, lease, countdownSeconds, impersonation } = useTenantShellContext();
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
  }, [apiClient, impersonation.effective.userId]);

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
