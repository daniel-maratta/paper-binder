# Tenancy Resolution

## Rules

- Tenant resolution is a security boundary.
- Post-auth tenant context is resolved from subdomain plus authenticated membership.
- Tenant context is immutable for the request lifetime.
- Tenant ID from client payload is ignored for authorization and data scoping.
- Tenant context is resolved exactly once in middleware and stored in a scoped `TenantContext`.
- Tenant host lookup may resolve host identity before request tenant context is established.
- Request hosts must match the configured root host or a single-label tenant subdomain beneath it; malformed or off-domain hosts are rejected before tenant-scoped handling runs.
- Tenant-scoped services/repositories must take `TenantContext` explicitly; no ambient/static tenant context is allowed.
- System-context paths (pre-auth endpoints, provisioning, cleanup jobs) must be explicitly marked as system execution and reviewed.

## Resolution Flow (v1)

1. Validate the request host against the configured root domain and extract a tenant slug when present.
2. Look up the requested tenant from the extracted host/subdomain.
3. Record whether the request is targeting the root host or a known tenant host.
4. Resolve authenticated user identity when a tenant-host request presents an auth cookie.
5. Validate user membership for the requested tenant.
6. Validate the tenant is active (not expired).
7. Materialize immutable tenant context for the request.

Anonymous tenant-host requests stop after host resolution and continue without an established tenant request context. This preserves tenant-host health checks and lets later authenticated flows fail through normal auth behavior instead of inventing an anonymous tenant context.

## Trust Model

Trusted inputs:
- Server-issued auth cookie / Identity principal.
- Server-side configuration (for host and tenant routing rules).

Untrusted inputs:
- Request headers (including forwarded headers unless explicitly validated/configured).
- Query-string tenant selectors.
- Client payload tenant identifiers.

Subdomain is routing input only and must match authenticated membership/claim-based tenant context before tenant-scoped access is allowed.
Development and Test environments may treat loopback hosts as explicit system-context requests for focused local/debug execution.

## Failure Behavior

- Invalid host or malformed tenant subdomain: reject request.
- Unknown tenant: reject request.
- Missing membership: reject request.
- Expired tenant: reject request.
- Resolution failure must happen before tenant-scoped data access.
- Tenant-host health endpoints remain anonymous and non-versioned even though they run on known tenant hosts.
