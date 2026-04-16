# T-0024: Track Remaining Test Coverage Gaps

## Status
done

## Type
risk

## Priority
P2

## Owner
agent

## Created
2026-04-08

## Updated
2026-04-16

## Checkpoint
Cross-checkpoint

## Phase
Cross-phase

## Summary
Record and close the remaining narrow test-coverage gaps that remain after the current backend and CP12 frontend suites passed, so they are not lost between checkpoints or sessions.

## Context
- A full test run on 2026-04-14 passed: 111 unit tests, 25 non-Docker integration tests, and 72 Docker-backed integration tests.
- CP12 added repo-native frontend component coverage on 2026-04-16: 5 test files and 8 tests across host-context resolution, route skeleton rendering, API-client behavior, primitive accessibility, tenant-shell safe states, and invalid-host fallback rendering.
- The current suite gives the shipped backend and frontend surfaces credible coverage across tenancy, auth, provisioning, authorization, binder behavior, lease lifecycle, worker cleanup, runtime health, and SPA foundation behavior.
- The last tracked narrow gap was direct end-to-end coverage for the `CHALLENGE_FAILED` API path when a challenge token is present but provider verification fails; CP13 closes that gap at the browser boundary.

## Acceptance Criteria
- [x] The `CHALLENGE_FAILED` behavior has explicit automated coverage at the appropriate boundary.
- [x] Frontend automated coverage is added once the UI stops being placeholder-only.
- [x] Testing docs and taskboard artifacts remain synchronized with the actual gap status.

## Dependencies
- (none)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Keep this task limited to the currently known test gaps. Do not expand into unrelated feature work.
- Pre-PR Critique: Any future fix should prove the missing behavior at the correct boundary rather than adding low-signal implementation-detail tests.
- Escalation Notes: If frontend behavior remains placeholder-only, explicit deferral is acceptable; do not invent UI behavior just to justify tests.

## Current State
- Done. CP13 added explicit browser-level `CHALLENGE_FAILED` coverage through the isolated root-host Playwright suite, and the testing docs/taskboard artifacts now reflect that closure.

## Touch Points
- `tests/PaperBinder.UnitTests/`
- `tests/PaperBinder.IntegrationTests/`
- `src/PaperBinder.Api/`
- `src/PaperBinder.Worker/`
- `docs/80-testing/test-strategy.md`
- `docs/05-taskboard/work-queue.md`

## Implementation Plan
- No additional gap-closing slices remain in scope for this task.

## Next Action
- None. Reopen only if a new durable gap needs explicit tracking.

## Validation Evidence
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require` (passed on 2026-04-14: 111 unit, 25 non-Docker integration, 72 Docker-backed integration)
- `npm.cmd run test` from `src/PaperBinder.Web` (passed on 2026-04-16: 5 test files, 8 tests, 0 failures)
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require` (passed on 2026-04-16: frontend 8 tests, 111 unit, 25 non-Docker integration, 72 Docker-backed integration)
- `powershell -ExecutionPolicy Bypass -File .\scripts\run-root-host-e2e.ps1` (passed on 2026-04-16: 3 Playwright tests covering provision success, login success, and `CHALLENGE_FAILED`/`INVALID_CREDENTIALS`/`RATE_LIMITED` deny behavior)
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` (passed on 2026-04-16 after the gap-closure doc/task updates)

## Decision Notes
- The current backend suite is strong enough to treat the remaining items as narrow follow-up gaps, not as evidence that the implemented backend surface is broadly untested.
- CP11 removed the previous worker-runtime coverage gap by adding worker-host dependency-resolution coverage plus deterministic cleanup-cycle and lease-lifecycle integration coverage.
- CP12 removed the previous frontend-coverage gap by adding repo-native component and utility coverage once the SPA stopped being placeholder-only.

## Validation Plan
- Re-run the canonical full test suite after any gap-closing change.
- Prefer boundary-level coverage for `CHALLENGE_FAILED` when feasible.
- Keep reviewer-facing testing docs aligned with the current gap list.

## Outcome (Fill when done)
- The remaining explicit `CHALLENGE_FAILED` coverage gap is closed at the browser boundary, and the canonical testing docs/taskboard artifacts now reflect that done-state.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
