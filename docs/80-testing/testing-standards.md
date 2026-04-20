# Testing Standards

## TDD And Change Discipline

- For non-trivial behavior changes, define/adjust tests with the change.
- For bounded backend, API, domain, persistence, security-boundary, and bug-fix work, use vertical-slice TDD unless the task is purely documentation, configuration, or mechanical refactoring with no behavior change.
- In PaperBinder checkpoint/task artifacts, capture this as planned `RED -> GREEN -> REFACTOR` behavior slices before broad implementation starts.
- Keep tests deterministic and isolated from machine-local state.

## Quality Gates

- Unit tests cover domain invariants and branching logic.
- Integration tests cover tenant boundaries, authz boundaries, and persistence behavior.
- Frontend component and utility tests use the checked-in Vitest command and must run explicitly in repo-native validation and CI.
- API protocol changes require explicit integration coverage, including scope boundaries (`X-Api-Version` on `/api/*`, `X-Correlation-Id` on all routes).
- Binder endpoint changes require explicit integration coverage for wrong-host `404`, wrong-tenant `404`, binder-policy denial, and CSRF rejection on unsafe routes.
- Impersonation-boundary changes require explicit integration coverage for same-tenant start, effective authorization, stop under downgraded role, CSRF on `POST` plus `DELETE`, and logout/session-expiry teardown.
- Security-boundary changes require explicit regression tests, including middleware-ordering, redirect-trust-boundary, and rate-limit-precedence checks when those seams move.
- Docs and lint checks must pass before merge-ready status.
- Environment-gated integration coverage must either run or be skipped with an explicit, visible reason; silent omission is not acceptable.
- Release-prep docs or validator changes must keep `docs/95-delivery/release-checklist.md` and `scripts/validate-docs.ps1` aligned so the clean-checkout release gate stays executable.

## Test Design Rules

- Avoid flaky timing/network dependencies in default test suites.
- Use controllable clocks and explicit fixtures for time-based behavior.
- Keep assertions specific enough to catch regressions without overspecifying internals.
- Frontend test-command wiring must land with real discovered tests; zero-test discovery is not acceptable.
- When only part of the integration suite needs Docker, tag and execute that bucket separately from non-Docker integration tests.
