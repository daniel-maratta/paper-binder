import { useEffect, useId, useState } from "react";
import { writeClipboardValue } from "./copy-value-chip";

type CredentialDisplayFieldVariant = "public" | "auth";

export function CredentialDisplayField({
  className,
  copyButtonLabel,
  hint,
  hideButtonLabel,
  label,
  onCopyResult,
  sensitive = false,
  showButtonLabel,
  value,
  variant
}: {
  className?: string;
  copyButtonLabel: string;
  hint: string;
  hideButtonLabel?: string;
  label: string;
  onCopyResult?: (copied: boolean, label: string) => void;
  sensitive?: boolean;
  showButtonLabel?: string;
  value: string;
  variant: CredentialDisplayFieldVariant;
}) {
  const inputId = useId();
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    setIsRevealed(false);
  }, [value]);

  useEffect(() => {
    if (!copied && !copyFailed) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopied(false);
      setCopyFailed(false);
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copied, copyFailed]);

  async function handleCopy() {
    const didCopy = await writeClipboardValue(value);
    setCopied(didCopy);
    setCopyFailed(!didCopy);
    onCopyResult?.(didCopy, label);
  }

  const showLabel = showButtonLabel ?? `Show ${label.toLowerCase()}`;
  const hideLabel = hideButtonLabel ?? `Hide ${label.toLowerCase()}`;
  const copyTooltip = copied ? "Copied" : copyFailed ? "Copy unavailable" : "Copy to clipboard";

  return (
    <div className={["pb-credential-field", `pb-credential-field--${variant}`, className].filter(Boolean).join(" ")}>
      <div className="pb-credential-field__header">
        <label className="pb-credential-field__label" htmlFor={inputId}>
          {label}
        </label>
        <div className="pb-credential-field__actions">
          {sensitive ? (
            <button
              aria-label={isRevealed ? hideLabel : showLabel}
              className={`pb-credential-icon-button pb-credential-icon-button--${variant}`}
              onClick={() => {
                setIsRevealed((currentValue) => !currentValue);
              }}
              type="button"
            >
              {isRevealed ? <HideIcon /> : <ShowIcon />}
              <span className="pb-credential-icon-button__tooltip">{isRevealed ? hideLabel : showLabel}</span>
            </button>
          ) : null}
          <button
            aria-label={copyButtonLabel}
            className={`pb-credential-icon-button pb-credential-icon-button--${variant}`}
            onClick={() => {
              void handleCopy();
            }}
            type="button"
          >
            <CopyIcon />
            <span className="pb-credential-icon-button__tooltip">{copyTooltip}</span>
          </button>
        </div>
      </div>
      <div className="pb-credential-field__control">
        <input
          autoComplete="off"
          className="font-mono"
          id={inputId}
          readOnly
          spellCheck={false}
          type={sensitive && !isRevealed ? "password" : "text"}
          value={value}
        />
      </div>
      <p className="pb-credential-field__hint">{hint}</p>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" className="pb-credential-icon-button__icon" viewBox="0 0 20 20">
      <path d="M7 3.5A2.5 2.5 0 0 0 4.5 6v8A2.5 2.5 0 0 0 7 16.5h7A2.5 2.5 0 0 0 16.5 14V6A2.5 2.5 0 0 0 14 3.5H7Z" />
      <path d="M4.5 12.5h-1A2.5 2.5 0 0 1 1 10V4A2.5 2.5 0 0 1 3.5 1.5h7A2.5 2.5 0 0 1 13 4v1" />
    </svg>
  );
}

function ShowIcon() {
  return (
    <svg aria-hidden="true" className="pb-credential-icon-button__icon" viewBox="0 0 20 20">
      <path d="M1.5 10s3-5.5 8.5-5.5S18.5 10 18.5 10 15.5 15.5 10 15.5 1.5 10 1.5 10Z" />
      <circle cx="10" cy="10" r="2.5" />
    </svg>
  );
}

function HideIcon() {
  return (
    <svg aria-hidden="true" className="pb-credential-icon-button__icon" viewBox="0 0 20 20">
      <path d="M2 3l16 14" />
      <path d="M7.2 5.4A8.73 8.73 0 0 1 10 4.5c5.5 0 8.5 5.5 8.5 5.5a16.54 16.54 0 0 1-2.85 3.51" />
      <path d="M12.12 12.22A2.5 2.5 0 0 1 7.78 7.88" />
      <path d="M5.05 9.07A16.18 16.18 0 0 0 1.5 10s3 5.5 8.5 5.5a8.8 8.8 0 0 0 3.08-.54" />
    </svg>
  );
}
