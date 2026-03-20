# FD-0002 - Demo Provisioning Login Flow

## AI Summary

- Root-host pre-auth flow combines challenge, provisioning, and login handoff.
- Provisioning returns one-time credentials and transitions the session to tenant host context.
- Returning users can log in from root host and are redirected to their tenant subdomain.
- Tenant resolution remains server-controlled from host plus membership.

## Status
Resolved — integrated into canonical documentation

## Canonical locations
- docs/40-contracts/api-contract.md
- docs/10-product/user-stories.md
- docs/10-product/ux-notes.md
- docs/20-architecture/frontend-spa.md

## Why this exists
Current docs describe provisioning and login independently, but the end-to-end flow and failure semantics are split across multiple lanes. This definition creates one implementation contract for provisioning plus login UX and API behavior.

## Scope
This definition covers:
- Root-host provisioning flow.
- Root-host login flow for previously provisioned users.
- Redirect behavior into tenant host context.

This definition does not cover:
- External identity providers.
- JWT/token handoff flows.
- Multi-tenant membership per user.

## Decision
The v1 flow is:
1. User completes challenge on root host.
2. User provisions tenant via `POST /api/provision`.
3. API returns generated credentials and signs in the newly created owner session.
4. Client redirects to tenant host using server-provided `redirectUrl`.
5. Returning users can use `POST /api/auth/login` on root host and receive tenant redirect URL.

Rules:
- Credentials from provisioning are shown once in UI and not re-fetchable.
- Tenant for login is resolved from authenticated membership; client payload tenant hints are ignored for authorization.
- Expired tenants cannot complete login into tenant-scoped experiences.

## User-visible behavior
- Landing page supports "provision and enter tenant" and "login with existing credentials."
- Successful provision/login redirects to `{tenant}.<parent-domain>/app`.
- Clear error messaging for invalid credentials, challenge failures, rate limits, and expired tenants.

## API / contract impact
Contract clarifications:
- `POST /api/provision` returns `tenantId`, `tenantSlug`, `expiresAt`, one-time credentials, and `redirectUrl`.
- `POST /api/auth/login` returns `redirectUrl` for resolved tenant host.
- Both endpoints return ProblemDetails on failure and preserve correlation headers.

Representative error codes:
- `CHALLENGE_REQUIRED`
- `CHALLENGE_FAILED`
- `INVALID_CREDENTIALS`
- `TENANT_EXPIRED`
- `RATE_LIMITED`

## Domain / architecture impact
- Provisioning remains transactional (tenant, owner user, seed data).
- Provisioning lifecycle state stays explicit (`Pending`, `Active`, `Failed`).
- Raw credential values are never persisted after issuance boundary.
- Tenant context for post-auth requests remains immutable per request.

## Security / ops impact
- Challenge verification and rate limiting are mandatory on pre-auth actions.
- Auth cookies remain parent-domain scoped with secure flags and CSRF controls for unsafe methods.
- Structured logs must include trace and correlation identifiers for failed pre-auth actions.

## Canonical updates required
- `docs/10-product/user-stories.md` (provision/login acceptance criteria details)
- `docs/10-product/ux-notes.md` (single-flow language and failure UX)
- `docs/20-architecture/system-overview.md` and `docs/20-architecture/frontend-spa.md` (flow sequence)
- `docs/40-contracts/api-contract.md` (response shape and errors)
- `docs/70-operations/runbook-local.md` and `docs/70-operations/runbook-prod.md` (verification checklist)

## Open questions
None.

## Resolution outcome
No new ADR required. This definition applies existing auth, tenancy, and bot-friction ADR decisions.
