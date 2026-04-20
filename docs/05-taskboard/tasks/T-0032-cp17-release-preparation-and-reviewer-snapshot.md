# T-0032: CP17 Release Preparation And Reviewer Snapshot

## Status
done

## Type
release

## Priority
P0

## Owner
agent

## Created
2026-04-19

## Updated
2026-04-20

## Checkpoint
CP17

## Phase
Phase 5

## Summary
Implement CP17 so PaperBinder ends `V1` as a reviewer-ready release cut: release identity is locked to prose `V1` with recommended tag `v1.0.0`, the changelog and release artifact set are complete, deployment and rollback docs match the supported single-host Docker Compose runtime, reviewer docs match the shipped system, the AI lane is explicitly deferred from `V1`, and final validation proves the documented commands reproduce the candidate release.

## Context
- CP17 scope is locked by `docs/55-execution/execution-plan.md`, `docs/95-delivery/pr/cp17-release-preparation-and-reviewer-snapshot/implementation-plan.md`, and `docs/95-delivery/pr/cp17-release-preparation-and-reviewer-snapshot/critic-review.md`.
- The checkpoint is release-prep only: no new feature work, architecture changes, or public-demo infrastructure expansion.
- The canonical closeout signal lives in `docs/95-delivery/release-checklist.md` `Release Readiness`, mirrored into the CP17 release artifact and checkpoint ledger.

## Acceptance Criteria
- [x] Release-facing docs use the locked `V1` / `v1.0.0` identity consistently.
- [x] `CHANGELOG.md` is cut as `## [V1] - YYYY-MM-DD` with an empty `## Unreleased`.
- [x] `docs/95-delivery/release-workflow.md` and `docs/95-delivery/release-checklist.md` exist as distinct canonical release docs.
- [x] The CP17 release artifact exists and records shipped scope, deferrals, rollout and rollback notes, validation evidence, reviewer walkthrough, and reviewer-ready rationale.
- [x] No reviewer-facing or canonical doc claims that an AI feature ships in `V1`.
- [x] Operations and testing docs align with the supported single-host Compose topology, release validation bundle, and rollback model.
- [x] Clean-checkout validation evidence is recorded and the taskboard plus checkpoint ledger reflect the true CP17 state.

## Dependencies
- [T-0031](./T-0031-cp16-hardening-and-consistency-pass.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Passed via `docs/95-delivery/pr/cp17-release-preparation-and-reviewer-snapshot/critic-review.md` on `2026-04-19`.
- Pre-PR Critique: Completed in the revised CP17 implementation plan before implementation broadened.
- Post-Implementation Critic Review: Passed via `docs/95-delivery/pr/cp17-release-preparation-and-reviewer-snapshot/critic-review.md` on `2026-04-20`; no blocking findings remain.
- Escalation Notes: Stop rather than widening into post-`V1` feature work, deployment-model changes, new dependencies, or reviewer-microsite generation.

## Current State
- CP17 release-doc reconciliation, release artifact creation, validator updates, and navigation metadata updates are complete.
- The scripted release bundle has passed from a fresh candidate clone, and the release-readiness signal is now recorded in `docs/95-delivery/release-checklist.md`.
- The post-implementation critic review closed with no blockers on `2026-04-20`; the remaining `npm ci` audit advisory is disclosed in the release artifact and deferred outside CP17 because it does not block the documented `V1` validation bundle.

## Touch Points
- `CHANGELOG.md`
- `README.md`
- `REVIEWERS.md`
- `review/`
- `docs/00-intent/`
- `docs/05-taskboard/`
- `docs/55-execution/`
- `docs/60-ai/`
- `docs/70-operations/`
- `docs/80-testing/`
- `docs/95-delivery/`
- `scripts/validate-docs.ps1`
- `docs/ai-index.md`
- `docs/repo-map.json`

## Implementation Plan
- Slice 1 `RED -> GREEN -> REFACTOR`
  - Public seam: release checklist existence, required sections, and canonical script links
  - Green target: create `docs/95-delivery/release-workflow.md`, `docs/95-delivery/release-checklist.md`, and the validator support needed to keep them from drifting
- Slice 2 `RED -> GREEN -> REFACTOR`
  - Public seam: release-facing docs and reviewer snapshot accurately describe shipped `V1` behavior
  - Green target: refresh README, reviewer docs, operations or testing docs, and AI-lane posture without widening scope
- Slice 3 `RED -> GREEN -> REFACTOR`
  - Public seam: clean-checkout reproducibility and release-readiness recording
  - Green target: run the scripted bundle from a fresh candidate checkout, record results, and synchronize the taskboard plus checkpoint ledger

## Next Action
- None for `CP17`. Owner-controlled merge and tag actions remain outside executor scope.

## Validation Evidence
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`: passed on `2026-04-19` before the clean-checkout run and again on `2026-04-20` after the post-implementation closeout updates
- Clean-checkout candidate clone bootstrapped `.env` from `.env.example` and then ran:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\preflight.ps1 -Profile Full`: passed on `2026-04-19`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\restore.ps1`: passed on `2026-04-19`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`: passed on `2026-04-19`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`: passed on `2026-04-19`
    - frontend tests: 9 files, 32 tests, 0 failures
    - unit tests: 111 passed, 0 failed
    - non-Docker integration tests: 27 passed, 0 failed
    - Docker-backed integration tests: 88 passed, 0 failed
  - `powershell -ExecutionPolicy Bypass -File .\scripts\run-browser-e2e.ps1`: passed on `2026-04-19`
    - root-host Playwright suite: 3 passed
    - tenant-host Playwright suite: 3 passed
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`: passed on `2026-04-19`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`: passed on `2026-04-19`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require`: passed on `2026-04-19`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\reviewer-full-stack.ps1 -NoBrowser`: passed on `2026-04-19`
- Manual verification evidence:
  - VS Code launch verification: passed on `2026-04-20`
  - Visual Studio launch verification: passed on `2026-04-20`
  - reviewer walkthrough coverage remains represented by the candidate-release browser suite plus the refreshed manual IDE launch verification

## Decision Notes
- The shipped release identity is prose `V1` with recommended tag `v1.0.0`.
- `scripts/run-root-host-e2e.ps1` remains a historical compatibility shim through `V1`.
- No AI feature ships in `V1`; the AI lane is deferred context only.
- The open high-severity `npm ci` audit advisory is a disclosed post-`V1` dependency follow-up, not a CP17 release blocker.

## Validation Plan
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` after the release-doc reconciliation set lands
- clean-checkout run of:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\preflight.ps1 -Profile Full`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\restore.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\run-browser-e2e.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require`
- reviewer and launch-verification evidence recording in the release artifact

## Outcome (Fill when done)
- CP17 now packages PaperBinder as the reviewer-ready `V1` release cut with the canonical release workflow, release checklist, refreshed reviewer snapshot, deferred AI posture, synchronized taskboard or checkpoint metadata, and recorded clean-checkout validation evidence.
- `main` is documented as taggable for `V1`; merge and tag actions remain owner-controlled.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
