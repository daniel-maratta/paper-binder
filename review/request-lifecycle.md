# Request Lifecycle (Reviewer Summary)

This document summarizes the request path and enforcement order.

Canonical behavior is defined in `docs/20-architecture/system-overview.md`, `docs/20-architecture/tenancy-resolution.md`, and `docs/40-contracts/api-contract.md`.

## End-to-End Flow

```text
Client request
  -> Edge routing and host validation
  -> API middleware pipeline
  -> Authentication principal resolution
  -> Tenant resolution from host + membership
  -> Endpoint policy authorization
  -> Application/domain execution
  -> Tenant-scoped data access
  -> ProblemDetails or success response
```

## Processing Guarantees

- Tenant context is resolved before tenant-scoped data access.
- Authorization is policy-based at the API boundary.
- Handlers do not rely on caller-provided role arguments.
- Data access applies explicit tenant predicates for tenant-owned data.
- Correlation IDs and structured error responses are part of the API contract.

## Common Failure Outcomes

- `403`: policy or membership failure.
- `404`: unknown tenant/resource, or tenant already purged.
- `410`: tenant expired but not yet purged.
- `409`: valid request shape but business-state conflict (for example invalid lease extension window).

## Canonical References

- `docs/20-architecture/system-overview.md`
- `docs/20-architecture/tenancy-resolution.md`
- `docs/20-architecture/policy-authorization.md`
- `docs/40-contracts/api-contract.md`
- `docs/90-adr/ADR-0021-api-versioning-and-correlation-id-contract.md`
