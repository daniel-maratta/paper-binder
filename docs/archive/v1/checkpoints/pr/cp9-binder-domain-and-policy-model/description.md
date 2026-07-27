# CP9 PR Description: Binder Domain And Policy Model
Status: Review Ready

## Checkpoint
- `CP9`: Binder Domain And Policy Model
- Task IDs: `T-0023`

## Summary
- Adds tenant-scoped `binders` plus `binder_policies` schema, migration metadata, and Dapper-backed binder services so binders become the first product entity inside the established tenancy/auth boundary.
- Adds `GET /api/binders`, `POST /api/binders`, `GET /api/binders/{binderId}`, `GET /api/binders/{binderId}/policy`, and `PUT /api/binders/{binderId}/policy` with stable binder ProblemDetails contracts, exact-role binder policy semantics, and SQL-level omission of inaccessible restricted binders.
- Updates canonical product, feature-definition, architecture, contracts, engineering, testing, taskboard, repo navigation, and delivery docs so CP9 behavior is reviewer-visible and internally consistent.

## Scope Boundaries
- Included:
  - binder schema, migration, runtime Dapper persistence, and tenant-scoped indexes
  - binder create/list/detail endpoints
  - binder-policy read/update endpoints using concrete `mode` + `allowedRoles`
  - binder-specific ProblemDetails mapping and stable binder `errorCode` values
  - unit and Docker-backed integration coverage for binder allow/deny, wrong-host, cross-tenant, protocol-header, and CSRF behavior
  - synchronized checkpoint, taskboard, repo navigation, and PR artifacts
- Not included:
  - document tables, document endpoints, archive behavior, or markdown handling
  - lease endpoints, worker cleanup, or worker lifecycle changes
  - frontend binder screens or binder-policy UI
  - new tenant roles, multi-role aggregation, user-specific ACLs, or a policy DSL
  - audit persistence or audit-reporting UI

## Critic Review
- Scope-lock outcome: the implementation remains aligned with the locked CP9 decisions from the pre-implementation review.
- Post-implementation outcome: the `2026-04-08` critic review returned no blockers and no required fixes before merge.
- Findings summary:
  - SQL-level omission of inaccessible restricted binders remains the shipped list behavior.
  - Binder names remain non-unique within a tenant in CP9.
  - Binder detail keeps the explicit `documents: []` contract until CP10.
  - Binder-specific request/response examples, failure semantics, and stable binder `errorCode` values are documented and implemented consistently.
  - Structured security logging remains explicit, and no durable audit-table expansion was pulled into CP9.
  - `binder_policies` enforces the composite `(tenant_id, binder_id)` relationship to `binders`.
- Deferred or rejected non-blocking items:
  - Deferred: add a Docker-backed endpoint round-trip test for `400 BINDER_NAME_INVALID` on blank or overlength binder names. Current unit coverage already proves binder-name normalization and ProblemDetails mapping, and other binder validation paths already have end-to-end coverage.
  - Rejected for CP9: add duplicate wrong-host coverage for binder policy endpoints. All binder endpoints share the same `.RequirePaperBinderTenantHost()` route-group enforcement, so the existing wrong-host integration test already exercises the shared gate.
  - Rejected for CP9: align binder test seeding to `ISystemClock`. Production code already uses `ISystemClock`, and no current binder tests assert on seed timestamps.

## Risks And Rollout Notes
- Config or migration considerations:
  - adds one schema migration: `202604070001_AddBindersAndBinderPolicies`
  - adds no new runtime configuration keys
- Security or operational considerations:
  - binder list omission semantics intentionally avoid exposing denial markers for inaccessible restricted binders
  - same-tenant binder-local policy denial returns stable `403 BINDER_POLICY_DENIED`
  - wrong-tenant binder IDs resolve to `404 BINDER_NOT_FOUND`, not `403`
  - binder-policy writes emit structured log entries with `tenant_id`, `user_id`, and `event_name`

## Validation Evidence
- Commands run:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
  - `dotnet test tests/PaperBinder.UnitTests/PaperBinder.UnitTests.csproj -c Release --no-build --filter FullyQualifiedName~BinderDomainAndPolicyModelTests --logger "console;verbosity=minimal"`
  - `dotnet test tests/PaperBinder.IntegrationTests/PaperBinder.IntegrationTests.csproj -c Release --no-build --filter FullyQualifiedName~BinderDomainAndPolicyModelIntegrationTests --logger "console;verbosity=minimal"`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` (re-run after post-implementation closeout-artifact updates)
- Results:
  - `scripts/build.ps1`: passed; frontend production build succeeded and `dotnet build PaperBinder.sln -c Release --no-restore -p:SkipFrontendBuild=true` completed with 0 warnings and 0 errors
  - `scripts/test.ps1 -DockerIntegrationMode Require`: passed; unit suite 81/81, non-Docker integration suite 25/25, Docker-backed integration suite 50/50
  - targeted binder unit tests: 15/15 passed
  - targeted binder integration tests: 11/11 passed
  - `scripts/validate-docs.ps1`: passed
  - `scripts/validate-launch-profiles.ps1`: passed
  - `scripts/validate-docs.ps1` re-run after closeout-artifact updates: passed
- Tests added/updated:
  - unit tests for binder policy evaluation, binder name rules, binder policy payload validation, and binder problem mapping
  - Docker-backed integration tests for binder create/list/detail/policy success, binder-policy denial, cross-tenant `404`, wrong-host `404`, CSRF rejection on unsafe binder routes, invalid policy payloads, idempotent policy updates, and protocol headers across binder endpoints
- Launch profile verification:
  - `scripts/validate-launch-profiles.ps1` passed
- Manual verification:
  - VS Code launch passed on `2026-04-08`
  - Visual Studio launch passed on `2026-04-08`

## Follow-Ups
- Add a binder-name `400 BINDER_NAME_INVALID` endpoint round-trip integration test the next time binder endpoints change; the post-implementation critic review kept this deferred because existing unit coverage already proves the failure path and it is not a CP9 blocker.
- CP10 consumes the explicit empty binder-detail `documents` contract by introducing document persistence and real document summaries.
