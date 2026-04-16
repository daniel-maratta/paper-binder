import { BrowserRouter, Routes } from "react-router-dom";
import { createPaperBinderApiClient, type PaperBinderApiClient } from "./api/client";
import { InvalidHostRoutes } from "./app/invalid-host";
import type { HostContext } from "./app/host-context";
import { resolveHostContext } from "./app/host-context";
import { RootHostRoutes } from "./app/root-host";
import { TenantHostRoutes } from "./app/tenant-host";
import { frontendEnvironment } from "./environment";

const browserHostContext = resolveHostContext(window.location, frontendEnvironment);
const browserApiClient = createPaperBinderApiClient({
  apiOrigin: browserHostContext.apiOrigin
});

export function AppRouter({
  apiClient,
  hostContext
}: {
  apiClient: PaperBinderApiClient;
  hostContext: HostContext;
}) {
  return (
    <Routes>
      {hostContext.kind === "root" ? RootHostRoutes({ hostContext }) : null}
      {hostContext.kind === "tenant" ? TenantHostRoutes({ apiClient, hostContext }) : null}
      {hostContext.kind === "invalid" ? InvalidHostRoutes({ hostContext }) : null}
    </Routes>
  );
}

export default function App({
  apiClient = browserApiClient,
  hostContext = browserHostContext
}: {
  apiClient?: PaperBinderApiClient;
  hostContext?: HostContext;
}) {
  return (
    <BrowserRouter>
      <AppRouter apiClient={apiClient} hostContext={hostContext} />
    </BrowserRouter>
  );
}
