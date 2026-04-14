# CP11 Implementation Plan: Worker Runtime And Lease Lifecycle
Status: Draft

## Goal

Implement CP11 so the current worker stops being a heartbeat-only host, the existing tenant-lease contract becomes real runtime behavior, and tenant expiry cleanup becomes deterministic first-class system behavior without reopening CP5 tenancy resolution, CP8 authorization, or CP10 document scope.

## Scope

Included:
- worker-host runtime work to turn the current heartbeat service into a real scheduled cleanup runtime
- application and infrastructure services for lease reads, extension rules, expired-tenant selection, and hard-delete cleanup orchestration
- tenant-host API endpoints `GET /api/tenant/lease` and `POST /api/tenant/lease/extend`
- structured worker logging and explicit audit-retention-mode handling inside the repo's current structured-logging boundary
- lease-extension rate limiting and CSRF enforcement on the unsafe extend route
- unit, non-Docker, and Docker-backed integration coverage for lease rules, cleanup idempotency, expired-before-purge behavior, and no-touch active tenants
- synchronized product, architecture, security, contract, testing, execution, operations, and delivery docs directly affected by CP11

Not included:
- frontend lease countdown, banner, or browser flows (`CP14`)
- provisioning-flow changes beyond the already-shipped lease initialization behavior
- soft deletes, grace periods, tenant recovery, or configurable commercial plan logic
- generalized job orchestration, queue infrastructure, distributed scheduling, or third-party background-job dependencies
- new audit tables, audit-reporting UI, or long-term analytics retention
- binder or document feature work beyond deleting tenant-owned rows during purge
- broader authenticated-route rate limiting or observability hardening outside the lease-extension and worker-runtime surface (`CP16`)

## Locked Design Decisions

CP11 design is stable at the checkpoint boundary. Implementation must not reopen these decisions without updating this plan and the affected canonical docs first.

- Reuse the current request pipeline and named policies. `GET /api/tenant/lease` stays `AuthenticatedUser`; `POST /api/tenant/lease/extend` stays `TenantAdmin`. CP11 does not add new v1 roles or bypass CP8 policy enforcement.
- Lease state remains on `tenants` via `expires_at_utc` and `lease_extension_count`. CP11 does not add a lease-history table, renewal-history table, or per-tenant plan abstraction.
- Lease evaluation is server-time only through `ISystemClock`. Client payloads, headers, query parameters, and host hints must never influence tenant selection or lease math.
- Successful lease reads return only the existing contract fields `expiresAt`, `secondsRemaining`, `extensionCount`, `maxExtensions`, and `canExtend`. CP11 does not add `serverTime`, warning-band enums, or frontend-only convenience fields.
- `secondsRemaining` is derived from `expiresAt - now` on read and is never negative in `200` responses.
- `canExtend` is true only when remaining lease is less than or equal to the configured extension window and `extensionCount` is below the configured max.
- The extension eligibility threshold is exactly `LeaseExtensionMinutes`. CP11 does not introduce a separate `PAPERBINDER_LEASE_EXTENSION_WINDOW_*` or other second threshold config key.
- `POST /api/tenant/lease/extend` accepts no business inputs beyond the authenticated tenant-host request. The handler must ignore any client attempt to supply tenant identifiers or duration values.
- `POST /api/tenant/lease/extend` is an unsafe cookie-authenticated route and must remain CSRF-protected and rate-limited using `PAPERBINDER_RATE_LIMIT_LEASE_EXTEND_PER_MINUTE`.
- Successful extension increments `lease_extension_count` exactly once and adds exactly `LeaseExtensionMinutes` to the persisted `expires_at_utc` for the current tenant.
- Extension-rule conflicts use stable lease-specific ProblemDetails codes. This plan locks them to `TENANT_LEASE_EXTENSION_WINDOW_NOT_OPEN` and `TENANT_LEASE_EXTENSION_LIMIT_REACHED`.
- Expired-but-not-yet-purged tenant-host requests continue to fail through the existing tenancy and auth boundary with `410 TENANT_EXPIRED`; purged tenant hosts continue to fail with `404 TENANT_NOT_FOUND`. Lease endpoints do not get a special expired-state bypass.
- Worker cleanup runs as explicit system execution. Expiry scanning may read across tenants only for reviewed cleanup purposes, and purge code must not reuse tenant-scoped repositories with synthetic or ambient tenant context.
- The worker loop stays thin and delegates one cleanup cycle to a separately invokable service so correctness can be tested without sleeping through timer loops.
- Hard delete remains the only purge model in v1. There is no grace period, quarantine state, or recovery flow.
- CP11 does not add durable audit persistence. `PAPERBINDER_AUDIT_RETENTION_MODE` is honored inside the existing structured-logging boundary only: retain-summary mode emits a minimal non-sensitive `tenant_purged` event, while purge mode avoids keeping a tenant-specific summary payload after deletion.

