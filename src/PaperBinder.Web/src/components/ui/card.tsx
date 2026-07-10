import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "../../lib/cn";

export function Card({
  className,
  ...props
}: ComponentPropsWithoutRef<"section">) {
  return (
    <section
      className={cn(
        "rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,252,255,0.96))] p-5 shadow-[var(--pb-shadow-card)] sm:p-6",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentPropsWithoutRef<"header">) {
  return <header className={cn("space-y-1.5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentPropsWithoutRef<"h2">) {
  return (
    <h2
      className={cn("text-[1.45rem] font-semibold tracking-[-0.03em] text-[var(--pb-color-text)]", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: ComponentPropsWithoutRef<"p">) {
  return (
    <p className={cn("text-[0.95rem] leading-6 text-[var(--pb-color-text-muted)]", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("mt-4 space-y-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentPropsWithoutRef<"footer">) {
  return <footer className={cn("mt-5 flex flex-wrap gap-3", className)} {...props} />;
}

export function CardMeta({
  label,
  value,
  className
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--pb-radius-md)] border border-[var(--pb-border-subtle)] bg-[linear-gradient(180deg,rgba(244,248,252,0.96),rgba(235,242,249,0.9))] px-4 py-3.5",
        className
      )}
    >
      <dt className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--pb-text-subtle)]">{label}</dt>
      <dd className="mt-2 text-sm font-semibold leading-6 text-[var(--pb-text-strong)]">{value}</dd>
    </div>
  );
}
