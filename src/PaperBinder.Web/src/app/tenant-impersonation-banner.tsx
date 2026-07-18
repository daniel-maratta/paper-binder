import { Alert, AlertBody, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import type { TenantImpersonationStatus, TenantRole } from "../api/client";

function formatRole(role: TenantRole): string {
  switch (role) {
    case "TenantAdmin":
      return "Tenant admin";
    case "BinderWrite":
      return "Binder write";
    case "BinderRead":
      return "Binder read";
    default:
      return role;
  }
}

export function TenantImpersonationBanner({
  impersonation,
  isStopping,
  onStop
}: {
  impersonation: TenantImpersonationStatus;
  isStopping: boolean;
  onStop: () => Promise<TenantImpersonationStatus>;
}) {
  if (!impersonation.isImpersonating) {
    return null;
  }

  return (
    <Alert className="pb-auth-banner" variant="warning">
      <div className="pb-auth-banner__layout">
        <div className="max-w-2xl">
          <AlertTitle>View as is active.</AlertTitle>
          <AlertBody>
            Actions now use {impersonation.effective.email} ({formatRole(impersonation.effective.role)}).
          </AlertBody>
          <AlertBody>
            You can stop view as at any time and return to {impersonation.actor.email} (
            {formatRole(impersonation.actor.role)}).
          </AlertBody>
        </div>
        <div className="pb-auth-banner__metrics">
          <div className="pb-auth-banner__metric">
            <p className="pb-auth-stat-label">Actor</p>
            <p className="pb-auth-banner__metric-value">{impersonation.actor.email}</p>
          </div>
          <div className="pb-auth-banner__metric">
            <p className="pb-auth-stat-label">Effective</p>
            <p className="pb-auth-banner__metric-value">{impersonation.effective.email}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          isLoading={isStopping}
          onClick={() => {
            void onStop();
          }}
          type="button"
          variant="secondary"
        >
          Stop view as
        </Button>
      </div>
    </Alert>
  );
}
