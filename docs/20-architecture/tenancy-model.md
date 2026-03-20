# Tenancy Model

## Tenant Identity

- `tenantId`: UUID primary identifier used in persistence and authorization.
- `tenantSlug`: subdomain label used for routing (for example `acme` in `acme.paperbinder.local`).

## Resolution Order

1. Resolve subdomain from request host.
2. Map subdomain to `tenantSlug`.
3. Look up `tenantId` from `tenantSlug`.
4. Validate authenticated user membership for resolved tenant.
5. Materialize immutable tenant context for the request.

Tenant identifiers in query/body/headers are not trusted for scoping.

## Data Model Invariants

- Every tenant-owned row includes `tenant_id`.
- Every tenant-scoped runtime query includes a `tenant_id` predicate.
- Tenant-owned relationships preserve tenant consistency with composite keys (or constraint/trigger plus tests when composite keys are impractical).

## Lifecycle and Lease

- Tenant includes provision timestamp and expiration timestamp.
- Provisioning sets `expires_at = provisioned_at + 60 minutes`.
- Extension allowed only when remaining lease is less than or equal to 10 minutes.
- Each extension adds 10 minutes.
- Maximum 3 extensions.
- Cleanup worker cadence target is every 1 minute.
- Expired tenant data is hard-deleted with best-effort completion within 5 minutes of `expires_at`.

## Cross-Tenant Access Policy

No cross-tenant access is allowed in user request paths.

Enforcement layers:
- Middleware resolves tenant context once and rejects mismatches early.
- API boundary applies policy-based authorization.
- Data access layer applies mandatory `tenant_id` predicates on all tenant-owned reads/writes.
