# Test Strategy

## AI Summary

- Testing prioritizes deterministic tenant-boundary and authorization correctness.
- Integration tests prove cross-boundary behaviors; unit tests protect invariants/handler logic.
- Non-negotiable coverage includes tenancy, policy enforcement, provisioning, lease-expiration cleanup, and impersonation constraints.

Related standards:
- `docs/80-testing/testing-standards.md`

## Principles

- Tests must be deterministic and isolated.
- Prefer integration tests for boundary behavior.
- Prefer unit tests for domain invariants and handler logic.
- Repository test scripts should separate environment-light validation from Docker-backed validation so local feedback stays useful without hiding skipped merge-gate coverage.

## Non-Negotiable Coverage

- Tenant isolation: no cross-tenant reads or writes.
- Authorization enforcement at API endpoints.
- Binder allow/deny behavior, including list omission for `restricted_roles`, same-tenant policy denial, and wrong-tenant `404` behavior.
- Document immutability, archive-transition rules, same-binder supersedes validation, and binder-policy behavior across document list/detail/write endpoints.
- Provisioning transactionality (all-or-nothing seed behavior).
- Tenant lease projection math, extension-window/limit rules, extend-route auth/CSRF/rate-limit behavior, and cleanup hard-delete behavior.
- Challenge + pre-auth rate-limit behavior on provisioning and root login.
- Impersonation constraints (tenant-local only) and required audit events.
- Startup configuration validation and health/readiness behavior for the local/prod runtime topology.

## Test Layer Guidance

- Integration tests:
  - Multi-tenant query boundaries.
  - Authentication/authorization boundary behavior.
  - Binder endpoint success/failure behavior, including CSRF enforcement on unsafe binder routes.
  - Provisioning and cleanup workflows, including expired-before-purge `410` versus post-purge `404`.
  - Split repo execution into non-Docker and Docker-backed buckets when Docker is required for only part of the suite.
- Unit tests:
  - Domain invariants.
  - Command/query handler behavior under explicit preconditions.

## Validation Contract

- `scripts/test.ps1` must always make Docker-backed coverage status explicit.
- Local `Auto` mode may skip Docker-backed integration tests with a clear message when Docker is unavailable.
- Checkpoint or CI merge-gate validation must require the Docker-backed bucket explicitly rather than assuming it ran.

## Current Known Gaps

- The current backend surface plus the CP13 through CP15 browser surfaces are covered credibly by unit tests, non-Docker and Docker-backed integration tests, frontend component tests, and the isolated Playwright browser suite.
- CP15 adds impersonation endpoint, teardown, audit-retention, shell-banner, and view-as browser coverage on top of the CP14 tenant-host baseline.
- Remaining browser gaps are broader hardening passes and any post-V1 smoke coverage.

## Environment-Gated Test Bypass Reminder

- If `PB_ENV == "Test"`: accept fixed Turnstile token value for test-only execution.
- Else: verify Turnstile with the configured secret key.
- Bypass logic must remain environment-gated and never enabled in Production.
