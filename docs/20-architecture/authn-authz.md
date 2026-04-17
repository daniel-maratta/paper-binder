# Authn Authz

## Authentication

- Authentication uses ASP.NET Core Identity with server-issued cross-subdomain cookie/principal trust.
- Cross-subdomain cookie authentication is the only supported mechanism in v1.
- JWT authentication is not supported in v1.
- Root-host login is live in CP6 and resolves tenant redirect target from server-side membership.
- CP15 reuses the same auth cookie to carry trusted impersonation markers for `effectiveUserId` and `sessionId`; the browser never supplies impersonation identity.
- Authenticated unsafe `/api/*` routes require a readable CSRF cookie paired with `X-CSRF-TOKEN`.
- Post-auth tenant context is derived server-side from membership and routing context and is materialized only after membership and tenant-expiry validation succeed.
- Root-host provisioning and login now require server-side challenge verification plus shared per-IP pre-auth rate limiting before expensive auth/provision work runs.

## Trust Model

Trusted inputs:
- Server-issued auth cookie / Identity principal.
- Server-issued impersonation claims embedded in that cookie.
- Server-side host and tenant routing configuration.
- Explicit public-root configuration used for redirect URL construction.

Untrusted inputs:
- Request headers (including forwarded headers unless explicitly validated/configured).
- Query-string tenant selectors.
- Client-supplied tenant identifiers.
- Client-supplied impersonation headers, query params, or browser-stored identity state.

Subdomain is routing input only and must match authenticated tenant membership/claim context.

## Authorization

- CP6 enforces the authenticated-user and tenant-membership boundary before feature handlers run.
- CP8 maps explicit named policies at the API boundary: `AuthenticatedUser`, `BinderRead`, `BinderWrite`, and `TenantAdmin`.
- Policy evaluation uses a request-scoped authenticated membership context populated only after tenant-host membership validation succeeds.
- While impersonation is active, endpoint and binder-policy authorization evaluate the effective impersonated membership rather than the original actor's `TenantAdmin` role.
- Original actor identity is preserved in request scope for stop behavior, audit-safe logging, and impersonation teardown during logout or expired-cookie detection.
- Tenant-host-only and system-host-only API routes are gated from the resolved-host request context before CSRF and authorization run.
- Handlers do not perform ad-hoc role checks and do not accept caller-role arguments.
- v1 uses one effective role per user per tenant as a simplification.
- Future versions may support additive multi-role aggregation without moving authorization out of API-boundary policy checks.
