import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

type ButtonVariant = "primary" | "secondary" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: ButtonVariant;
  isLoading?: boolean;
  children: ReactNode;
};

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "border-[var(--pb-action-primary)] bg-[var(--pb-action-primary)] text-white hover:border-[var(--pb-action-primary-hover)] hover:bg-[var(--pb-action-primary-hover)] active:border-[var(--pb-action-primary-active)] active:bg-[var(--pb-action-primary-active)]",
  secondary:
    "border-[var(--pb-border-subtle)] bg-[var(--pb-action-secondary)] text-[var(--pb-action-secondary-text)] hover:border-[var(--pb-border-strong)] hover:bg-[var(--pb-action-secondary-hover)]",
  danger:
    "border-[var(--pb-status-danger)] bg-[var(--pb-status-danger)] text-white hover:border-[var(--pb-status-danger-text)] hover:bg-[var(--pb-status-danger-text)]"
};

export function Button({
  asChild = false,
  variant = "primary",
  className,
  disabled,
  isLoading = false,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  const isDisabled = disabled || isLoading;
  const baseClassName = cn(
    "inline-flex items-center justify-center gap-2 rounded-[var(--pb-radius-md)] border px-4 py-2 text-sm font-semibold shadow-[0_1px_2px_rgba(20,34,53,0.04)] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pb-focus-ring)] disabled:cursor-not-allowed disabled:opacity-60",
    buttonVariants[variant],
    className
  );

  if (asChild) {
    return (
      <Comp
        className={baseClassName}
        aria-busy={isLoading || undefined}
        aria-disabled={isDisabled ? true : undefined}
        data-loading={isLoading || undefined}
        {...props}
      >
        {children}
      </Comp>
    );
  }

  return (
    <Comp
      className={baseClassName}
      aria-busy={isLoading || undefined}
      data-loading={isLoading || undefined}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <span
          aria-hidden="true"
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      ) : null}
      <span>{children}</span>
    </Comp>
  );
}
