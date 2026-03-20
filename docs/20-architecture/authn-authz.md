# Authn Authz

## Authentication

- Authentication uses ASP.NET Core Identity with server-issued cross-subdomain cookie/principal trust.
- Cross-subdomain cookie authentication is the only supported mechanism in v1.
- JWT authentication is not supported in v1.
- Post-auth tenant context is derived server-side from membership and routing context.
- Root-host pre-auth actions (provision/login) require challenge verification and rate limiting.

## Trust Model

Trusted inputs:
- Server-issued auth cookie / Identity principal.
- Server-side host and tenant routing configuration.

Untrusted inputs:
- Request headers (including forwarded headers unless explicitly validated/configured).
- Query-string tenant selectors.
- Client-supplied tenant identifiers.

Subdomain is routing input only and must match authenticated tenant membership/claim context.

## Authorization

- Authorization uses policy-based RBAC at the API boundary.
- Endpoints invoking handlers must declare policy requirements.
- Handlers do not perform ad-hoc role checks and do not accept caller-role arguments.
- v1 uses one effective role per user per tenant as a simplification.
- Future versions may support additive multi-role aggregation without moving authorization out of API-boundary policy checks.
