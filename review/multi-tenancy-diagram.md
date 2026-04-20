# Multi-Tenancy Architecture (Reviewer Summary)

This document summarizes how tenant isolation is enforced as a security boundary.

Canonical rules live in `docs/20-architecture/tenancy-model.md` and `docs/20-architecture/tenancy-resolution.md`.

Scope note: this file covers tenancy mechanics. Security trust model and status-code semantics are centralized in `review/security-model-summary.md`.

## Tenant Resolution Flow

```text
Request Host
  -> Resolve tenant slug from subdomain
  -> Resolve authenticated user
  -> Validate membership for requested tenant
  -> Materialize immutable TenantContext
  -> Execute policy checks and tenant-scoped data access
```

## Isolation Invariants

- Tenant context is established once per request and treated as immutable.
- Client-supplied tenant IDs in route, body, query, or headers are untrusted for scoping.
- Tenant-owned runtime queries must include an explicit `tenant_id` predicate.
- Tenant isolation is enforced by construction, never by filtering results after fetch.
- System-context paths are explicit and separately reviewed.

## Failure Semantics

- Invalid tenant host: `400` `TENANT_HOST_INVALID`.
- Unknown tenant: `404` `TENANT_NOT_FOUND`.
- Missing membership: `403`.
- Expired tenant: `410` before purge, then `404` after purge.
- Resolution failure occurs before tenant-scoped reads or writes.

## Canonical References

- `docs/20-architecture/tenancy-model.md`
- `docs/20-architecture/tenancy-resolution.md`
- `docs/30-security/tenant-isolation.md`
- `docs/20-architecture/system-overview.md`
- `docs/50-engineering/data-access-standards.md`
