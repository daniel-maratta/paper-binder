import type { CSSProperties, MouseEventHandler, ReactNode } from "react";
import { cn } from "../../lib/cn";

type ToastVariant = "info" | "success" | "warning" | "danger";

const toastVariants: Record<ToastVariant, string> = {
  info:
    "border-[var(--pb-status-info)] bg-[linear-gradient(180deg,rgba(243,248,255,0.98),rgba(231,238,248,0.94))] text-[var(--pb-status-info-text)]",
  success:
    "border-[var(--pb-status-success)] bg-[linear-gradient(180deg,rgba(241,250,246,0.99),rgba(226,241,234,0.95))] text-[var(--pb-status-success-text)]",
  warning:
    "border-[var(--pb-status-warning)] bg-[linear-gradient(180deg,rgba(252,247,236,0.99),rgba(247,238,219,0.95))] text-[var(--pb-status-warning-text)]",
  danger:
    "border-[var(--pb-status-danger)] bg-[linear-gradient(180deg,rgba(253,241,240,0.99),rgba(249,231,230,0.95))] text-[var(--pb-status-danger-text)]"
};

export function ToastViewport({
  className,
  children,
  hiddenCount = 0
}: {
  className?: string;
  children: ReactNode;
  hiddenCount?: number;
}) {
  return (
    <div
      aria-label="Notifications"
      className={cn("pb-toast-viewport", className)}
      role="region"
    >
      {children}
      {hiddenCount > 0 ? (
        <div className="pb-toast-queue-hint" role="status">
          <span className="pb-toast-queue-hint__count">+{hiddenCount}</span>
          <span className="pb-toast-queue-hint__label">more notification{hiddenCount === 1 ? "" : "s"} queued</span>
        </div>
      ) : null}
    </div>
  );
}

export function Toast({
  title,
  body,
  variant = "info",
  onDismiss,
  onDismissPause,
  onDismissResume,
  showTimeoutBar = false,
  timeoutBarDurationMs = 5000,
  timeoutBarPaused = false
}: {
  title: string;
  body: ReactNode;
  variant?: ToastVariant;
  onDismiss: () => void;
  onDismissPause?: MouseEventHandler<HTMLElement>;
  onDismissResume?: MouseEventHandler<HTMLElement>;
  showTimeoutBar?: boolean;
  timeoutBarDurationMs?: number;
  timeoutBarPaused?: boolean;
}) {
  type ToastTimeoutBarStyle = CSSProperties & {
    "--pb-toast-timeout-duration": string;
  };

  const timeoutBarStyle = showTimeoutBar
    ? ({
        "--pb-toast-timeout-duration": `${timeoutBarDurationMs}ms`,
        animationPlayState: timeoutBarPaused ? "paused" : "running"
      } as ToastTimeoutBarStyle)
    : undefined;

  return (
    <section
      className={cn("pb-toast", toastVariants[variant])}
      onMouseEnter={onDismissPause}
      onMouseLeave={onDismissResume}
      role={variant === "danger" ? "alert" : "status"}
    >
      <div className="pb-toast__content">
        <div className="min-w-0">
          <h2 className="pb-toast__title">{title}</h2>
          <p className="pb-toast__body">{body}</p>
        </div>
        <button
          aria-label={`Dismiss notification: ${title}`}
          className="pb-toast__dismiss"
          onClick={onDismiss}
          type="button"
        >
          Dismiss
        </button>
      </div>
      {showTimeoutBar ? <div aria-hidden="true" className="pb-toast__timeout-bar" style={timeoutBarStyle} /> : null}
    </section>
  );
}
