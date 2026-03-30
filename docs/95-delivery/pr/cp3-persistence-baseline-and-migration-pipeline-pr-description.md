# CP3 PR Description: Persistence Baseline And Migration Pipeline
Status: Draft

## Checkpoint
- `CP3`: Persistence Baseline And Migration Pipeline
- Task IDs: `T-0015`

## Summary
- Adds the first real persistence baseline: EF Core migration assets, a dedicated migration executable/container, and a baseline tenant lease table.
- Adds Dapper-oriented runtime database infrastructure with connection, transaction, and clock abstractions wired into the API and worker hosts.
- Replaces the fake database integration pattern with a PostgreSQL Testcontainers harness that provisions isolated databases and applies migrations per test scope.
- Updates operations, testing, README, and taskboard docs so the schema workflow is documented as implemented behavior rather than future intent.

## Scope Boundaries
- Included:
  - baseline schema migration workflow and `PaperBinder.Migrations` runtime
  - runtime persistence wiring for connections, transactions, readiness checks, and clocks
  - Docker Compose migration service plus manual migration script
  - Postgres-backed integration harness and matching doc propagation
- Not included:
  - tenancy resolution, auth, authorization, or domain feature repositories/endpoints
  - HTTP protocol hardening from `CP4`
  - binder/document schema or feature behavior from later checkpoints

## Critic Review
- Scope-lock outcome: Passed. The change stays inside CP3 boundaries: persistence foundations, migration workflow, integration harness, and synchronized docs.
- Findings summary: No code or build blocker remained after package/version alignment and Release build validation.
- Unresolved risks or accepted gaps:
  - CP3 merge-gate validation is blocked in this environment because Docker client access exists but no Docker daemon is running, so the Testcontainers-backed integration tests and migration container cannot complete here.

## Risks And Rollout Notes
- Config or migration considerations:
  - Local/dev/prod migration flow now runs through `PaperBinder.Migrations`, either via `scripts/migrate.ps1` or `docker compose run --rm migrations`.
  - Docker Compose startup now depends on a one-shot `migrations` service completing before the app container is considered ready.
- Security or operational considerations:
  - Readiness now verifies an actual database query instead of a TCP-only probe, which is a more credible dependency check for later feature work.
  - The baseline schema intentionally stops at the tenant lease table so later checkpoints can add auth/domain tables without pulling scope forward.

## Validation Evidence
- Commands run:
  - `dotnet restore PaperBinder.sln`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
  - `docker compose config`
  - `docker version`
- Tests added/updated:
  - `tests/PaperBinder.IntegrationTests/MigrationWorkflowIntegrationTests.cs`
  - `tests/PaperBinder.IntegrationTests/PersistenceInfrastructureIntegrationTests.cs`
  - `tests/PaperBinder.IntegrationTests/HealthEndpointIntegrationTests.cs`
  - `tests/PaperBinder.IntegrationTests/HealthEndpointFailureIntegrationTests.cs`
  - `tests/PaperBinder.IntegrationTests/PostgresContainerFixture.cs`
  - `tests/PaperBinder.IntegrationTests/PaperBinderApplicationHost.cs`
- Manual verification:
  - Confirmed `docker compose config` resolves the new `migrations` service and app dependency graph correctly.
  - Confirmed build and docs validation pass.
  - Could not complete Docker-backed migration/runtime verification because the Docker daemon was unavailable at `npipe://./pipe/docker_engine`.

## Follow-Ups
- Re-run `scripts/migrate.ps1` and `scripts/test.ps1 -Configuration Release` once Docker daemon access is available; if those pass, CP3 can move from `blocked` to `done`.
- `CP4` remains next once CP3 merge-gate validation is complete.
