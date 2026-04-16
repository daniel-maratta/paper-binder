import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "../../lib/cn";

type BannerVariant = "notice" | "warning" | "danger";

const bannerVariants: Record<BannerVariant, string> = {
  notice: "border-[var(--pb-color-info)] bg-[var(--pb-color-info-soft)]",
  warning: "border-[var(--pb-color-warning)] bg-[var(--pb-color-warning-soft)]",
  danger: "border-[var(--pb-color-danger)] bg-[var(--pb-color-danger-soft)]"
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
        "rounded-[var(--pb-radius-md)] border px-4 py-3 text-sm leading-6 text-[var(--pb-color-text)]",
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
