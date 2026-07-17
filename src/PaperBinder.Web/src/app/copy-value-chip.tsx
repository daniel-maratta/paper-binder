import { cn } from "../lib/cn";

export function CopyValueChip({
  className,
  compact = false,
  label,
  onCopy,
  value
}: {
  className?: string;
  compact?: boolean;
  label: string;
  onCopy: () => void;
  value: string;
}) {
  return (
    <button
      aria-label={`Copy ${label}`}
      className={cn("pb-auth-copy-chip", compact && "pb-auth-copy-chip--compact", className)}
      onClick={onCopy}
      type="button"
    >
      <span className="pb-auth-code">{value}</span>
    </button>
  );
}

export async function writeClipboardValue(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}
