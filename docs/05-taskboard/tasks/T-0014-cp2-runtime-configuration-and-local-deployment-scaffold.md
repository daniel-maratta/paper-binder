# T-0014: CP2 Runtime Configuration And Local Deployment Scaffold

## Status
done

## Type
feature

## Priority
P0

## Owner
agent

## Created
2026-03-26

## Updated
2026-03-26

## Checkpoint
CP2

## Phase
Phase 1

## Summary
Implement the runtime configuration contract and local Docker-based host topology so PaperBinder has a real app/proxy/database startup shape before persistence and HTTP-contract work expands further.

## Context
- CP2 is the first checkpoint where runtime configuration becomes real rather than implicit.
- The local stack must mirror the documented single app-host topology closely enough to keep deployment docs credible.
- This task must stay inside CP2 scope: configuration, environment handling, health probes needed for topology verification, local Docker wiring, and matching docs.

## Acceptance Criteria
- [x] Typed backend configuration exists and fails fast on missing/invalid required keys
- [x] Frontend environment handling validates the required `VITE_PAPERBINDER_*` contract
- [x] Local Docker Compose, PostgreSQL, reverse proxy, and single app-host wiring are committed
- [x] Repo-root `.env.example`, runbooks, and deployment/config docs are synchronized with the shipped keys and startup shape
- [x] Validation evidence is captured, including any environment limits that prevented full local-topology execution

## Dependencies
- [T-0010](./T-0010-cp1-solution-skeleton.md)
- [T-0011](./T-0011-cp1-frontend-scaffold.md)
- [T-0012](./T-0012-cp1-root-scripts-and-docs-validation.md)
- [T-0013](./T-0013-cp1-ci-pipeline.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Locked to CP2 only: typed runtime configuration, frontend env handling, minimal health/readiness support for topology verification, local Docker/Caddy/PostgreSQL scaffold, and required docs/taskboard propagation.
- Pre-PR Critique: Passed with no open blocker findings after restore, release build, integration coverage, docs validation, `docker compose config`, local Compose startup, and proxy endpoint verification completed.
- Escalation Notes: Dependency restore required sandbox escalation for network access, and the release build required sandbox escalation because Vite/esbuild could not spawn inside the sandbox.

## Current State
- Completed. PaperBinder now has a typed runtime configuration contract, root `.env.example`, local Docker Compose topology, reverse-proxy baseline, and health/readiness routes that support local topology verification.

## Touch Points
- `src/PaperBinder.Api`
- `src/PaperBinder.Infrastructure`
- `src/PaperBinder.Worker`
- `src/PaperBinder.Web`
- `docker-compose.yml`
- `deploy/local/Caddyfile`
- `scripts/start-local.ps1`
- operations/security/execution docs

## Next Action
- Advance to CP3 and use the committed config/deployment scaffold as the baseline for migrations, Dapper runtime infrastructure, and Postgres-backed integration infrastructure.

## Validation Evidence
- `powershell -ExecutionPolicy Bypass -File .\scripts\restore.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- `docker compose config`
- `docker compose up -d --build`
- `Invoke-WebRequest http://paperbinder.localhost:8080/health/live`
- `Invoke-WebRequest http://paperbinder.localhost:8080/health/ready`
- `Invoke-WebRequest http://demo.paperbinder.localhost:8080/app`

## Decision Notes
- Use one repo-root `.env` contract for Docker Compose, backend process debugging, and frontend build-time environment handling.
- Introduce the documented health/readiness routes in CP2 because the local proxy topology needs stable verification endpoints; keep CP4 focused on protocol middleware and contract coverage.
- Keep Docker local topology aligned to the locked single app-host deployment shape: Caddy -> ASP.NET host -> PostgreSQL.

## Validation Plan
- Restore NuGet and npm dependencies from the canonical script surface.
- Build the frontend and .NET solution in Release.
- Run unit and integration tests in Release.
- Run docs validation after documentation/taskboard propagation.
- Validate Docker Compose config if `docker` is available in the execution environment.

## Outcome (Fill when done)
- Added typed runtime configuration loading/validation, backend health/readiness endpoints, frontend environment validation, and local startup wiring based on Docker Compose plus Caddy and PostgreSQL.
- Added regression coverage for config validation and health/readiness behavior without pulling persistence or tenancy work forward.
- Updated local operations, deployment, security-config, execution-plan, and delivery docs so CP2 is reflected consistently across the repo.
- Verified the local Compose topology end to end: `docker compose config` resolved concrete values, `docker compose up -d --build` started the stack successfully, health endpoints returned `200` through the proxy, and the tenant subdomain route served the SPA.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
