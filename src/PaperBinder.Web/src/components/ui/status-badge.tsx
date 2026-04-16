import type { ComponentPropsWithoutRef } from "react";
import { cn } from "../../lib/cn";

type StatusBadgeVariant = "neutral" | "success" | "warning" | "danger";

const badgeVariants: Record<StatusBadgeVariant, string> = {
  neutral:
    "border-[var(--pb-color-border)] bg-[var(--pb-color-panel-muted)] text-[var(--pb-color-text)]",
  success: "border-[var(--pb-color-success)] bg-[var(--pb-color-success-soft)] text-[var(--pb-color-success)]",
  warning: "border-[var(--pb-color-warning)] bg-[var(--pb-color-warning-soft)] text-[var(--pb-color-warning-text)]",
  danger: "border-[var(--pb-color-danger)] bg-[var(--pb-color-danger-soft)] text-[var(--pb-color-danger)]"
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
