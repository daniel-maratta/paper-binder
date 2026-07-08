import type { ComponentPropsWithoutRef } from "react";
import { cn } from "../../lib/cn";

type StatusBadgeVariant = "neutral" | "success" | "warning" | "danger";

const badgeVariants: Record<StatusBadgeVariant, string> = {
  neutral:
    "border-[var(--pb-border-subtle)] bg-[var(--pb-surface-subtle)] text-[var(--pb-text-strong)]",
  success:
    "border-[var(--pb-status-success)] bg-[var(--pb-status-success-soft)] text-[var(--pb-status-success-text)]",
  warning:
    "border-[var(--pb-status-warning)] bg-[var(--pb-status-warning-soft)] text-[var(--pb-status-warning-text)]",
  danger:
    "border-[var(--pb-status-danger)] bg-[var(--pb-status-danger-soft)] text-[var(--pb-status-danger-text)]"
};

export function StatusBadge({
  className,
  variant = "neutral",
  ...props
}: ComponentPropsWithoutRef<"span"> & {
  variant?: StatusBadgeVariant;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}
