# T-0016: Repo Validation Tooling Hardening

## Status
done

## Type
debt

## Priority
P1

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
Harden the repo command surface so Docker prerequisites, split integration coverage, package-version governance, and validation-state language are explicit instead of being discovered late through opaque failures.

## Context
- CP3+ validation currently depends on Docker availability, but the default failure mode is a noisy late failure inside Testcontainers startup.
- Package versions were scattered across project files, which makes patch drift easy to introduce and harder to review.
- The repo needed a clearer convention for what counts as implemented, validated, and done once environment-gated checkpoints started to matter more than pure code changes.

## Acceptance Criteria
- [x] A repo preflight script exists for toolchain and Docker/local-stack prerequisites.
- [x] The canonical test script splits non-Docker integration coverage from Docker-backed integration coverage with explicit skip/fail behavior.
- [x] Package versions are governed from a shared repo-level file instead of being duplicated ad hoc across project files.
- [x] Documentation and taskboard workflow language are updated to reflect the new validation contract.
- [x] Validation evidence is captured, including any remaining environment or tooling limits.

## Dependencies
- [T-0012](./T-0012-cp1-root-scripts-and-docs-validation.md)
- [T-0015](./T-0015-cp3-persistence-baseline-and-migration-pipeline.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Locked to repo tooling, validation flow, and required docs/taskboard propagation. No product-scope expansion.
- Pre-PR Critique: Passed for the intended hardening scope. The remaining open risk is an opaque `dotnet restore` exit in the current Windows/.NET 10 SDK environment.
- Escalation Notes: Release build validation required escalation because Vite/esbuild spawning is blocked in the sandbox.

## Current State
- Completed. Preflight, split test buckets, shared package-version properties, and workflow/doc updates are in place.

## Touch Points
- `scripts/`
- `.github/workflows/ci.yml`
- `.vscode/tasks.json`
- `tests/PaperBinder.IntegrationTests`
- `README.md`
- `docs/70-operations/runbook-local.md`
- `docs/80-testing/`
- `docs/05-taskboard/`
- `docs/55-execution/`

## Next Action
- Triage the remaining `dotnet restore` exit-1 behavior as a separate tooling follow-up if it continues to affect clean-checkout validation.

## Validation Evidence
- `powershell -ExecutionPolicy Bypass -File .\scripts\preflight.ps1 -Profile Restore` (passed: resolved the pinned .NET SDK plus Node.js/npm toolchain versions)
- `powershell -ExecutionPolicy Bypass -File .\scripts\preflight.ps1 -Profile Test -DockerIntegrationMode Require` (failed fast as intended: Docker daemon unavailable at `npipe://./pipe/docker_engine`)
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release` (passed after escalation: Vite build and `dotnet build PaperBinder.sln -c Release --no-restore` succeeded)
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release` (passed: unit tests passed, 9 non-Docker integration tests passed, Docker-backed bucket skipped with explicit Docker-unavailable warning)
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` (passed)
- `powershell -ExecutionPolicy Bypass -File .\scripts\restore.ps1` (still exits nonzero in this environment after `Determining projects to restore...`; follow-up recorded instead of claiming restore validation passed)

## Decision Notes
- Use a shared `Directory.Build.props` version file instead of NuGet central package management, because the CPM attempt triggered opaque restore-graph failures under the current SDK/toolchain.
- Keep Docker-backed integration tests in the same test project for now, but make the bucket boundary explicit through traits and the root test script.
- Treat Windows `ExecutionPolicy Bypass` as baseline repo tooling, not an incidental workaround.

## Validation Plan
- Run restore/build/test/docs commands through the canonical repo scripts.
- Confirm Docker-required preflight fails early with a concrete daemon message.
- Confirm default test flow preserves useful feedback when Docker is unavailable.
- Confirm CI requires the Docker-backed bucket explicitly.

## Outcome (Fill when done)
- Added `scripts/preflight.ps1`, shared package-version properties, clearer wrapper/preflight messaging, and split non-Docker vs Docker-backed integration execution.
- Updated CI, VS Code tasks, README, operations docs, testing docs, and taskboard workflow language to match the new validation contract.
- Validation passed for build, non-Docker tests, Docker preflight behavior, and docs integrity.
- Follow-up: `dotnet restore` still exits with no surfaced error body in the current Windows/.NET 10 SDK environment, so that specific tooling quirk remains open and was not marked as solved here.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
