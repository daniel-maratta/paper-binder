# Security Model Summary (Reviewer)

This summary captures the security posture reviewers should validate first.

Canonical details are in `docs/30-security/` and architecture/contracts docs.

## Security Boundary Model

```text
Internet -> Host routing and abuse controls -> API authn/authz -> Tenant-scoped data access -> DB
```

Key point: tenant isolation is a security boundary, not a convenience feature.

## Trust Model

Trusted:
- server-issued auth cookie / identity principal
- server host and tenant routing configuration

Untrusted:
- client tenant IDs in route, body, query, or headers
- forwarded headers unless explicitly validated

## Enforcement Sequence

1. Resolve tenant from host/subdomain.
2. Resolve authenticated user.
3. Validate membership for resolved tenant.
4. Materialize immutable `TenantContext`.
5. Enforce endpoint policy requirements.
6. Execute tenant-scoped data access.
7. Apply authenticated tenant-host mutation limits to unsafe `/api/*` routes when applicable.

## Data Isolation Rules

- Tenant-owned rows include `tenant_id`.
- Runtime tenant-owned queries include explicit tenant predicate.
- No filter-after-fetch for tenancy.
- No cross-tenant joins in user request paths.
- System-context cross-tenant paths are explicit and reviewed.

## Failure Semantics (Reviewer Signals)

- `400`: invalid tenant host.
- `403`: membership/policy failure.
- `404`: unknown tenant/resource or already purged tenant.
- `410`: tenant expired but not yet purged.
- `409`: business conflict (for example lease extension outside allowed window).
- `429`: rate-limit rejection with `Retry-After` when available.

## Canonical References

- `docs/30-security/tenant-isolation.md`
- `docs/20-architecture/tenancy-resolution.md`
- `docs/20-architecture/authn-authz.md`
- `docs/20-architecture/policy-authorization.md`
- `docs/40-contracts/api-contract.md`
