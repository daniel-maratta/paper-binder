# CP2 PR Description: Runtime Configuration And Local Deployment Scaffold
Status: Draft

## Checkpoint
- `CP2`: Runtime Configuration And Local Deployment Scaffold
- Task IDs: `T-0014`

## Summary
- Adds typed backend runtime configuration with fail-fast validation for the canonical `PAPERBINDER_*` keys.
- Adds frontend environment validation for the required `VITE_PAPERBINDER_*` build-time keys.
- Adds a local Docker Compose topology with Caddy, a single ASP.NET app host, and PostgreSQL, plus a repo-root `.env.example`.
- Updates runbooks, deployment/config docs, and checkpoint/taskboard artifacts to match the shipped local startup shape.

## Scope Boundaries
- Included:
  - runtime configuration loading/validation in API and worker hosts
  - minimal `/health/live` and `/health/ready` routes needed for topology verification
  - root `.env.example`, Docker Compose, app Dockerfile, and local Caddy config
  - local-start script and docs propagation for the new topology
- Not included:
  - migrations pipeline or real persistence implementation
  - tenancy resolution, auth, authorization, or binder/document domain behavior
  - ProblemDetails, API versioning, correlation middleware, or broader HTTP protocol hardening from `CP4`

## Critic Review
- Scope-lock outcome: Passed. The branch stays inside the documented CP2 boundary: configuration, environment handling, minimal topology probes, local deployment scaffold, and synchronized docs.
- Findings summary: No blocker findings remained after restore, release build, tests, and docs validation passed.
- Unresolved risks or accepted gaps:
  - Readiness currently uses a TCP-connect probe to the configured database host/port; deeper dependency semantics remain available for later refinement when persistence work lands.

## Risks And Rollout Notes
- Config or migration considerations:
  - Frontend builds now require the repo-root environment contract; `scripts/build.ps1` falls back to `.env.example` on clean checkouts so build/CI workflows remain reproducible.
  - Runtime hosts now fail fast on missing or invalid required configuration keys.
- Security or operational considerations:
  - The local topology now mirrors the documented single app-host posture earlier, which reduces drift between runbooks and implementation.
  - Health/readiness routes were introduced in CP2 so the proxy topology has stable verification targets; CP4 still owns the broader protocol baseline.

## Validation Evidence
- Commands run:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\restore.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
  - `docker compose config`
  - `docker compose up -d --build`
  - `Invoke-WebRequest http://paperbinder.localhost:8080/health/live`
  - `Invoke-WebRequest http://paperbinder.localhost:8080/health/ready`
  - `Invoke-WebRequest http://demo.paperbinder.localhost:8080/app`
- Tests added/updated:
  - `tests/PaperBinder.IntegrationTests/RuntimeConfigurationTests.cs`
  - `tests/PaperBinder.IntegrationTests/HealthEndpointIntegrationTests.cs`
  - `tests/PaperBinder.IntegrationTests/TestRuntimeConfiguration.cs`
- Manual verification:
  - Confirmed the canonical operations docs, taskboard state, and `.env.example` match the committed Docker/Caddy/app topology.
  - Confirmed the proxy served the compiled SPA at both the root host and a tenant subdomain while `/health/live` and `/health/ready` returned `200`.

## Follow-Ups
- `CP3` adds the migrations pipeline, Dapper runtime infrastructure, and a real Postgres-backed integration harness on top of this configuration/deployment scaffold.
- `CP4` adds ProblemDetails, API versioning, correlation middleware, and contract-focused protocol coverage beyond the minimal topology probes introduced here.
