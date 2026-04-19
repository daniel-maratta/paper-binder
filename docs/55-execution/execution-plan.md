# PaperBinder V1 Execution Plan (V3)

## Status

Recommended execution plan for V1.

This plan supersedes `execution-plan-v1.md`, `execution-plan-v2.md`, and `execution-plan-merged.md` as the preferred implementation roadmap.
It is already the canonical execution reference used by `docs/55-execution/README.md` and `docs/ai-index.md`.

## Why This Version

- `execution-plan-v1.md` is the strongest base because it uses mergeable checkpoints, stays close to V1 scope, and treats tenant isolation as a release blocker.
- `execution-plan-v2.md` is too granular and drifts into implementation assumptions and doc artifacts that do not currently exist or are not required to start.
- `execution-plan-merged.md` contains scope errors and weakens several canonical constraints:
  - introduces AI work that is not part of the current V1 success path
  - allows document update flows even though documents are immutable in V1
  - references an external auth provider pattern instead of the documented ASP.NET Core Identity baseline
  - is too abstract to act as a real merge plan

V3 keeps V1's checkpoint model, tightens ordering, and requires documentation updates inside each checkpoint so the system can be built from zero code to release without reopening core architectural decisions mid-flight.

## Execution Rules

- Every checkpoint ends in a merge to `main`.
- Every checkpoint must leave `main` buildable, testable, and documentation-consistent.
- No checkpoint is complete until launch-profile validation passes and manual VS Code plus Visual Studio launch verification is recorded in the PR artifact.
- Every feature PR ships with contract updates and tests in the same change set.
- Tenant isolation, auth boundary correctness, and lease semantics are release-blocking invariants.
- No checkpoint introduces non-goals without explicit ADR and scope approval.

## Checkpoints

### CP1 - Workspace Bootstrap And CI

Outcome: the repository becomes a runnable software workspace.

Commits:
1. Add the .NET solution and project skeleton for API, worker, domain/application, infrastructure, migrations, and tests.
2. Add the Vite React client scaffold with pinned Node/npm requirements.
3. Add root scripts for restore, build, test, docs validation, and local startup. Agents must create these scripts as part of bootstrap and must not assume they already exist.
4. Add CI for backend build/test, frontend build, and docs/reference validation.

Merge gate:
- Clean checkout restores and builds.
- CI is green.
- Docs validation passes.

### CP2 - Runtime Configuration And Local Deployment Scaffold

Outcome: configuration and local host topology are real early.

Commits:
1. Add typed backend configuration, frontend environment handling, and minimal health/readiness probes needed for topology verification.
2. Add local Docker Compose, PostgreSQL container wiring, and reverse proxy baseline.
3. Add `.env.example` aligned to deployment docs and canonical config keys.
4. Update local runbook and deployment docs to match actual startup shape.

Merge gate:
- Local stack boots.
- Health endpoints are reachable through the local topology.

### CP3 - Persistence Baseline And Migration Pipeline

Outcome: schema management and runtime persistence foundations are in place.

Commits:
1. Add the migrations project and baseline schema workflow.
2. Add Dapper runtime infrastructure, connection abstractions, transaction helpers, and clock abstractions.
3. Add Postgres-backed integration test harness.
4. Add persistence/testing doc updates tied to the implemented workflow.

Merge gate:
- Migrations apply cleanly.
- Integration tests can stand up an isolated database and run against it.

### CP4 - HTTP Contract Baseline

Outcome: the API surface follows the documented protocol before feature growth.

Commits:
1. Add ProblemDetails handling, `/api/*` `X-Api-Version` behavior, and `X-Correlation-Id` middleware.
2. Add contract-focused integration coverage for `GET /health/live` and `GET /health/ready` alongside the protocol baseline.
3. Add standard error-code mapping for contract-sensitive failures.
4. Add integration tests for versioned API routes, non-versioned health routes, correlation headers, and ProblemDetails shape.

Merge gate:
- Protocol tests pass.
- Health endpoints remain non-versioned and error contracts match canonical docs.

