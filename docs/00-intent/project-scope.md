# Project Scope

Status: Current (v1)

## Overview

PaperBinder is a multi-tenant ASP.NET Core SaaS demo application that models a document organization system where:

- Documents are stored as immutable text records in the database.
- Documents can be placed into binders.
- Binders have policy-based access controls.
- Each tenant environment is temporary and expires after a fixed lease duration.

The purpose of PaperBinder is not to build a full document management platform, but to demonstrate:

- Multi-tenant system design (single database).
- Policy-based authorization.
- Identity integration with ASP.NET Core Identity.
- Background worker cleanup with lease-expiration enforcement.
- Clear domain boundaries.
- Production-grade repo discipline and documentation structure.

---

## Core Functional Scope (v1)

### Tenancy
- Multi-tenant (single database).
- Tenants provisioned from a public landing page.
- Generated credentials returned at provisioning.
- Tenant expires after 1 hour.
- Tenant lease extension is allowed only when remaining lease is <= 10 minutes.
- Each extension adds +10 minutes.
- Maximum 3 extensions per tenant.
- Worker runs periodically and deletes expired tenants and all related data.
- Expired tenants are hard-deleted within 5 minutes (best-effort SLA).

### Identity
- ASP.NET Core Identity for email/password login.
- Users belong to a single tenant in demo mode.
- Tenant is derived from user membership after login.

### Documents
- Stored as text in the database.
- Immutable after creation.
- Content is never edited in place.
- Changes require creating a new document (optional "supersedes" metadata).
- Archive/soft-delete visibility state is allowed.
- No uploads.
- No versioning in v1.
- No external sharing.
- Strict tenant isolation.

### Binders
- Logical grouping container for documents.
- No nesting in v1.
- Policies applied at binder level.

### Authorization
- RBAC implemented via policy-based authorization at the API boundary.
- Roles exist, but enforcement uses named policies/requirements.
- No ad-hoc role checks in handlers.

---

## Explicit Non-Goals (v1)

- No file uploads.
- No antivirus scanning.
- No blob storage (S3/Azure Blob/etc).
- No document versioning.
- No document editing.
- No cross-tenant sharing.
- No public share links.
- No cross-tenant admin portal.
- No per-tenant databases.
- No billing system.
- No advanced search indexing.
- No document preview pipelines.

---

## Architectural Goals

- Strict separation between domain/application and infrastructure.
- Zero ASP.NET or EF references in domain/application projects.
- Dapper for runtime data access.
- Separate migrations tooling/project may be used for schema management.
- API + Worker as separate deployables.
- React SPA frontend.
- Subdomain-based post-auth tenant routing.
- Hiring-artifact clarity over framework extraction.

---

## Success Criteria

PaperBinder is considered successful when:

1. A tenant can be provisioned and logged into.
2. Subdomain routing enforces tenant isolation.
3. Documents and binders function correctly.
4. Policy-based authorization gates binder access.
5. Lease countdown works.
6. Worker deletes expired tenants safely and idempotently.
7. Repo structure demonstrates architectural clarity.
