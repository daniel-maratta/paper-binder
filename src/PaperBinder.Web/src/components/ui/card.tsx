import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "../../lib/cn";

export function Card({
  className,
  ...props
}: ComponentPropsWithoutRef<"section">) {
  return (
    <section
      className={cn(
        "rounded-[12px] border border-[var(--pb-border-subtle)] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] sm:p-6",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentPropsWithoutRef<"header">) {
  return <header className={cn("space-y-2", className)} {...props} />;
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
  return <div className={cn("mt-5 space-y-4", className)} {...props} />;
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
        "rounded-[10px] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface)] px-4 py-3.5",
        className
      )}
    >
      <dt className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--pb-text-subtle)]">{label}</dt>
      <dd className="mt-2 text-sm font-semibold leading-6 text-[var(--pb-text-strong)]">{value}</dd>
    </div>
  );
}
