# Worker Jobs

## Purpose

Worker jobs enforce bounded lifecycle behavior for demo tenants.

## Expiry Cleanup Job (v1)

- Cadence target: every 1 minute via `PAPERBINDER_LEASE_CLEANUP_INTERVAL_SECONDS`.
- Selection rule: tenants with `ExpiresAt <= now`.
- Action: hard-delete tenant and all tenant-owned records in explicit system context.
- Hard delete scope includes the tenant row, user memberships, current tenant-owned user records, binders, binder policies, and documents.
- Selection and purge order must be deterministic and safe to retry.
- Behavior must be idempotent.
- SLA target: process expired tenants within 5 minutes of expiry (best effort).

## Safety Rules

- Cleanup must not delete active tenants.
- Cleanup queries must be deterministic and safe to retry.
- Cross-tenant reads are allowed only for system-level expiry scanning.
- Per-tenant purge work must use explicit transaction boundaries and FK-safe delete ordering.
- Audit retention mode must be exactly one of:
  - `PurgeTenantAudit`
  - `RetainTenantPurgedSummary`
- `RetainTenantPurgedSummary` keeps only a minimal non-sensitive `tenant_purged` structured log event.
- `PurgeTenantAudit` does not keep a tenant-specific success summary after deletion.
