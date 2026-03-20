# API Contract
Status: Current (v1)

## Scope
- This document points to the canonical API contract location.
- It prevents architecture-lane duplication of contract details.

## Non-goals
- No duplicate endpoint definitions in architecture docs.
- No divergence from canonical contract content.

Canonical API contract for v1 is maintained at:
- `docs/40-contracts/api-contract.md`
- `docs/40-contracts/api-versioning.md`

Tenancy contract reminder:
- Tenant scope is resolved from request host/subdomain plus server-side membership validation.
- No tenant identifier is accepted in API routes for tenant-scoped operations.
- Tenant lease operations apply only to the current resolved tenant via:
  - `GET /api/tenant/lease`
  - `POST /api/tenant/lease/extend`
- Correlation boundary contract is enforced via `X-Correlation-Id` and `traceId`.
- API version negotiation applies to `/api/*` routes via `X-Api-Version` and does not apply to non-API SPA asset or health routes.
