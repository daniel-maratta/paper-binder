const requiredFrontendKeys = [
  "VITE_PAPERBINDER_ROOT_URL",
  "VITE_PAPERBINDER_API_BASE_URL",
  "VITE_PAPERBINDER_TENANT_BASE_DOMAIN"
] as const;

type FrontendKey = (typeof requiredFrontendKeys)[number];
type FrontendEnvironmentSource = Partial<Record<FrontendKey, string>>;

type FrontendEnvironment = {
  rootUrl: string;
  apiBaseUrl: string;
  tenantBaseDomain: string;
  rootHost: string;
  apiOrigin: string;
};

declare const __PAPERBINDER_FRONTEND_ENV_FALLBACK__: Record<FrontendKey, string>;

function getRequiredValue(
  env: FrontendEnvironmentSource,
  key: FrontendKey,
  fallbackEnv: FrontendEnvironmentSource = {}
): string {
  const value = env[key] ?? fallbackEnv[key];

  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  throw new Error(`Missing required frontend environment variable ${key}.`);
}

function parseUrl(value: string, key: FrontendKey): string {
  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    throw new Error(`Frontend environment variable ${key} must be a valid absolute URL.`);
  }
}

function parseTenantBaseDomain(value: string): string {
  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue.length === 0 || normalizedValue.includes("://") || normalizedValue.includes("/")) {
    throw new Error(
      "Frontend environment variable VITE_PAPERBINDER_TENANT_BASE_DOMAIN must be a host or host:port value."
    );
  }

  return normalizedValue;
}

export function readFrontendEnvironment(
  env: FrontendEnvironmentSource,
  fallbackEnv: FrontendEnvironmentSource = {}
): FrontendEnvironment {
  const rootUrl = parseUrl(
    getRequiredValue(env, "VITE_PAPERBINDER_ROOT_URL", fallbackEnv),
    "VITE_PAPERBINDER_ROOT_URL"
  );
  const apiBaseUrl = parseUrl(
    getRequiredValue(env, "VITE_PAPERBINDER_API_BASE_URL", fallbackEnv),
    "VITE_PAPERBINDER_API_BASE_URL"
  );

  return {
    rootUrl,
    apiBaseUrl,
    tenantBaseDomain: parseTenantBaseDomain(
      getRequiredValue(env, "VITE_PAPERBINDER_TENANT_BASE_DOMAIN", fallbackEnv)
    ),
    rootHost: new URL(rootUrl).host.toLowerCase(),
    apiOrigin: new URL(apiBaseUrl).origin
  };
}

export const frontendEnvironment = readFrontendEnvironment(import.meta.env, __PAPERBINDER_FRONTEND_ENV_FALLBACK__);

export type { FrontendEnvironment };
