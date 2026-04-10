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
- Unknown tenant-scoped role-assignment targets return `404` ProblemDetails with `errorCode` `TENANT_USER_NOT_FOUND`.
- Tenant-user email conflicts return `409` ProblemDetails with `errorCode` `TENANT_USER_EMAIL_CONFLICT`.
- Last-admin protection failures return `409` ProblemDetails with `errorCode` `LAST_TENANT_ADMIN_REQUIRED`.
- Invalid tenant role values return `422` ProblemDetails with `errorCode` `TENANT_ROLE_INVALID`.
- Invalid tenant-user passwords return `422` ProblemDetails with `errorCode` `TENANT_USER_PASSWORD_INVALID`.
- Binder-name validation failures return `400` ProblemDetails with `errorCode` `BINDER_NAME_INVALID`.
- Unknown tenant-scoped binders return `404` ProblemDetails with `errorCode` `BINDER_NOT_FOUND`.
- Binder-local policy denial after endpoint authorization returns `403` ProblemDetails with `errorCode` `BINDER_POLICY_DENIED`.
- Invalid binder-policy payloads return `422` ProblemDetails with `errorCode` `BINDER_POLICY_INVALID`.
- Unknown tenant-scoped documents return `404` ProblemDetails with `errorCode` `DOCUMENT_NOT_FOUND`.
- Document-title validation failures return `400` ProblemDetails with `errorCode` `DOCUMENT_TITLE_INVALID`.
- Missing or whitespace-only document content returns `400` ProblemDetails with `errorCode` `DOCUMENT_CONTENT_REQUIRED`.
- Document content longer than 50,000 characters returns `400` ProblemDetails with `errorCode` `DOCUMENT_CONTENT_TOO_LARGE`.
- Unsupported document `contentType` values return `422` ProblemDetails with `errorCode` `DOCUMENT_CONTENT_TYPE_INVALID`.
- Missing document binder targets return `400` ProblemDetails with `errorCode` `DOCUMENT_BINDER_REQUIRED`.
- Invalid document supersedes targets return `422` ProblemDetails with `errorCode` `DOCUMENT_SUPERSEDES_INVALID`.
- Invalid archive transitions return `409` ProblemDetails with `errorCode` `DOCUMENT_ALREADY_ARCHIVED` or `DOCUMENT_NOT_ARCHIVED`.
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
  - Response example (`200`):
    ```json
    {
      "users": [
        {
          "userId": "3e7d6ad8-ec43-4d5b-8d35-28f316f8f7de",
          "email": "owner@acme-demo.local",
          "role": "TenantAdmin",
          "isOwner": true
        }
      ]
    }
    ```
  - Idempotency: idempotent.

- `POST /api/tenant/users`
  - Auth required: Y (`TenantAdmin`)
  - Tenant context source: subdomain plus cookie
  - Request example:
    ```json
    {
      "email": "writer@acme-demo.local",
      "password": "<temporary-password>",
      "role": "BinderWrite"
    }
    ```
  - Response example (`201`):
    ```json
    {
      "userId": "3e7d6ad8-ec43-4d5b-8d35-28f316f8f7de",
      "email": "writer@acme-demo.local",
      "role": "BinderWrite",
      "isOwner": false
    }
    ```
  - Failure semantics:
    - `400` when the email is empty, too long, contains whitespace, or does not contain exactly one `@`.
    - `409` when the requested email already exists.
    - `422` for invalid role values.
    - `422` for passwords that fail the configured Identity password validators.
  - Idempotency: not idempotent.

- `POST /api/tenant/users/{userId}/role`
  - Auth required: Y (`TenantAdmin`)
  - Tenant context source: subdomain plus cookie
  - Request example:
    ```json
    { "role": "BinderRead" }
    ```
  - Response example (`200`):
    ```json
    {
      "userId": "3e7d6ad8-ec43-4d5b-8d35-28f316f8f7de",
      "email": "writer@acme-demo.local",
      "role": "BinderRead",
      "isOwner": false
    }
    ```
  - Failure semantics:
    - `404` when the target user does not belong to the current tenant.
    - `409` when change would demote the last tenant admin.
    - `422` for invalid role value.
  - Idempotency: conditionally idempotent.

### Binders

- `GET /api/binders`
  - Auth required: Y (`BinderRead`)
  - Tenant context source: subdomain plus cookie
  - Response example (`200`):
    ```json
    {
      "binders": [
        {
          "binderId": "3e7d6ad8-ec43-4d5b-8d35-28f316f8f7de",
          "name": "Executive Policies",
          "createdAt": "2026-04-07T15:30:00Z"
        }
      ]
    }
    ```
  - Failure semantics:
    - `403` when caller lacks the `BinderRead` endpoint policy.
    - `404` when request host is not a tenant host.
    - Binders hidden by binder-local `restricted_roles` are omitted from the list; the endpoint does not return denial markers.
  - Idempotency: idempotent.

