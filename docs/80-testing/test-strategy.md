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

## Non-Negotiable Coverage

- Tenant isolation: no cross-tenant reads or writes.
- Authorization enforcement at API endpoints.
- Provisioning transactionality (all-or-nothing seed behavior).
- Tenant lease extension-window rules and cleanup hard-delete behavior.
- Challenge + pre-auth rate-limit behavior on provisioning and root login.
- Impersonation constraints (tenant-local only) and required audit events.

## Test Layer Guidance

- Integration tests:
  - Multi-tenant query boundaries.
  - Authentication/authorization boundary behavior.
  - Provisioning and cleanup workflows.
- Unit tests:
  - Domain invariants.
  - Command/query handler behavior under explicit preconditions.

## Environment-Gated Test Bypass Reminder

- If `PB_ENV == "Test"`: accept fixed Turnstile token value for test-only execution.
- Else: verify Turnstile with the configured secret key.
- Bypass logic must remain environment-gated and never enabled in Production.
