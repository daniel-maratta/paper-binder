# CP11 Critic Review: Worker Runtime And Lease Lifecycle

Reviewer: Critic
Review phases: scope-lock (2026-04-10), post-implementation (2026-04-10)

Inputs reviewed:
- `docs/55-execution/execution-plan.md` (CP11 section)
- `docs/95-delivery/pr/cp11-worker-runtime-and-lease-lifecycle/implementation-plan.md`
- `docs/95-delivery/pr/cp11-worker-runtime-and-lease-lifecycle/description.md`
- `docs/05-taskboard/tasks/T-0026-cp11-worker-runtime-and-lease-lifecycle.md`
- `docs/40-contracts/api-contract.md`
- `docs/20-architecture/demo-tenant-lease.md`
- `docs/20-architecture/worker-jobs.md`
- `docs/20-architecture/system-overview.md`
- `docs/30-security/rate-limiting-abuse.md`
- `docs/30-security/secrets-and-config.md`
- `docs/70-operations/cleanup-jobs-runbook.md`
- `docs/15-feature-definition/FD-0005-demo-tenant-lease-status-contract.md`
- `docs/15-feature-definition/FD-0007-tenant-purge-audit-retention-mode.md`
- `docs/80-testing/test-strategy.md`
- `docs/80-testing/integration-tests.md`
- `docs/00-intent/documentation-integrity-contract.md`
- `AGENTS.md`
- Full working-tree diff against `main`
- All new and modified source files across `src/PaperBinder.Api`, `src/PaperBinder.Application`, `src/PaperBinder.Infrastructure`, `src/PaperBinder.Worker`, `tests/PaperBinder.UnitTests`, `tests/PaperBinder.IntegrationTests`, and `scripts/`
- Private-boundary scan across all changed files

---

## Verdict

**Ship-ready. No blocking findings.**

The CP11 implementation is well-structured, respects all locked design decisions, maintains tenant isolation and security boundaries, and has credible test coverage across unit, non-Docker, and Docker-backed layers. All seven pre-implementation non-blocking findings from the scope-lock review were resolved before execution. Doc reconciliation is complete and internally consistent across all affected canonical docs. The private-boundary scan found no references to proprietary names or private sibling paths.

The only open item is the pending manual VS Code and Visual Studio launch verification, which the author has correctly deferred as a checkpoint-closure prerequisite rather than a code-level blocker.

---

## Blocking Findings

None.

---

## Non-Blocking Findings

### NB-POST-1: Exact boundary at `ExtensionMinutes` remaining is not explicitly unit-tested

The unit test theory `TenantLeaseRules_Should_AllowExtension_OnlyWithinWindow_AndBelowLimit` covers cases at 5 minutes, 1 minute, 11 minutes, and expired, but does not include an inline case at exactly 10 minutes remaining (the `<=` boundary). The `<=` comparison in `TenantLeaseRules.CanExtend` is correct, and the integration test at 8 minutes plus the 15-minute too-early case bracket the behavior, so this is a narrow gap in unit coverage rather than a correctness risk.

Severity: Low. No action required before merge; optionally add `[InlineData("2026-04-10T12:10:00Z", 0, true)]` in a future pass.

### NB-POST-2: Audit retention mode toggle behavior has no explicit test

The cleanup service `LogSuccessfulPurge` conditional guard is exercised under whichever mode `TestRuntimeConfiguration` provides (likely `RetainTenantPurgedSummary`), but no test toggles to `PurgeTenantAudit` and asserts that the purge-summary event is suppressed. The guard is a two-line conditional, and asserting structured-log suppression in integration tests is inherently fragile, so this is acceptable as-is.

Severity: Low. No action required before merge.

### NB-POST-3: Cleanup user-deletion safety depends on v1 single-tenant-per-user invariant

The purge path collects user IDs from `user_tenants` for the target tenant and then deletes those `users` rows by ID. In v1, each user belongs to exactly one tenant, so this is correct. If a future checkpoint introduced multi-tenant user membership, this SQL would delete a user row while leaving orphaned memberships in other tenants. The docs explicitly say "current tenant-owned user records" which acknowledges this scoping.

