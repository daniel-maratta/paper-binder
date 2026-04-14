# FD-0009 - Configuration Contract

## AI Summary

- Runtime behavior is controlled through typed environment-backed configuration.
- Startup validates required configuration and fails fast on invalid or missing critical values.
- Secrets and non-secret config are handled with distinct rules.
- Config contract includes lease controls, auth cookie, challenge, rate-limit, and retention-mode settings.

## Status
Resolved - integrated into canonical documentation

## Canonical locations
- docs/30-security/secrets-and-config.md
- docs/70-operations/deployment.md
- docs/70-operations/runbook-local.md
- docs/70-operations/runbook-prod.md

## Why this exists
Configuration expectations exist in security docs, but there is no single feature-level contract defining validation behavior and operational boundaries. This definition establishes the minimum required configuration contract for API and worker execution.

## Scope
This definition covers:
- Required configuration categories for v1.
- Startup validation behavior.
- Secret-handling and logging constraints.

This definition does not cover:
- Provider-specific secret manager implementation details.
- Dynamic runtime config reload in v1.
- Multi-environment release orchestration policy.

## Decision
PaperBinder uses environment-backed configuration with strict startup validation.

Rules:
- Required values must be present and parseable at startup.
- Invalid critical config causes startup failure (fail fast).
- Secrets must never be written to source control or logs.
- Non-secret behavior values use bounded validation (for example positive lease intervals and sane limit ranges).

Required configuration groups:
- Database connectivity.
- Auth cookie settings and key-ring location.
- Lease defaults, extension amount and eligibility threshold, max extensions, cleanup cadence.
- Challenge provider secrets and settings.
- Rate-limit budgets for pre-auth and authenticated surfaces.
- Audit retention mode for tenant purge behavior.

## User-visible behavior
- Misconfiguration produces deterministic service unavailability rather than partial unsafe behavior.
- Tenant users observe stable contract behavior across environments once service is healthy.

## API / contract impact
- No new user-facing endpoint is required.
- Error contracts continue to avoid config-secret leakage.
- Health/readiness endpoints should surface configuration readiness state at coarse level.

## Domain / architecture impact
- Typed options classes should map configuration into API and worker services.
- Validation occurs at composition and startup boundary, not ad hoc inside handlers.
- System-context jobs (cleanup and provisioning) consume the same validated config source.

## Security / ops impact
- Secret rotation procedures must be documented in operations runbooks.
- Logs and ProblemDetails must redact secret-like data.
- Environment-specific config baselines should be tracked via `.env.example` plus docs with fake values only.

## Canonical updates required
- `docs/30-security/secrets-and-config.md` (required vars and validation bounds)
- `docs/70-operations/runbook-local.md` and `docs/70-operations/runbook-prod.md` (config verification and rotation steps)
- `docs/20-architecture/system-overview.md` (startup validation boundary if expanded)
- `docs/40-contracts/api-contract.md` (error behavior references when config-induced unready state matters)
- `docs/80-testing/test-strategy.md` (config-validation and misconfiguration tests)

## Open questions
None.

## Resolution outcome
No new ADR required. This definition formalizes existing security and operations configuration posture.
