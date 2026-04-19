import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { DocumentDetail } from "../api/client";
import { Alert, AlertBody, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardMeta, CardTitle } from "../components/ui/card";
import { StatusBadge } from "../components/ui/status-badge";
import type { TenantHostErrorViewModel } from "./tenant-host-errors";
import { mapTenantHostError } from "./tenant-host-errors";
import { TenantRouteFailureCard, formatDateTime, useTenantShellContext } from "./tenant-shell";

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
