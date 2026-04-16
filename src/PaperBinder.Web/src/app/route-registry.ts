export const rootRouteDefinitions = [
  {
    path: "/" as const,
    label: "Overview",
    title: "Root-host foundation",
    description: "Static shell and form placeholders for the later provisioning and login flows."
  },
  {
    path: "/login" as const,
    label: "Login",
    title: "Login route placeholder",
    description: "Auth form composition is visible here, but submission wiring waits for CP13."
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
