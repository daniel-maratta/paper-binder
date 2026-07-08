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
        "rounded-[var(--pb-radius-md)] border px-4 py-3 shadow-[0_1px_2px_rgba(20,34,53,0.03)]",
        alertVariants[variant],
        className
      )}
      role={role}
      {...props}
    />
  );
}

export function AlertTitle({ className, ...props }: ComponentPropsWithoutRef<"h3">) {
  return <h3 className={cn("text-sm font-semibold", className)} {...props} />;
}

export function AlertBody({ className, ...props }: ComponentPropsWithoutRef<"p">) {
  return <p className={cn("mt-1 text-sm leading-6", className)} {...props} />;
}
