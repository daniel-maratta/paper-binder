import { type FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type {
  BinderSummary
} from "../api/client";
import { Alert, AlertBody, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Field } from "../components/ui/field";
import { DataTable, type DataTableColumn, type DataTableRow } from "../components/ui/table";
import type { TenantHostErrorViewModel } from "./tenant-host-errors";
import { mapTenantHostError } from "./tenant-host-errors";
import {
  TenantHostErrorNotice,
  TenantRouteFailureCard,
  formatDateTime,
  useTenantShellContext
} from "./tenant-shell";

type BinderFieldErrors = Partial<Record<"binderName", string>>;

export function BindersPage() {
  const { apiClient, impersonation } = useTenantShellContext();
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