Severity: Low. This is a documented v1 simplification and does not require a fix before merge. If multi-tenant membership is ever introduced, cleanup SQL must be revisited.

---

## Locked Design Decisions: Post-Implementation Verification

All locked design decisions in the implementation plan have been verified against the implemented source code:

| Decision | Status | Evidence |
|---|---|---|
| `GET /api/tenant/lease` uses `AuthenticatedUser` policy | Verified | `PaperBinderTenantLeaseEndpoints.cs:14` |
| `POST /api/tenant/lease/extend` uses `TenantAdmin` policy | Verified | `PaperBinderTenantLeaseEndpoints.cs:17` |
| `LeaseExtensionMinutes` drives both eligibility threshold and extension amount | Verified | `TenantLeaseRules.CanExtend` uses `policy.ExtensionMinutes` for window; `DapperTenantLeaseService.cs:103` uses `extensionMinutes` for the amount added |
| No separate `PAPERBINDER_LEASE_EXTENSION_WINDOW_*` config key | Verified | grep returned no matches across `src/` |
| `secondsRemaining` never negative in `200` responses | Verified | `TenantLeaseRules.GetSecondsRemaining` clamps to `0`; unit test confirms |
| `canExtend` true only when within window and below max | Verified | `TenantLeaseRules.CanExtend` checks both; unit theory covers all cases |
| Handler ignores client-supplied business inputs | Verified | `ExtendLeaseAsync` reads only `tenantContext` and `membershipContext`; integration test sends `{ tenantId, durationMinutes }` and asserts correct server-derived values |
| CSRF enforcement on extend | Verified | integration test asserts `403 CSRF_TOKEN_INVALID` on missing CSRF |
| Route-scoped rate limiting on extend | Verified | `RequireRateLimiting` applied only to extend endpoint; `IsTenantLeaseExtendRequest` guard prevents throttling other routes; integration test asserts `429` with `Retry-After` |
| Stable error codes `TENANT_LEASE_EXTENSION_WINDOW_NOT_OPEN` and `TENANT_LEASE_EXTENSION_LIMIT_REACHED` | Verified | `PaperBinderErrorCodes.cs:17-18`; `PaperBinderTenantLeaseProblemMapping.cs` maps correctly; unit and integration tests assert |
| Expired-but-not-yet-purged returns `410 TENANT_EXPIRED` | Verified | integration test `Should_ReturnGone_BeforePurge_AndNotFound_AfterPurge` confirms |
| Post-purge returns `404 TENANT_NOT_FOUND` | Verified | same integration test confirms |
| Hard delete only, no grace period or recovery | Verified | no soft-delete, quarantine, or recovery code exists |
| No durable audit tables | Verified | audit output stays within structured logging; no new tables or migrations |
| `PAPERBINDER_AUDIT_RETENTION_MODE` honored | Verified | `DapperTenantLeaseCleanupService.LogSuccessfulPurge` checks mode before logging |
| Retained purge-summary log is non-sensitive | Verified | log template emits only `tenant_id` and deletion counts; no emails, credentials, or document content |
| Worker delegates to single-cycle service | Verified | `Worker.cs:33-34` resolves and invokes `ITenantLeaseCleanupService` per cycle |
| Cleanup scans expired tenants in deterministic order | Verified | `ORDER BY expires_at_utc, id` in candidate scan SQL |
| Cleanup is retry-safe and idempotent | Verified | per-tenant `FOR UPDATE` re-checks expiry; already-purged tenants not re-selected; integration test runs two cycles |
| Cleanup does not use tenant-scoped repositories or synthetic tenant context | Verified | all cleanup SQL uses explicit `tenant_id` parameters; no `TenantContext` or scoped repository injection |
| Purge ordering is FK-safe | Verified | delete order: documents -> binder_policies -> binders -> user_tenants -> users -> tenants |
| Extension uses `FOR UPDATE` to prevent concurrent race | Verified | `DapperTenantLeaseService.cs:74`: `for update` in extend transaction |
| Rate limiter partitions by tenant+user when available | Verified | `ResolveLeaseExtendPartitionKey` uses `{tenantId}:{userId}` first, falls back to tenant+IP, then IP |
| No new third-party dependencies | Verified | no new NuGet packages in project files |
| No schema migration required | Verified | no new migration files; `tenants` table already has `expires_at_utc`, `lease_extension_count`, and the required index/constraint |

