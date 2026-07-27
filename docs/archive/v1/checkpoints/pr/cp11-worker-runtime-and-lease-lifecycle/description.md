# CP11 PR Description: Worker Runtime And Lease Lifecycle
Status: Review Ready

## Checkpoint
- `CP11`: Worker Runtime And Lease Lifecycle
- Task IDs: `T-0026`

## Summary
- Adds the real tenant lease runtime surface: `GET /api/tenant/lease`, `POST /api/tenant/lease/extend`, lease-specific ProblemDetails mappings, and route-scoped lease-extension rate limiting inside the existing tenant-host/auth/CSRF boundary.
- Replaces the worker heartbeat loop with a scheduled cleanup runtime that delegates one deterministic cleanup cycle to explicit system-context cleanup services with structured worker logging and audit-retention-mode handling.
- Adds deterministic unit, non-Docker, and Docker-backed coverage for lease rules, cleanup lifecycle behavior, worker-host dependency resolution, and expired-before-purge versus post-purge request semantics.
- Synchronizes canonical product, architecture, security, contracts, testing, taskboard, checkpoint, repo-navigation, and delivery artifacts with the locked CP11 design.

## Scope Boundaries
- Included:
  - worker runtime scheduling, cleanup-cycle delegation, and structured worker logging
  - tenant lease read and extend services plus tenant-host API endpoints
  - lease-specific ProblemDetails codes and lease-extend route-scoped rate limiting
  - deterministic expired-tenant cleanup orchestration and audit-retention-mode structured logging behavior
  - controllable-clock seam plus unit, non-Docker, and Docker-backed coverage for CP11 behavior
  - synchronized taskboard, checkpoint, navigation, and PR artifacts
- Not included:
  - frontend lease countdown/banner/browser flows
  - soft delete, grace periods, recovery flows, billing, or plan abstractions
  - generalized job orchestration, queues, or third-party background-job dependencies
  - durable audit tables, audit-reporting UI, or analytics retention
  - binder/document feature expansion beyond deleting tenant-owned rows during purge
  - broader authenticated-route throttling or observability hardening outside the CP11 surface

## Critic Review
- Scope-lock outcome: passed via [critic-review.md](./critic-review.md) on `2026-04-10`; no blocking findings remain.
- Post-implementation outcome: completed via [critic-review.md](./critic-review.md) on `2026-04-10`; ship-ready verdict, no blockers, and no required fixes before merge.
- Findings summary: seven non-blocking scope-lock findings were accepted and folded into the implementation plan before execution. Post-implementation review added one narrow unit-coverage observation at the exact `LeaseExtensionMinutes` boundary, which is now covered directly; the remaining low-risk findings are deferred follow-ups, not blockers.
- Locked design points implemented here:
  - `GET /api/tenant/lease` stays `AuthenticatedUser`; `POST /api/tenant/lease/extend` stays `TenantAdmin`
  - `LeaseExtensionMinutes` drives both eligibility threshold and extension amount; no second extension-window configuration key is introduced
  - expired-but-not-yet-purged tenant-host requests continue to fail through the existing tenancy boundary with `410 TENANT_EXPIRED`
  - cleanup runs in explicit system context and does not use synthetic tenant context to purge cross-tenant data
  - hard delete remains the only v1 purge model

## Risks And Rollout Notes
- Config or migration considerations:
  - no new third-party dependencies are introduced
  - no schema migration was required
- Security or operational considerations:
  - lease extend remains CSRF-protected and rate-limited with `Retry-After` on `429`
  - retained purge-summary logging must stay minimal and non-sensitive
  - cleanup ordering must remain FK-safe and retry-safe
- Checkpoint closure considerations:
  - automated validation passed on `2026-04-10`
  - manual VS Code and Visual Studio launch verification completed on `2026-04-14`
  - CP11 closeout evidence is complete

## Validation Evidence
- Commands run:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
  - `dotnet build PaperBinder.sln -c Release --no-restore -p:SkipFrontendBuild=true -v minimal`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` (re-run after the post-implementation critic follow-up and closeout artifact updates)
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require`
  - `dotnet test tests/PaperBinder.UnitTests/PaperBinder.UnitTests.csproj -c Release --no-build --no-restore --filter FullyQualifiedName~TenantLeaseLifecycleTests --logger "console;verbosity=minimal"`
- Tests added/updated:
  - `TenantLeaseLifecycleTests`: 9 passed, 0 failed
  - `WorkerHostIntegrationTests`: 1 passed, 0 failed
  - `TenantLeaseLifecycleIntegrationTests`: 8 passed, 0 failed
  - full scripted suite: 111 unit, 25 non-Docker integration, 72 Docker-backed integration, all passing
- Launch profile verification:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1` passed
- Manual verification:
  - VS Code launch passed on `2026-04-14`
  - Visual Studio launch passed on `2026-04-14`

## Author Notes For Critic
- Changed files:
  - Application: `src/PaperBinder.Application/Tenancy/TenantLeaseContracts.cs`, `TenantLeaseRules.cs`, `ITenantLeaseService.cs`, `ITenantLeaseCleanupService.cs`
  - Infrastructure: `src/PaperBinder.Infrastructure/Tenancy/DapperTenantLeaseService.cs`, `DapperTenantLeaseCleanupService.cs`, `src/PaperBinder.Infrastructure/Persistence/PaperBinderPersistenceServiceCollectionExtensions.cs`
  - API: `src/PaperBinder.Api/PaperBinderTenantLeaseRoutes.cs`, `PaperBinderTenantLeaseEndpoints.cs`, `PaperBinderTenantLeaseProblemMapping.cs`, `PaperBinderPreAuthProtectionExtensions.cs`, `PaperBinderErrorCodes.cs`, `Program.Partial.cs`
  - Worker: `src/PaperBinder.Worker/PaperBinderWorkerHostBuilder.cs`, `Program.cs`, `Worker.cs`
  - Tests: `tests/PaperBinder.UnitTests/TenantLeaseLifecycleTests.cs`, `tests/PaperBinder.IntegrationTests/TenantLeaseLifecycleIntegrationTests.cs`, `WorkerHostIntegrationTests.cs`, `TenantResolutionIntegrationTests.cs`, `TestSystemClock.cs`, and the integration test project file
  - Validation and docs: `scripts/validate-checkpoint.ps1`, the CP11 task/PR artifacts, checkpoint ledger, canonical lease/cleanup docs, `docs/ai-index.md`, and `docs/repo-map.json`
- Validation results:
  - `dotnet build PaperBinder.sln -c Release --no-restore -p:SkipFrontendBuild=true`: passed
  - targeted CP11 unit and integration coverage passed
  - targeted lease boundary unit test re-run: `9/9` passed
  - canonical build, test, docs, launch-profile, and checkpoint validation scripts passed on `2026-04-10`
  - `scripts/validate-docs.ps1` re-run after the post-implementation critic follow-up and closeout artifact updates: passed
  - the checkpoint validator required unsandboxed execution because its nested frontend build and Docker-backed checks were sandbox-limited in this environment
- Intentional deviations:
  - none from the locked CP11 design
- Residual risks:
  - the checkpoint-validation path depends on unsandboxed execution in environments where nested frontend build child processes or Docker access are sandbox-restricted

## Follow-Ups
- Deferred non-blocking critic findings:
  - `NB-POST-2`: no explicit audit-retention-mode suppression test; deferred because asserting structured-log absence would add brittle test coupling for a trivial conditional guard
  - `NB-POST-3`: cleanup deletion of tenant-owned user rows still relies on the documented v1 single-tenant-per-user invariant and must be revisited if multi-tenant membership is ever introduced
