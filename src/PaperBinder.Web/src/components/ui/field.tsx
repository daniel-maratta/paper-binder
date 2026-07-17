import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useId
} from "react";
import { cn } from "../../lib/cn";

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
};

type ControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  className?: string;
};

export function Field({ label, hint, error, children }: FieldProps) {
  const fieldId = useId();
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const control = Children.only(children);
  if (!isValidElement(control)) {
    throw new Error("Field expects a single valid form control child.");
  }

  const enhancedControl = cloneElement(control as ReactElement<ControlProps>, {
    id: fieldId,
    "aria-describedby": describedBy,
    "aria-invalid": Boolean(error),
    className: cn(
      "w-full rounded-[8px] border border-[var(--pb-border-strong)] bg-white px-3.5 py-2.5 text-sm text-[var(--pb-text-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pb-focus-ring)] disabled:cursor-not-allowed disabled:bg-[var(--pb-surface-subtle)]",
      (control.props as ControlProps).className
    )
  });

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-[var(--pb-color-text)]" htmlFor={fieldId}>
        {label}
      </label>
      {enhancedControl}
      {hint ? (
        <p className="text-[0.82rem] leading-5 text-[var(--pb-color-text-muted)]" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="text-[0.82rem] font-medium text-[var(--pb-color-danger)]" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
