# T-0026: CP11 Worker Runtime And Lease Lifecycle

## Status
done

## Type
feature

## Priority
P0

## Owner
agent

## Created
2026-04-10

## Updated
2026-04-14

## Checkpoint
CP11

## Phase
Phase 3

## Summary
Implement CP11 so tenant lease state becomes a real tenant-host API surface, expired-tenant cleanup becomes deterministic worker-managed runtime behavior, and the repo's task, PR, and canonical docs stay synchronized with the locked lease lifecycle design.

## Context
- CP10 shipped the binder/document domain, but the worker is still heartbeat-only and the tenant lease contract is not yet backed by runtime behavior.
- CP11 must stay bounded to worker runtime, tenant lease read/extend rules, cleanup orchestration, testing, and directly affected documentation only.
- Locked design decisions require server-time-only lease math, existing tenant roles/policies, hard delete only, explicit system-context cleanup, no lease history table, no new job framework, and no second lease-extension-window configuration key.

## Acceptance Criteria
- [x] Canonical contract, architecture, security, operations, feature-definition, testing, taskboard, repo-navigation, and delivery docs agree on `GET /api/tenant/lease`, `POST /api/tenant/lease/extend`, the locked `409` error codes, `429 RATE_LIMITED` plus `Retry-After`, `TenantAdmin` authorization for extend, and the full v1 hard-delete scope
- [x] `GET /api/tenant/lease` is implemented behind the existing tenant-host/auth boundary and returns only `expiresAt`, `secondsRemaining`, `extensionCount`, `maxExtensions`, and `canExtend`
- [x] `POST /api/tenant/lease/extend` is implemented as a tenant-host-only, `TenantAdmin`-only, CSRF-protected, route-scoped rate-limited endpoint that ignores client-supplied tenant or duration inputs
- [x] Lease extension uses `LeaseExtensionMinutes` for both eligibility threshold and extension amount, increments `lease_extension_count` exactly once on success, and returns stable `409` lease-specific ProblemDetails on rule conflicts
- [x] Expired-but-not-yet-purged tenant-host requests continue to fail through the existing tenancy boundary with `410 TENANT_EXPIRED`, and post-purge tenant hosts continue to fail with `404 TENANT_NOT_FOUND`
- [x] Worker runtime replaces the heartbeat loop with a scheduled cleanup loop that delegates one deterministic cleanup cycle to a separately invokable service and emits structured start/scan/purge/failure logging
- [x] Cleanup scans system-context expired tenants only, deletes tenant-owned rows in FK-safe order, honors `PAPERBINDER_AUDIT_RETENTION_MODE` with structured-logging-only behavior, and is idempotent and retry-safe
- [x] Unit, non-Docker, and Docker-backed tests cover lease math, cleanup-cycle correctness, worker-host dependency resolution, lease extend auth/CSRF/rate-limit rules, expired-before-purge `410`, post-purge `404`, cleanup idempotency, and no-touch active tenants
- [x] Checkpoint validation evidence is recorded in this task and the CP11 PR artifact, including any remaining manual-verification requirements

