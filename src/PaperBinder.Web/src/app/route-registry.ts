export const rootRouteDefinitions = [
  {
    path: "/" as const,
    label: "Product",
    title: "PaperBinder product overview",
    description: "See the live workspace story and the product-led public path."
  },
  {
    path: "/start-demo" as const,
    label: "Demo",
    title: "Start a live demo workspace",
    description: "Create a disposable workspace and continue into the live product."
  },
  {
    path: "/about" as const,
    label: "About",
    title: "About PaperBinder",
    description: "Scope, product truth, and supporting context."
  },
] as const;

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
    description: "Manage workspace users, roles, and view-as access."
  }
] as const;
