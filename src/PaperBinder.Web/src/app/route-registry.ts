export const rootRouteDefinitions = [
  {
    path: "/" as const,
    label: "Provision",
    title: "Provision a demo tenant",
    description: "Create a tenant, review one-time credentials, then continue to the tenant host."
  },
  {
    path: "/login" as const,
    label: "Login",
    title: "Root-host login",
    description: "Sign in with existing demo credentials and redirect with the server-provided URL."
  },
  {
    path: "/about" as const,
    label: "About",
    title: "About PaperBinder",
    description: "Checkpoint scope, product constraints, and reviewer context."
  }
] as const;

export const tenantNavigationItems = [
  {
    path: "/app" as const,
    label: "Home",
    description: "Tenant-shell dashboard placeholder and lease visibility."
  },
  {
    path: "/app/binders" as const,
    label: "Binders",
    description: "Tenant-scoped binder list placeholder and table baseline."
  },
  {
    path: "/app/users" as const,
    label: "Users",
    description: "Tenant-admin route placeholder and shared table state coverage."
  }
] as const;
