import { type FormEvent, type ReactNode, useEffect, useState } from "react";
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

function DetailStat({
  label,
  value
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <article className="pb-auth-stat-card">
      <p className="pb-auth-stat-label">{label}</p>
      <div className="pb-auth-stat-value">{value}</div>
    </article>
  );
}

function formatContentTypeLabel(contentType: string) {
  if (contentType === "markdown") {
    return "Markdown";
  }

  return contentType;
}

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
    <section className="pb-auth-panel">
      <div className="pb-auth-panel-header">
        <h3 className="pb-auth-panel-title pb-auth-panel-title--lg">Binder access</h3>
        <p className="pb-auth-panel-copy">
          Tenant admins can switch between inherited access and exact-role allow lists for this binder.
        </p>
      </div>
      <div className="pb-auth-panel-body">
        {isLoading ? (
          <p className="pb-auth-panel-copy">Loading binder policy...</p>
        ) : loadError ? (
          <TenantHostErrorNotice error={loadError} />
        ) : policy ? (
          <form className="pb-auth-form-stack" onSubmit={handleSubmit}>
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
              <p className="pb-auth-panel-copy">
                Exact role evaluation applies. Restricting a binder does not treat roles as interchangeable.
              </p>
              <div className="pb-auth-checkbox-list">
                {roleOptions.map((role) => (
                  <label className="pb-auth-checkbox-item" key={role}>
                    <input
                      checked={allowedRoles.includes(role)}
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
      </div>
    </section>
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
      <section className="pb-auth-panel pb-auth-panel--route">
        <div className="pb-auth-panel-header">
          <p className="pb-auth-eyebrow">Binder detail</p>
          <h2 className="pb-auth-panel-title pb-auth-panel-title--lg">Loading binder</h2>
          <p className="pb-auth-panel-copy">PaperBinder is resolving binder detail and visible documents.</p>
        </div>
      </section>
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
        <p className="pb-auth-list-title">{document.title}</p>
        <p className="pb-auth-list-meta">{formatContentTypeLabel(document.contentType)}</p>
      </div>,
      formatDateTime(document.createdAt),
      document.supersedesDocumentId ? (
        <span className="pb-auth-code">{document.supersedesDocumentId}</span>
      ) : (
        "None"
      ),
      <Button asChild key={`${document.documentId}-action`} type="button" variant="secondary">
        <Link to={`/app/documents/${document.documentId}`}>Open document</Link>
      </Button>
    ]
  }));

  return (
    <div className="pb-auth-page">
      <section className="pb-auth-page-intro">
        <div>
          <p className="pb-auth-eyebrow">Binder detail</p>
          <h2 className="pb-auth-page-title">{binder.name}</h2>
          <p className="pb-auth-page-copy">
            Binder detail combines live binder metadata with the visible document summaries exposed by the current contract.
          </p>
        </div>
        <div className="pb-auth-summary-grid pb-auth-summary-grid--3">
          <DetailStat label="Visible documents" value={binder.documents.length.toString()} />
          <DetailStat label="Created" value={formatDateTime(binder.createdAt)} />
          <DetailStat label="Binder id" value={<span className="pb-auth-code">{binder.binderId}</span>} />
        </div>
      </section>

      <div className="pb-auth-detail-grid">
        <section className="pb-auth-panel">
          <div className="pb-auth-panel-header">
            <h3 className="pb-auth-panel-title pb-auth-panel-title--lg">Visible documents</h3>
            <p className="pb-auth-panel-copy">
              Archived documents remain hidden from binder detail and stay readable only by direct document id.
            </p>
          </div>
          <div className="pb-auth-panel-body">
            <DataTable
              caption="Visible binder documents"
              columns={documentColumns}
              emptyMessage="No visible documents exist in this binder yet."
              rows={documentRows}
            />
          </div>
        </section>

        <BinderPolicyCard binderId={binderId} />
      </div>

      <section className="pb-auth-panel">
        <div className="pb-auth-panel-header">
          <h3 className="pb-auth-panel-title pb-auth-panel-title--lg">Add document</h3>
          <p className="pb-auth-panel-copy">
            Document creation stays within the binder route and submits the current route binder id through the shared client.
          </p>
        </div>
        <div className="pb-auth-panel-body">
          <form className="pb-auth-form-stack" onSubmit={handleCreateDocument}>
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
        </div>
      </section>
    </div>
  );
}
