import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "../../lib/cn";

export function Card({
  className,
  ...props
}: ComponentPropsWithoutRef<"section">) {
  return (
    <section
      className={cn(
        "rounded-[var(--pb-radius-lg)] border border-[var(--pb-color-border)] bg-white p-6 shadow-[var(--pb-shadow-card)]",
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
      className={cn("text-xl font-semibold tracking-[-0.02em] text-[var(--pb-color-text)]", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: ComponentPropsWithoutRef<"p">) {
  return (
    <p className={cn("text-sm leading-6 text-[var(--pb-color-text-muted)]", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("mt-5 space-y-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentPropsWithoutRef<"footer">) {
  return <footer className={cn("mt-6 flex flex-wrap gap-3", className)} {...props} />;
}

export function CardMeta({
  label,
  value
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-[var(--pb-radius-md)] bg-[var(--pb-color-panel-muted)] px-4 py-3">
      <dt className="text-xs uppercase tracking-[0.16em] text-[var(--pb-color-text-subtle)]">{label}</dt>
      <dd className="mt-2 text-sm font-medium text-[var(--pb-color-text)]">{value}</dd>
    </div>
  );
}
