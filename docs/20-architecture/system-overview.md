# System Overview

Status: Current (v1)

## AI Summary

- Architecture is a single-database, tenant-scoped web system with API, worker, and SPA.
- Tenant context is resolved early and remains immutable per request.
- Authorization is policy-based RBAC at the API boundary.
- Runtime persistence uses Dapper; EF Core is migrations/tooling only.
- Lease-driven tenant cleanup is worker-managed with strict extension limits.

PaperBinder is composed of five major layers:

1. Domain and application
2. API (HTTP surface + Identity integration)
3. Worker (Background cleanup)
4. Persistence (Dapper runtime + schema migration tooling)
5. React SPA (Frontend)

---

## Deployment Topology

- Single PostgreSQL database.
- Two backend deployables:
  - PaperBinder.Api
  - PaperBinder.Worker
- React SPA served separately (or via API host in early dev).
- Post-auth traffic routed via tenant subdomain.

---

## Multi-Tenancy Model

- Single database.
- All tenant-owned tables include TenantId.
- Post-auth tenant derived from user membership.
- Pre-auth provisioning does not require subdomain.
- After login, redirect to tenant subdomain.

Tenant isolation is enforced via:
- Middleware resolution
- Tenant context abstraction
- Query scoping at repository level
- Policy evaluation

---

## Identity

- ASP.NET Core Identity.
- Email/password authentication.
- Cross-subdomain cookie auth (parent-domain cookie) only in v1.
- No JWT auth in v1.
- Tenant membership stored in join table.

After authentication:
- Tenant is resolved from membership.
- Tenant context becomes immutable for request.

---

## Authorization

RBAC implemented via policy-based authorization via application/domain abstractions.

v1 role model:
- One effective role per user per tenant.
- Forward-compatible with future additive multi-role aggregation.

Binder access decisions require:
- User context
- Tenant context
- Binder policy rules

API layer delegates evaluation to application/domain policy evaluators.
No ad-hoc role checks are permitted in handlers.

---

## Lease Lifecycle

On provisioning:
- Tenant created.
- Lease set to 60 minutes.
- Seeded documents inserted.

Extension policy:
- Extension allowed only when remaining lease is <= 10 minutes.
- Each extension adds +10 minutes.
- Maximum 3 extensions per tenant.
- Canonical lease endpoints: `GET /api/tenant/lease` and `POST /api/tenant/lease/extend`.

Worker:
- Runs on a fixed cadence (target: every minute).
- Deletes expired tenants and all related data.
- Must be idempotent.
- SLA target: expired tenants are hard-deleted within 5 minutes (best effort).

Operational probes:
- `GET /health/live` (anonymous, minimal payload)
- `GET /health/ready` (anonymous, minimal payload, no dependency internals)

---

## Persistence Strategy

Runtime:
- Dapper for reads/writes.
- TenantId included in all relevant queries.

Schema:
- Separate migrations tooling/project.
- No mixed EF Core + Dapper runtime access in application code.

---

## Architectural Constraints

- Domain/application must not reference ASP.NET, EF, Dapper, or Identity types.
- API and Worker depend on domain/application.
- Adapters implement infrastructure concerns.
- Clear separation of concerns at project level.

---

## Non-Complexity Mandate

PaperBinder intentionally avoids:
- File storage systems.
- Streaming endpoints.
- Realtime signaling channels.
- Versioning engines.
- Public share tokens.
- Billing and subscriptions.

The system exists to demonstrate:
- Clean multi-tenant architecture.
- Authorization modeling.
- Lifecycle management.
- Repository discipline.
