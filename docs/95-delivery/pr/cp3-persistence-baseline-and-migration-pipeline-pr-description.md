# CP3 PR Description: Persistence Baseline And Migration Pipeline
Status: Review Ready

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
- Critique outcome: All 9 actionable findings have been addressed on this branch.
- Accepted deferrals: The remaining two observations are scope-correct deferrals and do not block CP3.
- Validation outcome: Docker-backed migration and integration validation now pass.

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
  - `powershell -ExecutionPolicy Bypass -File .\scripts\preflight.ps1 -Profile Test -DockerIntegrationMode Require`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\migrate.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
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
  - Confirmed the containerized migration workflow now restores correctly after copying `Directory.Build.props` into the .NET Docker build stages.
  - Confirmed the initial EF migration is now discovered at runtime after adding the required migration metadata, and the Docker-backed persistence tests pass against real PostgreSQL databases.

## Follow-Ups
- `CP4` is next.
