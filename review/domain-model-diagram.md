# Domain Model (Reviewer Summary)

This document summarizes the core v1 domain shape.

Canonical model rules live in `docs/20-architecture/data-model.md` and `docs/10-product/domain-nouns.md`.

## Entity Relationship Snapshot

```text
[Tenant]
  |-- [TenantUser]
  |-- [Binder] --contains--> [Document]
  |-- [TenantLease]
  `-- [AuditEvent]

[Binder] --has policy--> [BinderPolicy]
[Document] --optional supersedes--> [Document]
```

## Core Constraints

- Every tenant-owned entity is scoped by `tenant_id`.
- Documents are immutable text records in v1.
- Binders are logical containers; no nesting in v1.
- Binder policies layer on top of endpoint policy checks.
- Mutable updates are limited to intrinsic state (for example, lease and status transitions).

## Canonical References

- `docs/20-architecture/data-model.md`
- `docs/20-architecture/policy-authorization.md`
- `docs/00-intent/project-scope.md`
- `docs/10-product/domain-nouns.md`
- `docs/90-adr/ADR-0001-domain-immutable-documents-with-supersedes-chain.md`
