# FD-0006 - Challenge Verification and Rate Limits

## AI Summary

- Challenge verification is mandatory anti-abuse friction for root-host pre-auth actions.
- Challenge verification is server-side and never treated as authentication.
- Rate limits apply to challenge-bearing endpoints with strict `429` semantics.
- Error responses stay on RFC 7807 ProblemDetails with stable machine codes.

## Status
Resolved — integrated into canonical documentation

## Canonical locations
- docs/40-contracts/api-contract.md
- docs/30-security/rate-limiting-abuse.md
- docs/20-architecture/authn-authz.md
- docs/70-operations/runbook-prod.md

## Why this exists
Challenge and rate-limit posture is documented in security/ADR docs, but implementation-level contract details are not consolidated. This definition specifies how challenge verification and throttling integrate at endpoint boundaries.

## Scope
This definition covers:
- Challenge requirements for pre-auth endpoints.
- Rate-limiting semantics and response contract.
- Logging/audit expectations for challenge failures and throttle events.

This definition does not cover:
- Advanced bot scoring engines.
- Distributed/multi-node rate-limiting infrastructure.
- CAPTCHA provider lock-in details beyond configuration contract.

## Decision
Challenge and throttling are mandatory controls on root-host pre-auth endpoints.

Rules:
- `POST /api/provision` and `POST /api/auth/login` require challenge proof input.
- Challenge proof is verified server-side before expensive provisioning/auth work.
- Missing or invalid challenge proof fails fast.
- Rate limiting applies before or alongside challenge verification with endpoint-appropriate limits.
- `429` responses include `Retry-After` when available.

## User-visible behavior
- Users must complete challenge before provisioning or login attempts are accepted.
- On challenge failure, users see a retryable, non-leaky error.
- On throttling, users see rate-limit messaging and suggested retry timing.

## API / contract impact
Contract clarifications:
- Pre-auth request payloads include `challengeToken` (or equivalent provider proof).
- ProblemDetails errors include stable `errorCode` values for challenge and rate-limit failures.

Representative error classes:
- `400` challenge token missing or malformed.
- `403` challenge verification failed.
- `429` rate-limited with ProblemDetails and optional `Retry-After`.

## Domain / architecture impact
- Challenge validation is an infrastructure concern at API boundary and not a domain authorization substitute.
- Rate-limit policy mapping is centralized and endpoint-scoped.
- Provisioning/auth handlers assume challenge and throttle guards already executed.

## Security / ops impact
- Failed challenge and throttled events are logged with correlation fields and source metadata.
- Limits are configurable per environment and tuned from observed traffic.
- Challenge secrets remain environment-managed and never committed.

## Canonical updates required
- `docs/30-security/rate-limiting-abuse.md` (endpoint-specific mappings)
- `docs/30-security/public-repo-safety.md` and `docs/30-security/secrets-and-config.md` (challenge config)
- `docs/40-contracts/api-contract.md` (challenge/rate-limit errors)
- `docs/70-operations/runbook-prod.md` (triage for challenge and throttling incidents)
- `docs/80-testing/e2e-tests.md` and `docs/80-testing/integration-tests.md` (challenge fail and `429` behavior)

## Open questions
None.

## Resolution outcome
No new ADR required. This definition implements accepted ADR-0006 direction.
