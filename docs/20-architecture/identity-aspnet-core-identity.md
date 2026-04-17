# Identity (ASP.NET Core Identity)

## v1 Identity Model

- ASP.NET Core Identity handles email/password authentication.
- Identity managers are used with custom Dapper-backed runtime stores; EF Core is not used for runtime auth data access.
- The built-in `PasswordHasher<TUser>` is the explicit v1 password hashing strategy.
- User credentials live in `users`, and tenant linkage lives in `user_tenants`.
- Demo users belong to exactly one tenant in v1.
- Tenant assignment is determined by membership after successful authentication.
- After login, user is redirected to the tenant subdomain.
- Login runs only on the root host, logout runs only on tenant hosts, and both share one parent-domain auth cookie.
- Authenticated unsafe `/api/*` routes require the paired CSRF cookie and `X-CSRF-TOKEN` header.
- Root-host browser login submits only `email`, `password`, and `challengeToken`; tenant-host browser logout returns to the configured root-host `/login`.

## Boundary Rules

- ASP.NET Core Identity types stay confined to API and Infrastructure code.
- Application-facing code uses tenant membership abstractions rather than Identity role types.
- Tenant context is not materialized for authenticated tenant-host requests until membership and expiry validation succeed.
- Anonymous tenant-host requests may still resolve the host, but they do not receive an established tenant request context.

## Authorization Model

- Roles are the RBAC primitive.
- v1 uses one effective role per user per tenant.
- Future versions may support additive multi-role aggregation.
- CP6 stores canonical tenant roles (`TenantAdmin`, `BinderWrite`, `BinderRead`) on `user_tenants`.
- CP8 enforces named API-boundary policies from a request-scoped tenant membership context established during tenant resolution.
- Tenant-user creation validates passwords with Identity password validators and persists `users` plus `user_tenants` in one Dapper transaction rather than calling `UserManager.CreateAsync()`.
- Ad-hoc role checks in handlers are not allowed.
