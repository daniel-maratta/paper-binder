# Frontend SPA
Status: V1

PaperBinder uses a client-rendered React SPA for root and tenant experiences.

## Scope

In scope:
- SPA runtime boundaries and route responsibilities.
- Browser auth behavior with cookie-based identity.
- Tenant-aware navigation based on host context.
- React Router client-side SPA routing.

Out of scope:
- SSR/streaming SSR.
- Mobile clients.
- BFF pattern.
- React Router framework mode.
- Server loaders/actions.
- SignalR or other realtime push channels.

## Runtime Model

- SPA is served by ASP.NET host.
- Frontend build tooling uses Vite.
- The SPA chooses root-host versus tenant-host behavior from the current browser host plus `VITE_PAPERBINDER_ROOT_URL` and `VITE_PAPERBINDER_TENANT_BASE_DOMAIN`.
- Loopback process-debug hosts such as `localhost` remain root-host debug aliases only; they never establish tenant context.
- API calls are direct over HTTPS with `credentials: "include"`.
- Browser `/api/*` calls flow through one shared client layer.
- Tokens are not stored in local/session storage.
- Generated provisioning credentials are never stored in browser storage, cookies, or query params; CP13 keeps them in transient in-memory UI state only until the user continues to the tenant host.
- SPA sends `X-Api-Version` on all API requests (v1 value: `1`).
- `X-Api-Version` negotiation is enforced server-side for `/api/*` routes.
- Non-API SPA document/asset requests do not participate in API version negotiation.
- Routing and data orchestration execute in the client SPA and call the API directly.
- Tenant-shell auth-aware bootstrap uses `GET /api/tenant/lease` as the authoritative shell seam; CP14 layers feature-specific calls on top of that shell-owned lease state.
- No route-module server logic executes in V1.

## Host Contexts

- Root host (`lab.danielmaratta.com`):
  - `/` owns live provisioning plus the one-time credential handoff state.
  - `/login` owns live login.
  - challenge/rate-limit handling stays server-authoritative and routes through the shared browser client.
- Tenant host (`{tenant}.lab.danielmaratta.com`):
  - `/app` dashboard plus lease visibility
  - `/app/binders` and `/app/binders/:binderId` for binder, document-create, and binder-policy flows
  - `/app/documents/:documentId` for read-only document detail
  - `/app/users` for tenant-admin user management

## Authentication in Browser

- Cookie-based auth only in V1.
- Cookies must be `Secure` and `HttpOnly`.
- Parent-domain cookie enables single-login subdomain flow.
- Unsafe methods require CSRF protection.

## Error UX

- API errors use ProblemDetails.
- Shared client error handling preserves at least HTTP status, `errorCode`, user-displayable detail, `X-Correlation-Id`, and `Retry-After` when present.
- Browser-owned challenge wrapper markup owns label, helper/error association, keyboard reachability, and visible state messaging; provider widget internals remain third-party controlled.
- User-facing handling includes:
  - missing challenge proof
  - invalid credentials
  - expired or unknown tenant
  - challenge failure
  - tenant-name validation/conflict failures
  - rate limiting (`429`)
  - tenant-host access denial, validation, and route-failure states

## Tenant Shell State

- Lease state is owned once at the tenant-shell level and is the only browser source for expiry, countdown, extension count, and extend affordance state.
- Countdown is presentation only and is derived from the latest authoritative `expiresAt` value.
- CP14 refreshes lease state on bootstrap, successful extend, route changes, focus/visibility return, and a coarse periodic refresh.
- Tenant-host logout uses `POST /api/auth/logout` through the shared API client only and returns the browser to the configured root-host `/login`.

## Alternatives Considered

- SSR: rejected; unnecessary V1 complexity.
- JWT browser auth: rejected; avoid token-storage risk.
- Separate BFF: rejected; extra deployment surface.
- Realtime push channels: rejected; unnecessary V1 complexity.

## Related Documents

- `docs/20-architecture/frontend-app-route-map.md`
- `docs/40-contracts/api-contract.md`
