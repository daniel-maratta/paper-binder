# Rate Limiting and Abuse Controls
Status: V1 (Minimal)

This document defines baseline anti-abuse controls for the public demo.
This file is the PaperBinder-specific abuse surface and policy binding.

Current implementation note:
- The current build adds server-side Turnstile verification for root-host `POST /api/provision` and `POST /api/auth/login`.
- The current build applies a shared per-IP fixed-window rate limit across those two root-host pre-auth routes.
- `PB_ENV=Test` allows a fixed bypass token for automated tests only; production behavior always verifies with the configured secret key.

## Scope

In scope:
- Endpoint-level rate limiting posture.
- Abuse surface inventory.
- `429` response behavior.

Out of scope:
- Advanced bot scoring.
- Multi-node distributed rate limiting.
- Dedicated WAF policy program.

## Abuse Surfaces

Pre-auth:
- Turnstile challenge verification.
- `POST /api/provision`.
- `POST /api/auth/login`.

Tenant-scoped:
- `POST /api/tenant/lease/extend`.
- Document read endpoints.
- Binder creation endpoints.

## Policy Direction

Apply rate limiting in one canonical place:
- Preferred: ASP.NET Core rate limiting middleware.
- Alternative: reverse-proxy coarse limits.

Current CP7 implementation:
- ASP.NET Core rate limiting middleware is the canonical enforcement point.
- Login and provision intentionally share one per-IP pre-auth budget in v1.

Suggested starting limits:
- Pre-auth: strict per-IP limits.
- Authenticated: per-identity/per-tenant budgets.
- Lease extension: very strict anti-abuse limits.

Tune limits based on observed traffic.

## Challenge Interaction

- Challenge completion is not authentication.
- Require challenge proof on `POST /api/provision` and `POST /api/auth/login`.
- Rate limit provisioning and root-host login together under one shared pre-auth budget.
- Log failed verification events and throttle aggressively.
- In tests only, `PB_ENV=Test` may use the fixed bypass token instead of the real provider verification round-trip.

## Response Semantics

- Return `429 Too Many Requests`.
- Return ProblemDetails payload.
- Include `Retry-After` when supported.
- Use stable machine-readable `errorCode` values:
  - `CHALLENGE_REQUIRED`
  - `CHALLENGE_FAILED`
  - `RATE_LIMITED`

## Alternatives Considered

- No rate limiting in V1: rejected; unacceptable public risk.
- CAPTCHA-first strategy: rejected as default; keep Turnstile-based model.
- Redis/distributed limiter: rejected for single-host V1.
