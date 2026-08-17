export const rootRouteDefinitions = [
  {
    path: "/" as const,
    label: "Product",
    title: "Home",
    description: "See the product, the public entry points, and the demo path."
  },
  {
    path: "/start-demo" as const,
    label: "Demo",
    title: "Demo",
    description: "Create a temporary workspace and continue into the product."
  },
  {
    path: "/about" as const,
    label: "About",
    title: "About PaperBinder",
    description: "Product scope, demo constraints, and supporting context."
  },
] as const;

export const publicStandaloneRouteDefinitions = [
  {
    path: "/login" as const,
    label: "Sign in",
    title: "Sign in",
    description: "Return to an existing temporary workspace with generated credentials."
  }
] as const;

export const publicLoginRoutePath = publicStandaloneRouteDefinitions[0].path;

export const tenantNavigationItems = [
  {
    path: "/app" as const,
    label: "Dashboard",
    description: "Lease state, recent binders, and next actions in this workspace."
  },
  {
    path: "/app/binders" as const,
    label: "Binders",
    description: "Open binders, add documents, and manage binder access."
  },
  {
    path: "/app/users" as const,
    label: "Users",
    description: "Manage workspace users, roles, and view as actions."
  }
] as const;
