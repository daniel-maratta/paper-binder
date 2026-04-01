# PaperBinder Reviewer Guide

This guide is for interviewers and technical reviewers who want a fast, accurate read of the repository.

PaperBinder is intentionally narrow: a multi-tenant SaaS demo that prioritizes tenant isolation, explicit boundaries, and reviewable engineering decisions over feature breadth.

## Fast Review Path (10-15 Minutes)

Read these first:

1. `review/architecture-overview.md`
2. `review/multi-tenancy-diagram.md`
3. `review/request-lifecycle.md`
4. `review/user-flows.md`
5. `review/security-model-summary.md`

Optional AI context:

- `review/ai-surface-map.md`

Then confirm constraints in canonical docs:

1. `docs/20-architecture/system-overview.md`
2. `docs/20-architecture/tenancy-model.md`
3. `docs/20-architecture/tenancy-resolution.md`
4. `docs/20-architecture/authn-authz.md`
5. `docs/40-contracts/api-contract.md`

## Core Architecture Snapshot

- Frontend: React SPA (client-rendered), no SSR and no BFF in v1.
- Backend: ASP.NET Core API plus background worker.
- Data: PostgreSQL, single shared schema, strict tenant scoping.
- Auth: ASP.NET Core Identity with host-driven tenant resolution.
- Lifecycle: demo tenants are lease-bound and automatically purged when expired.

## Reviewer Deep-Dive Path

1. System and boundaries:
   - `docs/20-architecture/system-overview.md`
   - `docs/20-architecture/boundaries.md`
   - `docs/20-architecture/deployment-topology.md`
2. Tenancy and security model:
   - `docs/20-architecture/tenancy-model.md`
   - `docs/20-architecture/tenancy-resolution.md`
   - `docs/30-security/tenant-isolation.md`
3. Identity and authorization:
   - `docs/20-architecture/authn-authz.md`
   - `docs/20-architecture/policy-authorization.md`
   - `docs/40-contracts/api-contract.md`
4. Product and scope constraints:
   - `docs/00-intent/project-scope.md`
   - `docs/00-intent/non-goals.md`
5. ADR rationale:
   - `docs/90-adr/README.md`
   - `docs/90-adr/ADR-0003-data-shared-schema-multi-tenancy-with-tenantid-discriminator.md`
   - `docs/90-adr/ADR-0006-authz-policy-based-authorization-at-api-boundary.md`
   - `docs/90-adr/ADR-0012-operations-tenant-provisioning-and-lease-cleanup-semantics.md`
   - `docs/90-adr/ADR-0019-no-bff.md`
   - `docs/90-adr/ADR-0023-frontend-runtime-tooling-and-realtime-boundaries.md`

## What To Evaluate

- Tenant isolation as a security boundary from request entry through data access.
- Policy-based authorization placement at the API boundary.
- Scope discipline (what is intentionally excluded from v1).
- Decision quality and traceability through ADRs.
- Operational simplicity and demo lifecycle controls (tenant lease and cleanup).

## Local Validation

Use `docs/70-operations/runbook-local.md` for setup and run commands.
For the fastest reviewer-facing process launch in Visual Studio, open `PaperBinder.sln` and use the shared `Reviewer UI` solution launch profile when available.