Any future change to these decisions requires revising this plan and the affected canonical docs before implementation begins.

## Planned Work

1. Reconcile the CP11 contract docs before broad implementation. This blocking doc pass must update `docs/40-contracts/api-contract.md`, `docs/20-architecture/demo-tenant-lease.md`, `docs/20-architecture/worker-jobs.md`, `docs/70-operations/cleanup-jobs-runbook.md`, `docs/30-security/rate-limiting-abuse.md`, and `docs/15-feature-definition/FD-0005-demo-tenant-lease-status-contract.md` so they explicitly agree on:
   - `POST /api/tenant/lease/extend` as `TenantAdmin`, `CSRF required: Y`, and `Rate limited: Y`
   - `429 RATE_LIMITED` plus `Retry-After` in lease-extend failure semantics
   - lease-specific `409` error codes `TENANT_LEASE_EXTENSION_WINDOW_NOT_OPEN` and `TENANT_LEASE_EXTENSION_LIMIT_REACHED` in the main API error-contract section
   - the full v1 hard-delete scope: tenant row, user memberships, current tenant-owned user records, binders, binder policies, and documents
   - audit-retention-mode wording that stays aligned with the existing structured-logging-only posture
2. Add lease-focused application contracts and rules for read-state calculation, extension eligibility, cleanup-cycle outcomes, and purge orchestration without leaking ASP.NET Core or worker concerns into domain and application code.
3. Add infrastructure services for tenant lease read and update operations plus deterministic expired-tenant cleanup orchestration, using SQL that stays explicit about system-context scanning versus tenant-owned delete paths.
4. Replace the worker heartbeat-only behavior with a scheduled cleanup loop that uses `LeaseCleanupIntervalSeconds`, emits structured start, scan, purge, and failure logs, and delegates actual purge work to an invokable single-cycle service.
5. Add tenant-host lease endpoints, lease-specific ProblemDetails mapping, and a dedicated lease-extension rate-limit policy wired through the existing ASP.NET Core rate-limiting middleware.
6. Tighten the API and worker test-host seams so integration tests can inject a controllable clock and invoke one cleanup cycle deterministically without waiting on real timers. The non-Docker worker-host smoke coverage must also prove the host resolves the cleanup-cycle dependency after the heartbeat-to-cleanup migration.
7. Add unit coverage for lease-rule calculations and Docker-backed integration coverage for lease API behavior, cleanup side effects, and purge retry safety.
8. Synchronize the remaining canonical docs, delivery artifact navigation, and repository metadata in the same change set.

## Vertical-Slice TDD Plan

Public interfaces under test:
- `GET /api/tenant/lease`
- `POST /api/tenant/lease/extend`
- new application contracts under `src/PaperBinder.Application/Tenancy/` or an adjacent lease-focused slice
- new cleanup-cycle entrypoint consumed by `src/PaperBinder.Worker/Worker.cs`
- worker-host startup and scheduling behavior in `src/PaperBinder.Worker/`

Planned `RED -> GREEN -> REFACTOR` slices:

1. `RED`: `Should_ReturnLeaseState_When_AuthenticatedMemberTargetsActiveTenant`
   `GREEN`: add the minimal lease read service and endpoint mapping using the established request tenant and membership context with the locked response shape.
   `REFACTOR`: centralize lease-state projection so `GET` and `POST` success responses share one mapping path.
2. `RED`: `Should_ExtendLease_When_TenantAdminCallsWithinAllowedWindow`
   `GREEN`: add the minimal extension path that re-reads current lease state, updates `expires_at_utc` and `lease_extension_count`, and returns the updated lease payload.
   `REFACTOR`: isolate persistence and rule evaluation so the endpoint stays thin.
