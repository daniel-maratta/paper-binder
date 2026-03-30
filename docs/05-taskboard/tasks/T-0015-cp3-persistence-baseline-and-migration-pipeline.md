# T-0015: CP3 Persistence Baseline And Migration Pipeline

## Status
blocked

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
- [ ] A baseline schema migration exists and can be applied through the dedicated migrations workflow
- [ ] Runtime persistence infrastructure exists for connections, transactions, and clock access without introducing EF Core into runtime query paths
- [ ] Integration tests stand up isolated PostgreSQL databases, apply migrations, and verify real persistence behavior
- [ ] Persistence, testing, and local-operations docs are updated to match the implemented workflow
- [ ] Validation evidence is captured, including any environment limits that affect migration or Docker-backed test execution

## Dependencies
- [T-0014](./T-0014-cp2-runtime-configuration-and-local-deployment-scaffold.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Locked to CP3 only: baseline schema workflow, runtime persistence plumbing, transaction/clock abstractions, Postgres-backed integration harness, and required docs/taskboard propagation.
- Pre-PR Critique: Code/build/docs scope is complete for CP3, but the checkpoint cannot close until Docker-backed migration and integration validation can run against a live daemon.
- Escalation Notes: NuGet restore required escalation for package restore, and the Release build/test commands required escalation because Vite/esbuild spawning and Docker-backed integration execution are blocked in the sandbox.

## Current State
- Blocked on local environment validation. The persistence baseline, migration workflow, and Docker-backed integration harness are implemented, but the Docker daemon is unavailable on this machine so the CP3 merge gate cannot be fully verified.

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
- Start or make available a working Docker daemon, then rerun `scripts\migrate.ps1` plus `scripts\test.ps1 -Configuration Release` to close the remaining CP3 validation gate.

## Validation Evidence
- `dotnet restore PaperBinder.sln` (passed after package alignment and escalation)
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release` (passed; frontend and .NET Release build clean)
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release` (partially passed: unit tests and 9 integration tests passed; 4 Docker-backed integration tests failed because Docker daemon was unavailable at `npipe://./pipe/docker_engine`)
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` (passed)
- `docker compose config` (passed; Compose resolved the new `migrations` service and app dependency graph correctly)
- `docker version` (client present; daemon unavailable in this environment)

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
- Checkpoint closure is blocked only by environment: the Docker daemon was unavailable locally, so the Docker-backed migration and integration merge gate could not be completed in this session.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
