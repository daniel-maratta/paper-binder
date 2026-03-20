# Data Model

## Multi-Tenant Shape

- Tenant-owned entities include `tenant_id uuid not null`.
- Tenant-owned relationships must preserve tenant consistency.
- Cross-tenant joins are prohibited in application query paths.

## Relationship Enforcement

- Prefer composite foreign keys including `tenant_id` for tenant-owned relationships.
- If composite foreign keys are impractical, enforce tenant consistency with constraints/triggers and integration tests.

## Mutability Posture

- Prefer append-only modeling for record-like entities.
- Mutable updates are allowed only when mutation is intrinsic state (for example tenant status or lease extension) or the entity is not record-like.
- Required mutable updates must emit audit events.
