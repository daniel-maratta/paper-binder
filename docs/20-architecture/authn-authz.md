# Authn Authz

## Authentication

- Authentication uses ASP.NET Core Identity with server-issued cross-subdomain cookie/principal trust.
- Cross-subdomain cookie authentication is the only supported mechanism in v1.
- JWT authentication is not supported in v1.
- Root-host login is live in CP6 and resolves tenant redirect target from server-side membership.
- Authenticated unsafe `/api/*` routes require a readable CSRF cookie paired with `X-CSRF-TOKEN`.
- Post-auth tenant context is derived server-side from membership and routing context and is materialized only after membership and tenant-expiry validation succeed.
- Root-host provisioning and login now require server-side challenge verification plus shared per-IP pre-auth rate limiting before expensive auth/provision work runs.

## Trust Model

Trusted inputs:
- Server-issued auth cookie / Identity principal.
- Server-side host and tenant routing configuration.
- Explicit public-root configuration used for redirect URL construction.

Untrusted inputs:
- Request headers (including forwarded headers unless explicitly validated/configured).
- Query-string tenant selectors.
- Client-supplied tenant identifiers.

Subdomain is routing input only and must match authenticated tenant membership/claim context.

## Authorization

- CP6 enforces the authenticated-user and tenant-membership boundary before feature handlers run.
- Policy-based RBAC remains the v1 authorization model, but explicit named-policy endpoint mapping lands in CP8.
- Handlers do not perform ad-hoc role checks and do not accept caller-role arguments.
- v1 uses one effective role per user per tenant as a simplification.
- Future versions may support additive multi-role aggregation without moving authorization out of API-boundary policy checks.