### CP5 - Tenancy Resolution And Immutable Tenant Context

Outcome: tenant context is enforced as an early, immutable request boundary.

Commits:
1. Add host/subdomain parsing and tenant resolution middleware/services.
2. Add immutable request-scoped tenant context abstractions.
3. Add host validation and rejection paths for invalid or unknown tenants.
4. Add integration tests for spoofed tenant hints, invalid hosts, and unknown tenants.

Merge gate:
- Tenant context is resolved server-side once per request.
- Client tenant identifiers cannot affect scoping.

### CP6 - Identity, Authentication, And Membership Validation

Outcome: authenticated user context is live using the documented auth model.

Commits:
1. Add ASP.NET Core Identity integration, cross-subdomain cookie configuration, and CSRF protection for unsafe cookie-auth routes.
2. Add login/logout endpoints and authenticated session flow.
3. Add tenant membership model and membership validation during tenant-host requests.
4. Add integration tests for login, logout, CSRF enforcement, missing membership, and expired-tenant auth failures.

Merge gate:
- Authenticated requests establish both user and tenant context correctly.
- Wrong-host or missing-membership access is rejected before feature handlers run.

### CP7 - Pre-Auth Abuse Controls And Provisioning Surface

Outcome: public entry points are protected before demo onboarding is exposed.

Commits:
1. Add challenge verification integration with environment-gated test bypass.
2. Add rate limits for provisioning and root-host login flows.
3. Add `POST /api/provision` transactional tenant creation with owner user, membership, lease, and session establishment only.
4. Add integration tests for challenge-required, rate-limited, successful, and rollback-on-failure paths.

Merge gate:
- Provisioning is all-or-nothing.
- Challenge bypass is test-only.
- Pre-auth routes are protected.

### CP8 - Authorization Policies And Tenant User Administration

Outcome: policy-based RBAC is enforced at the API boundary.

Commits:
1. Add named policies, requirements, and endpoint policy mapping.
2. Add tenant user list/create and role assignment endpoints.
3. Add last-admin protection and invalid-role handling.
4. Add integration tests for allow/deny paths across role and tenant boundaries.

Merge gate:
- All protected endpoints use explicit policy enforcement.
- No ad-hoc role checks remain in shipped handlers.

### CP9 - Binder Domain And Policy Model

Outcome: binders exist as the tenant-scoped authorization grouping boundary.

Commits:
1. Add binder schema, repositories, commands/queries, and API endpoints.
2. Add binder policy read/update behavior and `inherit` / `restricted_roles` handling.
3. Add tenant-scoped query/index strategy and contract/doc updates.
4. Add integration tests for binder reads/writes and cross-tenant denial.

Merge gate:
- Binder operations are tenant-scoped by construction.
- Binder policy behavior matches API and product docs.

### CP10 - Document Domain And Immutable Document Rules

Outcome: the core product workflow is implemented within V1 scope.

Commits:
1. Add document schema, repositories, and create/read/list endpoints.
2. Add immutable document rules, supersedes metadata, and archive/unarchive behavior.
3. Add safe-source document rendering strategy.
4. Add unit/integration tests for immutability, archive filtering, and tenant isolation.

Merge gate:
- No document content mutation path exists.
- Document behavior matches the canonical immutable-document rules.

### CP11 - Worker Runtime And Lease Lifecycle

Outcome: tenant lifecycle and expiry cleanup are implemented as first-class system behavior.

Commits:
1. Add worker host, scheduling setup, and structured worker logging.
2. Add expired-tenant cleanup orchestration with idempotent retry-safe behavior.
3. Add `GET /api/tenant/lease` and `POST /api/tenant/lease/extend` with documented rules.
4. Add integration tests for cleanup idempotency, extension limits, expired-not-purged behavior, and no-touch active tenants.

Merge gate:
- Cleanup is deterministic and idempotent.
- Lease endpoints match documented rules and failure semantics.

### CP12 - Frontend Foundation And Shared UI System

Outcome: the frontend has a stable implementation foundation before feature-heavy UI work.

