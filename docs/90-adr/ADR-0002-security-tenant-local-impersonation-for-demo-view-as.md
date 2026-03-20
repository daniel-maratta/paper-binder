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
  - Logged via AuditEvents (ImpersonationStarted, ImpersonationEnded).
- The effective user context is derived from trusted claims or signed server-issued context.
- Arbitrary headers or client-controlled claims are never trusted.

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
- All impersonation actions must emit audit events.
- Requires clear UI signaling when impersonation is active.

## Alternatives considered
- No impersonation capability: strongest simplicity, weaker demo ergonomics.
- Global cross-tenant impersonation: unacceptable boundary risk for this project.