3. `RED`: `Should_ReturnConflict_When_LeaseExtensionWindowIsNotOpen_OrLimitIsReached`
   `GREEN`: enforce extension-window and max-extension rules with the locked `409` error codes.
   `REFACTOR`: centralize rule helpers so `canExtend`, conflict detection, and success-path updates remain consistent.
4. `RED`: `Should_RejectLeaseExtend_When_CsrfTokenIsMissing_OrCallerLacksTenantAdmin`
   `GREEN`: wire the extend route through the existing tenant-host gating, authorization, and CSRF middleware without custom bypasses.
   `REFACTOR`: reduce route ceremony and keep the surface policy-driven.
5. `RED`: `Should_ReturnTooManyRequests_When_LeaseExtendRateLimitIsExceeded`
   `GREEN`: add the dedicated authenticated lease-extension limiter with `429 RATE_LIMITED` and `Retry-After` behavior.
   `REFACTOR`: keep limiter partitioning and rejection writing aligned with the existing rate-limit pipeline.
6. `RED`: `Should_DeleteExpiredTenantData_When_CleanupCycleRuns`
   `GREEN`: add a single cleanup-cycle entrypoint that selects expired tenants and hard-deletes tenant-owned rows in deterministic order.
   `REFACTOR`: separate scan logic, per-tenant purge transaction boundaries, and summary logging so reruns stay easy to reason about.
7. `RED`: `Should_NotDeleteActiveTenants_And_Should_BeIdempotent_When_CleanupCycleRunsRepeatedly`
   `GREEN`: make cleanup retry-safe for already-purged or partially-purged tenants and ensure active tenants are untouched.
   `REFACTOR`: consolidate retry-safe delete statements and structured failure logging without widening scope.
8. `RED`: `Should_ReturnGone_BeforePurge_AndNotFound_AfterPurge_ForRepresentativeTenantHostRequests`
   `GREEN`: prove the existing `410` and `404` boundary behavior remains correct once cleanup and lease endpoints are live.
   `REFACTOR`: tighten shared clock and seeding helpers rather than duplicating ad hoc time-based setup.

## Acceptance Criteria

- `PaperBinder.Worker` starts with validated runtime settings, logs worker startup and each cleanup pass, and schedules cleanup using `PAPERBINDER_LEASE_CLEANUP_INTERVAL_SECONDS` without embedding correctness inside timer waits.
- A single cleanup cycle selects only tenants where `expires_at_utc <= now`, processes them in deterministic order, and never selects active tenants.
- Purge hard-deletes the tenant row and all tenant-owned rows required by current v1 scope, including user memberships, binders, binder policies, documents, and current tenant-owned user records, without widening reads beyond reviewed cleanup paths.
- Cleanup is retry-safe and idempotent: rerunning after a successful purge or after a partial failure does not delete active tenants, does not require manual repair first, and can resume safely on the next scheduled pass.
- `GET /api/tenant/lease` returns the locked lease payload for the current tenant only, using host-derived tenant identity plus authenticated membership and never trusting client-supplied tenant identifiers.
- `GET /api/tenant/lease` computes `secondsRemaining`, `extensionCount`, `maxExtensions`, and `canExtend` from persisted lease state plus server time and preserves `X-Api-Version` and `X-Correlation-Id`.
- `POST /api/tenant/lease/extend` is tenant-host-only, `TenantAdmin`-only, CSRF-protected, rate-limited, and on success increments `lease_extension_count` exactly once, adds exactly `LeaseExtensionMinutes` to `expires_at_utc`, and returns the updated lease payload with standard API headers.
- `POST /api/tenant/lease/extend` returns `409 TENANT_LEASE_EXTENSION_WINDOW_NOT_OPEN` when remaining lease is still above the configured extension window and `409 TENANT_LEASE_EXTENSION_LIMIT_REACHED` when the tenant has already consumed the configured maximum number of extensions.
- `LeaseExtensionMinutes` drives both the eligibility threshold and the extension amount, and CP11 does not introduce a second extension-window configuration key.
- Representative tenant-host API requests continue to return `410 TENANT_EXPIRED` after expiry but before purge, and return `404 TENANT_NOT_FOUND` after purge removes the tenant host.
- Cleanup retains the repo's current no-audit-table posture while honoring `PAPERBINDER_AUDIT_RETENTION_MODE`; retained summary output must be minimal and non-sensitive and must not include credentials, document content, or user email addresses.
- The implementation ships without soft deletes, grace periods, recovery workflows, new background-job dependencies, or frontend lease UX.
- Canonical product, architecture, security, contract, testing, operations, execution, and delivery docs are updated in the same change set as the implementation.

