# T-0015: CP3 Persistence Baseline And Migration Pipeline

## Status
done

## Type
feature

## Priority
P0

## Owner
agent

## Created
2026-03-30

## Updated
2026-03-30

## Checkpoint
CP3

## Phase
Phase 1

## Summary
Implement the first real persistence layer for PaperBinder: baseline schema migrations, Dapper-oriented runtime database infrastructure, transaction and clock abstractions, and a Postgres-backed integration harness that proves the workflow against isolated databases.

## Context
- CP3 is the first checkpoint where the repository moves from topology-only readiness to real schema and database runtime behavior.
- The implementation must preserve the documented split: Dapper for runtime query/command paths, EF Core for migrations/tooling only.
- Tenant-isolation rules remain binding even though tenant-aware feature repositories do not land until later checkpoints.

## Acceptance Criteria
- [x] A baseline schema migration exists and can be applied through the dedicated migrations workflow
- [x] Runtime persistence infrastructure exists for connections, transactions, and clock access without introducing EF Core into runtime query paths
- [x] Integration tests stand up isolated PostgreSQL databases, apply migrations, and verify real persistence behavior
- [x] Persistence, testing, and local-operations docs are updated to match the implemented workflow
- [x] Validation evidence is captured, including any environment limits that affect migration or Docker-backed test execution

## Dependencies
- [T-0014](./T-0014-cp2-runtime-configuration-and-local-deployment-scaffold.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Locked to CP3 only: baseline schema workflow, runtime persistence plumbing, transaction/clock abstractions, Postgres-backed integration harness, and required docs/taskboard propagation.
- Pre-PR Critique: Complete. All 9 actionable findings were remediated on this branch; the remaining two observations are accepted as scope-correct deferrals.
- Escalation Notes: NuGet restore required escalation for package restore, and the Release build/test commands required escalation because Vite/esbuild spawning and Docker-backed integration execution are blocked in the sandbox.

## Current State
- Completed. The persistence baseline, migration workflow, and Docker-backed integration harness are implemented and validated, including the Docker-backed migration and integration merge gate.

## Touch Points
- `src/PaperBinder.Application`
- `src/PaperBinder.Infrastructure`
- `src/PaperBinder.Migrations`
- `src/PaperBinder.Api`
- `src/PaperBinder.Worker`
- `tests/PaperBinder.IntegrationTests`
- `docker-compose.yml`
- `scripts/`
- persistence, operations, testing, execution, and delivery docs

## Next Action
- Advance to `CP4`.

## Validation Evidence
- `dotnet restore PaperBinder.sln` (passed after package alignment and escalation)
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release` (passed; frontend and .NET Release build clean)
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release` (passed in `Auto` mode for unit plus non-Docker integration coverage; Docker-backed bucket skipped explicitly while the daemon was unavailable)
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` (passed)
- `docker compose config` (passed; Compose resolved the new `migrations` service and app dependency graph correctly)
- `powershell -ExecutionPolicy Bypass -File .\scripts\preflight.ps1 -Profile Test -DockerIntegrationMode Require` (passed once Docker Desktop access was available)
- `powershell -ExecutionPolicy Bypass -File .\scripts\migrate.ps1` (passed after copying `Directory.Build.props` into the .NET Docker build stages so containerized restore sees the pinned package versions)
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require` (passed: 1 unit test, 9 non-Docker integration tests, and 4 Docker-backed integration tests)

## Decision Notes
- Runtime access remains Dapper-oriented; EF Core is limited to migration/tooling concerns.
- Baseline schema should stay narrow and infrastructure-focused rather than pulling later tenant/auth/domain features forward.

## Validation Plan
- Restore dependencies from the canonical repo scripts.
- Build the solution and frontend in Release.
- Run unit and integration tests in Release, including Docker-backed integration coverage.
- Run docs validation after all propagation updates are in place.
- Verify the local migration workflow against the canonical Docker Compose stack.

## Outcome (Fill when done)
- Added the CP3 persistence foundation: baseline EF Core migration assets, Dapper-oriented runtime connection/transaction services, shared clock abstraction, Docker Compose migration service, and Postgres-backed integration harness code.
- Updated operations/testing/docs/taskboard artifacts to describe the real schema workflow and validation path.
- Added the missing persistence-stack ADR plus the critic-review remediation items, including readiness-probe cleanup, rollback warning logging, quoted PostgreSQL DDL identifiers in tests, and local Compose hardening.
- Fixed the Docker validation path by copying `Directory.Build.props` into the .NET Docker build stages and by marking the initial EF migration with the metadata EF Core requires for runtime discovery.
- Docker-backed migration and integration validation now pass, so CP3 is ready to close and `CP4` is next.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
