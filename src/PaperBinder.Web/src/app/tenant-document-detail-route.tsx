import { type ReactNode, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { DocumentDetail } from "../api/client";
import { Alert, AlertBody, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { StatusBadge } from "../components/ui/status-badge";
import type { TenantHostErrorViewModel } from "./tenant-host-errors";
import { mapTenantHostError } from "./tenant-host-errors";
import { TenantRouteFailureCard, formatDateTime, useTenantShellContext } from "./tenant-shell";

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

export function DocumentDetailPage() {
  const { documentId = "" } = useParams();
  const { apiClient, impersonation } = useTenantShellContext();
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
  }, [apiClient, documentId, impersonation.effective.userId]);

  if (pageError !== null) {
    return <TenantRouteFailureCard error={pageError} />;
  }

  if (isLoading || documentDetail === null) {
    return (
      <section className="pb-auth-panel pb-auth-panel--route">
        <div className="pb-auth-panel-header">
          <p className="pb-auth-eyebrow">Document detail</p>
          <h2 className="pb-auth-panel-title pb-auth-panel-title--lg">Loading document</h2>
          <p className="pb-auth-panel-copy">PaperBinder is resolving the read-only document view.</p>
        </div>
      </section>
    );
  }

  return (
    <div className="pb-auth-page">
      <section className="pb-auth-page-intro">
        <div className="pb-auth-detail-head">
          <div>
            <p className="pb-auth-eyebrow">Document detail</p>
            <h2 className="pb-auth-page-title">{documentDetail.title}</h2>
            <p className="pb-auth-page-copy">
              Document detail is read-only in v1 and reflects the current server contract directly.
            </p>
          </div>
          <StatusBadge className="pb-auth-detail-status" variant={documentDetail.archivedAt ? "warning" : "success"}>
            {documentDetail.archivedAt ? "Archived" : "Active"}
          </StatusBadge>
        </div>

        <div className="pb-auth-summary-grid">
          <DetailStat label="Created" value={formatDateTime(documentDetail.createdAt)} />
          <DetailStat label="Format" value="Markdown" />
          <DetailStat
            label="Supersedes"
            value={
              documentDetail.supersedesDocumentId ? (
                <span className="pb-auth-code">{documentDetail.supersedesDocumentId}</span>
              ) : (
                "None"
              )
            }
          />
          <DetailStat label="Status" value={documentDetail.archivedAt ? "Archived" : "Active"} />
        </div>
      </section>

      {documentDetail.archivedAt ? (
        <Alert className="w-full" variant="warning">
          <AlertTitle>Archived document visible by direct id.</AlertTitle>
          <AlertBody>
            Binder detail hides archived documents, but direct reads remain available to allowed callers.
          </AlertBody>
        </Alert>
      ) : null}

      <section className="pb-auth-panel">
        <div className="pb-auth-panel-header">
          <h3 className="pb-auth-panel-title pb-auth-panel-title--lg">Document source</h3>
          <p className="pb-auth-panel-copy">
            CP14 keeps document rendering dependency-free and avoids raw HTML injection by showing safe markdown source.
          </p>
        </div>
        <div className="pb-auth-panel-body">
          <pre className="pb-auth-source-block">{documentDetail.content}</pre>
        </div>
      </section>

      <section className="pb-auth-panel">
        <div className="pb-auth-panel-header">
          <h3 className="pb-auth-panel-title pb-auth-panel-title--lg">Reference metadata</h3>
          <p className="pb-auth-panel-copy">Identifiers stay available here without leading the document view.</p>
        </div>
        <div className="pb-auth-panel-body">
          <div className="pb-auth-summary-grid pb-auth-summary-grid--2">
            <DetailStat label="Document id" value={<span className="pb-auth-code">{documentDetail.documentId}</span>} />
            <DetailStat label="Binder id" value={<span className="pb-auth-code">{documentDetail.binderId}</span>} />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button asChild type="button" variant="secondary">
          <Link to={`/app/binders/${documentDetail.binderId}`}>Back to binder</Link>
        </Button>
      </div>
    </div>
  );
}
