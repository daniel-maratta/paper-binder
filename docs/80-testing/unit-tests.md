# Unit Tests
Status: V1

Unit tests validate domain and application logic without infrastructure dependencies.

## Scope

In scope:
- Domain invariants (immutability, naming, validation rules).
- Application rule logic (lease timing, extension windows, policy decisions).
- ProblemDetails mapping logic where unit-testable.

Out of scope:
- DB correctness (integration tests).
- Browser behavior (E2E tests).

## Principles

- Assert behavior, not internals.
- Keep tests deterministic and fast.
- Mock only true external boundaries.

## Required Coverage Areas

- Lease timer starts at provisioning/credential issuance boundary.
- Extension allowed only within allowed window.
- Extension count limits enforced.
- Expired-tenant decision behavior.
- Host parsing/tenant resolution helper logic (if unit-scoped).
- API version header parsing and unsupported-version mapping (if unit-scoped).
- API route-prefix classification for version negotiation (`/api/*` only) (if unit-scoped).
- Correlation ID validation/generation helper behavior (if unit-scoped).

## Quality Gates

- Unit tests run on each PR.
- Build fails on unit test failure.
- Optional modest coverage thresholds for core logic.

## Alternatives Considered

- Integration/E2E only: rejected; slower feedback and weaker isolation.
- Coverage-percentage-first strategy: rejected; encourages low-value tests.
