# T-0022: CP8 Authorization Policies And Tenant User Administration

## Status
done

## Type
feature

## Priority
P0

## Owner
agent

## Created
2026-04-07

## Updated
2026-04-07

## Checkpoint
CP8

## Phase
Phase 2

## Summary
Implement CP8 so named API-boundary authorization policies are live, tenant-host and system-host routes are gated from the resolved-host context, and tenant admins can list users, create tenant-local users, and reassign roles without weakening tenant isolation.

## Context
- CP7 left explicit endpoint policy mapping and tenant-user administration intentionally deferred.
- CP8 must preserve the existing tenancy-resolution model, CSRF contract, and one-membership-per-user simplification.
- Lease, binder, document, and frontend work remain out of scope for this checkpoint.

## Acceptance Criteria
- [x] Request-scoped authenticated membership context is populated during tenant-host tenant-resolution success paths
- [x] Named policies `AuthenticatedUser`, `BinderRead`, `BinderWrite`, and `TenantAdmin` are registered and enforced explicitly at endpoints
- [x] Tenant-host-only and system-host-only routes are gated from the resolved-host request context before CSRF and authorization middleware runs
- [x] `GET /api/tenant/users`, `POST /api/tenant/users`, and `POST /api/tenant/users/{userId}/role` are live with tenant-scoped data access only
- [x] Tenant-user create uses Identity password validators plus Dapper transactionality for `users` and `user_tenants`
- [x] Invalid role, invalid password, duplicate email, unknown tenant user, and last-admin failures map to stable ProblemDetails contracts
- [x] Unit and Docker-backed integration coverage prove policy hierarchy, allow/deny behavior, CSRF enforcement, and last-admin protection
- [x] Canonical docs, taskboard, checkpoint ledger, and CP8 delivery artifact are synchronized in the same change set

## Dependencies
- [T-0020](./T-0020-cp7-pre-auth-abuse-controls-and-provisioning-surface.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Locked to CP8 authorization-policy infrastructure, tenant-user admin endpoints, tests, and synchronized docs only. No CP9+ binder/document/lease/frontend pull-forward.
- Pre-PR Critique: Addressed before implementation start. Key constraints locked in: use a DI-scoped membership context, keep host gating on the existing request-host model, preserve atomic tenant-user creation without `UserManager.CreateAsync()`, keep CSRF middleware authoritative, and register policy probes through the integration-host startup hook only.
- Escalation Notes: Docker-backed CP8 integration verification required unsandboxed execution because the sandbox could not access the local Docker engine pipe.

## Current State
- Implemented, post-implementation-reviewed, and fully validated on the current branch. Manual VS Code and Visual Studio launch verification is recorded in the PR artifact, and the canonical frontend restore/build path now passes again in this environment.

## Touch Points
- `src/PaperBinder.Api`
- `src/PaperBinder.Application`
- `src/PaperBinder.Infrastructure`
- `tests/PaperBinder.UnitTests`
- `tests/PaperBinder.IntegrationTests`
- `docs/20-architecture`
- `docs/30-security`
- `docs/40-contracts`
- `docs/55-execution`
- `docs/70-operations`
- `docs/80-testing`
- `docs/95-delivery/pr`

## Next Action
- None for CP8. Next planned checkpoint is `CP9`.

## Validation Evidence
- `powershell -ExecutionPolicy Bypass -File .\scripts\restore.ps1` (passed, including `npm ci`)
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release` (passed, including `npm run build` and full solution build)
- `dotnet build PaperBinder.sln -c Release --no-restore -p:SkipFrontendBuild=true -v minimal` (passed)
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require` (passed with escalation: 66/66 unit tests, 25/25 non-Docker integration tests, 39/39 Docker-backed integration tests)
- `dotnet test tests/PaperBinder.IntegrationTests/PaperBinder.IntegrationTests.csproj -c Release --no-build --filter FullyQualifiedName~AuthorizationPoliciesAndTenantUserAdministrationIntegrationTests --logger "console;verbosity=minimal"` (passed with escalation: 15/15)
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` (passed)
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1` (passed)

## Decision Notes
- Authorization policies evaluate against a request-scoped tenant membership context rather than reading ad-hoc role values in handlers.
- Host-gated routes now use endpoint metadata plus middleware backed by `IRequestResolvedTenantHostContext`, which keeps the existing tenancy model authoritative and returns `404` on the wrong host before CSRF or authorization run.
- Tenant-user creation validates passwords with the configured Identity password validators, normalizes email/name with `ILookupNormalizer`, hashes with `IPasswordHasher<PaperBinderUser>`, and inserts `users` plus `user_tenants` inside one Dapper transaction.
- Post-implementation review found no blockers; the two low/info observations were addressed by adding a minimal structural email check and by making the tenant-user request DTO string properties explicitly nullable.

## Validation Plan
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`

## Outcome (Fill when done)
- Added request-scoped tenant membership context, named authorization policies, and resolved-host route gating so protected endpoints are explicit and tenant-host/system-host mismatches fail before handlers run.
- Added tenant-user list/create/role endpoints with tenant-scoped Dapper data access, last-admin protection, Identity-backed password validation, and stable ProblemDetails mappings for the CP8 failure contract.
- Added unit coverage for policy hierarchy, membership-context behavior, role parsing, failure mapping, and last-admin rules plus Docker-backed integration coverage for tenant-user allow/deny paths, CSRF rejection, policy probes, and tenant-boundary enforcement.
- Synchronized architecture, security, contract, testing, taskboard, operations, and delivery docs with the shipped CP8 backend boundary.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
