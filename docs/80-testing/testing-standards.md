# Testing Standards

## TDD And Change Discipline

- For non-trivial behavior changes, define/adjust tests with the change.
- Prefer writing a failing test first when bug-fixing or implementing bounded behavior.
- Keep tests deterministic and isolated from machine-local state.

## Quality Gates

- Unit tests cover domain invariants and branching logic.
- Integration tests cover tenant boundaries, authz boundaries, and persistence behavior.
- API protocol changes require explicit integration coverage, including scope boundaries (`X-Api-Version` on `/api/*`, `X-Correlation-Id` on all routes).
- Security-boundary changes require explicit regression tests.
- Docs and lint checks must pass before merge-ready status.

## Test Design Rules

- Avoid flaky timing/network dependencies in default test suites.
- Use controllable clocks and explicit fixtures for time-based behavior.
- Keep assertions specific enough to catch regressions without overspecifying internals.
