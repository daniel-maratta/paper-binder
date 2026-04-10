# Product Requirements Document (PRD)

Status: Current (v1)

## AI Summary

- PaperBinder v1 demonstrates tenant isolation, authn/authz, and constrained SaaS scope.
- Core workflow: provision tenant, authenticate, manage binders/documents, enforce policies, expire tenant by lease.
- Documents are immutable DB-backed text; no file uploads or binary storage.
- Auth is cross-subdomain cookie only in v1; JWT is out of scope.
- Non-goals are explicit and binding for scope control.

## 1. Overview

PaperBinder is a multi-tenant document binder SaaS demonstration application.

It is intentionally constrained in scope. The goal is to demonstrate:

- Multi-tenant architecture
- Tenant isolation
- Identity and authentication
- Policy-based authorization
- Clean architectural boundaries
- Operational lifecycle management (lease-based demo tenants)

PaperBinder is not intended to be a commercial product.

---

## 2. Problem Statement

Organizations frequently need to:

- Organize structured documents into logical groupings ("binders")
- Restrict access by role or policy
- Maintain strict tenant isolation
- Provide controlled, revocable access

PaperBinder demonstrates how such a system can be built using:

- ASP.NET Core (backend)
- PostgreSQL (data store)
- React SPA (frontend)
- Policy-based authorization
- Explicit tenancy resolution

---

## 3. Product Goals

### 3.1 Primary Goals

1. Demonstrate production-grade multi-tenancy.
2. Enforce strict tenant isolation at the data layer.
3. Implement identity and role-based policy authorization.
4. Provide ephemeral demo tenants with automatic lease-expiration cleanup.
5. Keep scope narrow and controlled.

### 3.2 Non-Goals

PaperBinder will NOT:

- Support file uploads
- Support binary storage
- Support cross-tenant sharing
- Support public document links
- Implement billing or subscriptions
- Implement versioning of documents
- Implement document collaboration
- Integrate with external identity providers
- Provide admin UI for infrastructure configuration

---

## 4. Target Users (Demo Personas)

### 4.1 Demo Tenant User

- Logs in using generated credentials
- Views binders
- Creates text-based documents
- Access is restricted to their tenant

### 4.2 Demo Tenant Admin

- Manages users within tenant
- Assigns roles
- Creates binders
- Controls document access policies

---

## 5. Core Domain Concepts

See: docs/10-product/domain-nouns.md

Primary entities:

- Tenant
- User
- Role
- Binder
- Document
- Policy

All entities are tenant-scoped unless explicitly global.

---

## 6. Functional Requirements

### 6.1 Tenant Provisioning

- A demo tenant can be provisioned from the landing page.
- Credentials are generated.
- Tenant has a fixed lease duration (1 hour).
- Tenant expiration timestamp is stored.
- Tenant expiration triggers automated cleanup.
- Tenant lease status is exposed via `GET /api/tenant/lease`.
- Tenant lease extension is allowed only when remaining lease is <= 10 minutes.
- Lease extension action uses `POST /api/tenant/lease/extend`.
- Each extension adds +10 minutes.
- Maximum 3 extensions per tenant.

### 6.2 Authentication

- Username/password authentication.
- Authentication is tenant-aware.
- Identity is isolated per tenant.
- Cross-subdomain cookie authentication (parent-domain cookie) is the only supported auth mechanism in v1.
- JWT authentication is out of scope for v1.

### 6.3 Authorization

- RBAC (roles) implemented via policy-based authorization checks at the API boundary.
- v1 simplifies RBAC to one effective role per user per tenant.
- Future versions may adopt additive multi-role aggregation.
- No ad-hoc role checks in endpoint handlers.
- Policies must be explicit and documented.

### 6.4 Binders

- A binder is a logical grouping of documents.
- Binders are tenant-scoped.
- Binder names are not unique within a tenant in v1.
- New binders default to binder policy mode `inherit`.
- Binders may define binder-local access constraints (role-based).
- Binder policy modes are `inherit` (default) and `restricted_roles`.
- Binder policy `allowedRoles` values are exact v1 tenant role values.
- Binder list responses omit restricted binders the caller cannot access.
- Binder detail responses return concrete `documents` summaries in CP10.

### 6.5 Documents

- Documents are text-only.
- Stored in PostgreSQL as structured text.
- No file uploads.
- No external storage.
- Documents are immutable after creation.
- Changes require creating a new document (optional `SupersedesDocumentId` metadata).
- Document titles are trimmed and must be 1-200 characters after trimming.
- Document `contentType` must be the exact contract value `markdown`.
- Document content must be non-whitespace and no longer than 50,000 characters.
- `SupersedesDocumentId`, when supplied, must reference another document in the same tenant and same binder.
- Archive/soft-delete visibility is allowed without changing content.
- Archived documents are hidden by default in list views and can be included with explicit filter options.
- Archived documents remain readable by direct document id.
- No in-place content editing API.
- No version history.

### 6.6 Lease and Cleanup

- Each demo tenant has an expiration timestamp.
- Background worker checks for expired tenants on a fixed cadence (target: every minute).
- Expired tenants are hard-deleted.
- All associated data is removed.
- SLA target: expired tenants are deleted within 5 minutes (best effort).

---

## 7. System Constraints

- Single database instance.
- Logical tenant isolation (no per-tenant database).
- All queries must enforce tenant filtering.
- No cross-tenant joins.
- No shared document tables without tenant key.

---

## 8. Security Requirements

- Tenant ID must be resolved per request.
- Tenant ID must not be client-controlled.
- All database access must include tenant scoping.
- Challenge verification and rate limiting must protect provisioning and root login endpoints.
- No secrets committed to repository.
- No PII beyond demo credentials.

---

## 9. Technical Stack

Backend:
- ASP.NET Core
- ASP.NET Core Identity
- Dapper for runtime data access
- EF Core migrations tooling only (not used for runtime query/command paths)
- PostgreSQL
- Separate migrations tooling/project for schema changes

Frontend:
- React (SPA)
- No BFF pattern in v1; the SPA calls the API directly.

Infrastructure:
- Containerized deployment
- Single production environment
- HTTPS enforced

---

## 10. Out of Scope (Explicit)

The following are intentionally excluded to prevent scope creep:

- Audit logging UI/reporting
- Document versioning
- Enterprise SSO
- RBAC customization UI
- Search indexing
- Full-text search optimization
- Horizontal scaling
- Multi-region deployment
- Observability dashboards beyond basic logging

---

## 11. Success Definition

PaperBinder is successful if:

- It demonstrates correct multi-tenant isolation.
- It enforces policy-based authorization.
- It provisions and expires demo tenants automatically.
- It remains under controlled scope.
- It is understandable to hiring reviewers.

See: docs/00-intent/success-criteria.md
