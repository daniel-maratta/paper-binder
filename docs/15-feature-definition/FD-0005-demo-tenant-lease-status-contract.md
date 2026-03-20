# FD-0005 - Demo Tenant Lease Status Contract

## AI Summary

- Tenant lease state is explicit server state exposed via a tenant-lease contract.
- Extension remains allowed only near expiry and capped by max extension count.
- Expired-state responses are deterministic before and after purge.
- UI countdown/extension behavior is driven by API state, not client clocks alone.

## Status
Resolved — integrated into canonical documentation

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
- `POST /api/tenant/lease/extend` applies extension only when remaining lease is <= 10 minutes and extension count is below max.
- Each successful extension adds exactly 10 minutes.
- Maximum extension count is 3.
- Expired tenants are denied tenant-scoped actions and then hard-deleted by worker.

## User-visible behavior
- Tenant shell shows countdown from server-provided lease state.
- Extend action is enabled only when `canExtend=true`.
- Users see clear conflict messages when extension is not allowed.
- Expired tenant host shows safe expired/not-found behavior.

## API / contract impact
Contract additions/clarifications:
- `GET /api/tenant/lease` response includes:
  - `expiresAt`
  - `secondsRemaining`
  - `extensionCount`
  - `maxExtensions`
  - `canExtend`
- `POST /api/tenant/lease/extend` success returns updated lease state.
- If a legacy `POST /api/tenant/extend` route exists, treat it as temporary compatibility alias and deprecate in docs.

ProblemDetails expectations:
- `409` with stable extension-rule error codes when window/count rules fail.
- `410` when tenant is expired but not yet purged.
- `404` after tenant purge completes.

## Domain / architecture impact
- Tenant lease remains mutable intrinsic state (`ExpiresAt`, `ExtensionCount`).
- Extension and expiry transitions emit audit events.
- Worker cleanup cadence and idempotency remain unchanged.

## Security / ops impact
- Tenant lease and extension endpoints require authenticated tenant membership.
- Client-supplied tenant identifiers are ignored for lease operations.
- Lease evaluation uses server time and deterministic comparisons.

## Canonical updates required
- `docs/10-product/user-stories.md` (lease acceptance criteria details)
- `docs/10-product/information-architecture.md` and `docs/10-product/ux-notes.md` (lease indicator behavior)
- `docs/20-architecture/demo-tenant-lease.md` (lease endpoint contract)
- `docs/40-contracts/api-contract.md` (tenant lease payload and extension errors)
- `docs/70-operations/cleanup-jobs-runbook.md` and `docs/70-operations/runbook-local.md` (status/extension verification)

## Open questions
None.

## Resolution outcome
No new ADR required. This definition is consistent with ADR-0003 and current lease architecture.
