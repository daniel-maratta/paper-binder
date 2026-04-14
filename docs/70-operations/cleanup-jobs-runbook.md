# Cleanup Jobs Runbook

## Scope

This runbook covers lease-expiration cleanup for expired demo tenants.

## Required Behavior

- Cleanup execution is idempotent and safe to retry.
- Hard delete includes the tenant row, user memberships, tenant-owned user records, binders, binder policies, and documents.
- Cleanup must not remove active tenants.
- Worker logs `tenant_cleanup_cycle_started`, `tenant_cleanup_cycle_completed`, and `tenant_cleanup_cycle_failed` for each cycle.
- Per-tenant purge failures are logged as `tenant_purge_failed` and retried on the next cycle.

## Audit Retention Modes

Exactly one retention mode must be configured and documented:
- `PurgeTenantAudit`: purge tenant-specific audit events and do not keep a tenant-specific success summary after deletion.
- `RetainTenantPurgedSummary`: keep only a minimal non-sensitive `tenant_purged` structured log event.

Canonical config key:
- `PAPERBINDER_AUDIT_RETENTION_MODE`
  - `PurgeTenantAudit`
  - `RetainTenantPurgedSummary`

Cleanup cadence config key:
- `PAPERBINDER_LEASE_CLEANUP_INTERVAL_SECONDS`
