# FD-0007 - Tenant Purge Audit Retention Mode

## AI Summary

- Expired demo tenants are hard-deleted with deterministic worker semantics.
- Exactly one audit-retention mode must be configured.
- Retained audit data after purge must be minimal and non-sensitive.
- Purge execution is idempotent and safe to retry.

## Status
Resolved — integrated into canonical documentation

## Canonical locations
- docs/20-architecture/worker-jobs.md
- docs/70-operations/cleanup-jobs-runbook.md
- docs/30-security/secrets-and-config.md
- docs/40-contracts/api-contract.md

## Why this exists
ADR and operations docs define hard-delete cleanup and two retention modes, but teams still need one feature-level contract that makes mode selection and startup validation explicit.

## Scope
This definition covers:
- Purge behavior for expired tenants.
- Audit retention mode choices and constraints.
- Validation and observability expectations for purge jobs.

This definition does not cover:
- Data recovery for purged tenants.
- Long-term analytics pipelines.
- Generalized retention policies for non-tenant system data.

## Decision
Tenant purge uses hard-delete semantics with mutually exclusive audit retention modes.

Rules:
- Worker selects tenants where `ExpiresAt <= now`.
- Purge hard-deletes tenant-owned users, binders, documents, and related tenant-owned rows.
- Exactly one mode is configured:
  - `PurgeTenantAudit`: remove tenant-specific audit events.
  - `RetainTenantPurgedSummary`: keep only minimal non-sensitive `TenantPurged` summary event.
- Startup validation fails if no mode or multiple modes are configured.

## User-visible behavior
- Expired demo tenants become inaccessible and are removed shortly after expiry.
- No recovery workflow is exposed in v1.
- If summary retention mode is enabled, no user-facing data from deleted tenant remains accessible.

## API / contract impact
- No new interactive API endpoint is required.
- Tenant-scoped endpoints return expired/not-found states as defined by the lease contract during and after purge.

## Domain / architecture impact
- Purge runs in explicit system execution context and never impersonates end users.
- Purge and retention mode logic must be deterministic and idempotent.
- Purge completion emits audit output according to selected retention mode.

## Security / ops impact
- Retained summary event must avoid sensitive fields (no credential values, no document content, no user emails).
- Purge runs are logged with correlation fields and outcome metrics.
- Operational docs must state the configured retention mode unambiguously.

## Canonical updates required
- `docs/20-architecture/worker-jobs.md` (retention mode enforcement details)
- `docs/70-operations/cleanup-jobs-runbook.md` (mode config and validation steps)
- `docs/30-security/tenant-isolation.md` (post-expiry isolation guarantees as needed)
- `docs/40-contracts/api-contract.md` (error semantics references for post-purge access)
- `docs/80-testing/integration-tests.md` (mode-specific purge assertions)

## Open questions
None.

## Resolution outcome
No new ADR required. This definition concretizes ADR-0003 and current audit-retention constraints.
