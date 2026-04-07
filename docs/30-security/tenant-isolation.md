# Tenant Isolation

Tenant isolation is a security boundary in PaperBinder.

## AI Summary

- Tenant isolation is enforced by construction, not post-fetch filtering.
- Tenant context is resolved once and treated as immutable per request.
- Tenant scoping is mandatory for tenant-owned data access paths.
- Cross-tenant access is denied by default and validated with integration tests.

## Non-Negotiable Rules

- Every tenant-owned table includes `TenantId`.
- Runtime data access is Dapper-only in v1.
- Tenant scoping is enforced in query construction, never after fetch.
- Cross-tenant data access is rejected by default.
- Tenant context is resolved early and is immutable per request.
- Known tenant hosts are resolved early, but request tenant context is established only after authenticated membership and tenant-expiry validation succeed.
- Authenticated tenant membership is stored in a request-scoped context only after the same validation succeeds.
- Tenant-host-only and system-host-only endpoints are enforced from the resolved-host request context before CSRF and authorization middleware runs.
- Request hosts outside the configured root/tenant pattern are rejected before tenant-scoped handling runs.
- No cross-tenant joins are allowed except explicit, reviewed system-context queries.

## Data Access Expectations

- All repository queries for tenant-owned entities require tenant context.
- Primary access paths include composite indexes containing `TenantId`.
- System-level cleanup jobs may access multiple tenants only for expiry deletion logic.
- Any data access that depends on tenant scope must take tenant context as an explicit input parameter.
- Client tenant hints in headers, query-string values, or payloads must not override host-derived tenant context.
- Ambient/static tenant state is prohibited for scoping decisions.

## Validation Expectations

- Integration tests must prove no cross-tenant reads/writes.
- Security-sensitive changes to isolation rules require an ADR.
