import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "../../lib/cn";

type BannerVariant = "notice" | "warning" | "danger";

const bannerVariants: Record<BannerVariant, string> = {
  notice:
    "border-[var(--pb-status-info)] bg-[var(--pb-status-info-soft)] text-[var(--pb-status-info-text)]",
  warning:
    "border-[var(--pb-status-warning)] bg-[var(--pb-status-warning-soft)] text-[var(--pb-status-warning-text)]",
  danger:
    "border-[var(--pb-status-danger)] bg-[var(--pb-status-danger-soft)] text-[var(--pb-status-danger-text)]"
};

export function Banner({
  className,
  variant = "notice",
  children,
  ...props
}: ComponentPropsWithoutRef<"section"> & {
  variant?: BannerVariant;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-[var(--pb-radius-md)] border px-4 py-3 text-sm leading-6 shadow-[0_1px_2px_rgba(20,34,53,0.03)]",
        bannerVariants[variant],
        className
      )}
      role="status"
      {...props}
    >
      {children}
    </section>
  );
}