## Validation Plan

- pre-implementation scope-lock check that `docs/40-contracts/api-contract.md`, `docs/20-architecture/demo-tenant-lease.md`, `docs/20-architecture/worker-jobs.md`, `docs/70-operations/cleanup-jobs-runbook.md`, `docs/30-security/rate-limiting-abuse.md`, and `docs/15-feature-definition/FD-0005-demo-tenant-lease-status-contract.md` explicitly agree on `TenantAdmin` authorization, `CSRF required: Y`, `Rate limited: Y`, `429 RATE_LIMITED` plus `Retry-After`, the two lease-specific `409` error codes, and the full hard-delete scope before broad code changes begin
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
- targeted unit tests for lease-state projection, extension-window evaluation, max-extension evaluation, and any cleanup-cycle selection helpers that do not require PostgreSQL
- targeted non-Docker integration coverage for worker-host construction, cleanup-cycle dependency resolution after the worker migration, and any new test-host seam needed to replace `ISystemClock`
- targeted Docker-backed integration tests for lease read success, lease extend success, too-early extension `409`, extension-limit `409`, missing-CSRF rejection on `POST /api/tenant/lease/extend`, non-`TenantAdmin` rejection on `POST /api/tenant/lease/extend`, `429 RATE_LIMITED` behavior on the extend route, expired-before-purge `410`, post-purge `404`, cleanup hard-delete of tenant-owned rows, cleanup idempotency, and no-touch active tenants
- targeted Docker-backed integration coverage that invokes one cleanup cycle directly rather than sleeping for the background timer interval
- clock-sensitive lease and cleanup assertions must use a controllable clock seam rather than raw `DateTimeOffset.UtcNow`
- static review during closeout that confirms no separate `PAPERBINDER_LEASE_EXTENSION_WINDOW_*` config key or second extension-threshold setting was introduced
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require`
- manual VS Code and Visual Studio launch verification recorded in the eventual CP11 PR artifact before checkpoint closeout

## Likely Touch Points

- `src/PaperBinder.Worker/Program.cs`
- `src/PaperBinder.Worker/Worker.cs`
- `src/PaperBinder.Application/Tenancy/`
- `src/PaperBinder.Infrastructure/Tenancy/`
- `src/PaperBinder.Infrastructure/Persistence/PaperBinderPersistenceServiceCollectionExtensions.cs`
- `src/PaperBinder.Infrastructure/Configuration/PaperBinderRuntimeSettings.cs`
- `src/PaperBinder.Api/Program.Partial.cs`
- `src/PaperBinder.Api/PaperBinderAuthenticationExtensions.cs`
- `src/PaperBinder.Api/PaperBinderPreAuthProtectionExtensions.cs`
- `src/PaperBinder.Api/PaperBinderErrorCodes.cs`
- `src/PaperBinder.Api/TenantResolutionMiddleware.cs`
- `tests/PaperBinder.UnitTests/`
- `tests/PaperBinder.IntegrationTests/PaperBinderApplicationHost.cs`
- `tests/PaperBinder.IntegrationTests/TenantResolutionIntegrationTests.cs`
- `tests/PaperBinder.IntegrationTests/AuthIntegrationTests.cs`
- `tests/PaperBinder.IntegrationTests/WorkerHostIntegrationTests.cs`
- `docs/10-product/prd.md`
- `docs/10-product/user-stories.md`
- `docs/15-feature-definition/FD-0005-demo-tenant-lease-status-contract.md`
- `docs/15-feature-definition/FD-0007-tenant-purge-audit-retention-mode.md`
- `docs/20-architecture/demo-tenant-lease.md`
- `docs/20-architecture/system-overview.md`
- `docs/20-architecture/worker-jobs.md`
- `docs/30-security/rate-limiting-abuse.md`
- `docs/30-security/secrets-and-config.md`
- `docs/40-contracts/api-contract.md`
- `docs/80-testing/test-strategy.md`
- `docs/80-testing/testing-standards.md`
- `docs/80-testing/integration-tests.md`
- `docs/70-operations/cleanup-jobs-runbook.md`
- `docs/70-operations/runbook-local.md`
- `docs/70-operations/runbook-prod.md`
- `docs/55-execution/phases/phase-3-product-domain.md`
- `docs/95-delivery/pr/cp11-worker-runtime-and-lease-lifecycle/`
- `docs/ai-index.md`
- `docs/repo-map.json`

## Critic Review Resolution Log

- `NB-1` Accepted and resolved: planned work step 1 and the validation plan now explicitly require `CSRF required: Y` and `Rate limited: Y` on the `POST /api/tenant/lease/extend` contract entry.
- `NB-2` Accepted and resolved: planned work step 1 and the validation plan now explicitly require `429 RATE_LIMITED` plus `Retry-After` in lease-extend failure semantics.
- `NB-3` Accepted and resolved: the plan already locked the two lease-specific `409` codes, and step 1 plus validation now explicitly require adding them to the main API error-contract section.
- `NB-4` Accepted and resolved: step 1 and the validation plan now explicitly require `worker-jobs.md` and `cleanup-jobs-runbook.md` to align to the full v1 purge scope, including tenant row, user memberships, binders, binder policies, documents, and current tenant-owned user records.
- `NB-5` Accepted and resolved: locked design decisions and acceptance criteria now explicitly state that `LeaseExtensionMinutes` drives both the eligibility threshold and the extension amount, with no second extension-window config key.
- `NB-6` Accepted and resolved: planned work step 1 and the validation plan now explicitly require `demo-tenant-lease.md` and `FD-0005` to use `TenantAdmin` wording for lease extension authorization.
- `NB-7` Accepted and resolved: planned work step 6 and the validation plan now explicitly require non-Docker worker-host smoke coverage that proves the cleanup-cycle dependency resolves after the worker migration.

## Pre-Implementation Reconciliation Gates

- Reconcile the existing authorization wording mismatch by updating `docs/20-architecture/demo-tenant-lease.md` and `docs/15-feature-definition/FD-0005-demo-tenant-lease-status-contract.md` to `TenantAdmin`, matching the locked CP11 design and `docs/40-contracts/api-contract.md`.
- Add `TENANT_LEASE_EXTENSION_WINDOW_NOT_OPEN` and `TENANT_LEASE_EXTENSION_LIMIT_REACHED` to the main error-contract section in `docs/40-contracts/api-contract.md` before broad endpoint implementation starts.
- Add or expose the small controllable-clock and worker-host dependency-resolution test seam needed for deterministic CP11 coverage before timer-dependent implementation expands.

## ADR Triggers And Boundary Risks

- ADR trigger: adding Quartz, Hangfire, cron infrastructure, or any other third-party background-job dependency instead of the documented `BackgroundService` baseline.
- ADR trigger: changing hard-delete semantics into soft delete, grace-period retention, or tenant recovery behavior.
- ADR trigger: introducing durable audit tables or an event store to satisfy purge-retention requirements.
- ADR trigger: changing the current expired-tenant boundary so lease endpoints or other tenant-host routes can bypass `TENANT_EXPIRED`.
- Boundary risk: if the lease-extend authorization mismatch is not reconciled first, CP11 will ship with reviewer-visible contract drift.
- Boundary risk: implementing cleanup through tenant-scoped repositories plus a synthetic `TenantContext` would violate the reviewed system-context exception and could miss or mis-scope child-row deletion.
- Boundary risk: time-based lease tests and cleanup-cycle tests will be flaky unless the controllable-clock and single-cycle test seam lands early.
- Boundary risk: purge ordering must be explicit and transaction-safe so child rows are not left orphaned and active-tenant data is never touched.
- Boundary risk: making lease-extension rate limiting too generic could unintentionally throttle unrelated authenticated routes; CP11 must scope the limiter to `POST /api/tenant/lease/extend` only.
- Boundary risk: retained purge-summary output must stay minimal and non-sensitive; logging tenant emails, credentials, or document content would violate FD-0007 and the security docs.
