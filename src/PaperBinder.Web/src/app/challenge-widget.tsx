import { useEffect, useId, useRef, useState } from "react";
import { StatusBadge } from "../components/ui/status-badge";
import { cn } from "../lib/cn";

type TurnstileRenderOptions = {
  sitekey: string;
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "timeout-callback"?: () => void;
  "error-callback"?: () => void;
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const challengeScriptCache = new Map<string, Promise<void>>();

function loadChallengeScript(src: string): Promise<void> {
  if (window.turnstile) {
    return Promise.resolve();
  }

  const cached = challengeScriptCache.get(src);
  if (cached) {
    return cached;
  }

  const loader = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Challenge script failed to load.")), {
        once: true
      });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Challenge script failed to load.")), { once: true });
    document.head.appendChild(script);
  });

  challengeScriptCache.set(src, loader);
  return loader;
}

type ChallengeStatus = "loading" | "ready" | "complete" | "error";

function getChallengeStatusContent(status: ChallengeStatus): {
  badge: string;
  badgeVariant: "neutral" | "warning" | "success" | "danger";
  detail: string;
} {
  switch (status) {
    case "loading":
      return {
        badge: "Loading",
        badgeVariant: "neutral",
        detail: "Loading the challenge widget."
      };
    case "ready":
      return {
        badge: "Required",
        badgeVariant: "warning",
        detail: "Complete the challenge before submitting."
      };
    case "complete":
      return {
        badge: "Ready",
        badgeVariant: "success",
        detail: "Challenge complete."
      };
    case "error":
      return {
        badge: "Unavailable",
        badgeVariant: "danger",
        detail: "The challenge widget could not be loaded. Refresh and try again."
      };
  }
}

export function RootHostChallengeWidget({
  label,
  hint,
  error,
  siteKey,
  scriptUrl,
  resetNonce,
  onTokenChange
}: {
  label: string;
  hint: string;
  error?: string;
  siteKey: string;
  scriptUrl: string;
  resetNonce: number;
  onTokenChange: (token: string | null) => void;
}) {
  const labelId = useId();
  const hintId = `${labelId}-hint`;
  const statusId = `${labelId}-status`;
  const errorId = error ? `${labelId}-error` : undefined;
  const describedBy = [hintId, statusId, errorId].filter(Boolean).join(" ");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState<ChallengeStatus>("loading");
  const statusContent = getChallengeStatusContent(status);

  useEffect(() => {
    let disposed = false;
    onTokenChange(null);
    setStatus("loading");

    void loadChallengeScript(scriptUrl)
      .then(() => {
        if (disposed || containerRef.current === null || window.turnstile === undefined) {
          return;
        }

        containerRef.current.innerHTML = "";
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => {
            if (disposed) {
              return;
            }

            onTokenChange(token);
            setStatus("complete");
          },
          "expired-callback": () => {
            if (disposed) {
              return;
            }

            onTokenChange(null);
            setStatus("ready");
          },
          "timeout-callback": () => {
            if (disposed) {
              return;
            }

            onTokenChange(null);
            setStatus("ready");
          },
          "error-callback": () => {
            if (disposed) {
              return;
            }

            onTokenChange(null);
            setStatus("error");
          }
        });

        setStatus("ready");
      })
      .catch(() => {
        if (disposed) {
          return;
        }

        onTokenChange(null);
        setStatus("error");
      });

    return () => {
      disposed = true;
      if (widgetIdRef.current !== null && window.turnstile !== undefined) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [onTokenChange, scriptUrl, siteKey]);

  useEffect(() => {
    if (resetNonce === 0) {
      return;
    }

    onTokenChange(null);
    if (widgetIdRef.current !== null && window.turnstile !== undefined) {
      window.turnstile.reset(widgetIdRef.current);
      setStatus("ready");
    }
  }, [onTokenChange, resetNonce]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="block text-sm font-medium text-[var(--pb-color-text)]" id={labelId}>
          {label}
        </label>
        <StatusBadge variant={statusContent.badgeVariant}>{statusContent.badge}</StatusBadge>
      </div>
      <div
        aria-describedby={describedBy}
        aria-labelledby={labelId}
        className={cn(
          "rounded-[var(--pb-radius-md)] border bg-white px-3 py-3 shadow-sm focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--pb-color-primary)]",
          error ? "border-[var(--pb-color-danger)]" : "border-[var(--pb-color-border-strong)]"
        )}
      >
        <div ref={containerRef} />
      </div>
      <p className="text-sm text-[var(--pb-color-text-muted)]" id={hintId}>
        {hint}
      </p>
      <p className="text-sm text-[var(--pb-color-text-muted)]" id={statusId}>
        {statusContent.detail}
      </p>
      {error ? (
        <p className="text-sm text-[var(--pb-color-danger)]" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
