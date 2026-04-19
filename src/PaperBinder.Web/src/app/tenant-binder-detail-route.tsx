import { type FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type {
  BinderDetail,
  BinderPolicy,
  DocumentDetail,
  DocumentSummary,
  TenantRole
} from "../api/client";
import { Alert, AlertBody, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardMeta,
  CardTitle
} from "../components/ui/card";
import { Field } from "../components/ui/field";
import { DataTable, type DataTableColumn, type DataTableRow } from "../components/ui/table";
import type { TenantHostErrorViewModel } from "./tenant-host-errors";
import { mapTenantHostError } from "./tenant-host-errors";
import {
  TenantHostErrorNotice,
  TenantRouteFailureCard,
  formatDateTime,
  formatRole,
  roleOptions,
  useTenantShellContext
} from "./tenant-shell";

type DocumentFieldErrors = Partial<
  Record<"documentTitle" | "documentContent" | "documentSupersedesDocumentId", string>
>;
type BinderPolicyFieldErrors = Partial<Record<"binderPolicy", string>>;

function BinderPolicyCard({
  binderId
}: {
  binderId: string;
}) {
  const { apiClient, impersonation } = useTenantShellContext();
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
  }, [apiClient, binderId, impersonation.effective.userId]);

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

export function BinderDetailPage() {
  const { binderId = "" } = useParams();
  const { apiClient, impersonation } = useTenantShellContext();
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
  }, [apiClient, binderId, impersonation.effective.userId]);

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
