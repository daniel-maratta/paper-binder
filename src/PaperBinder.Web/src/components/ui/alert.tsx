import type { ComponentPropsWithoutRef } from "react";
import { cn } from "../../lib/cn";

type AlertVariant = "info" | "success" | "warning" | "danger";

const alertVariants: Record<AlertVariant, string> = {
  info:
    "border-[var(--pb-status-info)] bg-[var(--pb-status-info-soft)] text-[var(--pb-text-strong)]",
  success:
    "border-[var(--pb-status-success)] bg-[var(--pb-status-success-soft)] text-[var(--pb-text-strong)]",
  warning:
    "border-[var(--pb-status-warning)] bg-[var(--pb-status-warning-soft)] text-[var(--pb-text-strong)]",
  danger:
    "border-[var(--pb-status-danger)] bg-[var(--pb-status-danger-soft)] text-[var(--pb-text-strong)]"
};

export function Alert({
  className,
  variant = "info",
  ...props
}: ComponentPropsWithoutRef<"section"> & {
  variant?: AlertVariant;
}) {
  const role = variant === "danger" ? "alert" : "status";

  return (
    <section
      className={cn(
        "rounded-[calc(var(--pb-radius-md)+4px)] border px-4 py-4 shadow-[var(--pb-shadow-card)]",
        alertVariants[variant],
        className
      )}
      role={role}
      {...props}
    />
  );
}

export function AlertTitle({ className, ...props }: ComponentPropsWithoutRef<"h3">) {
  return <h3 className={cn("text-[0.95rem] font-semibold tracking-[-0.01em]", className)} {...props} />;
}

export function AlertBody({ className, ...props }: ComponentPropsWithoutRef<"p">) {
  return <p className={cn("mt-1.5 text-sm leading-6", className)} {...props} />;
}
