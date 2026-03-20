# Identity (ASP.NET Core Identity)

## v1 Identity Model

- ASP.NET Core Identity handles username/password authentication.
- Demo users belong to exactly one tenant in v1.
- Tenant assignment is determined by membership after successful authentication.
- After login, user is redirected to the tenant subdomain.

## Authorization Model

- Roles are the RBAC primitive.
- v1 uses one effective role per user per tenant.
- Future versions may support additive multi-role aggregation.
- Enforcement is policy-based at API boundary.
- Named policies/requirements (for example `BinderRead`, `BinderWrite`, `TenantAdmin`) gate endpoints.
- Ad-hoc role checks in handlers are not allowed.
