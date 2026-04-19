import { Alert, AlertBody, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { CardMeta } from "../components/ui/card";
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
    <Alert className="overflow-hidden" variant="warning">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <AlertTitle>Impersonation active.</AlertTitle>
          <AlertBody>
            Authorizing as {impersonation.effective.email} ({formatRole(impersonation.effective.role)}).
          </AlertBody>
          <AlertBody>
            Original actor {impersonation.actor.email} ({formatRole(impersonation.actor.role)}) stays available for
            stop behavior and audit-safe signaling.
          </AlertBody>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[28rem]">
          <CardMeta label="Actor" value={impersonation.actor.email} />
          <CardMeta label="Effective" value={impersonation.effective.email} />
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
          Stop impersonation
        </Button>
      </div>
    </Alert>
  );
}
