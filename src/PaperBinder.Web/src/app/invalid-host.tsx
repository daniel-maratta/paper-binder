import { Route } from "react-router-dom";
import { Alert, AlertBody, AlertTitle } from "../components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardMeta, CardTitle } from "../components/ui/card";
import type { InvalidHostContext } from "./host-context";

function InvalidHostPage({ hostContext }: { hostContext: InvalidHostContext }) {
  return (
    <div className="min-h-screen bg-[var(--pb-surface-gradient)] px-6 py-10 text-[var(--pb-color-text)] lg:px-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Host context is not recognized</CardTitle>
            <CardDescription>
              PaperBinder stays host-aware. The SPA only renders root-host or single-label tenant-host route spaces.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <CardMeta label="Current host" value={hostContext.currentHost} />
            <CardMeta label="Configured root host" value={hostContext.environment.rootHost} />
            <CardMeta label="Tenant base domain" value={hostContext.environment.tenantBaseDomain} />
          </CardContent>
        </Card>
        <Alert variant="warning">
          <AlertTitle>Safe fallback only</AlertTitle>
          <AlertBody>{hostContext.reason}</AlertBody>
        </Alert>
      </div>
    </div>
  );
}

export function InvalidHostRoutes({ hostContext }: { hostContext: InvalidHostContext }) {
  return <Route element={<InvalidHostPage hostContext={hostContext} />} path="*" />;
}
