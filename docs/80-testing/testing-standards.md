# Testing Standards

## TDD And Change Discipline

- For non-trivial behavior changes, define/adjust tests with the change.
- Prefer writing a failing test first when bug-fixing or implementing bounded behavior.
- Keep tests deterministic and isolated from machine-local state.

## Quality Gates

- Unit tests cover domain invariants and branching logic.
- Integration tests cover tenant boundaries, authz boundaries, and persistence behavior.
- API protocol changes require explicit integration coverage, including scope boundaries (`X-Api-Version` on `/api/*`, `X-Correlation-Id` on all routes).
- Binder endpoint changes require explicit integration coverage for wrong-host `404`, wrong-tenant `404`, binder-policy denial, and CSRF rejection on unsafe routes.
- Security-boundary changes require explicit regression tests.
- Docs and lint checks must pass before merge-ready status.
- Environment-gated integration coverage must either run or be skipped with an explicit, visible reason; silent omission is not acceptable.

## Test Design Rules

- Avoid flaky timing/network dependencies in default test suites.
- Use controllable clocks and explicit fixtures for time-based behavior.
- Keep assertions specific enough to catch regressions without overspecifying internals.
- When only part of the integration suite needs Docker, tag and execute that bucket separately from non-Docker integration tests.
