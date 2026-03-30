# ADR-0007: Persistence Stack Uses PostgreSQL with Dapper Runtime and EF Core Migrations

Status: Accepted

## Context

CP3 introduces the first real persistence baseline for PaperBinder. The repository needs:

- a real PostgreSQL schema that can evolve through repeatable migrations
- a runtime query path for the API and worker that keeps tenant scoping explicit
- integration tests that exercise the same database engine and migration path used by the local stack

PaperBinder already treats runtime data-access discipline as a core architectural constraint:

- runtime query and command paths are Dapper-only in v1
- EF Core is allowed only for migrations and tooling
- PostgreSQL is the canonical database engine for the local and deployment topology

CP3 therefore needs a concrete persistence stack decision, not just a general preference.

## Decision

Use the following persistence stack for PaperBinder v1:

- PostgreSQL as the database engine
- Npgsql as the PostgreSQL ADO.NET provider and data-source implementation
- Dapper for runtime reads and writes in API and worker code
- EF Core with the Npgsql provider for schema migrations and design-time tooling only
- `Testcontainers.PostgreSql` for Docker-backed integration tests that provision isolated databases and apply migrations before exercising runtime code

The runtime boundary is strict:

- application and domain code do not take EF Core dependencies
- runtime query and command paths do not use EF Core
- EF Core remains confined to the migration/tooling path under infrastructure and the dedicated migrations executable

## Why

- Keeps tenant-scoped runtime SQL explicit instead of hiding access patterns behind a second runtime ORM.
- Preserves the documented v1 rule that Dapper is the runtime data-access mechanism.
- Uses one database engine across local Compose, migrations, runtime services, and integration tests, which reduces behavioral drift.
- Gives the repository a reviewer-credible migration workflow without introducing a broader repository abstraction or pulling later checkpoint scope forward.
- Keeps schema evolution maintainable through EF Core migrations while preserving a lightweight runtime access path.

## Consequences

- Positive: schema changes run through a dedicated migration executable and container before the app host is considered ready.
- Positive: runtime persistence stays explicit and easy to review at the SQL boundary.
- Positive: Docker-backed integration tests exercise real PostgreSQL behavior instead of substitutes with different semantics.
- Negative: the solution now carries both Dapper and EF Core/Npgsql dependencies, so the runtime/tooling boundary must stay explicit in code review and docs.
- Negative: full merge-gate validation for persistence now depends on Docker availability for the PostgreSQL test container path.
- Negative: EF Core migration assets and Dapper runtime SQL can drift if future changes ignore the documented boundary and testing requirements.

## Alternatives considered

- EF Core for both runtime access and migrations: rejected because PaperBinder v1 deliberately prefers explicit runtime SQL and already treats mixed runtime ORM usage as out of bounds.
- Raw ADO.NET plus handwritten SQL migration scripts: rejected because it increases migration-management overhead and weakens the reviewer-facing schema evolution story.
- SQLite or in-memory substitutes for integration tests: rejected because they would diverge from PostgreSQL behavior and undermine CP3's credibility goal.
- PostgreSQL without Docker-backed integration coverage: rejected because CP3 must prove that migrations and runtime persistence work against the real engine, not just compile.
