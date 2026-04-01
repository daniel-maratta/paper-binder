# Data Access Standards
Status: V1 (Implementation Baseline)

## Purpose

Define PaperBinder runtime data-access rules for tenant isolation and auditability.

## Runtime Access Rules

- Runtime query/command paths use Dapper only.
- EF Core is allowed only for migrations/tooling.
- Tenant-owned data access must be tenant-scoped by construction.
- Never fetch broadly and filter tenant scope afterward.
- Repository/query entrypoints for tenant-owned data must take tenant context explicitly.

## Query Construction Rules

- Every tenant-owned table includes `TenantId`.
- Primary runtime queries for tenant-owned entities must include `TenantId` in predicates.
- Prefer composite indexes that include `TenantId` for primary access paths.
- System-context queries are allowed only for explicit reviewed cases such as expiry cleanup.
- Do not hide tenant scoping in ambient/static state.

## Mutation Rules

- Document content is immutable after creation.
- Archive/unarchive changes visibility metadata only.
- Tenant cleanup must be deterministic and idempotent.
- Use explicit transactions for multi-step state changes such as provisioning and cleanup.

## Testing Rules

- Integration tests must prove cross-tenant reads/writes are rejected.
- Persistence changes require coverage for the actual query behavior, not just in-memory logic.
- Time-based lease behavior must use controllable clocks.

## Related Documents

- `docs/30-security/tenant-isolation.md`
- `docs/20-architecture/data-model.md`
- `docs/80-testing/integration-tests.md`
- `docs/90-adr/ADR-0007-persistence-stack-ef-core-migrations-dapper-runtime.md`