- `POST /api/binders`
  - Auth required: Y (`BinderWrite`)
  - Tenant context source: subdomain plus cookie
  - CSRF required: Y
  - Request example:
    ```json
    { "name": "Executive Policies" }
    ```
  - Response example (`201`):
    ```json
    {
      "binderId": "3e7d6ad8-ec43-4d5b-8d35-28f316f8f7de",
      "name": "Executive Policies",
      "createdAt": "2026-04-07T15:30:00Z"
    }
    ```
  - Failure semantics:
    - `400` when the binder name is empty, whitespace-only, or longer than 200 characters after trimming.
    - `403` when the caller lacks the `BinderWrite` endpoint policy or the request omits a valid CSRF token.
    - `404` when request host is not a tenant host.
  - Notes:
    - New binders default to binder policy mode `inherit`.
    - Binder names are not unique within a tenant in CP9.
  - Idempotency: not idempotent.

- `GET /api/binders/{binderId}`
  - Auth required: Y (`BinderRead`)
  - Tenant context source: subdomain plus cookie
  - Response example (`200`):
    ```json
    {
      "binderId": "3e7d6ad8-ec43-4d5b-8d35-28f316f8f7de",
      "name": "Executive Policies",
      "createdAt": "2026-04-07T15:30:00Z",
      "documents": [
        {
          "documentId": "0d5a5380-c8ef-4c1c-86cf-2dd6cfcbfa85",
          "binderId": "3e7d6ad8-ec43-4d5b-8d35-28f316f8f7de",
          "title": "Security Handbook",
          "contentType": "markdown",
          "supersedesDocumentId": null,
          "createdAt": "2026-04-09T15:30:00Z",
          "archivedAt": null
        }
      ]
    }
    ```
  - Failure semantics:
    - `403` when binder-local policy denies the caller after the `BinderRead` endpoint policy has already passed.
    - `404` when the binder does not exist in the current tenant or the request host is not a tenant host.
  - Notes:
    - `documents` reuses `DocumentSummary[]`.
    - Archived documents are hidden by default in binder detail responses.
  - Idempotency: idempotent.

- `GET /api/binders/{binderId}/policy`
  - Auth required: Y (`TenantAdmin`)
  - Tenant context source: subdomain plus cookie
  - Response example (`200`):
    ```json
    {
      "mode": "inherit",
      "allowedRoles": []
    }
    ```
  - Failure semantics:
    - `403` when caller lacks the `TenantAdmin` endpoint policy.
    - `404` when the binder does not exist in the current tenant or the request host is not a tenant host.
  - Idempotency: idempotent.

- `PUT /api/binders/{binderId}/policy`
  - Auth required: Y (`TenantAdmin`)
  - Tenant context source: subdomain plus cookie
  - CSRF required: Y
  - Policy modes:
    - `inherit`
    - `restricted_roles`
  - Policy payload rules:
    - `allowedRoles` must be empty when `mode=inherit`.
    - `allowedRoles` must contain one or more exact v1 tenant role values when `mode=restricted_roles`.
  - Request example:
    ```json
    {
      "mode": "restricted_roles",
      "allowedRoles": ["TenantAdmin", "BinderWrite"]
    }
    ```
  - Response example (`200`):
    ```json
    {
      "mode": "restricted_roles",
      "allowedRoles": ["TenantAdmin", "BinderWrite"]
    }
    ```
  - Failure semantics:
    - `403` when caller lacks the `TenantAdmin` endpoint policy or the request omits a valid CSRF token.
    - `404` when the binder does not exist in the current tenant or the request host is not a tenant host.
    - `422` when `mode` is unsupported, `allowedRoles` contains invalid role values, or the `mode`/`allowedRoles` combination is structurally invalid.
  - Idempotency: idempotent for same payload.

### Documents

- `GET /api/documents`
  - Auth required: Y (`BinderRead`)
  - Tenant context source: subdomain plus cookie
  - Query options:
    - `binderId` (optional)
    - `includeArchived` (optional, default `false`)
  - Response example (`200`):
    ```json
    {
      "documents": [
        {
          "documentId": "0d5a5380-c8ef-4c1c-86cf-2dd6cfcbfa85",
          "binderId": "3e7d6ad8-ec43-4d5b-8d35-28f316f8f7de",
          "title": "Security Handbook",
          "contentType": "markdown",
          "supersedesDocumentId": null,
          "createdAt": "2026-04-09T15:30:00Z",
          "archivedAt": null
        }
      ]
    }
    ```
  - Failure semantics:
    - `403` when an explicit `binderId` targets a current-tenant binder whose binder-local policy denies the caller after the `BinderRead` endpoint policy has already passed.
    - `404` when an explicit `binderId` does not exist in the current tenant or the request host is not a tenant host.
  - Notes:
    - Unfiltered list requests omit documents from binders the caller cannot access.
    - Archived documents are excluded by default and included only when `includeArchived=true`.
  - Idempotency: idempotent.

