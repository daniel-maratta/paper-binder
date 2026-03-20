# User Stories (v1 Slices)

This document defines the implementation slices for v1 and their acceptance criteria.

## Slice 1: Provisioning

### User Story
As a visitor, I can provision a demo tenant and receive generated credentials so I can access a tenant-isolated environment.

### Acceptance Criteria
- Given a valid provisioning request, `POST /api/provision` returns `201` and includes generated credentials, tenant subdomain, and redirect URL.
- Provision response includes `expiresAt` set to approximately 1 hour from provision time.
- Given remaining lease > 10 minutes, `POST /api/tenant/lease/extend` returns `409`.
- Given remaining lease <= 10 minutes and extension count < 3, `POST /api/tenant/lease/extend` returns `200` and extends expiry by +10 minutes.
- Given extension count = 3, `POST /api/tenant/lease/extend` returns `409`.
- `GET /api/tenant/lease` returns authoritative lease state including `canExtend`.
- Provisioning and root login are challenge-protected and return `429` when pre-auth rate limits are exceeded.

## Slice 2: Authentication

### User Story
As a tenant user, I can log in from the landing page and be routed into my tenant context.

### Acceptance Criteria
- Login succeeds with generated credentials from provisioning.
- After login, user is redirected to the tenant subdomain.
- Authenticated identity maps to exactly one tenant in v1.
- Root login requires challenge proof and returns clear challenge/rate-limit errors.

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
- `GET /api/binders` lists only binders for current tenant.
- `GET /api/binders/{id}` returns binder only when it belongs to current tenant.
- `GET /api/binders/{id}/policy` and `PUT /api/binders/{id}/policy` enforce tenant-admin policy management.
- Unauthorized access returns `403`.

## Slice 5: Documents (Immutable)

### User Story
As a tenant user with permission, I can create and read immutable text documents scoped to a binder.

### Acceptance Criteria
- `POST /api/documents` creates immutable text document in a tenant binder.
- `GET /api/documents` lists documents scoped to current tenant.
- `GET /api/documents/{id}` returns document only when tenant-scoped access is valid.
- `POST /api/documents/{id}/archive` and `POST /api/documents/{id}/unarchive` toggle visibility state without mutating content.
- Archived documents are excluded by default and included only via explicit `includeArchived=true`.
- No `PUT` or `PATCH` endpoint exists for document content in v1.
- Optional metadata may reference `SupersedesDocumentId` without mutating previous content.
- Archive/soft-delete may hide documents without altering document content.
- Unauthorized access returns `403`.

## Slice 6: Lease Cleanup

### User Story
As the platform, expired tenants are removed automatically so demo environments remain bounded and safe.

### Acceptance Criteria
- Worker runs on fixed cadence (target: every minute).
- Worker selects tenants where `ExpiresAt <= now`.
- Worker hard-deletes expired tenants and tenant-owned data.
- Cleanup is idempotent.
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
