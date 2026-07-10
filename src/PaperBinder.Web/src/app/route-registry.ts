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
    description: "Scope, constraints, and reviewer context."
  },
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
