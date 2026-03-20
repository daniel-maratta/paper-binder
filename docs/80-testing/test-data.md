# Test Data
Status: V1

This document defines deterministic test data creation and cleanup rules.

## Scope

In scope:
- Unit, integration, and E2E test data strategy.
- Isolation and cleanup rules.

Out of scope:
- Large synthetic datasets.
- Production snapshot usage.

## Principles

- Tests create their own data.
- Tests do not depend on shared persistent state.
- Avoid coupling to public demo data.

## Unit Test Data

- Use in-memory builders/value objects.
- Inject clock abstractions for lease/time logic.

## Integration Test Data

- Use dedicated containerized Postgres.
- Reset schema per run (or equivalent isolation strategy).
- Seed minimal required reference data.

## E2E Test Data

- Provision tenants through normal app flow in local test env.
- Use short lease durations and faster cleanup cadence in test env.
- Capture generated credentials through safe test-only paths.
- Do not expose test-only endpoints in production.

## Cleanup Strategy

- Prefer automatic lease-expiration cleanup in test environment.
- Explicit cleanup endpoint is optional and test-only if implemented.

## Alternatives Considered

- Shared persistent test DB: rejected; causes flakiness/coupling.
- Public demo as test-data source: rejected; noisy and expensive.
