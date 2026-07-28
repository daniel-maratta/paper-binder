import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "../../lib/cn";

type ButtonVariant = "primary" | "secondary" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: ButtonVariant;
  isLoading?: boolean;
  children: ReactNode;
  ref?: Ref<HTMLButtonElement>;
};

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "!text-white border-[var(--pb-action-primary)] bg-[var(--pb-action-primary)] shadow-[0_4px_10px_rgba(15,23,42,0.18)] hover:border-[var(--pb-action-primary-hover)] hover:bg-[var(--pb-action-primary-hover)] active:border-[var(--pb-action-primary-active)] active:bg-[var(--pb-action-primary-active)] disabled:border-[#40506a] disabled:bg-[#40506a] disabled:!text-white",
  secondary:
    "!text-[var(--pb-action-secondary-text)] border-[var(--pb-border-subtle)] bg-[var(--pb-action-secondary)] hover:border-[var(--pb-border-strong)] hover:bg-[var(--pb-action-secondary-hover)] disabled:border-[#d5dee8] disabled:bg-[#f8fafc] disabled:!text-[#51657f]",
  danger:
    "!text-white border-[var(--pb-status-danger)] bg-[var(--pb-status-danger)] hover:border-[var(--pb-status-danger-text)] hover:bg-[var(--pb-status-danger-text)] disabled:border-[#b96b69] disabled:bg-[#b96b69] disabled:!text-white"
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
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-[8px] border px-4 py-2 text-sm font-semibold no-underline transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pb-focus-ring)] disabled:cursor-not-allowed disabled:shadow-none",
    isDisabled ? "cursor-not-allowed" : null,
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
