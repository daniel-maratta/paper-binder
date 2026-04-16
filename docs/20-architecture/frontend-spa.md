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
- SPA sends `X-Api-Version` on all API requests (v1 value: `1`).
- `X-Api-Version` negotiation is enforced server-side for `/api/*` routes.
- Non-API SPA document/asset requests do not participate in API version negotiation.
- Routing and data orchestration execute in the client SPA and call the API directly.
- Tenant-shell auth-aware bootstrap in CP12 uses only `GET /api/tenant/lease` before later checkpoints add feature-specific calls.
- No route-module server logic executes in V1.

## Host Contexts

- Root host (`lab.danielmaratta.com`):
  - backend login/provision contracts plus challenge/rate-limit guards are live; browser UI wiring lands in later frontend checkpoints.
- Tenant host (`{tenant}.lab.danielmaratta.com`):
  - binders/documents, lease status, tenant actions.

## Authentication in Browser

- Cookie-based auth only in V1.
- Cookies must be `Secure` and `HttpOnly`.
- Parent-domain cookie enables single-login subdomain flow.
- Unsafe methods require CSRF protection.

## Error UX

- API errors use ProblemDetails.
- Shared client error handling preserves at least HTTP status, `errorCode`, user-displayable detail, `X-Correlation-Id`, and `Retry-After` when present.
- User-facing handling includes:
  - invalid credentials
  - expired or unknown tenant
  - challenge failure
  - rate limiting (`429`)

## Alternatives Considered

- SSR: rejected; unnecessary V1 complexity.
- JWT browser auth: rejected; avoid token-storage risk.
- Separate BFF: rejected; extra deployment surface.
- Realtime push channels: rejected; unnecessary V1 complexity.

## Related Documents

- `docs/20-architecture/frontend-app-route-map.md`
- `docs/40-contracts/api-contract.md`
