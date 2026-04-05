# API Contract (Minimum Viable, v1)

Status: Current (v1)

This contract defines the HTTP surface and boundary rules for the PaperBinder demo.
Use this file for PaperBinder-specific API surface and behavior binding.

## AI Summary

- Tenant scope is server-resolved from host plus membership; client tenant IDs are ignored.
- v1 auth is cookie-based only; `/api/*` version defaults to `1` with response header echo.
- Root-host provisioning and login now enforce server-side challenge verification plus shared pre-auth rate limiting.
- Tenant lease uses canonical routes `/api/tenant/lease` and `/api/tenant/lease/extend`.
- Documents remain immutable; archive state is visibility metadata only.
- Health endpoints are non-API routes, anonymous, minimal, and non-versioned.

## PaperBinder Binding Rules

- Tenant context source: request host/subdomain resolved server-side plus authenticated membership validation.
- Auth mechanism: cross-subdomain cookie only in v1 (no JWT).
- Authenticated unsafe `/api/*` requests require a CSRF cookie/header pair.
- Tenant scope is resolved server-side. Client-provided tenant identifiers are ignored.
- Request hosts must be either the configured root host or a single-label tenant subdomain beneath it; other hosts are rejected before route handlers execute.
- API versioning contract: `docs/40-contracts/api-versioning.md`.
- Version negotiation applies to `/api/*` routes only.
- On `/api/*`, request header `X-Api-Version` is optional in v1 and defaults to `1`.
- On `/api/*`, response header `X-Api-Version` is always returned.
- If `X-Api-Version` is malformed or unsupported on `/api/*`, the error response still returns `X-Api-Version: 1`.
- Non-API routes (SPA HTML/assets, health endpoints) do not participate in API version negotiation.
- Request header `X-Correlation-Id` is optional.
- Client-supplied `X-Correlation-Id` is reused only when it is a single visible ASCII token with no whitespace/control characters and length `1-64`; otherwise the server generates a replacement value.
- Response header `X-Correlation-Id` is always returned.
- v1 RBAC simplification: users have one effective role per tenant. Future versions may support multi-role aggregation.

## Error Contract (PaperBinder Binding)

Use RFC 7807 ProblemDetails for error responses:

```json
{
  "type": "https://paperbinder.dev/problems/tenant-forbidden",
  "title": "Tenant access denied.",
  "status": 403,
  "detail": "Tenant access denied.",
  "instance": "/api/binders",
  "errorCode": "TENANT_FORBIDDEN",
  "traceId": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00",
  "correlationId": "8f1571a64b7d49ce8a684214635d2f95"
}
```

Notes:
- `errorCode` is stable and machine-readable.
- `detail` is safe for client display.
- `traceId` is required for incident correlation.
- `correlationId` is required for request/incident correlation.
- Unsupported API version errors use `errorCode` `API_VERSION_UNSUPPORTED`.
- Invalid tenant hosts on `/api/*` return `400` ProblemDetails with `errorCode` `TENANT_HOST_INVALID`.
- Unknown tenant hosts on `/api/*` return `404` ProblemDetails with `errorCode` `TENANT_NOT_FOUND`.
- Invalid credentials return `401` ProblemDetails with `errorCode` `INVALID_CREDENTIALS`.
- Missing challenge proof returns `400` ProblemDetails with `errorCode` `CHALLENGE_REQUIRED`.
- Failed challenge verification returns `403` ProblemDetails with `errorCode` `CHALLENGE_FAILED`.
- Invalid CSRF tokens return `403` ProblemDetails with `errorCode` `CSRF_TOKEN_INVALID`.
- Tenant-name validation failures return `400` ProblemDetails with `errorCode` `TENANT_NAME_INVALID`.
- Tenant-name conflicts return `409` ProblemDetails with `errorCode` `TENANT_NAME_CONFLICT`.
- Missing or wrong-tenant membership returns `403` ProblemDetails with `errorCode` `TENANT_FORBIDDEN`.
- Expired-but-not-purged tenants return `410` ProblemDetails with `errorCode` `TENANT_EXPIRED`.
- Pre-auth throttling returns `429` ProblemDetails with `errorCode` `RATE_LIMITED` and includes `Retry-After` when available.
- Unmatched `/api/*` routes return `404` ProblemDetails and still include `traceId`, `correlationId`, `X-Api-Version`, and `X-Correlation-Id`.

