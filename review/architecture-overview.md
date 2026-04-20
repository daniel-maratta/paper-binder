# PaperBinder Architecture Overview

This is the one-page reviewer entry point for interview pre-read.

It combines system shape, isolation posture, and request flow so discussion can move quickly from whiteboard context into implementation tradeoffs.

## At a Glance

PaperBinder is a constrained multi-tenant SaaS demo with:

- React SPA frontend
- ASP.NET Core API backend
- PostgreSQL persistence (single shared schema)
- background worker for tenant lease cleanup
- host-derived tenant routing and strict tenant-scoped data access
- no BFF, no SSR, and no realtime push in v1

## Key Tradeoffs

- No BFF in v1: fewer moving parts and clearer API boundary, at the cost of pushing some orchestration to the SPA.
  - Source: `docs/90-adr/ADR-0005-no-bff.md`
- Client-rendered SPA only: simpler hosting/runtime model, at the cost of no SSR and no framework server loaders/actions.
  - Source: `docs/20-architecture/frontend-spa.md`
- Shared-schema multi-tenancy (`tenant_id`): low operational overhead and explicit isolation mechanics, at the cost of strict query-discipline requirements.
  - Source: `docs/20-architecture/tenancy-model.md`
- Policy-based auth at API boundary: consistent authorization enforcement, at the cost of more upfront policy design.
  - Source: `docs/20-architecture/policy-authorization.md`, `docs/90-adr/ADR-0008-identity-auth-boundary-with-dapper-stores.md`
- Host-derived tenant resolution: stronger anti-spoofing posture versus client-provided tenant IDs, at the cost of stricter routing and environment setup.
  - Source: `docs/20-architecture/tenancy-resolution.md`

## Combined Runtime View

```text
[Browser SPA]
      |
      | HTTPS / JSON
      v
[ASP.NET Core API]
  - authentication
  - tenant resolution (host + membership)
  - policy-based authorization
  - application/domain execution
      |
      +-----------------------> [PostgreSQL]
      |                            - tenant-scoped data
      |
      +-----------------------> [Worker]
                                   - lease-expiration cleanup
                                   - hard delete expired tenants
```

## Request Flow Summary

1. User action in SPA triggers API request.
2. API authenticates principal and resolves immutable tenant context.
3. Endpoint policy is evaluated at API boundary.
4. Application/domain logic executes.
5. Tenant-scoped query/command runs against PostgreSQL.
6. Response returns as success or ProblemDetails.

## Isolation Summary

- Tenant isolation is a security boundary.
- Tenant context is resolved once and cannot be mutated during request processing.
- Client-supplied tenant identifiers are untrusted for scoping.
- Data access is tenant-scoped by construction, never by post-fetch filtering.

## What Is Intentionally Excluded in v1

- Cross-tenant sharing
- File uploads and blob pipelines
- In-place document editing/versioning
- Realtime collaboration infrastructure

## Related Reviewer Artifacts

- `review/security-model-summary.md`
- `review/multi-tenancy-diagram.md`
- `review/request-lifecycle.md`
- `review/user-flows.md`
- `review/future-evolution.md`
- `review/ai-surface-map.md` (post-V1 context only)

## Reviewer Discussion Focus

Hands-on discussion should center on:

- tenant resolution and immutable `TenantContext` through request handling
- API-boundary policy enforcement and failure semantics (`403`/`404`/`410`/`409`)
- tenant-scoped data access paths and how the design prevents cross-tenant leakage

## Canonical References

- `docs/20-architecture/system-overview.md`
- `docs/20-architecture/tenancy-resolution.md`
- `docs/20-architecture/authn-authz.md`
- `docs/40-contracts/api-contract.md`
- `docs/00-intent/project-scope.md`
- `docs/00-intent/non-goals.md`
