# Data Model

## Multi-Tenant Shape

- Tenant-owned entities include `tenant_id uuid not null`.
- Tenant-owned relationships must preserve tenant consistency.
- Cross-tenant joins are prohibited in application query paths.

## Relationship Enforcement

- Prefer composite foreign keys including `tenant_id` for tenant-owned relationships.
- If composite foreign keys are impractical, enforce tenant consistency with constraints/triggers and integration tests.
- CP9 binder shape:
  - `binders` is a direct tenant-owned table keyed by `id` with `tenant_id`, `name`, and `created_at_utc`.
  - `binder_policies` is tenant-scoped and references `binders` through composite key `(tenant_id, binder_id)`.
- CP10 document shape:
  - `documents` is a direct tenant-owned table keyed by `id` with `tenant_id`, `binder_id`, `title`, `content_type`, raw markdown `content`, optional `supersedes_document_id`, `created_at_utc`, and nullable `archived_at_utc`.
  - `documents` references `binders` through composite key `(tenant_id, binder_id)`.
  - `documents` uses a same-binder self-reference `(tenant_id, binder_id, supersedes_document_id)` -> `(tenant_id, binder_id, id)` so cross-binder supersedes links are impossible at the schema boundary.

## Mutability Posture

- Prefer append-only modeling for record-like entities.
- Mutable updates are allowed only when mutation is intrinsic state (for example tenant status or lease extension) or the entity is not record-like.
- Binder-policy updates are mutable security state, must emit structured security events, and must not widen tenant scope.
- Document rows stay immutable after creation; archive/unarchive mutates `archived_at_utc` only.
