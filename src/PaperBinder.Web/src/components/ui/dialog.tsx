import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "../../lib/cn";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  title,
  description,
  children,
  ...props
}: Omit<ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, "title"> & {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 bg-[rgba(16,45,69,0.35)]" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 w-[min(92vw,36rem)] -translate-x-1/2 -translate-y-1/2 rounded-[var(--pb-radius-lg)] border border-[var(--pb-color-border)] bg-white p-6 shadow-[0_24px_80px_-45px_rgba(16,45,69,0.65)] focus:outline-none",
          className
        )}
        {...props}
      >
        <div className="space-y-2">
          <DialogPrimitive.Title className="text-lg font-semibold text-[var(--pb-color-text)]">
            {title}
          </DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="text-sm leading-6 text-[var(--pb-color-text-muted)]">
              {description}
            </DialogPrimitive.Description>
          ) : null}
        </div>
        <div className="mt-5 space-y-4">{children}</div>
        <DialogPrimitive.Close
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-full border border-[var(--pb-color-border)] px-2 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--pb-color-text-muted)] transition hover:bg-[var(--pb-color-panel-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pb-color-primary)]"
        >
          Close
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogFooter({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("flex flex-wrap justify-end gap-3", className)} {...props} />;
}
