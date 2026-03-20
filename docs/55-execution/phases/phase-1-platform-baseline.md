# Phase 1 - Platform Baseline

Checkpoints: CP1, CP2, CP3, CP4

## Goal

Establish the workspace, deployment topology, persistence pipeline, and HTTP contract baseline so that all subsequent work builds on a real, runnable platform.

## Entry Conditions

- Scope and non-goals are current in `docs/00-intent/`.
- Canonical decisions are locked in `docs/00-intent/canonical-decisions.md`.
- No code exists yet; repo is docs-only.

## Checkpoints

### CP1 - Workspace Bootstrap And CI

- .NET solution and project skeleton (API, worker, domain, application, infrastructure, migrations, tests).
- Vite React client scaffold.
- Root scripts for restore, build, test, docs validation, local startup.
- Agents must create the required bootstrap and validation scripts in this checkpoint; do not assume pre-existing helper scripts.
- CI for backend build/test, frontend build, docs/reference validation.

### CP2 - Runtime Configuration And Local Deployment Scaffold

- Typed backend configuration and frontend environment handling.
- Docker Compose, PostgreSQL container, reverse proxy baseline.
- `.env.example` aligned to deployment docs.
- Local runbook and deployment docs updated.

### CP3 - Persistence Baseline And Migration Pipeline

- Migrations project and baseline schema workflow.
- Dapper runtime infrastructure, connection abstractions, transaction helpers, clock abstractions.
- Postgres-backed integration test harness.
- Persistence/testing doc updates.

### CP4 - HTTP Contract Baseline

- ProblemDetails handling, `X-Api-Version`, `X-Correlation-Id` middleware.
- `GET /health/live` and `GET /health/ready` per contract.
- Standard error-code mapping.
- Integration tests for versioned API routes, non-versioned health routes, correlation headers, ProblemDetails shape.

## Exit Criteria

- Clean checkout restores and builds backend and frontend.
- CI is green.
- Local stack boots with reverse proxy, app container, and database.
- Migrations apply cleanly.
- Integration tests can provision an isolated database and query it.
- Health endpoints and error contracts match canonical docs.
- Protocol-level tests pass.

## Task Integration

Each checkpoint should map to one or more tasks under `docs/05-taskboard/tasks/` using the `T-####` format. Create tasks before starting work and update their status as checkpoints progress. Reference the checkpoint ID (e.g., `CP1`) in task context fields.

## Key References

- [execution-plan.md](../execution-plan.md) - Full checkpoint details
- [docs/40-contracts/api-contract.md](../../40-contracts/api-contract.md) - API contract
- [docs/70-operations/README.md](../../70-operations/README.md) - Operations and deployment
