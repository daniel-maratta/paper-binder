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
      "w-full rounded-[var(--pb-radius-md)] border border-[var(--pb-color-border-strong)] bg-white px-3 py-2 text-sm text-[var(--pb-color-text)] shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pb-color-primary)] disabled:cursor-not-allowed disabled:bg-[var(--pb-color-panel-muted)]",
      (control.props as ControlProps).className
    )
  });

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[var(--pb-color-text)]" htmlFor={fieldId}>
        {label}
      </label>
      {enhancedControl}
      {hint ? (
        <p className="text-sm text-[var(--pb-color-text-muted)]" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-[var(--pb-color-danger)]" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
