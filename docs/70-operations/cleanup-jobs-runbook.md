# Cleanup Jobs Runbook

## Scope

This runbook covers lease-expiration cleanup for expired demo tenants.

## Required Behavior

- Cleanup execution is idempotent and safe to retry.
- Hard delete includes tenant-owned user records and documents.
- Cleanup must not remove active tenants.
- Failures are logged with correlation fields and retried on the next run.

## Audit Retention Modes

Exactly one retention mode must be configured and documented:
- Purge tenant-specific audit events with tenant data, or
- Retain only a minimal non-sensitive `TenantPurged` summary event.

Canonical config key:
- `PAPERBINDER_AUDIT_RETENTION_MODE`
  - `PurgeTenantAudit`
  - `RetainTenantPurgedSummary`
