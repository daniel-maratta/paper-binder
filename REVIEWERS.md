# PaperBinder Reviewer Guide

This guide is for interviewers and technical reviewers who want a fast, accurate read of the shipped `V1` system and its release evidence.

PaperBinder is intentionally narrow: a multi-tenant SaaS demonstration that prioritizes tenant isolation, explicit boundaries, and reviewable engineering decisions over feature breadth. The recommended release tag for this cut is `v1.0.0`.

## Fast Review Path (10-15 Minutes)

Read these first:

1. `review/architecture-overview.md`
2. `review/multi-tenancy-diagram.md`
3. `review/request-lifecycle.md`
4. `review/user-flows.md`
5. `review/security-model-summary.md`
6. `docs/95-delivery/release-checklist.md`

Optional post-V1 context:

- `review/ai-surface-map.md`

Then confirm constraints in canonical docs:

1. `docs/20-architecture/system-overview.md`
2. `docs/20-architecture/tenancy-model.md`
3. `docs/20-architecture/tenancy-resolution.md`
4. `docs/20-architecture/authn-authz.md`
5. `docs/40-contracts/api-contract.md`

## Core Architecture Snapshot

- Frontend: React SPA (client-rendered), no SSR and no BFF in `V1`.
- Backend: ASP.NET Core API plus background worker.
- Data: PostgreSQL, single shared schema, strict tenant scoping.
- Auth: ASP.NET Core Identity with host-driven tenant resolution.
- Lifecycle: demo tenants are lease-bound and automatically purged when expired.

## Recommended Walkthrough

Use `docs/70-operations/runbook-local.md` and the `Reviewer Full Stack` launch path, then verify this order:

1. Root host provisioning or login.
2. Tenant-host dashboard, binder creation, document creation, and document detail.
3. Tenant-admin user management or binder-policy behavior.
4. Impersonation start, downgraded effective experience, and stop without a root-host round-trip.
5. Lease visibility and extend behavior.
6. Authenticated `429` plus `Retry-After` on a tenant-host mutation when the rate-limit budget is exhausted.
7. Spoofed-host rejection at the host-validation boundary.
8. Logout back to the root host.

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
   - `docs/00-intent/canonical-decisions.md`
5. Decision rationale:
   - `docs/90-adr/README.md`
   - `docs/90-adr/ADR-0003-operations-tenant-provisioning-and-lease-cleanup-semantics.md`
   - `docs/90-adr/ADR-0004-public-demo-deployment-topology.md`
   - `docs/90-adr/ADR-0005-no-bff.md`
   - `docs/90-adr/ADR-0007-persistence-stack-ef-core-migrations-dapper-runtime.md`
   - `docs/90-adr/ADR-0008-identity-auth-boundary-with-dapper-stores.md`
   - `docs/20-architecture/tenancy-model.md`
   - `docs/20-architecture/tenancy-resolution.md`
   - `docs/20-architecture/policy-authorization.md`
6. Release evidence:
   - `docs/95-delivery/release-workflow.md`
   - `docs/95-delivery/release-checklist.md`
   - `docs/95-delivery/pr/cp17-release-preparation-and-reviewer-snapshot/description.md`

## What To Evaluate

- Tenant isolation as a security boundary from request entry through data access.
- Policy-based authorization placement at the API boundary.
- Scope discipline (what is intentionally excluded from v1).
- Decision quality and traceability through ADRs.
- Operational simplicity and demo lifecycle controls (tenant lease and cleanup).
- Release readiness evidence: clean-checkout reproducibility, reviewer clarity, and documentation integrity.

## Local Validation

Use `docs/70-operations/runbook-local.md` for setup and run commands.
For the fastest reviewer-facing process launch in Visual Studio, open `PaperBinder.sln` and use the shared `Reviewer Full Stack` solution launch profile when available.
`Launch Frontend Dev Server` remains intentionally VS Code-only.
