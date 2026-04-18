# ADR-Security: Tenant-Local Impersonation for Demo ("View As")

## Context

The demo requires a way to showcase policy enforcement and RBAC behavior without maintaining multiple real user sessions manually.

We must provide impersonation functionality without introducing cross-tenant privilege escalation or weakening tenant isolation.

Impersonation is security-sensitive and must be constrained.

## Decision

We will implement Tenant-Local Impersonation with the following constraints:

- Only Tenant Admin users may initiate impersonation.
- Impersonation is restricted to users within the same tenant.
- No cross-tenant impersonation is allowed.
- Impersonation state is:
  - Server-controlled, and
  - carried only by the existing signed auth cookie / trusted server-issued context, and
  - logged durably in a tenant-scoped append-only audit table (`tenant_impersonation_audit_events`) with `ImpersonationStarted` and `ImpersonationEnded`.
- The effective user context is derived from trusted claims or signed server-issued context.
- Original actor identity remains available separately from the effective impersonated identity for stop behavior, audit-safe logging, and teardown.
- Arbitrary headers or client-controlled claims are never trusted.
- Audit rows must include `tenant_id`, actor user id, effective user id, timestamp, and correlation id, and tenant-scoped reads/writes must be constructed by `tenant_id`.
- Tenant purge must delete impersonation audit rows under `PurgeTenantAudit` and must not leave per-user impersonation rows behind under `RetainTenantPurgedSummary`.

Impersonation will not mint arbitrary authentication cookies from client input.

## Why

- Enables effective demonstration of RBAC and policy enforcement.
- Preserves strict tenant isolation.
- Maintains security discipline.
- Ensures impersonation activity is auditable.
- Prevents privilege escalation across tenant boundaries.

## Consequences

- Additional authorization checks required on impersonation endpoints.
- Slight increase in authentication complexity.
- All impersonation actions must emit durable audit events.
- Requires clear UI signaling when impersonation is active.
- Existing tenant-host mutation seams that log actor identity must preserve actor vs. effective attribution once impersonation exists.

## Alternatives considered
- No impersonation capability: strongest simplicity, weaker demo ergonomics.
- Global cross-tenant impersonation: unacceptable boundary risk for this project.
