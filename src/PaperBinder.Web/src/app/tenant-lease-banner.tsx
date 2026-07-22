import { Alert, AlertBody, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
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
        : "Demo lease active.";
  const detail =
    countdownSeconds <= 0
      ? "This workspace has expired. Existing UI may stay visible, but new actions will fail until an admin extends the lease or cleanup removes the workspace."
      : lease.canExtend
        ? "This workspace can be extended by 15 minutes now before it expires."
      : "This workspace remains active. The extend action appears only after the server opens the final extension window.";

  return (
    <Alert className="pb-auth-banner" variant={variant}>
      <div className="pb-auth-banner__layout">
        <div className="max-w-2xl">
          <AlertTitle>{title}</AlertTitle>
          <AlertBody>{detail}</AlertBody>
        </div>
        <div className="pb-auth-banner__metrics">
          <div className="pb-auth-banner__metric">
            <p className="pb-auth-stat-label">Expires</p>
            <p className="pb-auth-banner__metric-value">{formatDateTime(lease.expiresAt)}</p>
          </div>
          <div className="pb-auth-banner__metric">
            <p className="pb-auth-stat-label">Demo expires in</p>
            <p className="pb-auth-banner__metric-value">{formatCountdown(countdownSeconds)}</p>
          </div>
          <div className="pb-auth-banner__metric">
            <p className="pb-auth-stat-label">Extensions</p>
            <p className="pb-auth-banner__metric-value">
              {lease.extensionCount} of {lease.maxExtensions}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          disabled={!lease.canExtend || isExtending}
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
