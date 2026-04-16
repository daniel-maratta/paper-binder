import type { FrontendEnvironment } from "../environment";

export type BrowserLocationLike = Pick<
  Location,
  "origin" | "host" | "hostname" | "pathname" | "search" | "hash"
>;

type HostContextBase = {
  currentOrigin: string;
  currentHost: string;
  currentPath: string;
  apiOrigin: string;
  environment: FrontendEnvironment;
};

export type RootHostContext = HostContextBase & {
  kind: "root";
  debugAlias: boolean;
};

export type TenantHostContext = HostContextBase & {
  kind: "tenant";
  tenantSlug: string;
};

export type InvalidHostContext = HostContextBase & {
  kind: "invalid";
  reason: string;
};

export type HostContext = RootHostContext | TenantHostContext | InvalidHostContext;

const loopbackHostnames = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function normalizeHost(host: string): string {
  return host.trim().toLowerCase();
}

function isLoopbackHostname(hostname: string): boolean {
  return loopbackHostnames.has(hostname.trim().toLowerCase());
}

function tryResolveTenantSlug(currentHost: string, tenantBaseDomain: string): string | null {
  const suffix = `.${tenantBaseDomain}`;

  if (!currentHost.endsWith(suffix)) {
    return null;
  }

  const candidate = currentHost.slice(0, -suffix.length);
  if (!candidate || candidate.includes(".")) {
    return null;
  }

  return candidate;
}

export function resolveHostContext(
  locationLike: BrowserLocationLike,
  environment: FrontendEnvironment
): HostContext {
  const currentHost = normalizeHost(locationLike.host);
  const currentOrigin = locationLike.origin;
  const currentPath = `${locationLike.pathname}${locationLike.search}${locationLike.hash}`;

  if (currentHost === environment.rootHost) {
    return {
      kind: "root",
      currentOrigin,
      currentHost,
      currentPath,
      apiOrigin: currentOrigin,
      environment,
      debugAlias: false
    };
  }

  if (isLoopbackHostname(locationLike.hostname)) {
    return {
      kind: "root",
      currentOrigin,
      currentHost,
      currentPath,
      apiOrigin: currentOrigin,
      environment,
      debugAlias: true
    };
  }

  const tenantSlug = tryResolveTenantSlug(currentHost, environment.tenantBaseDomain);
  if (tenantSlug !== null) {
    return {
      kind: "tenant",
      currentOrigin,
      currentHost,
      currentPath,
      apiOrigin: currentOrigin,
      environment,
      tenantSlug
    };
  }

  return {
    kind: "invalid",
    currentOrigin,
    currentHost,
    currentPath,
    apiOrigin: environment.apiOrigin,
    environment,
    reason:
      "The current host does not match the configured root host or a single-label tenant subdomain."
  };
}