Commits:
1. Add app shell, route skeleton, API client layer, and auth-aware routing.
2. Add shared UI primitives for forms, tables, alerts, dialogs, and status badges.
3. Add frontend build/test pipeline and route-map alignment.
4. Add component-level tests for shared primitives and client error handling.

Merge gate:
- Frontend builds cleanly.
- Shared primitives are stable enough to support product flows.

### CP13 - Root-Host Frontend Flows

Outcome: provisioning and login work from the browser.

Commits:
1. Build landing/provisioning view and login view on the root host.
2. Wire challenge flow, provisioning, login, and redirect handling.
3. Add user-facing handling for ProblemDetails-based failures.
4. Add E2E coverage for provisioning and login happy/deny paths.

Merge gate:
- A user can provision a tenant and log in through the browser.
- Root-host flows match documented route behavior.

### CP14 - Tenant-Host Frontend Flows

Outcome: the main authenticated product workflow is complete.

Commits:
1. Build dashboard, binder list/detail, and document detail/create flows.
2. Build tenant user management and binder policy UI for `TenantAdmin`.
3. Add lease-status banner/countdown and extend interaction.
4. Add E2E coverage for normal user, admin, forbidden, expired, and logout flows.

Merge gate:
- The end-to-end reviewer workflow works in the browser.
- UI permissions align with API policy behavior.

### CP15 - Tenant-Local Impersonation And Audit Safety

Outcome: tenant-local impersonation is implemented without weakening the tenant boundary or obscuring original actor identity.

Commits:
1. Add tenant-host impersonation status/start/stop flow and API endpoints on top of the existing cookie-auth model.
2. Add tenant-local validation and request-context handling so effective user context never crosses tenant boundaries and original actor identity remains available while impersonation is active.
3. Add required audit-event recording and clear browser signaling for active impersonation.
4. Add unit, integration, and browser coverage for same-tenant success, cross-tenant denial, stop behavior, and audit behavior.

Merge gate:
- Cross-tenant impersonation is impossible.
- Effective authorization reflects the impersonated user while original actor identity remains available for audit-safe behavior.
- Audit behavior and UI signaling match the ADR and testing expectations.

### CP16 - Hardening And Consistency Pass

Outcome: security, operability, and documentation drift are closed before release.

Commits:
1. Reconcile threat model, cookie/CSRF/host validation, secrets posture, and document-rendering/XSS posture with actual implementation.
2. Add or finish OpenTelemetry, structured logging, and minimum operational metrics.
3. Run defect remediation across backend, frontend, worker, and tests.
4. Reconcile architecture, security, testing, runbook, and reviewer docs with shipped behavior.

Merge gate:
- Full regression suite is green.
- No open critical or high isolation/auth defects remain.
- Docs contain no stale or aspirational behavior claims.

### CP17 - Release Preparation And Reviewer Snapshot

Outcome: V1 is packaged as a reviewer-ready release.

Commits:
1. Freeze scope and finalize changelog, delivery notes, and release checklist.
2. Finalize deployment artifacts, validation commands, and rollback notes.
3. Refresh reviewer docs, diagrams, and walkthrough flow against the shipped system.
4. Run final clean-checkout validation and resolve any last packaging or doc drift.

Merge gate:
- `main` is taggable as V1.
- Deployment and reviewer walkthrough are reproducible from the documented steps.

## Recommended Ordering

- CP1-CP4 establish the workspace, deployment, persistence, and protocol baseline.
- CP5-CP8 establish the security boundary and public entry surface.
- CP9-CP11 establish the product domain and lease lifecycle.
- CP12-CP15 establish the browser experience and any remaining in-scope admin/security features.
- CP16-CP17 harden and cut the release.

## Minimal Principles For Every PR

- Keep the PR cohesive and mergeable.
- Add tests with the behavior change.
- Update canonical docs in the same PR when behavior, contracts, or terms change.
- Do not add speculative abstractions.
- Do not weaken tenant scoping for implementation convenience.
