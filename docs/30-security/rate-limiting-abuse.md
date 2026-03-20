# Rate Limiting and Abuse Controls
Status: V1 (Minimal)

This document defines baseline anti-abuse controls for the public demo.
This file is the PaperBinder-specific abuse surface and policy binding.

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

Suggested starting limits:
- Pre-auth: strict per-IP limits.
- Authenticated: per-identity/per-tenant budgets.
- Lease extension: very strict anti-abuse limits.

Tune limits based on observed traffic.

## Challenge Interaction

- Challenge completion is not authentication.
- Require challenge proof on `POST /api/provision` and `POST /api/auth/login`.
- Rate limit challenge verification, provisioning, and login endpoints.
- Log failed verification events and throttle aggressively.

## Response Semantics

- Return `429 Too Many Requests`.
- Return ProblemDetails payload.
- Include `Retry-After` when supported.
- Prefer stable machine-readable `errorCode` values for throttle and challenge failures.

## Alternatives Considered

- No rate limiting in V1: rejected; unacceptable public risk.
- CAPTCHA-first strategy: rejected as default; keep Turnstile-based model.
- Redis/distributed limiter: rejected for single-host V1.
