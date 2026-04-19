import { Alert, AlertBody, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { CardMeta } from "../components/ui/card";
import type { TenantLeaseSummary } from "../api/client";

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) {
    return "Expired";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

export function TenantLeaseBanner({
  lease,
  countdownSeconds,
  isExtending,
  onExtend
}: {
  lease: TenantLeaseSummary;
  countdownSeconds: number;
  isExtending: boolean;
  onExtend: () => Promise<void>;
}) {
  const variant = countdownSeconds <= 0 ? "danger" : lease.canExtend ? "warning" : "success";
  const title =
    countdownSeconds <= 0
      ? "Lease expired."
      : lease.canExtend
        ? "Lease extension window open."
        : "Lease active.";
  const detail =
    countdownSeconds <= 0
      ? "Tenant routes stay visible, but new activity will fail until an admin extends the lease or the tenant is purged."
      : lease.canExtend
        ? "The current tenant session can request a server-authoritative lease extension now."
        : "Countdown is local presentation only. Extension eligibility remains server-authoritative.";

  return (
    <Alert className="overflow-hidden" variant={variant}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <AlertTitle>{title}</AlertTitle>
          <AlertBody>{detail}</AlertBody>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[28rem]">
          <CardMeta label="Expires" value={formatDateTime(lease.expiresAt)} />
          <CardMeta label="Countdown" value={formatCountdown(countdownSeconds)} />
          <CardMeta
            label="Extensions"
            value={`${lease.extensionCount} of ${lease.maxExtensions}`}
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          disabled={!lease.canExtend && !isExtending}
          isLoading={isExtending}
          onClick={() => {
            void onExtend();
          }}
          type="button"
        >
          {lease.canExtend ? "Extend lease" : "Extend when window opens"}
        </Button>
      </div>
    </Alert>
  );
}