No locked decision was violated. No ADR trigger was hit. No CP5, CP8, or CP10 boundary was reopened.

---

## Doc Reconciliation: Post-Implementation Verification

All pre-implementation reconciliation gates from the scope-lock review have been resolved:

| Gate | Status |
|---|---|
| `api-contract.md` lease extend entry includes `CSRF required: Y` and `Rate limited: Y` | Verified (lines 145-146) |
| `api-contract.md` lease extend failure semantics include `429 RATE_LIMITED` with `Retry-After` | Verified (line 164) |
| `api-contract.md` error contract section lists both `409` lease-specific codes | Verified (lines 71-72) |
| `api-contract.md` RBAC policy map includes lease endpoints | Verified (lines 562-563) |
| `worker-jobs.md` hard-delete scope includes binders, binder policies, and user memberships | Verified (line 12) |
| `cleanup-jobs-runbook.md` hard-delete scope matches implemented purge SQL | Verified (line 11) |
| `demo-tenant-lease.md` says `TenantAdmin` for extend authorization | Verified (line 27) |
| `FD-0005` says `TenantAdmin` for extend authorization | Verified (line 39) |
| `rate-limiting-abuse.md` documents lease-extend limiter and partitioning | Verified (lines 11-12) |
| `secrets-and-config.md` documents `PAPERBINDER_RATE_LIMIT_LEASE_EXTEND_PER_MINUTE` | Verified (line 37) |
| `secrets-and-config.md` notes no separate extension-window config key | Verified (lines 49-50) |
| `system-overview.md` lease lifecycle section is current | Verified (lines 87-107) |
| `integration-tests.md` golden path list includes all CP11 tests | Verified (lines 57-64) |
| `test-strategy.md` non-negotiable coverage includes lease and cleanup behavior | Verified (line 26) |

---

## Test Coverage: Post-Implementation Verification

### Unit Tests (TenantLeaseLifecycleTests: 8/8)

| Test | Covers |
|---|---|
| `TenantLeaseRules_Should_ProjectLeaseState_WithNonNegativeSecondsRemaining` | `secondsRemaining` clamped to 0 for past-expiry |
| `TenantLeaseRules_Should_AllowExtension_OnlyWithinWindow_AndBelowLimit` (5 cases) | within-window, within-window-near-limit, outside-window, at-max-extensions, expired |
| `TenantLeaseRules_Should_ProjectExactWholeSecondDifference` | exact seconds math for 480-second remaining |
| `TenantLeaseProblemMapping_Should_MapStableLeaseSpecificConflictCodes` | both 409 error code mappings |

### Non-Docker Integration Tests (WorkerHostIntegrationTests: 1/1)

| Test | Covers |
|---|---|
| `Should_BuildWorkerHost_AndResolveCleanupDependencies_When_RuntimeConfigurationIsValid` | host construction, `ITenantLeaseCleanupService` resolution, Worker registered as `IHostedService` |

### Docker-Backed Integration Tests (TenantLeaseLifecycleIntegrationTests: 8/8)

| Test | Covers |
|---|---|
| `Should_ReturnLeaseState_When_AuthenticatedMemberTargetsActiveTenant` | lease read payload shape, `X-Api-Version`, `X-Correlation-Id` |
| `Should_ExtendLease_When_TenantAdminCallsWithinAllowedWindow` | extension success, DB verification, client-input-ignoring |
| `Should_ReturnConflict_When_LeaseExtensionWindowIsNotOpen_OrLimitIsReached` | both 409 codes with correct ProblemDetails |
| `Should_RejectLeaseExtend_When_CsrfTokenIsMissing_OrCallerLacksTenantAdmin` | CSRF 403, non-admin 403 |
| `Should_ReturnTooManyRequests_When_LeaseExtendRateLimitIsExceeded` | 429 with `RATE_LIMITED` errorCode and `Retry-After` header |
| `Should_DeleteExpiredTenantData_When_CleanupCycleRuns` | full purge of tenant, memberships, users, binders, binder policies, documents |
| `Should_NotDeleteActiveTenants_And_Should_BeIdempotent_When_CleanupCycleRunsRepeatedly` | active tenant untouched, idempotent second cycle |
| `Should_ReturnGone_BeforePurge_AndNotFound_AfterPurge` | 410 before purge, 404 after purge |

