# Worker Jobs

## Purpose

Worker jobs enforce bounded lifecycle behavior for demo tenants.

## Expiry Cleanup Job (v1)

- Cadence target: every 1 minute.
- Selection rule: tenants with `ExpiresAt <= now`.
- Action: hard-delete tenant and all tenant-owned records.
- Hard delete scope includes tenant-owned users and documents.
- Behavior must be idempotent.
- SLA target: process expired tenants within 5 minutes of expiry (best effort).

## Safety Rules

- Cleanup must not delete active tenants.
- Cleanup queries must be deterministic and safe to retry.
- Cross-tenant reads are allowed only for system-level expiry scanning.
- Audit retention mode must be exactly one of:
  - `PurgeTenantAudit`
  - `RetainTenantPurgedSummary`
