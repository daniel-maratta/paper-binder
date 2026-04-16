import type { ComponentPropsWithoutRef } from "react";
import { cn } from "../../lib/cn";

type AlertVariant = "info" | "success" | "warning" | "danger";

const alertVariants: Record<AlertVariant, string> = {
  info: "border-[var(--pb-color-info)] bg-[var(--pb-color-info-soft)] text-[var(--pb-color-text)]",
  success:
    "border-[var(--pb-color-success)] bg-[var(--pb-color-success-soft)] text-[var(--pb-color-text)]",
  warning:
    "border-[var(--pb-color-warning)] bg-[var(--pb-color-warning-soft)] text-[var(--pb-color-text)]",
  danger: "border-[var(--pb-color-danger)] bg-[var(--pb-color-danger-soft)] text-[var(--pb-color-text)]"
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
      className={cn("rounded-[var(--pb-radius-md)] border px-4 py-3", alertVariants[variant], className)}
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