## API Surface

### Provisioning and Lease

- `POST /api/provision`
  - Status: live in the current build
  - Auth required: N
  - Tenant context source: none (system context, pre-auth)
  - Challenge required: Y
  - Rate limited: Y
  - Request example:
    ```json
    { "tenantName": "Acme Demo", "challengeToken": "<token>" }
    ```
  - Response example (`201`):
    ```json
    {
      "tenantId": "3e7d6ad8-ec43-4d5b-8d35-28f316f8f7de",
      "tenantSlug": "acme-demo",
      "expiresAt": "2026-03-02T21:30:00Z",
      "redirectUrl": "https://acme-demo.paperbinder.local/app",
      "credentials": { "email": "owner@acme-demo.local", "password": "<generated>" }
    }
    ```
  - Failure semantics:
    - `400` when challenge proof is missing or the tenant name is invalid after normalization.
    - `403` when challenge verification fails.
    - `409` when the normalized tenant name is unavailable.
    - `429` when the shared pre-auth rate-limit budget is exhausted.
  - Idempotency: not idempotent.

- `GET /api/tenant/lease`
  - Auth required: Y
  - Tenant context source: host/subdomain plus server-side membership validation
  - Response example (`200`):
    ```json
    {
      "expiresAt": "2026-03-02T21:30:00Z",
      "secondsRemaining": 2520,
      "extensionCount": 1,
      "maxExtensions": 3,
      "canExtend": false
    }
    ```
  - Idempotency: idempotent.

- `POST /api/tenant/lease/extend`
  - Auth required: Y
  - Tenant context source: host/subdomain plus server-side membership validation
  - Request example:
    ```json
    {}
    ```
  - Response example (`200`):
    ```json
    {
      "expiresAt": "2026-03-02T21:40:00Z",
      "secondsRemaining": 3120,
      "extensionCount": 2,
      "maxExtensions": 3,
      "canExtend": false
    }
    ```
  - Failure semantics:
    - `409` when extension window/count rules are not satisfied.
    - `410` when tenant is expired but not yet purged.
    - `404` after tenant purge.
  - Idempotency: conditionally idempotent within unchanged lease state; otherwise non-idempotent.

### Authentication

- `POST /api/auth/login`
  - Auth required: N
  - Tenant context source: credential plus server-side membership (host may be root domain)
  - Challenge required: Y
  - Rate limited: Y
  - Request example:
    ```json
    { "email": "owner@acme-demo.local", "password": "<password>", "challengeToken": "<token>" }
    ```
  - Response example (`200`):
    ```json
    { "redirectUrl": "https://acme-demo.paperbinder.local/app" }
    ```
  - Failure semantics:
    - `400` when challenge proof is missing.
    - `403` when challenge verification fails or the user has no tenant membership.
    - `401` when credentials are invalid.
    - `410` when the resolved tenant is expired but not yet purged.
    - `429` when the shared pre-auth rate-limit budget is exhausted.
  - Idempotency: effectively idempotent for valid repeated submissions.

- `POST /api/auth/logout`
  - Auth required: Y
  - Tenant context source: subdomain plus cookie
  - CSRF required: Y
  - Request example:
    ```json
    {}
    ```
  - Response example (`204`): empty body.
  - Idempotency: idempotent.

### Tenant Users and Roles

- `GET /api/tenant/users`
  - Auth required: Y (`TenantAdmin`)
  - Tenant context source: subdomain plus cookie
  - Idempotency: idempotent.

- `POST /api/tenant/users`
  - Auth required: Y (`TenantAdmin`)
  - Tenant context source: subdomain plus cookie
  - Idempotency: not idempotent.

