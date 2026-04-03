# Tenancy Resolution

## Rules

- Tenant resolution is a security boundary.
- Post-auth tenant context is resolved from subdomain plus authenticated membership.
- Tenant context is immutable for the request lifetime.
- Tenant ID from client payload is ignored for authorization and data scoping.
- Tenant context is resolved exactly once in middleware and stored in a scoped `TenantContext`.
- Request hosts must match the configured root host or a single-label tenant subdomain beneath it; malformed or off-domain hosts are rejected before tenant-scoped handling runs.
- Tenant-scoped services/repositories must take `TenantContext` explicitly; no ambient/static tenant context is allowed.
- System-context paths (pre-auth endpoints, provisioning, cleanup jobs) must be explicitly marked as system execution and reviewed.

## Resolution Flow (v1)

1. Validate the request host against the configured root domain and extract a tenant slug when present.
2. Look up the requested tenant from the extracted host/subdomain.
3. Resolve authenticated user identity.
4. Validate user membership for requested tenant.
5. Validate tenant is active (not expired).
6. Materialize immutable tenant context for the request.

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
