# Phase 3 - Product Domain

Checkpoints: CP9, CP10, CP11

## Goal

Implement the core product domain (binders, documents, lease lifecycle) within the proven security boundary, completing the backend product surface.

## Entry Conditions

- Phase 2 exit criteria are satisfied.
- Tenant isolation, auth, and RBAC are validated and enforced.
- V1 scope constraints for immutable DB-backed text documents are confirmed.
- Lease/TTL rules are documented and agreed.

## Checkpoints

### CP9 - Binder Domain And Policy Model

- Binder schema, repositories, commands/queries, and API endpoints.
- Binder policy read/update behavior and `inherit` / `restricted_roles` handling.
- Tenant-scoped query/index strategy and contract/doc updates.
- Integration tests for binder reads/writes and cross-tenant denial.

### CP10 - Document Domain And Immutable Document Rules

- Document schema, repositories, and create/read/list endpoints.
- Immutable document rules, supersedes metadata, and archive/unarchive behavior.
- Safe-source document rendering strategy.
- Unit/integration tests for immutability, archive filtering, and tenant isolation.

### CP11 - Worker Runtime And Lease Lifecycle

- Worker host, scheduling setup, and structured worker logging.
- Expired-tenant cleanup orchestration with idempotent retry-safe behavior.
- `GET /api/tenant/lease` and `POST /api/tenant/lease/extend` with documented rules.
- Integration tests for cleanup idempotency, extension limits, expired-not-purged behavior, no-touch active tenants.

## Exit Criteria

- Binder operations are tenant-scoped by construction.
- Binder policy behavior matches API and product docs.
- No document content mutation path exists.
- Document behavior matches the canonical immutable-document rules.
- Cleanup is deterministic and idempotent.
- Lease endpoints match documented rules and failure semantics.
- All domain operations are proven tenant-isolated via integration tests.

## Task Integration

Each checkpoint should map to one or more tasks under `docs/05-taskboard/tasks/`. Domain invariants (immutability, tenant scoping) are release-blocking; mark tasks accordingly. Reference the checkpoint ID in task context fields.

## Key References

- [execution-plan.md](../execution-plan.md) - Full checkpoint details
- [docs/15-feature-definition/README.md](../../15-feature-definition/README.md) - Feature definitions
- [docs/40-contracts/api-contract.md](../../40-contracts/api-contract.md) - API contract
