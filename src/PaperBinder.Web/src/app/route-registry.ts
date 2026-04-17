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
    description: "Live tenant dashboard, lease visibility, and reviewer quick actions."
  },
  {
    path: "/app/binders" as const,
    label: "Binders",
    description: "Visible binders, inline binder creation, and binder-detail entry."
  },
  {
    path: "/app/users" as const,
    label: "Users",
    description: "Tenant-admin user list, user creation, and role-change management."
  }
] as const;