All tests use `MutableTestSystemClock` for deterministic time control. Cleanup tests invoke the single-cycle service directly rather than waiting on background timer loops.

---

## Security Boundary Verification

- **Tenant isolation**: lease reads are tenant-scoped via host-resolved `TenantContext`; cleanup scans use system-context SQL with explicit `tenant_id` parameters; no synthetic tenant context or ambient request state leaks into cleanup.
- **Authorization**: `GET /api/tenant/lease` requires `AuthenticatedUser`; `POST /api/tenant/lease/extend` requires `TenantAdmin`; both verified in integration tests.
- **CSRF**: extend route is CSRF-protected through the existing cookie-authenticated CSRF boundary; integration test confirms rejection on missing token.
- **Rate limiting**: extend route has its own fixed-window budget partitioned by tenant+user identity; does not interfere with the pre-auth limiter or other authenticated routes.
- **Input trust**: extend handler accepts no business inputs from the request body; the endpoint signature has no body-bound parameters; integration test sends spoofed `tenantId` and `durationMinutes` that are correctly ignored.
- **Sensitive data**: purge-summary log emits only `tenant_id` and numeric deletion counts; no email addresses, credentials, or document content appear in log templates.
- **Concurrency**: extend and purge operations use `FOR UPDATE` row-level locking within transactions; cleanup re-validates expiry under lock to prevent TOCTOU races with concurrent lease extensions.

---

## Residual Risks

1. **Multi-tenant user membership (v1 scoping)**: cleanup deletes user rows by collecting IDs from the target tenant's memberships. If multi-tenant user membership were introduced without updating the cleanup SQL, users in multiple tenants could be prematurely deleted. This is a documented v1 simplification and does not apply under current v1 constraints.

2. **Manual launch verification pending**: VS Code and Visual Studio launch verification is not yet recorded. The author has correctly marked the task and PR artifact as active/draft until this evidence is captured.

3. **Audit retention mode suppression path untested**: the `PurgeTenantAudit` code path (suppressing purge-summary log) has no explicit test assertion. The conditional is trivial and the risk of regression is low.

4. **Exact `ExtensionMinutes` boundary case**: the unit test theory does not include a case at exactly `ExtensionMinutes` remaining. The `<=` comparison is correct and bracketed by adjacent cases, but the boundary itself is not pinned.

5. **Checkpoint validator sandbox dependency**: the checkpoint validation bundle requires unsandboxed execution for nested frontend builds and Docker access. This is an environment constraint, not a code issue, and is documented in both the task file and PR description.

---

## Required Fixes Before Merge

None. The checkpoint is ship-ready pending only the manual launch verification step that is already tracked as a checkpoint-closure prerequisite.

---

## Pre-Implementation Scope-Lock Review Resolution Log

All seven non-blocking findings from the scope-lock review were accepted and resolved before implementation:

- `NB-1` CSRF and rate-limiting attributes added to api-contract lease extend entry.
- `NB-2` 429 RATE_LIMITED with Retry-After added to lease extend failure semantics.
- `NB-3` Both lease-specific 409 error codes added to api-contract error section.
- `NB-4` Hard-delete scope in worker-jobs.md and cleanup-jobs-runbook.md updated to include binders, binder policies, and user memberships.
- `NB-5` Locked design explicitly states LeaseExtensionMinutes drives both eligibility threshold and extension amount.
- `NB-6` Authorization wording in demo-tenant-lease.md and FD-0005 updated to TenantAdmin.
- `NB-7` WorkerHostIntegrationTests now verifies cleanup service dependency resolution after the heartbeat-to-cleanup migration.
