import { type FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type {
  BinderSummary
} from "../api/client";
import { Alert, AlertBody, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Field } from "../components/ui/field";
import { DataTable, type DataTableColumn, type DataTableRow } from "../components/ui/table";
import { CopyValueChip, writeClipboardValue } from "./copy-value-chip";
import type { TenantHostErrorViewModel } from "./tenant-host-errors";
import { mapTenantHostError } from "./tenant-host-errors";
import {
  TenantHostErrorNotice,
  TenantRouteFailureCard,
  formatDateTime,
  useIsDesktopShell,
  useTenantShellContext
} from "./tenant-shell";

type BinderFieldErrors = Partial<Record<"binderName", string>>;

function BinderRowIcon() {
  return (
    <svg aria-hidden="true" className="pb-auth-row-icon" viewBox="0 0 24 24">
      <path d="M3.5 7.5h6l2 2h9v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
      <path d="M3.5 7.5v-1a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function BindersPage() {
  const { apiClient, impersonation, showToast } = useTenantShellContext();
  const isDesktopShell = useIsDesktopShell();
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
  }, [apiClient, impersonation.effective.userId]);

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

  async function copyValue(label: string, value: string) {
    const copied = await writeClipboardValue(value);
    if (copied) {
      showToast({
        title: `${label} copied.`,
        body: `${label} is ready to paste.`,
        variant: "success"
      });
      return;
    }

    showToast({
      title: `Could not copy ${label.toLowerCase()}.`,
      body: "Clipboard access is not available in this browser session.",
      variant: "warning"
    });
  }

  if (pageError !== null) {
    return <TenantRouteFailureCard error={pageError} />;
  }

  const rows: DataTableRow[] = binders.map((binder) => ({
    key: binder.binderId,
    cells: [
      <div className="pb-auth-row-head" key={`${binder.binderId}-name`}>
        <BinderRowIcon />
        <div>
          <p className="font-medium text-[var(--pb-color-text)]">{binder.name}</p>
          <CopyValueChip
            className="mt-2"
            compact
            label={`binder id for ${binder.name}`}
            onCopy={() => {
              void copyValue("Binder ID", binder.binderId);
            }}
            value={binder.binderId}
          />
        </div>
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
    <div className="pb-auth-page">
      <section className="pb-auth-page-intro">
        <p className="pb-auth-eyebrow">Workspace</p>
        <h2 className="pb-auth-page-title">Binders</h2>
        <p className="pb-auth-page-copy">Create and open the binders currently available to this workspace.</p>
      </section>

      <div className="pb-auth-layout-split">
        <section className="pb-auth-panel">
          <div className="pb-auth-panel-header">
            <h3 className="pb-auth-panel-title pb-auth-panel-title--lg">Available binders</h3>
            <p className="pb-auth-panel-copy">Only the binders available to you appear here.</p>
          </div>
          <div className="pb-auth-panel-body">
            {isDesktopShell ? (
              <DataTable
                caption="Workspace binders"
                columns={columns}
                emptyMessage="No binders are visible in this workspace yet."
                isLoading={isLoading}
                loadingLabel="Loading workspace binders..."
                rows={rows}
              />
            ) : (
              <div aria-label="Workspace binders" className="pb-auth-mobile-list" role="list">
                {isLoading ? (
                  <div className="pb-auth-selection-empty" role="status">
                    Loading workspace binders...
                  </div>
                ) : binders.length === 0 ? (
                  <div className="pb-auth-selection-empty">No binders are visible in this workspace yet.</div>
                ) : (
                  binders.map((binder) => (
                    <article className="pb-auth-mobile-list-card" key={binder.binderId} role="listitem">
                      <div className="pb-auth-mobile-list-card__header">
                        <div className="pb-auth-mobile-list-card__identity">
                          <p className="pb-auth-stat-label">Binder</p>
                          <p className="pb-auth-mobile-list-card__title">{binder.name}</p>
                        </div>
                      </div>
                      <div className="pb-auth-mobile-list-card__meta">
                        <div>
                          <p className="pb-auth-stat-label">Created</p>
                          <p>{formatDateTime(binder.createdAt)}</p>
                        </div>
                        <div>
                          <p className="pb-auth-stat-label">Binder ID</p>
                          <CopyValueChip
                            compact
                            label={`binder id for ${binder.name}`}
                            onCopy={() => {
                              void copyValue("Binder ID", binder.binderId);
                            }}
                            value={binder.binderId}
                          />
                        </div>
                      </div>
                      <Button asChild type="button" variant="secondary">
                        <Link to={`/app/binders/${binder.binderId}`}>Open binder</Link>
                      </Button>
                    </article>
                  ))
                )}
              </div>
            )}
          </div>
        </section>

        <section className="pb-auth-panel">
          <div className="pb-auth-panel-header">
            <h3 className="pb-auth-panel-title pb-auth-panel-title--lg">Add binder</h3>
            <p className="pb-auth-panel-copy">Create a binder for the documents this workspace needs.</p>
          </div>
          <div className="pb-auth-panel-body">
            <form className="space-y-4" onSubmit={handleCreateBinder}>
              <Field
                error={fieldErrors.binderName}
                hint="Use a clear name people in this workspace can recognize."
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
                  <AlertTitle>Binder added.</AlertTitle>
                  <AlertBody>{createSuccess} is now available in this workspace.</AlertBody>
                </Alert>
              ) : null}
              <Button disabled={!binderName.trim() || isCreating} isLoading={isCreating} type="submit">
                Add binder
              </Button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
