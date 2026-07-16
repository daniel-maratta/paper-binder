import { type ReactNode, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { DocumentDetail } from "../api/client";
import { Alert, AlertBody, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { StatusBadge } from "../components/ui/status-badge";
import { CopyValueChip, writeClipboardValue } from "./copy-value-chip";
import type { TenantHostErrorViewModel } from "./tenant-host-errors";
import { mapTenantHostError } from "./tenant-host-errors";
import { TenantRouteFailureCard, formatDateTime, useTenantShellContext } from "./tenant-shell";

function isSafeMarkdownHref(href: string) {
  const trimmedHref = href.trim();
  if (
    trimmedHref.length === 0 ||
    trimmedHref.startsWith("#") ||
    trimmedHref.startsWith("/") ||
    trimmedHref.startsWith("./") ||
    trimmedHref.startsWith("../")
  ) {
    return trimmedHref.length > 0;
  }

  try {
    const url = new URL(trimmedHref);
    return url.protocol === "http:" || url.protocol === "https:" || url.protocol === "mailto:";
  } catch {
    return false;
  }
}

function renderInlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
  const tokenPattern = /(\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_)/;
  const match = tokenPattern.exec(text);
  if (match === null || match.index === undefined) {
    return [text];
  }

  const nodes: ReactNode[] = [];
  if (match.index > 0) {
    nodes.push(text.slice(0, match.index));
  }

  const [token] = match;
  const key = `${keyPrefix}-${match.index}`;

  if (match[2] !== undefined && match[3] !== undefined) {
    const href = match[3].trim();
    const label = renderInlineMarkdown(match[2], `${key}-label`);
    nodes.push(
      isSafeMarkdownHref(href) ? (
        <a className="pb-auth-markdown-link" href={href} key={key} rel="noreferrer" target="_blank">
          {label}
        </a>
      ) : (
        <span key={key}>{label}</span>
      )
    );
  } else if (match[4] !== undefined) {
    nodes.push(
      <code className="pb-auth-markdown-inline-code" key={key}>
        {match[4]}
      </code>
    );
  } else if (match[5] !== undefined || match[6] !== undefined) {
    const value = match[5] ?? match[6] ?? "";
    nodes.push(<strong key={key}>{renderInlineMarkdown(value, `${key}-strong`)}</strong>);
  } else if (match[7] !== undefined || match[8] !== undefined) {
    const value = match[7] ?? match[8] ?? "";
    nodes.push(<em key={key}>{renderInlineMarkdown(value, `${key}-em`)}</em>);
  }

  nodes.push(...renderInlineMarkdown(text.slice(match.index + token.length), `${keyPrefix}-rest-${match.index}`));
  return nodes;
}

function isMarkdownBlockBoundary(line: string) {
  const trimmedLine = line.trim();
  return (
    trimmedLine.length === 0 ||
    /^(#{1,6})\s+/.test(trimmedLine) ||
    /^```/.test(trimmedLine) ||
    /^>\s?/.test(trimmedLine) ||
    /^[-*+]\s+/.test(trimmedLine) ||
    /^\d+\.\s+/.test(trimmedLine) ||
    /^(-{3,}|\*{3,}|_{3,})\s*$/.test(trimmedLine)
  );
}

function renderMarkdownHeading(level: number, content: string, key: string) {
  const children = renderInlineMarkdown(content.trim(), `${key}-inline`);

  switch (level) {
    case 1:
      return <h1 key={key}>{children}</h1>;
    case 2:
      return <h2 key={key}>{children}</h2>;
    case 3:
      return <h3 key={key}>{children}</h3>;
    case 4:
      return <h4 key={key}>{children}</h4>;
    case 5:
      return <h5 key={key}>{children}</h5>;
    default:
      return <h6 key={key}>{children}</h6>;
  }
}

function renderMarkdownBlocks(markdown: string, keyPrefix = "markdown"): ReactNode[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];

  for (let lineIndex = 0; lineIndex < lines.length; ) {
    const line = lines[lineIndex];
    const trimmedLine = line.trim();
    const key = `${keyPrefix}-${lineIndex}`;

    if (trimmedLine.length === 0) {
      lineIndex += 1;
      continue;
    }

    if (/^```/.test(trimmedLine)) {
      const codeLines: string[] = [];
      lineIndex += 1;

      while (lineIndex < lines.length && !/^```/.test(lines[lineIndex].trim())) {
        codeLines.push(lines[lineIndex]);
        lineIndex += 1;
      }

      if (lineIndex < lines.length) {
        lineIndex += 1;
      }

      blocks.push(
        <pre className="pb-auth-markdown-code-block" key={key}>
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(trimmedLine)) {
      blocks.push(<hr key={key} />);
      lineIndex += 1;
      continue;
    }

    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch !== null) {
      blocks.push(renderMarkdownHeading(headingMatch[1].length, headingMatch[2], key));
      lineIndex += 1;
      continue;
    }

    if (/^>\s?/.test(trimmedLine)) {
      const quoteLines: string[] = [];

      while (lineIndex < lines.length && /^>\s?/.test(lines[lineIndex].trim())) {
        quoteLines.push(lines[lineIndex].trim().replace(/^>\s?/, ""));
        lineIndex += 1;
      }

      blocks.push(<blockquote key={key}>{renderMarkdownBlocks(quoteLines.join("\n"), `${key}-quote`)}</blockquote>);
      continue;
    }

    const unorderedListMatch = trimmedLine.match(/^[-*+]\s+(.+)$/);
    if (unorderedListMatch !== null) {
      const items: ReactNode[] = [];

      while (lineIndex < lines.length) {
        const currentLine = lines[lineIndex].trim();
        const itemMatch = currentLine.match(/^[-*+]\s+(.+)$/);
        if (itemMatch === null) {
          break;
        }

        items.push(<li key={`${key}-item-${lineIndex}`}>{renderInlineMarkdown(itemMatch[1], `${key}-item-inline-${lineIndex}`)}</li>);
        lineIndex += 1;
      }

      blocks.push(
        <ul key={key}>
          {items}
        </ul>
      );
      continue;
    }

    const orderedListMatch = trimmedLine.match(/^\d+\.\s+(.+)$/);
    if (orderedListMatch !== null) {
      const items: ReactNode[] = [];

      while (lineIndex < lines.length) {
        const currentLine = lines[lineIndex].trim();
        const itemMatch = currentLine.match(/^\d+\.\s+(.+)$/);
        if (itemMatch === null) {
          break;
        }

        items.push(<li key={`${key}-item-${lineIndex}`}>{renderInlineMarkdown(itemMatch[1], `${key}-item-inline-${lineIndex}`)}</li>);
        lineIndex += 1;
      }

      blocks.push(
        <ol key={key}>
          {items}
        </ol>
      );
      continue;
    }

    const paragraphLines = [trimmedLine];
    lineIndex += 1;

    while (lineIndex < lines.length && !isMarkdownBlockBoundary(lines[lineIndex])) {
      paragraphLines.push(lines[lineIndex].trim());
      lineIndex += 1;
    }

    blocks.push(<p key={key}>{renderInlineMarkdown(paragraphLines.join(" "), `${key}-paragraph`)}</p>);
  }

  return blocks;
}

function MarkdownPreview({
  content
}: {
  content: string;
}) {
  return <div className="pb-auth-markdown">{renderMarkdownBlocks(content)}</div>;
}

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
  const { apiClient, impersonation, showToast } = useTenantShellContext();
  const [documentDetail, setDocumentDetail] = useState<DocumentDetail | null>(null);
  const [supersededDocumentTitle, setSupersededDocumentTitle] = useState<string | null>(null);
  const [isViewingSource, setIsViewingSource] = useState(false);
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

  useEffect(() => {
    const supersedesDocumentId = documentDetail?.supersedesDocumentId;
    if (typeof supersedesDocumentId !== "string" || supersedesDocumentId.length === 0) {
      setSupersededDocumentTitle(null);
      return;
    }

    const supersedesDocumentIdValue = supersedesDocumentId;
    const abortController = new AbortController();

    async function loadSupersededDocument() {
      try {
        const supersededDocument = await apiClient.getDocumentDetail(
          supersedesDocumentIdValue,
          abortController.signal
        );
        if (abortController.signal.aborted) {
          return;
        }

        setSupersededDocumentTitle(supersededDocument.title);
      } catch {
        if (!abortController.signal.aborted) {
          setSupersededDocumentTitle(null);
        }
      }
    }

    void loadSupersededDocument();

    return () => {
      abortController.abort();
    };
  }, [apiClient, documentDetail?.supersedesDocumentId]);

  useEffect(() => {
    setIsViewingSource(false);
  }, [documentId]);

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

  if (isLoading || documentDetail === null) {
    return (
      <section className="pb-auth-panel pb-auth-panel--route">
        <div className="pb-auth-panel-header">
          <p className="pb-auth-eyebrow">Document detail</p>
          <h2 className="pb-auth-panel-title pb-auth-panel-title--lg">Loading document</h2>
          <p className="pb-auth-panel-copy">PaperBinder is loading the current document.</p>
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
              Read the rendered markdown by default, or switch to source when you need the stored document body.
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
                <div>
                  <p className="pb-auth-list-title">{supersededDocumentTitle ?? "Linked document"}</p>
                  <div className="mt-2">
                    <CopyValueChip
                      compact
                      label="superseded document id"
                      onCopy={() => {
                        void copyValue("Superseded document ID", documentDetail.supersedesDocumentId!);
                      }}
                      value={documentDetail.supersedesDocumentId}
                    />
                  </div>
                </div>
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
            Binder lists hide archived documents, but direct reads remain available to allowed users.
          </AlertBody>
        </Alert>
      ) : null}

      <section className="pb-auth-panel">
        <div className="pb-auth-panel-header">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="pb-auth-panel-title pb-auth-panel-title--lg">
                {isViewingSource ? "Document source" : "Document preview"}
              </h3>
              <p className="pb-auth-panel-copy">
                {isViewingSource
                  ? "Read-only markdown source is shown exactly as stored for this workspace."
                  : "Rendered markdown is shown by default so the document reads like a finished page."}
              </p>
            </div>
            <Button
              onClick={() => {
                setIsViewingSource((currentValue) => !currentValue);
              }}
              type="button"
              variant="secondary"
            >
              {isViewingSource ? "View Rendered" : "View Source"}
            </Button>
          </div>
        </div>
        <div className="pb-auth-panel-body">
          {isViewingSource ? (
            <pre className="pb-auth-source-block">{documentDetail.content}</pre>
          ) : (
            <MarkdownPreview content={documentDetail.content} />
          )}
        </div>
      </section>

      <section className="pb-auth-panel">
        <div className="pb-auth-panel-header">
          <h3 className="pb-auth-panel-title pb-auth-panel-title--lg">Reference metadata</h3>
        </div>
        <div className="pb-auth-panel-body">
          <div className="pb-auth-summary-grid pb-auth-summary-grid--2">
            <DetailStat
              label="Document id"
              value={
                <CopyValueChip
                  label="document id"
                  onCopy={() => {
                    void copyValue("Document ID", documentDetail.documentId);
                  }}
                  value={documentDetail.documentId}
                />
              }
            />
            <DetailStat
              label="Binder id"
              value={
                <CopyValueChip
                  label="binder id"
                  onCopy={() => {
                    void copyValue("Binder ID", documentDetail.binderId);
                  }}
                  value={documentDetail.binderId}
                />
              }
            />
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
