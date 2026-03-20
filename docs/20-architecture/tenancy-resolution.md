# Tenancy Resolution

## Rules

- Tenant resolution is a security boundary.
- Post-auth tenant context is resolved from subdomain plus authenticated membership.
- Tenant context is immutable for the request lifetime.
- Tenant ID from client payload is ignored for authorization and data scoping.
- Tenant context is resolved exactly once in middleware and stored in a scoped `TenantContext`.
- Tenant-scoped services/repositories must take `TenantContext` explicitly; no ambient/static tenant context is allowed.
- System-context paths (pre-auth endpoints, provisioning, cleanup jobs) must be explicitly marked as system execution and reviewed.

## Resolution Flow (v1)

1. Resolve requested tenant from host/subdomain.
2. Resolve authenticated user identity.
3. Validate user membership for requested tenant.
4. Validate tenant is active (not expired).
5. Materialize immutable tenant context for the request.

## Trust Model

Trusted inputs:
- Server-issued auth cookie / Identity principal.
- Server-side configuration (for host and tenant routing rules).

Untrusted inputs:
- Request headers (including forwarded headers unless explicitly validated/configured).
- Query-string tenant selectors.
- Client payload tenant identifiers.

Subdomain is routing input only and must match authenticated membership/claim-based tenant context before tenant-scoped access is allowed.

## Failure Behavior

- Unknown tenant: reject request.
- Missing membership: reject request.
- Expired tenant: reject request.
- Resolution failure must happen before tenant-scoped data access.
