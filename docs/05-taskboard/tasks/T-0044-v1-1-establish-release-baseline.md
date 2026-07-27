# T-0044: Establish V1.1.0 Release Baseline

## Status
done

## Type
risk

## Priority
P1

## Owner
agent

## Created
2026-07-23

## Updated
2026-07-23

## Checkpoint
Cross-checkpoint

## Phase
V1.1 close-out

## Summary
Establish a concise, reproducible baseline record for branch review/v1.1.0-baseline: current build/test/docs/browser/local-stack validation results, tool versions, the responsive viewport matrix established by `T-0039`, current accessibility tooling posture, and known warnings/advisories/deferred findings — as a single repository-native document, not a parallel governance system.

## Context
- This replaces the "PR 1: baseline and review infrastructure" framing from a temporary external prompt with a lightweight task that fits the existing taskboard/delivery conventions instead of duplicating them.
- This is baseline and reproducibility work only. It records current state; it does not remediate application defects.
- `T-0039` (responsive QA) landed its fix on a separate branch (review/v1.1.0-responsive-t0039, not yet merged), so this baseline reflects branch review/v1.1.0-baseline as it stands today, with the T-0039 viewport matrix and its outcome referenced as pending-merge context rather than already-applied behavior.

## Acceptance Criteria
- [x] `docs/archive/v1-1/baseline-and-review-infra/v1.1.0-baseline.md` records branch/commit, tool versions, and every canonical validation command with its result.
- [x] Backend, frontend, integration, docs, browser/E2E, and local-stack results are each recorded, with executed vs statically-inspected vs not-tested explicitly distinguished.
- [x] The T-0039 responsive viewport matrix is referenced as established/pending-merge context.
- [x] Current accessibility tooling posture (manual-only today) is recorded accurately against `docs/10-product/accessibility.md`.
- [x] Known warnings, advisories, and deferred findings (including the two items triaged from the Inbox) are listed with their owning task.
- [x] No application defects are fixed as part of this task.

## Dependencies
- (none)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Baseline recording only. No product, docs-restructure, or governance-system work beyond the single baseline document and taskboard bookkeeping.
- Pre-PR Critique: Confirm every recorded result was actually executed or explicitly marked as static/not-tested — no inferred passes.
- Escalation Notes: Full bundle requires Docker, browser automation, and local-stack startup.

## Current State
- Done. Full validation bundle executed on branch review/v1.1.0-baseline; results recorded in `docs/archive/v1-1/baseline-and-review-infra/v1.1.0-baseline.md`. Committed, pushed, and PR #45 open into `release/v1.1.0` (not merged).

## Touch Points
- `docs/archive/v1-1/baseline-and-review-infra/v1.1.0-baseline.md` (new)
- `docs/05-taskboard/`

## Implementation Plan
- Record git/environment state.
- Run backend restore/build/tests.
- Run frontend install/typecheck/lint/build/tests.
- Run integration tests (non-Docker, then Docker-backed).
- Run docs and launch-profile validation.
- Attempt local reviewer-stack startup and browser E2E.
- Reference the T-0039 viewport matrix and accessibility tooling posture.
- Record warnings/advisories/deferred findings with owning task references.
- Write `docs/archive/v1-1/baseline-and-review-infra/v1.1.0-baseline.md` and update this task file.

## Next Action
- Done, committed, pushed, PR #45 open. Proceed to `T-0045`.

## Validation Evidence
- Full validation bundle executed and recorded in `docs/archive/v1-1/baseline-and-review-infra/v1.1.0-baseline.md`: restore/build (0 warnings, 0 errors), 63 frontend + 142 unit + 32 non-Docker integration + 102 Docker integration tests all passing, docs/version/launch-profile validation passing, browser E2E (root-host 3/3, tenant-host 2/3 with one deterministic test-defect failure), local reviewer-stack startup healthy, `npm audit` (7 advisories: 2 low, 5 high) and `dotnet list package --vulnerable` (none) both recorded.

## Decision Notes
- The docs validator (`validate-docs.ps1`) treats any inline-code literal starting with `review/` as a path into the docs/review/ directory convention, which collided with references to the review/v1.1.0-* branch names introduced by this task and `T-0039`'s taskboard updates. Resolved by writing branch names in prose without backticks throughout the taskboard docs and this baseline document, rather than as inline-code path literals.
- One new finding was discovered during baseline execution (not present in prior task-log notes): `e2e/tenant-host.spec.ts` expects a "Tenant admin" checkbox in the binder-access-policy form that `tenant-binder-detail-route.tsx` intentionally never renders (tenant admins always retain access by design). Classified as a stale test expectation, not a product defect. Not fixed here; assigned to `T-0045`.

## Validation Plan
- `powershell -ExecutionPolicy Bypass -File .\scripts\restore.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-version.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\run-browser-e2e.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\reviewer-full-stack.ps1 -NoBrowser` (or documented blocker)

## Outcome
- Established `docs/archive/v1-1/baseline-and-review-infra/v1.1.0-baseline.md` as the repository-native v1.1.0 baseline record for branch review/v1.1.0-baseline.
- Full validation bundle executed: backend/frontend build clean; 339 automated tests passing (63 frontend + 142 unit + 32 non-Docker integration + 102 Docker integration); docs/version/launch-profile validation passing; browser E2E mostly passing with one deterministic, root-caused test defect; local reviewer stack healthy.
- No application defects were fixed; all findings (one newly discovered, several carried from `T-0039` and prior task-log notes) were recorded and routed to `T-0045` or `T-0041`.
- No parallel governance system was created.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
