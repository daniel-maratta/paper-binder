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
    "border-[var(--pb-color-primary)] bg-[var(--pb-color-primary)] text-white hover:bg-[#de6a1a]",
  secondary:
    "border-[var(--pb-color-border-strong)] bg-white text-[var(--pb-color-text)] hover:bg-[var(--pb-color-panel-muted)]",
  danger: "border-[var(--pb-color-danger)] bg-[var(--pb-color-danger)] text-white hover:bg-[#95261f]"
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
    "inline-flex items-center justify-center gap-2 rounded-[var(--pb-radius-md)] border px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pb-color-primary)] disabled:cursor-not-allowed disabled:opacity-60",
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