## Dependencies
- [T-0025](./T-0025-cp10-document-domain-and-immutable-document-rules.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Passed via [critic-review.md](../../95-delivery/pr/cp11-worker-runtime-and-lease-lifecycle/critic-review.md) on `2026-04-10`; no blocking findings remain.
- Pre-PR Critique: Scope-locked. Implementation and automated validation completed against the locked plan before final closeout.
- Post-Implementation Critique: Completed via [critic-review.md](../../95-delivery/pr/cp11-worker-runtime-and-lease-lifecycle/critic-review.md) on `2026-04-10`; ship-ready verdict, no blockers, and no required fixes before merge. The exact `LeaseExtensionMinutes` boundary coverage gap was closed in follow-up; `NB-POST-2` and `NB-POST-3` remain deferred as low-risk follow-ups because they depend on brittle structured-log suppression assertions or the documented v1 single-tenant-per-user invariant.
- Escalation Notes: Docker-backed validation and the canonical checkpoint-validation bundle required unsandboxed execution because the sandbox blocks Docker access and nested frontend build child-process creation.

## Current State
- CP11 implementation is in place across application, infrastructure, API, worker runtime, tests, validation tooling, and canonical docs.
- Automated validation is green: targeted CP11 tests, canonical build/test/docs/launch-profile scripts, and the full checkpoint validator all passed on `2026-04-10`.
- Post-implementation critic review is complete with a ship-ready verdict and no blocking findings; the exact `ExtensionMinutes` unit-test boundary is now covered directly.
- Manual VS Code and Visual Studio launch verification completed on `2026-04-14` and is recorded in the CP11 PR artifact, so the task is ready to close as `done`.

## Touch Points
- `src/PaperBinder.Api`
- `src/PaperBinder.Application`
- `src/PaperBinder.Infrastructure`
- `src/PaperBinder.Worker`
- `tests/PaperBinder.UnitTests`
- `tests/PaperBinder.IntegrationTests`
- `docs/10-product`
- `docs/15-feature-definition`
- `docs/20-architecture`
- `docs/30-security`
- `docs/40-contracts`
- `docs/55-execution`
- `docs/70-operations`
- `docs/80-testing`
- `docs/90-adr`
- `docs/95-delivery/pr`
- `docs/ai-index.md`
- `docs/repo-map.json`
- `scripts`

## Implementation Plan
- Slice 1 `RED -> GREEN -> REFACTOR`
  - Public interface: `GET /api/tenant/lease`
  - First failing tests: worker/host seam for controllable clock plus Docker-backed lease-read success
  - Green target: add lease read contracts, projection rules, Dapper read path, and tenant-host endpoint mapping with standard API headers
- Slice 2 `RED -> GREEN -> REFACTOR`
  - Public interface: `POST /api/tenant/lease/extend`
  - First failing test: Docker-backed tenant-admin extend success within the allowed window
  - Green target: add extension rules, persisted update path, stable success payload, and no-payload business semantics
- Slice 3 `RED -> GREEN -> REFACTOR`
  - Public interface: lease conflict semantics
  - First failing tests: too-early extend `409` and max-extension `409`
  - Green target: add stable `TENANT_LEASE_EXTENSION_WINDOW_NOT_OPEN` and `TENANT_LEASE_EXTENSION_LIMIT_REACHED` mapping
- Slice 4 `RED -> GREEN -> REFACTOR`
  - Public interface: lease extend security boundary
  - First failing tests: missing CSRF and non-`TenantAdmin` denial on `POST /api/tenant/lease/extend`
  - Green target: wire the endpoint through the existing tenant-host/auth/CSRF pipeline without ad-hoc bypasses
- Slice 5 `RED -> GREEN -> REFACTOR`
  - Public interface: lease extend rate limiting
  - First failing test: route-scoped `429 RATE_LIMITED` plus `Retry-After`
  - Green target: add the dedicated lease-extend limiter without throttling unrelated authenticated routes
- Slice 6 `RED -> GREEN -> REFACTOR`
  - Public interface: single cleanup cycle
  - First failing test: cleanup deletes expired tenant-owned rows and leaves active tenants untouched
  - Green target: add deterministic expired-tenant scan and FK-safe purge orchestration in explicit system context
- Slice 7 `RED -> GREEN -> REFACTOR`
  - Public interface: cleanup retry safety and host/runtime wiring
  - First failing tests: cleanup idempotency plus worker-host dependency-resolution smoke coverage after the heartbeat-to-cleanup migration
  - Green target: replace the heartbeat loop with scheduled cleanup delegation and structured worker logging

## Next Action
- None for `CP11`. Next planned checkpoint is `CP12`.

## Validation Evidence
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release` passed
- `dotnet build PaperBinder.sln -c Release --no-restore -p:SkipFrontendBuild=true -v minimal` passed when rebuilding after the post-implementation critic follow-up
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require` passed
  - unit suite: 111 passed, 0 failed
  - non-Docker integration suite: 25 passed, 0 failed
  - Docker-backed integration suite: 72 passed, 0 failed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` passed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` re-run after the post-implementation critic follow-up and closeout artifact updates passed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1` passed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require` passed when re-run unsandboxed
- `dotnet test tests/PaperBinder.UnitTests/PaperBinder.UnitTests.csproj -c Release --no-build --no-restore --filter FullyQualifiedName~TenantLeaseLifecycleTests --logger "console;verbosity=minimal"` passed
  - 9 passed, 0 failed
- `dotnet test tests/PaperBinder.IntegrationTests/PaperBinder.IntegrationTests.csproj -c Release --no-build --no-restore --filter FullyQualifiedName~WorkerHostIntegrationTests --logger "console;verbosity=minimal"` passed
  - 1 passed, 0 failed
- `dotnet test tests/PaperBinder.IntegrationTests/PaperBinder.IntegrationTests.csproj -c Release --no-build --no-restore --filter FullyQualifiedName~TenantLeaseLifecycleIntegrationTests --logger "console;verbosity=minimal"` passed
  - 8 passed, 0 failed
- Manual verification recorded in the CP11 PR artifact on `2026-04-14`
  - VS Code launch passed
  - Visual Studio launch passed

## Decision Notes
- `LeaseExtensionMinutes` remains the single configuration source for both extension eligibility threshold and extension amount.
- Cleanup will run in explicit system context and must not reuse tenant-scoped repositories with synthetic tenant context.
- CP11 remains within the existing `BackgroundService` baseline and does not introduce third-party scheduling infrastructure.
- Post-implementation critic findings are not all equal:
  - the exact `ExtensionMinutes` boundary case is now covered directly in `TenantLeaseLifecycleTests`
  - audit-retention-mode suppression coverage remains deferred because asserting structured-log absence adds more brittleness than value for a two-line guard
  - cleanup user-row deletion continues to rely on the documented v1 single-tenant-per-user invariant and must be revisited if multi-tenant membership is ever introduced

## Validation Plan
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
- targeted unit tests for lease rules and projection math
- targeted non-Docker integration tests for worker-host dependency resolution and controllable-clock seams
- targeted Docker-backed integration tests for lease reads, lease extension auth/CSRF/rate-limit/conflict behavior, expired-before-purge `410`, post-purge `404`, cleanup hard delete, cleanup idempotency, and no-touch active tenants
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require`
- manual VS Code and Visual Studio launch verification recorded in the PR artifact before checkpoint closure

## Outcome
- CP11 adds tenant lease read and extend runtime behavior, lease-specific ProblemDetails codes, and route-scoped lease-extension throttling without reopening the CP5 or CP8 boundary design.
- CP11 replaces the worker heartbeat with deterministic cleanup-cycle delegation, explicit system-context purge orchestration, and structured worker logging while keeping hard delete as the only v1 purge model.
- Post-implementation critic follow-up closed the only practical unit-coverage gap and left no blocking review items.
- CP11 closeout is complete: automated validation, post-implementation critic review, launch-profile validation, and manual VS Code plus Visual Studio verification are all recorded as passing.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
