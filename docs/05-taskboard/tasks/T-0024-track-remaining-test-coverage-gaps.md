# T-0024: Track Remaining Test Coverage Gaps

## Status
queued

## Type
risk

## Priority
P2

## Owner
agent

## Created
2026-04-08

## Updated
2026-04-10

## Checkpoint
Cross-checkpoint

## Phase
Cross-phase

## Summary
Record and close the remaining narrow test-coverage gaps that remain after the current backend suite passed, so they are not lost between checkpoints or sessions.

## Context
- A full test run on 2026-04-10 passed: 110 unit tests, 25 non-Docker integration tests, and 72 Docker-backed integration tests.
- That run gives the current backend surface credible coverage across tenancy, auth, provisioning, authorization, binder behavior, lease lifecycle, worker cleanup, persistence, and runtime health.
- A few narrower gaps still remain and should stay visible in durable repo artifacts:
- direct end-to-end coverage for the `CHALLENGE_FAILED` API path when a challenge token is present but provider verification fails
- explicit frontend automated coverage once the placeholder UI starts carrying real product behavior

## Acceptance Criteria
- [ ] The `CHALLENGE_FAILED` behavior has explicit automated coverage at the appropriate boundary.
- [ ] Frontend automated coverage is added when the UI stops being placeholder-only, or the deferral rationale remains current and explicit.
- [ ] Testing docs and taskboard artifacts remain synchronized with the actual gap status.

## Dependencies
- (none)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Keep this task limited to the currently known test gaps. Do not expand into unrelated feature work.
- Pre-PR Critique: Any future fix should prove the missing behavior at the correct boundary rather than adding low-signal implementation-detail tests.
- Escalation Notes: If frontend behavior remains placeholder-only, explicit deferral is acceptable; do not invent UI behavior just to justify tests.

## Current State
- Queued. CP11 closed the worker-runtime and lease-lifecycle gap, and the remaining narrow gaps are documented here for later hardening work.

## Touch Points
- `tests/PaperBinder.UnitTests/`
- `tests/PaperBinder.IntegrationTests/`
- `src/PaperBinder.Api/`
- `src/PaperBinder.Worker/`
- `src/PaperBinder.Web/`
- `docs/80-testing/test-strategy.md`
- `docs/05-taskboard/work-queue.md`

## Implementation Plan
- Future work should add one gap-closing slice at a time using `RED -> GREEN -> REFACTOR`.
- Start with the highest-value missing behavior slice: explicit `CHALLENGE_FAILED` coverage.
- Add frontend coverage only when the behavior under test is concrete enough to justify stable assertions.

## Next Action
- Pull this into active work when the next hardening pass, auth touch, or frontend checkpoint creates a natural place to close one or more of the gaps.

## Validation Evidence
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require` (passed on 2026-04-10: 110 unit, 25 non-Docker integration, 72 Docker-backed integration)

## Decision Notes
- The current backend suite is strong enough to treat the remaining items as narrow follow-up gaps, not as evidence that the implemented backend surface is broadly untested.
- CP11 removed the previous worker-runtime coverage gap by adding worker-host dependency-resolution coverage plus deterministic cleanup-cycle and lease-lifecycle integration coverage.
- Frontend coverage remains intentionally deferred while the UI is still placeholder-only.

## Validation Plan
- Re-run the canonical full test suite after any gap-closing change.
- Prefer boundary-level coverage for `CHALLENGE_FAILED` when feasible.
- Keep reviewer-facing testing docs aligned with the current gap list.

## Outcome (Fill when done)
- Gap closures completed and reflected in testing docs/taskboard state.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
