# ADR-0008: Identity Auth Boundary Uses ASP.NET Core Identity with Dapper Runtime Stores

Status: Accepted

## Context

CP6 introduces the first live authenticated boundary for PaperBinder. The repository needs:

- a real username/password authentication system aligned to the documented ASP.NET Core Identity baseline
- parent-domain cookie auth that works across the root host and tenant subdomains
- tenant membership validation before tenant-scoped request handling runs
- an implementation that preserves ADR-0007's Dapper-only runtime rule

This decision sits on two existing constraints:

- tenant isolation is a security boundary, so authenticated tenant access must be validated before tenant-scoped handlers run
- runtime persistence must stay Dapper-only in v1, with EF Core confined to migrations and tooling

CP6 therefore needs an explicit auth-boundary ADR rather than an implementation accident.

## Decision

Use the following auth boundary for PaperBinder v1:

- ASP.NET Core Identity managers for username/password authentication and cookie-session management
- custom Dapper-backed runtime stores for user persistence instead of EF Core Identity stores
- `users` as the credential and normalized-identity table
- `user_tenants` as the authoritative tenant-membership table
- one tenant membership per user in v1, enforced with a unique constraint on `user_tenants.user_id`
- canonical tenant roles stored on `user_tenants` as `TenantAdmin`, `BinderWrite`, and `BinderRead`
- parent-domain auth cookie configuration based on the configured auth-cookie domain and name
- Data Protection keys persisted via `PAPERBINDER_AUTH_KEY_RING_PATH`
- redirect origin construction based on trusted `PAPERBINDER_PUBLIC_ROOT_URL`, not raw request scheme/host input
- CSRF enforcement for authenticated unsafe `/api/*` requests using a readable companion cookie and `X-CSRF-TOKEN`

The runtime boundary is strict:

- Identity managers and stores are allowed in API and Infrastructure only
- application/domain code does not depend on ASP.NET Core Identity types
- runtime auth reads/writes remain Dapper-based
- tenant request context is established only after authenticated membership and expiry validation succeed

## Why

- Preserves the documented ASP.NET Core Identity baseline without violating ADR-0007.
- Keeps runtime tenant/membership SQL explicit and reviewable.
- Avoids a second runtime ORM pattern for auth data.
- Supports the single-login cross-subdomain flow required by the root-host to tenant-host handoff.
- Uses the authoritative membership join table to prevent tenant selection from drifting into client-controlled inputs.
- Anchors redirect construction to trusted configuration rather than reverse-proxy assumptions that are easy to misconfigure.

## Consequences

- Positive: authentication, cookie issuance, and password verification rely on mature ASP.NET Core primitives rather than custom crypto/session code.
- Positive: authenticated tenant-host requests now fail closed on missing membership or expired-tenant state before feature handlers run.
- Positive: the auth boundary stays aligned with the documented Dapper-only runtime rule.
- Negative: Infrastructure now owns custom Identity store code that must stay consistent with the schema and manager expectations.
- Negative: CP6 still does not provide pre-auth challenge verification or login throttling; those controls remain required CP7 follow-up work.
- Negative: the v1 one-membership-per-user simplification constrains future multi-tenant-user behavior until a later ADR or feature definition supersedes it.

## Alternatives considered

- EF Core Identity stores at runtime: rejected because they would violate ADR-0007's Dapper-only runtime rule.
- Fully custom password/session implementation: rejected because it adds avoidable security and maintenance risk without improving reviewer signal.
- Deriving tenant access from client-supplied tenant identifiers after login: rejected because tenant isolation must remain server-authoritative.
- Building redirect origins from raw request scheme or forwarded headers alone: rejected because the trusted public origin must be explicit in config for this demo topology.
