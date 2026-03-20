# FD-0008 - Health and Readiness Contract

## AI Summary

- Liveness and readiness are separate contracts with different dependency strictness.
- Health endpoints are system-context operational paths and not tenant-scoped APIs.
- Readiness reflects dependency availability required to serve traffic safely.
- Responses must be non-sensitive and stable for automation.

## Status
Resolved — integrated into canonical documentation

## Canonical locations
- docs/40-contracts/api-contract.md
- docs/40-contracts/api-style.md
- docs/40-contracts/api-versioning.md
- docs/70-operations/runbook-prod.md
- docs/70-operations/deployment.md

## Why this exists
Operations docs reference container health checks, but endpoint-level semantics are not documented in one place. This definition standardizes health/readiness behavior for deployment and incident workflows.

## Scope
This definition covers:
- API health endpoint paths and semantics.
- Readiness dependency checks.
- Response shape and status-code expectations.

This definition does not cover:
- Full observability dashboard design.
- SLO/SLI governance program.
- Tenant-level synthetic transaction probes.

## Decision
Expose two operational endpoints with explicit semantics:
- `GET /health/live`
- `GET /health/ready`

Rules:
- `live` reports process liveness only (service loop alive).
- `ready` reports whether required dependencies are available to safely handle requests.
- Health endpoints are accessible without authentication.
- Health endpoints are outside `/api/*` version negotiation.
- Payloads must not leak secrets, connection strings, dependency internals, topology details, or service version numbers.

## User-visible behavior
- No end-user UI feature depends on health endpoints.
- Deployment and orchestration systems consume these endpoints for routing and restart decisions.
- During degraded dependency states, readiness can return non-`2xx` while liveness remains `200`.

## API / contract impact
Contract:
- `GET /health/live` -> `200` when process is alive.
- `GET /health/ready` -> `200` when service is ready, `503` when not ready.
- Response media type is JSON with minimal stable top-level fields:
  - `status`
  - `timestamp`
- Response body must not enumerate dependency check names, dependency states, or version metadata.

## Domain / architecture impact
- Health checks execute in explicit system context.
- Readiness checks include at minimum database connectivity and required configuration presence.
- Dependency-specific failure detail remains internal (logs/telemetry), not health-response payload.
- Worker health is monitored via either dedicated health endpoint (if hosted) or structured heartbeat logs.

## Security / ops impact
- Endpoints should be low-cost and resistant to abuse (coarse rate limiting at edge acceptable).
- Failure logs should include correlation fields without sensitive values.
- Runbooks must map health failure classes to concrete triage actions.

## Canonical updates required
- `docs/70-operations/runbook-prod.md` (health endpoint checks in triage)
- `docs/70-operations/deployment.md` (probe wiring and rollout expectations)
- `docs/20-architecture/deployment-topology.md` (health-path placement)
- `docs/40-contracts/api-style.md` (non-API route contract note, if expanded)
- `docs/80-testing/integration-tests.md` (health/readiness assertions)

## Open questions
None.

## Resolution outcome
No new ADR required. This definition specifies operational contract details within existing topology decisions.
