# Domain Nouns

This document defines the core domain vocabulary for PaperBinder v1.

The goal is clarity and minimalism.

---

## Tenant

Represents an isolated demo environment.

Fields:
- TenantId
- Name
- CreatedAt
- ExpiresAt
- ExtensionCount (0-3)

Rules:
- Expires after 60 minutes.
- Extension allowed only when remaining lease is <= 10 minutes.
- Each extension adds +10 minutes.
- Maximum 3 extensions.
- Hard-deleted by worker when expired.
- Deletion target is within 5 minutes of expiry (best effort SLA).

---

## User

Managed via ASP.NET Core Identity.

Each user:
- Belongs to exactly one tenant (v1).
- Is authenticated via email/password.
- Has tenant membership enforced post-auth.
- Has one effective role in v1 (future versions may support additive multi-role aggregation).

UserTenant join table:
- UserId
- TenantId
- IsOwner

---

## Document

Represents an immutable text-based document.

Fields:
- DocumentId
- TenantId
- BinderId
- Title
- ContentType (markdown)
- Content (text, limited size)
- SupersedesDocumentId (optional)
- CreatedAt
- ArchivedAt (nullable)

Rules:
- Immutable after creation.
- Content cannot be updated in place.
- Title is trimmed and must be 1-200 characters after trimming.
- ContentType is the exact contract value `markdown`.
- Content must be non-whitespace and at most 50,000 characters.
- New document may supersede a prior document via metadata.
- `SupersedesDocumentId` must reference another document in the same tenant and same binder.
- Archive/soft-delete may hide a document without changing content.
- Archived documents are hidden by default and included only through explicit archive filters.
- Archived documents remain directly readable by document id.
- No versioning in v1.
- No external sharing.
- Strict tenant ownership.
- Document rendering HTML-encodes markdown source for safe display only.
- No markdown parser or sanitizer pipeline exists in v1.
- No raw HTML content support.

---

## Binder

Logical grouping of documents.

Fields:
- BinderId
- TenantId
- Name
- CreatedAt

Rules:
- No nesting in v1.
- Can contain multiple documents.
- Document belongs to exactly one binder in v1.
- Binder names are not unique within a tenant in CP9.
- Binder detail returns visible document summaries in CP10; archived documents stay hidden by default there.

---

## BinderPolicy

Represents access control rules applied at binder level.

Fields:
- BinderId
- TenantId
- Mode (`inherit` | `restricted_roles`)
- AllowedRoles (role list; empty when `Mode=inherit`)
- CreatedAt
- UpdatedAt

Rules:
- Default mode is `inherit`.
- `restricted_roles` stores exact v1 tenant role values and narrows access beyond the endpoint policy.
- Policies are evaluated via application/domain authorization abstractions after the API endpoint policy succeeds.
- Binder list responses omit binders the caller cannot satisfy under `restricted_roles`.

---

## DemoTenantLease (Conceptual)

Represents the lease state of a tenant.

Fields:
- ExpiresAt
- ExtensionCount

Rules:
- Extension allowed only when remaining lease is <= 10 minutes.
- Each extension adds +10 minutes.
- Maximum 3 extensions.
- Expired tenants are hard-deleted by worker.
- Cleanup target is within 5 minutes of expiry (best effort SLA).
- Canonical API routes are `GET /api/tenant/lease` and `POST /api/tenant/lease/extend`.
