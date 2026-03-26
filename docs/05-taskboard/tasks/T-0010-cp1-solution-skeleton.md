# T-0010: CP1 Solution Skeleton

## Status
done

## Type
feature

## Priority
P0

## Owner
agent

## Created
2026-03-24

## Updated
2026-03-25

## Checkpoint
CP1

## Phase
Phase 1

## Summary
Create the .NET solution and backend project skeleton required for the repo to become a runnable software workspace.

## Context
- CP1 requires the foundational backend project layout before infrastructure, CI, or feature work can land cleanly.
- The skeleton must align with current architecture and tech-stack constraints without adding speculative layers.
- This task covers backend workspace structure only; frontend scaffolding, scripts, and CI are separate tasks.

## Acceptance Criteria
- [x] Solution file exists and restores cleanly
- [x] Backend projects exist for API, worker, domain/application, infrastructure, migrations, and tests
- [x] Project references align with documented boundaries
- [x] Solution and project layout are launchable from VS Code without requiring a separate non-script workflow
- [x] Solution builds successfully
- [x] Docs are updated if the implemented structure changes canonical repo expectations

## Dependencies
- [T-0002](./T-0002-agent-operating-model.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Locked to the documented CP1 backend boundary only: standard `.sln`, backend project skeleton, project references, and VS Code launchability without adding runtime/domain behavior ahead of later checkpoints.
- Pre-PR Critique: Passed with no open blocker findings after validating restore, release build, tests, and docs integrity against the new workspace shape.
- Escalation Notes: (none)

## Current State
- Completed. The repo now has a standard `PaperBinder.sln` plus API, worker, domain, application, infrastructure, migrations, and test projects under the documented `src/` and `tests/` layout.

## Touch Points
- `*.sln`
- backend project directories
- root bootstrap docs/scripts referenced by the workspace

## Next Action
- Pull this task into `Now`, lock scope against current architecture docs, and implement the backend solution skeleton.

## Validation Evidence
- `npm.cmd install --prefix src/PaperBinder.Web` completed successfully and generated the frontend lockfile.
- `dotnet restore PaperBinder.sln` completed successfully against the pinned .NET 10 SDK.
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release` completed successfully.
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release` completed successfully.
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` completed successfully.

## Decision Notes
- Keep project boundaries aligned to current architecture docs and coding standards.
- Favor a solution and startup layout that works cleanly with VS Code launch configuration and integrated terminal usage.

## Validation Plan
- Run restore and build for the solution.
- Verify the chosen solution layout can be targeted cleanly by VS Code launch settings.
- Verify project references match documented boundaries.
- Verify any changed docs remain synchronized.

## Outcome (Fill when done)
- Added the Phase 1 / CP1 backend workspace skeleton under `src/` and `tests/`.
- Aligned project references with the documented boundary rules: application depends on domain, infrastructure depends on application/domain, and host/test projects depend on the appropriate downstream assemblies.
- Added a standard `.sln` and API host static-file wiring so the compiled SPA can be served from the ASP.NET host without committing generated frontend assets.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
