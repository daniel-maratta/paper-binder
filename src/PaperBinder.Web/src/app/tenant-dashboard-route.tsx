import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { BinderSummary } from "../api/client";
import { Alert, AlertBody, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import type { TenantHostErrorViewModel } from "./tenant-host-errors";
import { mapTenantHostError } from "./tenant-host-errors";
import {
  TenantHostErrorNotice,
  formatCountdown,
  formatDateTime,
  formatRole,
  hasUsersDashboardAccess,
  useTenantShellContext
} from "./tenant-shell";

function DashboardStat({
  label,
  value,
  tone = "default"
}: {
  label: string;
  value: string;
  tone?: "default" | "warning";
}) {
  return (
    <article className={`pb-auth-stat-card${tone === "warning" ? " pb-auth-stat-card--warning" : ""}`}>
      <p className="pb-auth-stat-label">{label}</p>
      <p className="pb-auth-stat-value">{value}</p>
    </article>
  );
}

function BinderListIcon() {
  return (
    <svg aria-hidden="true" className="pb-auth-row-icon pb-auth-row-icon--binder" viewBox="0 0 24 24">
      <path d="M3.5 7.5h6l2 2h9v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
      <path d="M3.5 7.5v-1a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function DashboardPage() {
  const { apiClient, lease, countdownSeconds, impersonation } = useTenantShellContext();
  const [binders, setBinders] = useState<BinderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<TenantHostErrorViewModel | null>(null);
  const canManageUsers = hasUsersDashboardAccess(impersonation);

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
    <li className="pb-auth-list-item" key={binder.binderId}>
      <div className="pb-auth-row-head">
        <BinderListIcon />
        <div>
          <p className="pb-auth-list-title">{binder.name}</p>
          <p className="pb-auth-list-meta">{formatDateTime(binder.createdAt)}</p>
        </div>
      </div>
      <Button asChild type="button" variant="secondary">
        <Link to={`/app/binders/${binder.binderId}`}>Open binder</Link>
      </Button>
    </li>
  ));

  return (
    <div className="pb-auth-page">
      <section className="pb-auth-page-intro">
        <p className="pb-auth-eyebrow">Overview</p>
        <h2 className="pb-auth-page-title">Workspace dashboard</h2>
        <p className="pb-auth-page-copy">
          A workspace represents one temporary organization. Binders group the controlled text documents that
          organization manages, and this dashboard shows lease status, recent binders, and next actions.
        </p>
      </section>

      <div className="pb-auth-summary-grid">
        <DashboardStat label="Visible binders" value={isLoading ? "Loading..." : binders.length.toString()} />
        <DashboardStat label="Current role" value={formatRole(impersonation.effective.role)} />
        <DashboardStat label="Lease extensions" value={`${lease.extensionCount} of ${lease.maxExtensions} used`} />
        <DashboardStat
          label="Demo expires in"
          tone={countdownSeconds > 0 && countdownSeconds < 600 ? "warning" : "default"}
          value={formatCountdown(countdownSeconds)}
        />
      </div>
      {!lease.canExtend ? (
        <section className="pb-auth-callout pb-auth-callout--info">
          <div className="pb-auth-callout__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5" />
              <path d="M12 7v5l3 2" />
            </svg>
          </div>
          <div>
            <h3 className="pb-auth-callout__title">This demo tenant will be available for an hour after creation</h3>
            <p className="pb-auth-callout__body">
              When less than 10 minutes are left, the opportunity to extend the demo by 15 minutes appears if you need more time. You can extend the tenant demo by up to 3 times (45 minutes).
            </p>
          </div>
        </section>
      ) : null}

      <div className="pb-auth-layout-split">
        <section className="pb-auth-panel">
          <div className="pb-auth-panel-header">
            <h3 className="pb-auth-panel-title pb-auth-panel-title--lg">Recent binders</h3>
            <p className="pb-auth-panel-copy">
              Return to the binders available in this workspace.
            </p>
          </div>
          <div className="pb-auth-panel-body">
            {summaryError ? (
              <TenantHostErrorNotice error={summaryError} />
            ) : isLoading ? (
              <p className="pb-auth-panel-copy">Loading visible binders...</p>
            ) : binders.length === 0 ? (
              <Alert variant="info">
                <AlertTitle>No binders yet.</AlertTitle>
                <AlertBody>
                  Start with a binder, then add documents inside it to see how PaperBinder organizes controlled text records in this workspace.
                </AlertBody>
              </Alert>
            ) : (
              <ul className="pb-auth-list">{visibleBinderRows}</ul>
            )}
          </div>
        </section>

        <section className="pb-auth-panel">
          <div className="pb-auth-panel-header">
            <h3 className="pb-auth-panel-title pb-auth-panel-title--lg">Next actions</h3>
            <p className="pb-auth-panel-copy">
              Jump to the pages most likely to matter in this workspace.
            </p>
          </div>
          <div className="pb-auth-panel-body pb-auth-action-stack">
            <Button asChild className="w-full justify-center sm:w-auto" type="button">
              <Link to="/app/binders">{binders.length === 0 ? "Add your first binder" : "Review binders"}</Link>
            </Button>
            {canManageUsers ? (
              <Button asChild className="w-full justify-center sm:w-auto" type="button" variant="secondary">
                <Link to="/app/users">Manage users</Link>
              </Button>
              ) : (
                <Alert variant="info">
                  <AlertTitle>User management is available to workspace admins.</AlertTitle>
                  <AlertBody>If your role allows it, the Users page appears here.</AlertBody>
                </Alert>
              )}
          </div>
        </section>
      </div>
    </div>
  );
}
