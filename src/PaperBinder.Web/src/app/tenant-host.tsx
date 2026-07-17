import { Route } from "react-router-dom";
import type { PaperBinderApiClient } from "../api/client";
import type { TenantHostContext } from "./host-context";
import { BinderDetailPage } from "./tenant-binder-detail-route";
import { BindersPage } from "./tenant-binders-route";
import { DashboardPage } from "./tenant-dashboard-route";
import { DocumentDetailPage } from "./tenant-document-detail-route";
import {
  TenantShell,
  defaultTenantHostNavigator,
  type TenantHostNavigator
} from "./tenant-shell";
import { UsersPage } from "./tenant-users-route";
import { Alert, AlertBody, AlertTitle } from "../components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

function TenantNotFoundPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>This workspace page is unavailable</CardTitle>
        <CardDescription>
          Unknown tenant routes stay inside the current workspace shell and never infer a different tenant.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="warning">
          <AlertTitle>Use a known workspace route</AlertTitle>
          <AlertBody>
            <code>/app</code>, <code>/app/binders</code>, <code>/app/binders/:binderId</code>,{" "}
            <code>/app/documents/:documentId</code>, and <code>/app/users</code> are the available workspace routes in
            this demo.
          </AlertBody>
        </Alert>
      </CardContent>
    </Card>
  );
}

export type { TenantHostNavigator } from "./tenant-shell";

export function TenantHostRoutes({
  apiClient,
  hostContext,
  navigator = defaultTenantHostNavigator
}: {
  apiClient: PaperBinderApiClient;
  hostContext: TenantHostContext;
  navigator?: TenantHostNavigator;
}) {
  return (
    <Route element={<TenantShell apiClient={apiClient} hostContext={hostContext} navigator={navigator} />}>
      <Route element={<DashboardPage />} path="/app" />
      <Route element={<BindersPage />} path="/app/binders" />
      <Route element={<BinderDetailPage />} path="/app/binders/:binderId" />
      <Route element={<DocumentDetailPage />} path="/app/documents/:documentId" />
      <Route element={<UsersPage />} path="/app/users" />
      <Route element={<TenantNotFoundPage />} path="*" />
    </Route>
  );
}
