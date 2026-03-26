# CP1 PR Description: Workspace Bootstrap And CI
Status: Draft

## Checkpoint
- `CP1`: Workspace Bootstrap And CI
- Task IDs: `T-0010`, `T-0011`, `T-0012`, `T-0013`

## Summary
- Adds the initial PaperBinder software workspace: `PaperBinder.sln`, backend project skeletons, test projects, and VS Code launch/task wiring.
- Adds the pinned Vite + React + TypeScript frontend scaffold under `src/PaperBinder.Web`, including the committed `package-lock.json`.
- Adds the canonical root script surface for restore, build, test, docs validation, and local startup, plus a repo-native docs validator.
- Replaces placeholder CI with a real workflow that reuses the shipped scripts so CP1 leaves `main` buildable, testable, and documentation-consistent.

## Scope Boundaries
- Included:
  - .NET solution and host/library/test project skeletons for API, worker, domain, application, infrastructure, migrations, and tests
  - Frontend scaffold and baseline app shell
  - Root scripts, VS Code wrappers, and documentation validation
  - CI enforcement for restore, build, test, and docs validation
- Not included:
  - Docker Compose, PostgreSQL wiring, or runtime topology beyond local host/process startup
  - Persistence implementation, migrations workflow behavior, or database-backed features
  - Health/readiness endpoints, API protocol middleware, tenancy resolution, auth, authorization, or product flows
  - Interactive API documentation or any reviewer-facing product UI beyond the backend liveness page and frontend scaffold

## Critic Review
- Scope-lock outcome: Passed. The branch stays inside the documented CP1 boundary: workspace bootstrap, frontend scaffold, canonical scripts, and CI only.
- Findings summary: No blocker findings remained after validating restore, release build, tests, and docs integrity against the implemented workspace shape.
- Unresolved risks or accepted gaps:
  - The current backend root is a reviewer-friendly liveness surface only; real health endpoints land in `CP4`.
  - Local startup is process-based only in `CP1`; Docker and Postgres wiring are intentionally deferred to `CP2`.
  - Domain, tenancy, auth, and binder/document behavior are still scaffold-only and are intentionally deferred to later checkpoints.

## Risks And Rollout Notes
- Config or migration considerations:
  - No schema migration workflow or database configuration is introduced in this checkpoint.
  - Frontend and backend toolchains are now pinned and required for clean-checkout validation (`.NET SDK` via `global.json`, Node via `.nvmrc`, npm via `packageManager`).
- Security or operational considerations:
  - No tenant or auth boundary is implemented yet; this PR only establishes the workspace needed to add those controls in later checkpoints.
  - `scripts/start-local.ps1` starts API, worker, and frontend processes and writes logs to `logs/local-start/`, which is useful for reviewer troubleshooting but is not a deployment story.

## Validation Evidence
- Commands run:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\restore.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- Tests added/updated:
  - `tests/PaperBinder.UnitTests/AssemblyReferenceTests.cs`
  - `tests/PaperBinder.UnitTests/SolutionBootstrapTests.cs`
  - `tests/PaperBinder.IntegrationTests/FrontendHostingPolicyTests.cs`
- Manual verification:
  - Reviewed the local runbook, VS Code task/launch wiring, and CI workflow against the shipped script surface to confirm they point at the same commands.

## Follow-Ups
- `CP2` adds typed runtime configuration, local Docker/Postgres topology, and deployment-aligned environment handling.
- `CP3` adds persistence infrastructure and the actual migration pipeline now that the workspace skeleton exists.
- `CP4` adds the documented HTTP protocol baseline, including health endpoints, versioning behavior, correlation IDs, and ProblemDetails enforcement.
