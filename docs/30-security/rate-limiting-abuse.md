# Rate Limiting and Abuse Controls
Status: V1 (Minimal)

This document defines baseline anti-abuse controls for the public demo.
This file is the PaperBinder-specific abuse surface and policy binding.

Current implementation note:
- The current build adds server-side Turnstile verification for root-host `POST /api/provision` and `POST /api/auth/login`.
- The current build applies a shared per-IP fixed-window rate limit across those two root-host pre-auth routes.
- The current build applies a canonical fixed-window authenticated limiter across unsafe tenant-host `/api/*` mutations after tenant membership is established.
- Authenticated tenant-host mutation partitions use `(tenant_id, effective_user_id)`.
- `POST /api/auth/logout` and `DELETE /api/tenant/impersonation` are exempt from the authenticated mutation limiter so teardown stays reachable under downgraded effective roles.
- Missing-CSRF tenant-host mutations are rejected before authenticated rate-limit accounting.
- The current build applies a dedicated fixed-window rate limit to tenant-host `POST /api/tenant/lease/extend`.
- Lease-extend partitions use tenant-plus-user identity when membership is established, fall back to tenant-plus-IP when only tenant host resolution is available, and otherwise fall back to IP.
- `PB_ENV=Test` allows a fixed bypass token for the isolated automated-test runtime.
- A separate local-development bypass may also be enabled explicitly through the documented local runtime flags; it remains off by default, is rejected for non-local root hosts, and is not part of the reviewer or production path.
- Default reviewer and production behavior still verifies with the configured secret key.

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
- Unsafe tenant-host `/api/*` mutations after membership validation.
- `POST /api/tenant/lease/extend`.
- Document read endpoints.
- Binder creation endpoints.

## Policy Direction

Apply rate limiting in one canonical place:
- Preferred: ASP.NET Core rate limiting middleware.
- Alternative: reverse-proxy coarse limits.

Current implementation:
- ASP.NET Core rate limiting middleware is the canonical enforcement point.
- Login and provision intentionally share one per-IP pre-auth budget in v1.
- Authenticated unsafe tenant-host mutations share one fixed-window budget sourced from `PAPERBINDER_RATE_LIMIT_AUTHENTICATED_PER_MINUTE`.
- `POST /api/tenant/lease/extend` has its own route-scoped fixed-window budget and returns `429 RATE_LIMITED` with `Retry-After` on rejection.

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
- In the isolated E2E/runtime-test path, `PB_ENV=Test` may use the fixed bypass token instead of the real provider verification round-trip.
- In local development only, an explicit opt-in config path may use the same fixed bypass token for manual testing past the root-host challenge when the configured root host is loopback or `.localhost`.
- Reviewer and production flows must keep both bypass paths disabled.

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