- `GET /api/documents/{documentId}`
  - Auth required: Y (`BinderRead`)
  - Tenant context source: subdomain plus cookie
  - Response example (`200`):
    ```json
    {
      "documentId": "0d5a5380-c8ef-4c1c-86cf-2dd6cfcbfa85",
      "binderId": "3e7d6ad8-ec43-4d5b-8d35-28f316f8f7de",
      "title": "Security Handbook",
      "contentType": "markdown",
      "content": "# Security Handbook",
      "supersedesDocumentId": null,
      "createdAt": "2026-04-09T15:30:00Z",
      "archivedAt": null
    }
    ```
  - Failure semantics:
    - `403` when binder-local policy denies the caller after the `BinderRead` endpoint policy has already passed.
    - `404` when the document does not exist in the current tenant or the request host is not a tenant host.
  - Notes:
    - Archived documents remain readable by direct document id.
  - Idempotency: idempotent.

- `POST /api/documents`
  - Auth required: Y (`BinderWrite`)
  - Tenant context source: subdomain plus cookie
  - CSRF required: Y
  - Request example:
    ```json
    {
      "binderId": "3e7d6ad8-ec43-4d5b-8d35-28f316f8f7de",
      "title": "Security Handbook",
      "contentType": "markdown",
      "content": "# Security Handbook",
      "supersedesDocumentId": null
    }
    ```
  - Response example (`201`):
    ```json
    {
      "documentId": "0d5a5380-c8ef-4c1c-86cf-2dd6cfcbfa85",
      "binderId": "3e7d6ad8-ec43-4d5b-8d35-28f316f8f7de",
      "title": "Security Handbook",
      "contentType": "markdown",
      "content": "# Security Handbook",
      "supersedesDocumentId": null,
      "createdAt": "2026-04-09T15:30:00Z",
      "archivedAt": null
    }
    ```
  - Failure semantics:
    - `400` when `binderId` is missing, title is empty/whitespace/overlength after trimming, content is empty/whitespace, or content exceeds 50,000 characters.
    - `403` when binder-local policy denies the target binder after the `BinderWrite` endpoint policy has already passed, or the request omits a valid CSRF token.
    - `404` when the target binder does not exist in the current tenant or the request host is not a tenant host.
    - `422` when `contentType` is not the exact value `markdown` or `supersedesDocumentId` does not reference an existing document in the same tenant and same binder.
  - Notes:
    - Titles are trimmed and must be 1-200 characters after trimming.
    - Stored `content` remains raw markdown; rendered HTML is not stored in CP10.
  - Idempotency: not idempotent.

- `POST /api/documents/{documentId}/archive`
  - Auth required: Y (`BinderWrite`)
  - Tenant context source: subdomain plus cookie
  - CSRF required: Y
  - Response example (`200`):
    ```json
    {
      "documentId": "0d5a5380-c8ef-4c1c-86cf-2dd6cfcbfa85",
      "binderId": "3e7d6ad8-ec43-4d5b-8d35-28f316f8f7de",
      "title": "Security Handbook",
      "contentType": "markdown",
      "content": "# Security Handbook",
      "supersedesDocumentId": null,
      "createdAt": "2026-04-09T15:30:00Z",
      "archivedAt": "2026-04-09T16:00:00Z"
    }
    ```
  - Failure semantics:
    - `403` when binder-local policy denies the caller after the `BinderWrite` endpoint policy has already passed, or the request omits a valid CSRF token.
    - `404` when the document does not exist in the current tenant or the request host is not a tenant host.
    - `409` when the document is already archived.
  - Idempotency: conditionally idempotent.

- `POST /api/documents/{documentId}/unarchive`
  - Auth required: Y (`BinderWrite`)
  - Tenant context source: subdomain plus cookie
  - CSRF required: Y
  - Response example (`200`):
    ```json
    {
      "documentId": "0d5a5380-c8ef-4c1c-86cf-2dd6cfcbfa85",
      "binderId": "3e7d6ad8-ec43-4d5b-8d35-28f316f8f7de",
      "title": "Security Handbook",
      "contentType": "markdown",
      "content": "# Security Handbook",
      "supersedesDocumentId": null,
      "createdAt": "2026-04-09T15:30:00Z",
      "archivedAt": null
    }
    ```
  - Failure semantics:
    - `403` when binder-local policy denies the caller after the `BinderWrite` endpoint policy has already passed, or the request omits a valid CSRF token.
    - `404` when the document does not exist in the current tenant or the request host is not a tenant host.
    - `409` when the document is not archived.
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
- `GET /api/tenant/lease` -> `AuthenticatedUser`.
- `POST /api/tenant/lease/extend` -> `TenantAdmin`.
- `POST /api/auth/logout` -> `AuthenticatedUser`.
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
