# User Stories (v1 Slices)

This document defines the implementation slices for v1 and their acceptance criteria.

## Slice 1: Provisioning

### User Story
As a visitor, I can provision a demo tenant and receive generated credentials so I can access a tenant-isolated environment.

### Acceptance Criteria
- Given a valid provisioning request, `POST /api/provision` returns `201` and includes generated credentials, tenant subdomain, and redirect URL.
- Root-host `/` owns the provisioning form and submits only `tenantName` plus `challengeToken` through the shared SPA client.
- After provisioning succeeds, generated credentials are shown exactly once in a root-host handoff state and remain transient in memory only.
- The handoff state keeps the user signed in and continues to the tenant host only when the user activates the explicit continue action that uses the server-provided `redirectUrl`.
- Provision response includes `expiresAt` set to approximately 1 hour from provision time.
- `GET /api/tenant/lease` returns authoritative lease state including `expiresAt`, `secondsRemaining`, `extensionCount`, `maxExtensions`, and `canExtend`.
- `POST /api/tenant/lease/extend` requires the existing `TenantAdmin` policy, a valid CSRF token, and ignores client-supplied tenant or duration values.
- Given remaining lease > 10 minutes, `POST /api/tenant/lease/extend` returns `409 TENANT_LEASE_EXTENSION_WINDOW_NOT_OPEN`.
- Given remaining lease <= 10 minutes and extension count < 3, `POST /api/tenant/lease/extend` returns `200` and extends expiry by `PAPERBINDER_LEASE_EXTENSION_MINUTES`.
- Given extension count = 3, `POST /api/tenant/lease/extend` returns `409 TENANT_LEASE_EXTENSION_LIMIT_REACHED`.
- Given the dedicated lease-extend budget is exhausted, `POST /api/tenant/lease/extend` returns `429 RATE_LIMITED` with `Retry-After`.
- Provisioning and root login are challenge-protected and return `429` when pre-auth rate limits are exceeded.
- Root-host provisioning renders safe, actionable ProblemDetails handling for challenge-required, challenge-failed, tenant-name-invalid, tenant-name-conflict, rate-limited, and unexpected failure paths.

## Slice 2: Authentication

### User Story
As a tenant user, I can log in from the landing page and be routed into my tenant context.

### Acceptance Criteria
- Login succeeds with generated credentials from provisioning.
- Root-host `/login` owns the login form, labels the identity field as `Email`, and submits only `email`, `password`, and `challengeToken` through the shared SPA client.
- After login, user is redirected to the tenant subdomain via the server-provided `redirectUrl`.
- Authenticated identity maps to exactly one tenant in v1.
- Root login requires challenge proof and returns clear safe handling for challenge, invalid-credentials, tenant-expired, and rate-limit failures.

## Slice 3: Tenant Resolution

### User Story
As the system, every authenticated request resolves tenant context deterministically and rejects invalid tenants.

### Acceptance Criteria
- Given authenticated user membership and matching tenant subdomain, tenant-scoped request returns success (`2xx`).
- Given unknown tenant subdomain, request returns `404` or `400`.
- Given expired tenant before purge, request returns `410`.
- Given expired tenant after purge, request returns `404`.
- Given authenticated user from tenant A requesting tenant B subdomain, request returns `403`.
- Modifying tenant identifiers in request body/query does not bypass host+membership checks.

## Slice 4: Binders

### User Story
As a tenant user with permission, I can create and view binders within my tenant.

### Acceptance Criteria
- `POST /api/binders` creates a binder scoped to current tenant.
- `POST /api/binders` defaults new binders to binder policy mode `inherit`.
- `GET /api/binders` lists only binders for current tenant and omits restricted binders the caller cannot access.
- `GET /api/binders/{id}` returns binder only when it belongs to current tenant and returns concrete visible document summaries in `documents`.
- `GET /api/binders/{id}/policy` and `PUT /api/binders/{id}/policy` enforce tenant-admin policy management.
- Binder policy payloads use `mode` plus exact-role `allowedRoles`.
- Unauthorized access returns `403`, while wrong-tenant or unknown binders return `404`.

## Slice 5: Documents (Immutable)

### User Story
As a tenant user with permission, I can create and read immutable text documents scoped to a binder.

### Acceptance Criteria
- `POST /api/documents` creates immutable text document in a tenant binder.
- `POST /api/documents` trims title to 1-200 characters, requires exact `contentType=markdown`, requires non-whitespace content <= 50,000 characters, and accepts optional same-binder `SupersedesDocumentId`.
- `GET /api/documents` lists documents scoped to current tenant, omits restricted binders on unfiltered requests, and returns `403` when an explicit binder filter targets a same-tenant binder denied by binder-local policy.
- `GET /api/documents/{id}` returns document only when tenant-scoped access is valid and still allows direct-id reads of archived documents.
- `POST /api/documents/{id}/archive` and `POST /api/documents/{id}/unarchive` toggle visibility state without mutating content.
- Archived documents are excluded by default and included only via explicit `includeArchived=true`.
- No `PUT` or `PATCH` endpoint exists for document content in v1.
- Optional metadata may reference `SupersedesDocumentId` without mutating previous content.
- Archive/soft-delete may hide documents without altering document content.
- Unauthorized or binder-policy-denied access returns `403`; wrong-tenant or unknown binder/document ids return `404`.

## Slice 6: Lease Cleanup

### User Story
As the platform, expired tenants are removed automatically so demo environments remain bounded and safe.

### Acceptance Criteria
- Worker runs on fixed cadence (target: every minute).
- Worker selects tenants where `ExpiresAt <= now`.
- Worker hard-deletes expired tenants and tenant-owned data, including the tenant row, user memberships, tenant-owned users, binders, binder policies, and documents.
- Cleanup is deterministic, idempotent, and leaves active tenants untouched.
- Expired tenants are deleted within 5 minutes of lease expiry (best effort SLA).
- Post-expiry API access before purge returns `410`.
- Post-expiry API access after purge returns `404`.

## Slice 7: Tenant User Management

### User Story
As a tenant admin, I can manage tenant users and assign roles without crossing tenant boundaries.

### Acceptance Criteria
- `GET /api/tenant/users` returns only users for the current tenant.
- `POST /api/tenant/users` creates a tenant-scoped user with an initial role.
- `POST /api/tenant/users/{userId}/role` changes role only for tenant-scoped users.
- Attempting to demote the last remaining tenant admin returns `409`.
- Non-admin callers receive `403` for tenant user-management routes.
