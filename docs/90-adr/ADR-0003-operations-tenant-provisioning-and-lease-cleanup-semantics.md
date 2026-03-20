# ADR-Operations: Tenant Provisioning and Lease Cleanup with Hard Deletes

## Context

Tenants in the demo are short-lived and governed by a lease duration.

The system must:

- Provision tenants reliably.
- Seed initial data safely.
- Expire tenants automatically.
- Prevent data persistence beyond lease expiry.

We must choose between soft deletes and hard deletes for expired tenants.

## Decision

Provisioning:

- Tenant creation and initial data seeding occur within a single database transaction.
- ProvisioningState tracks lifecycle (Pending, Active, Failed).
- Raw credentials are never stored.

Cleanup:

- A BackgroundService performs scheduled lease-expiration checks.
- Expired tenants are transitioned to an expired state.
- All tenant-owned data is hard deleted.
- A final audit event records the purge action.

We will not implement soft deletes.
Hard delete includes tenant-owned user records and documents.
Audit retention on purge follows one of two explicit modes:
- Purge tenant-specific audit events, or
- Retain only a minimal non-sensitive `TenantPurged` summary event.

## Why

- Hard deletes keep the database small and predictable.
- Lease semantics align with ephemeral demo tenants.
- Avoids complexity of soft-delete filters across all queries.
- Simplifies reasoning about tenant isolation.
- BackgroundService avoids third-party job dependencies.

## Consequences

- Expired tenant data cannot be recovered.
- Cleanup logic must be carefully tested.
- Audit retention must account for purge semantics.
- Provisioning and cleanup must be idempotent and failure-safe.

## Alternatives considered
- Soft-delete retention model: easier recovery but higher complexity and storage growth.
- Multi-stage asynchronous seed workflow: flexible but unnecessary for current scale.
