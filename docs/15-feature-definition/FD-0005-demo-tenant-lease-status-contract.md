# FD-0005 - Demo Tenant Lease Status Contract

## AI Summary

- Tenant lease state is explicit server state exposed via a tenant-lease contract.
- Extension remains allowed only near expiry and capped by max extension count.
- Expired-state responses are deterministic before and after purge.
- UI countdown and extension behavior is driven by API state, not client clocks alone.

## Status
Resolved - integrated into canonical documentation

## Canonical locations
- docs/40-contracts/api-contract.md
- docs/20-architecture/demo-tenant-lease.md
- docs/10-product/user-stories.md
- docs/70-operations/runbook-local.md

## Why this exists
Lease rules are documented, but there is no single API contract for reading lease status and driving extension UX decisions. This definition removes ambiguity around status fields and conflict semantics.

## Scope
This definition covers:
- Tenant lease status read contract.
- Extension action response semantics.
- Expiry-state response behavior.

This definition does not cover:
- Configurable per-tenant commercial plans.
- Grace periods beyond defined v1 lease rules.
- Recovery of purged tenants.

## Decision
Tenant lease state is exposed through a dedicated tenant-lease endpoint and extension action.

Rules:
- Canonical endpoints are `GET /api/tenant/lease` and `POST /api/tenant/lease/extend`.
- `GET /api/tenant/lease` returns authoritative lease fields.
- `POST /api/tenant/lease/extend` requires `TenantAdmin`, a valid CSRF token, and the dedicated lease-extend rate limiter.
- `POST /api/tenant/lease/extend` applies extension only when remaining lease is greater than `0`, less than or equal to `PAPERBINDER_LEASE_EXTENSION_MINUTES`, and extension count is below max.
- Each successful extension adds exactly `PAPERBINDER_LEASE_EXTENSION_MINUTES`.
- Maximum extension count is 3.
- Expired tenants are denied tenant-scoped actions and then hard-deleted by worker.

## User-visible behavior
- Tenant shell shows countdown from server-provided lease state.
- Extend action is enabled only when `canExtend=true`.
- Users see clear conflict messages when extension is not allowed.
- Expired tenant host shows safe expired/not-found behavior.

## API / contract impact
Contract additions and clarifications:
- `GET /api/tenant/lease` response includes:
  - `expiresAt`
  - `secondsRemaining`
  - `extensionCount`
  - `maxExtensions`
  - `canExtend`
- `POST /api/tenant/lease/extend` success returns updated lease state.
- Client-supplied tenant identifiers and duration values are ignored for lease operations.

ProblemDetails expectations:
- `409 TENANT_LEASE_EXTENSION_WINDOW_NOT_OPEN` when the extension window is not open.
- `409 TENANT_LEASE_EXTENSION_LIMIT_REACHED` when the configured maximum extensions have already been used.
- `429 RATE_LIMITED` with `Retry-After` when the lease-extend route budget is exhausted.
- `410` when tenant is expired but not yet purged.
- `404` after tenant purge completes.

## Domain / architecture impact
- Tenant lease remains mutable intrinsic state (`ExpiresAt`, `ExtensionCount`).
- Extension and purge outcomes use structured logging; CP11 does not add a durable lease-history or audit table.
- Worker cleanup cadence and idempotency remain unchanged.

## Security / ops impact
- `GET /api/tenant/lease` requires authenticated tenant membership.
- `POST /api/tenant/lease/extend` requires `TenantAdmin`, CSRF protection, and route-scoped throttling.
- Client-supplied tenant identifiers are ignored for lease operations.
- Lease evaluation uses server time and deterministic comparisons.

## Canonical updates required
- `docs/10-product/user-stories.md` (lease acceptance criteria details)
- `docs/10-product/information-architecture.md` and `docs/10-product/ux-notes.md` (lease indicator behavior)
- `docs/20-architecture/demo-tenant-lease.md` (lease endpoint contract)
- `docs/40-contracts/api-contract.md` (tenant lease payload and extension errors)
- `docs/70-operations/cleanup-jobs-runbook.md` and `docs/70-operations/runbook-local.md` (status and extension verification)

## Open questions
None.

## Resolution outcome
No new ADR required. This definition is consistent with ADR-0003 and current lease architecture.
