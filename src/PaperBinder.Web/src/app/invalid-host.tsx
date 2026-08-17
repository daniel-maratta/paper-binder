import { Route } from "react-router-dom";
import { Alert, AlertBody, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardMeta, CardTitle } from "../components/ui/card";
import type { InvalidHostContext } from "./host-context";

function InvalidHostPage({ hostContext }: { hostContext: InvalidHostContext }) {
  const mainSiteUrl = new URL("/", hostContext.environment.rootUrl).toString();

  return (
    <div className="min-h-screen bg-[var(--pb-surface-gradient)] px-6 py-10 text-[var(--pb-color-text)] lg:px-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>This PaperBinder address is unavailable</CardTitle>
            <CardDescription>
              Use the main PaperBinder site or a supported workspace address.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <CardMeta label="Current host" value={hostContext.currentHost} />
            <CardMeta label="Main site host" value={hostContext.environment.rootHost} />
            <CardMeta label="Workspace base domain" value={hostContext.environment.tenantBaseDomain} />
          </CardContent>
        </Card>
        <Alert variant="warning">
          <AlertTitle>Use a known PaperBinder address</AlertTitle>
          <AlertBody>{hostContext.reason}</AlertBody>
        </Alert>
        <div className="flex flex-wrap gap-3">
          <Button asChild type="button">
            <a href={mainSiteUrl}>Return to main site</a>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function InvalidHostRoutes({ hostContext }: { hostContext: InvalidHostContext }) {
  return <Route element={<InvalidHostPage hostContext={hostContext} />} path="*" />;
}
