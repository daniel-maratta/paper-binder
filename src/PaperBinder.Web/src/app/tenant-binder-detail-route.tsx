import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type {
  BinderDetail,
  BinderPolicy,
  DocumentDetail,
  DocumentSummary,
  TenantRole
} from "../api/client";
import { Alert, AlertBody, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "../components/ui/dialog";
import { Field } from "../components/ui/field";
import { DataTable, type DataTableColumn, type DataTableRow } from "../components/ui/table";
import { CopyValueChip, writeClipboardValue } from "./copy-value-chip";
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

function resolveMostRecentMatchingDocument(
  documents: readonly DocumentSummary[],
  title: string
): DocumentSummary | null {
  const trimmedTitle = title.trim();
  if (trimmedTitle.length === 0) {
    return null;
  }

  const comparableTitle = trimmedTitle.toLowerCase();
  return documents
    .filter((document) => document.title.trim().toLowerCase() === comparableTitle)
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))[0] ?? null;
}

function resolveSupersededDocumentLabel(
  documents: readonly DocumentSummary[],
  supersedesDocumentId: string | null,
  onCopyUnknownDocumentId: (documentId: string) => void
): ReactNode {
  if (supersedesDocumentId === null) {
    return "None";
  }

  const supersededDocument = documents.find((document) => document.documentId === supersedesDocumentId);
  if (supersededDocument === undefined) {
    return (
      <CopyValueChip
        compact
        label="superseded document id"
        onCopy={() => {
          onCopyUnknownDocumentId(supersedesDocumentId);
        }}
        value={supersedesDocumentId}
      />
    );
  }

  return (
    <div>
      <p className="pb-auth-list-title">{supersededDocument.title}</p>
      <p className="pb-auth-list-meta">{formatDateTime(supersededDocument.createdAt)}</p>
    </div>
  );
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
  const sortedAllowedRoles = [...allowedRoles].sort();
  const sortedPolicyRoles = [...(policy?.allowedRoles ?? [])].sort();
  const isDirty =
    policy !== null &&
    (mode !== policy.mode || JSON.stringify(sortedAllowedRoles) !== JSON.stringify(sortedPolicyRoles));
  const isInvalidRestrictedRoleSelection = mode === "restricted_roles" && allowedRoles.length === 0;

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
            <p className="pb-auth-panel-copy">Use workspace access or limit this binder to specific roles.</p>
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
              hint="Use workspace access for the default behavior, or limit the binder to selected roles."
              label="Access mode"
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
                <option value="inherit">Use workspace role access</option>
                <option value="restricted_roles">Limit to selected roles</option>
              </select>
            </Field>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-[var(--pb-color-text)]">Allowed roles</legend>
              <p className="pb-auth-panel-copy">
                Only the selected roles can open this binder.
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
                  <AlertTitle>Binder access saved.</AlertTitle>
                  <AlertBody>The binder now uses the updated access rules.</AlertBody>
                </Alert>
              ) : null}
            <Button
              disabled={!isDirty || isInvalidRestrictedRoleSelection || isSubmitting}
              isLoading={isSubmitting}
              type="submit"
            >
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
  const navigate = useNavigate();
  const { apiClient, impersonation, showToast } = useTenantShellContext();
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
  const [isDeleteBinderDialogOpen, setIsDeleteBinderDialogOpen] = useState(false);
  const [binderDeleteConfirmationName, setBinderDeleteConfirmationName] = useState("");
  const [deleteBinderError, setDeleteBinderError] = useState<TenantHostErrorViewModel | null>(null);
  const [isDeletingBinder, setIsDeletingBinder] = useState(false);
  const documentTitleLength = documentTitle.length;
  const isDocumentTitleTooLong = documentTitleLength > 200;
  const canMutateBinder = impersonation.effective.role !== "BinderRead";

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

  const matchingTitleDocument = useMemo(
    () => (binder === null ? null : resolveMostRecentMatchingDocument(binder.documents, documentTitle)),
    [binder, documentTitle]
  );
  const requiresMatchingTitleSupersede = matchingTitleDocument !== null;
  const hasValidMatchingTitleSupersedeSelection =
    !requiresMatchingTitleSupersede || documentSupersedesDocumentId === matchingTitleDocument.documentId;
  const canSubmitDocument =
    canMutateBinder &&
    documentTitle.trim().length > 0 &&
    documentContent.trim().length > 0 &&
    !isDocumentTitleTooLong &&
    hasValidMatchingTitleSupersedeSelection;
  const duplicateTitleError =
    matchingTitleDocument !== null && !hasValidMatchingTitleSupersedeSelection
      ? "A document with this title already exists. Rename this document or supersede the current document with the same name."
      : fieldErrors.documentSupersedesDocumentId;

  useEffect(() => {
    if (matchingTitleDocument === null) {
      if (documentSupersedesDocumentId !== "") {
        setDocumentSupersedesDocumentId("");
      }

      return;
    }

    if (
      documentSupersedesDocumentId.length > 0 &&
      documentSupersedesDocumentId !== matchingTitleDocument.documentId
    ) {
      setDocumentSupersedesDocumentId("");
    }
  }, [documentSupersedesDocumentId, matchingTitleDocument]);

  async function handleCreateDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextFieldErrors: DocumentFieldErrors = {};
    if (!documentTitle.trim()) {
      nextFieldErrors.documentTitle = "Document title is required.";
    } else if (documentTitle.trim().length > 200) {
      nextFieldErrors.documentTitle = "Document title must stay at or below 200 characters.";
    }

    if (!documentContent.trim()) {
      nextFieldErrors.documentContent = "Document content is required.";
    }

    if (
      matchingTitleDocument !== null &&
      documentSupersedesDocumentId !== matchingTitleDocument.documentId
    ) {
      nextFieldErrors.documentSupersedesDocumentId =
        "A document with this title already exists. Rename this document or supersede the current document with the same name.";
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

  async function handleDeleteBinder() {
    if (binder === null) {
      return;
    }

    setIsDeletingBinder(true);
    setDeleteBinderError(null);

    try {
      await apiClient.deleteBinder(binder.binderId);
      showToast({
        title: "Binder deleted.",
        body: `${binder.name} and its documents were removed from this workspace.`,
        variant: "success"
      });
      navigate("/app/binders");
    } catch (error) {
      setDeleteBinderError(mapTenantHostError(error));
    } finally {
      setIsDeletingBinder(false);
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
            <p className="pb-auth-panel-copy">Loading the binder and its available documents.</p>
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
        <p className="pb-auth-list-meta">
          {formatContentTypeLabel(document.contentType)}
        </p>
      </div>,
      formatDateTime(document.createdAt),
      resolveSupersededDocumentLabel(binder.documents, document.supersedesDocumentId, (documentId) => {
        void copyValue("Document ID", documentId);
      }),
      <Button asChild key={`${document.documentId}-action`} type="button" variant="secondary">
        <Link to={`/app/documents/${document.documentId}`}>Open document</Link>
      </Button>
    ]
  }));

  return (
    <div className="pb-auth-page">
      <div className="flex flex-wrap gap-3">
        <Button asChild type="button" variant="secondary">
          <Link to="/app/binders">Back to binders</Link>
        </Button>
      </div>

      <section className="pb-auth-page-intro">
        <div>
          <p className="pb-auth-eyebrow">Binder detail</p>
          <h2 className="pb-auth-page-title">{binder.name}</h2>
          <p className="pb-auth-page-copy">Work with the documents currently available in this binder.</p>
        </div>
        <div className="pb-auth-summary-grid pb-auth-summary-grid--3">
          <DetailStat label="Visible documents" value={binder.documents.length.toString()} />
          <DetailStat label="Created" value={formatDateTime(binder.createdAt)} />
          <DetailStat
            label="Binder id"
            value={
              <CopyValueChip
                compact
                label={`binder id for ${binder.name}`}
                onCopy={() => {
                  void copyValue("Binder ID", binder.binderId);
                }}
                value={binder.binderId}
              />
            }
          />
        </div>
      </section>

      <div className="pb-auth-detail-grid">
        <section className="pb-auth-panel">
          <div className="pb-auth-panel-header">
            <h3 className="pb-auth-panel-title pb-auth-panel-title--lg">Documents</h3>
            <p className="pb-auth-panel-copy">Open the documents available in this binder.</p>
          </div>
          <div className="pb-auth-panel-body">
            <DataTable
              caption="Binder documents"
              columns={documentColumns}
              emptyMessage="No documents are visible in this binder yet."
              rows={documentRows}
            />
          </div>
        </section>

        <BinderPolicyCard binderId={binderId} />
      </div>

      {canMutateBinder ? (
        <section className="pb-auth-panel">
          <div className="pb-auth-panel-header">
            <h3 className="pb-auth-panel-title pb-auth-panel-title--lg">Add document</h3>
            <p className="pb-auth-panel-copy">Save a new immutable source document in this binder.</p>
          </div>
          <div className="pb-auth-panel-body">
            <form className="pb-auth-form-stack" onSubmit={handleCreateDocument}>
              <Field
                error={fieldErrors.documentTitle}
                hint="Up to 200 characters."
                label="Document title"
              >
                <input
                  aria-invalid={isDocumentTitleTooLong}
                  disabled={isCreating}
                  onChange={(event) => {
                    setDocumentTitle(event.target.value);
                    setFieldErrors((currentErrors) => ({
                      ...currentErrors,
                      documentTitle: undefined,
                      documentSupersedesDocumentId: undefined
                    }));
                    setCreateError(null);
                  }}
                  placeholder="Security handbook"
                  type="text"
                  value={documentTitle}
                />
              </Field>
              <p className={`pb-auth-character-count${isDocumentTitleTooLong ? " pb-auth-character-count--invalid" : ""}`}>
                {documentTitleLength}/200
              </p>
              <Field
                error={fieldErrors.documentContent}
                hint="Markdown supported."
                label="Document source"
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
                hint={
                  matchingTitleDocument === null
                    ? "Optional. Link this document to an earlier visible document in the same binder."
                    : `A document named "${matchingTitleDocument.title}" already exists. Rename this document or supersede that document.`
                }
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
                  {matchingTitleDocument !== null ? (
                    <option value={matchingTitleDocument.documentId}>{matchingTitleDocument.title}</option>
                  ) : null}
                </select>
              </Field>
              <TenantHostErrorNotice error={createError} />
              {createdDocument ? (
                <Alert variant="success">
                  <AlertTitle>Document added.</AlertTitle>
                  <AlertBody>{createdDocument.title} is now available in this binder.</AlertBody>
                  <div className="mt-3">
                    <Button asChild type="button" variant="secondary">
                      <Link to={`/app/documents/${createdDocument.documentId}`}>Open document</Link>
                    </Button>
                  </div>
                </Alert>
              ) : null}
              <Button disabled={!canSubmitDocument || isCreating} isLoading={isCreating} type="submit">
                Add document
              </Button>
              {duplicateTitleError ? (
                <p className="mt-[-4px] text-[0.86rem] font-bold leading-6 text-[var(--pb-status-danger-text)]">
                  {duplicateTitleError}
                </p>
              ) : null}
            </form>
          </div>
        </section>
      ) : null}

      {canMutateBinder ? (
        <section className="pb-auth-panel">
          <div className="pb-auth-panel-header">
            <h3 className="pb-auth-panel-title pb-auth-panel-title--lg">Delete binder</h3>
            <p className="pb-auth-panel-copy">
              Remove this binder and every document currently stored in it after confirming the binder
              name. This action cannot be undone.
            </p>
          </div>
          <div className="pb-auth-panel-body space-y-4">
            <TenantHostErrorNotice error={deleteBinderError} />
            <Button
              onClick={() => {
                setDeleteBinderError(null);
                setBinderDeleteConfirmationName("");
                setIsDeleteBinderDialogOpen(true);
              }}
              type="button"
              variant="danger"
            >
              Delete binder
            </Button>
          </div>
        </section>
      ) : null}

      <Dialog onOpenChange={setIsDeleteBinderDialogOpen} open={isDeleteBinderDialogOpen}>
        <DialogContent
          description={`Type ${binder.name} to permanently remove this binder and all of its documents. This action cannot be undone.`}
          title={`Delete ${binder.name}?`}
        >
          <Field
            hint="This action removes the binder and all of its current documents permanently."
            label="Confirm binder name"
          >
            <input
              autoComplete="off"
              disabled={isDeletingBinder}
              onChange={(event) => {
                setBinderDeleteConfirmationName(event.target.value);
                setDeleteBinderError(null);
              }}
              placeholder={binder.name}
              type="text"
              value={binderDeleteConfirmationName}
            />
          </Field>
          <TenantHostErrorNotice error={deleteBinderError} />
          <DialogFooter>
            <Button onClick={() => setIsDeleteBinderDialogOpen(false)} type="button" variant="secondary">
              Cancel
            </Button>
            <Button
              disabled={binderDeleteConfirmationName.trim() !== binder.name || isDeletingBinder}
              isLoading={isDeletingBinder}
              onClick={() => void handleDeleteBinder()}
              type="button"
              variant="danger"
            >
              Delete binder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
