# Canonical Decisions (v1)

This document eliminates architectural ambiguity before implementation and prevents scope drift during v1 development.

This document defines binding scope constraints for PaperBinder v1.

These are product and scope constraints for the demo, not ADR entries.

## AI Summary

- PaperBinder v1 is a constrained multi-tenant demo, not a product framework.
- Tenant isolation and policy enforcement are the primary correctness signals.
- Documents are immutable text records; no in-place editing or versioning in v1.
- Runtime data access is Dapper-only with tenant-scoped query construction.
- Tenant lease lifecycle and extension rules are strict and must be enforced consistently.
- Deviations require ADR + synchronized updates to PRD and this file.

PaperBinder canonical identity:
- Constrained multi-tenant SaaS demonstration only
- Not a reusable SaaS foundation
- Not a production framework
- Do not optimize for future extraction

Primary hiring signal:
- Correct tenant isolation
- Correct policy enforcement

Optimization target:
- Production-minded design
- Not production-hardened completeness

Reviewer experience:
- Live demo
- Code walkthrough

Minimum v1 workflow:
1. Provision demo tenant
2. Login
3. Create binder
4. Create document
5. Enforce role restriction
6. Lease expiration deletes tenant

## Functional Constraints

Documents:
- Immutable after creation
- Changes require creating a new document
- Optional `SupersedesDocumentId` metadata is allowed
- Archive/soft-delete visibility is allowed without changing content
- No versioning
- No history tracking
- Markdown only
- No raw HTML support
- Document rendering presents HTML-encoded safe source only
- No markdown parser or sanitizer pipeline in v1
- No embedded script execution

Authorization model:
- RBAC only
- RBAC implemented via policy-based authorization at API boundary
- No ad-hoc role checks in handlers
- No ABAC
- No per-binder dynamic policy engine

Tenant resolution:
- Tenant derived strictly from authenticated user membership
- Subdomain may route pre-auth
- After login, tenant is not client-controlled

Binders:
- Document belongs to exactly one binder in v1
- No multi-binder relationships
- Binder is the authorization grouping boundary

Tenant lease:
- Hard delete on expiration
- No grace period
- Extension allowed only when remaining lease is <= 10 minutes
- Each extension adds +10 minutes
- Maximum 3 extensions per tenant
- Cleanup is eventual and expected within 5 minutes of expiry
- Worker runs on a fixed cadence (target: every 1 minute)

Database enforcement:
- Application-layer enforcement is required
- All tenant-scoped tables include `TenantId`
- Composite indexes including `TenantId` are required for primary access paths
- No row-level security policies in v1

Runtime data access:
- Dapper-only in v1 runtime paths
- EF Core is permitted only for migrations/tooling
- No mixed EF Core + Dapper usage in runtime application code

BFF:
- No dedicated BFF layer in v1

Frontend runtime:
- Client-rendered React SPA only in v1
- Vite is the frontend build tool
- Router uses React Router for client-side SPA routing only
- No React Router framework mode in v1
- No route-module server features or server loaders/actions in v1
- No SignalR or other realtime push channels in v1
- Baseline forms use native controlled/uncontrolled React with lightweight validation
- `react-hook-form` + `zod` are not baseline v1 dependencies

Node and package manager pinning:
- npm is the package manager for v1 frontend workflows
- Repo root must include `.nvmrc` with explicit major/minor pin
- Frontend `package.json` must include `engines` and `packageManager`

## Governance

This document is binding for v1 scope control.

Precedence rules:
- ADRs are binding unless explicitly superseded by a newer ADR or by this canonical decisions document.
- PRD and scope documents define product boundaries and must not contradict ADRs or this document.
- If a contradiction is found, fix the incorrect document immediately and add a changelog entry naming the resolved conflict.

If implementation must deviate from these constraints:
1. Create an ADR describing the change and rationale
2. Update `docs/10-product/prd.md` to reflect the new scope
3. Update this document to remain consistent with the new baseline
4. This document supersedes implicit assumptions in other documentation.