- `POST /api/tenant/users/{userId}/role`
  - Auth required: Y (`TenantAdmin`)
  - Tenant context source: subdomain plus cookie
  - Failure semantics:
    - `409` when change would demote the last tenant admin.
    - `422` for invalid role value.
  - Idempotency: conditionally idempotent.

### Binders

- `GET /api/binders`
  - Auth required: Y (`BinderRead`)
  - Tenant context source: subdomain plus cookie
  - Idempotency: idempotent.

- `POST /api/binders`
  - Auth required: Y (`BinderWrite`)
  - Tenant context source: subdomain plus cookie
  - Idempotency: not idempotent.

- `GET /api/binders/{binderId}`
  - Auth required: Y (`BinderRead`)
  - Tenant context source: subdomain plus cookie
  - Returns binder metadata plus document summaries (archived excluded by default).
  - Idempotency: idempotent.

- `GET /api/binders/{binderId}/policy`
  - Auth required: Y (`TenantAdmin`)
  - Tenant context source: subdomain plus cookie
  - Idempotency: idempotent.

- `PUT /api/binders/{binderId}/policy`
  - Auth required: Y (`TenantAdmin`)
  - Tenant context source: subdomain plus cookie
  - Policy modes:
    - `inherit`
    - `restricted_roles`
  - Idempotency: idempotent for same payload.

### Documents

- `GET /api/documents`
  - Auth required: Y (`BinderRead`)
  - Tenant context source: subdomain plus cookie
  - Query options:
    - `binderId` (optional)
    - `includeArchived` (optional, default `false`)
  - Idempotency: idempotent.

- `GET /api/documents/{documentId}`
  - Auth required: Y (`BinderRead`)
  - Tenant context source: subdomain plus cookie
  - Returns immutable content and archive metadata.
  - Idempotency: idempotent.

- `POST /api/documents`
  - Auth required: Y (`BinderWrite`)
  - Tenant context source: subdomain plus cookie
  - Idempotency: not idempotent.

- `POST /api/documents/{documentId}/archive`
  - Auth required: Y (`BinderWrite`)
  - Tenant context source: subdomain plus cookie
  - Idempotency: conditionally idempotent.

- `POST /api/documents/{documentId}/unarchive`
  - Auth required: Y (`BinderWrite`)
  - Tenant context source: subdomain plus cookie
  - Idempotency: conditionally idempotent.

No `PUT`/`PATCH` document-content endpoint exists in v1.

## Operational Endpoints (Non-API Routes)

- `GET /health/live`
  - Auth required: N
  - Version negotiation: none
  - Response:
    ```json
    { "status": "alive", "timestamp": "2026-03-02T21:40:00Z" }
    ```

- `GET /health/ready`
  - Auth required: N
  - Version negotiation: none
  - Status behavior: `200` when ready, `503` when not ready
  - Response:
    ```json
    { "status": "ready", "timestamp": "2026-03-02T21:40:00Z" }
    ```

Health payloads must not include dependency internals or version metadata.

## RBAC Policy Map

- `POST /api/provision` -> anonymous system-context endpoint.
- `GET /api/tenant/lease` -> authenticated tenant member.
- `POST /api/tenant/lease/extend` -> `TenantAdmin`.
- `POST /api/auth/logout` -> authenticated user.
- `GET /api/tenant/users` -> `TenantAdmin`.
- `POST /api/tenant/users` -> `TenantAdmin`.
- `POST /api/tenant/users/{userId}/role` -> `TenantAdmin`.
- `GET /api/binders` -> `BinderRead`.
- `POST /api/binders` -> `BinderWrite`.
- `GET /api/binders/{binderId}` -> `BinderRead`.
- `GET /api/binders/{binderId}/policy` -> `TenantAdmin`.
- `PUT /api/binders/{binderId}/policy` -> `TenantAdmin`.
- `GET /api/documents` -> `BinderRead`.
- `GET /api/documents/{documentId}` -> `BinderRead`.
- `POST /api/documents` -> `BinderWrite`.
- `POST /api/documents/{documentId}/archive` -> `BinderWrite`.
- `POST /api/documents/{documentId}/unarchive` -> `BinderWrite`.
