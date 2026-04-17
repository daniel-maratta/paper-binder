# CP15 PR Description: Tenant-Local Impersonation And Audit Safety
Status: Review Ready

## Checkpoint
- `CP15`: Tenant-Local Impersonation And Audit Safety
- Task IDs: `T-0030`

## Summary
- Adds tenant-host impersonation status, start, and stop behavior on `GET`, `POST`, and `DELETE` `/api/tenant/impersonation`, keeping tenant identity host-derived and server-authoritative while preventing cross-tenant or nested impersonation.
- Extends request-scoped tenant execution context so tenant-host authorization runs as the effective impersonated user while preserving original actor identity for stop behavior, structured logs, and audit-safe attribution.
- Adds the minimum durable audit substrate required by CP15: a tenant-scoped append-only impersonation audit table, start and stop event persistence, purge-retention compatibility, logout or expiry teardown, and explicit actor-vs-effective stamping on the existing tenant-host mutation seams.
- Adds tenant-shell impersonation signaling, `/app/users` start affordances, safe stop behavior, frontend and browser coverage, and synchronized taskboard, delivery, architecture, security, testing, operations, ADR, and navigation docs in the same change set.

## Scope Boundaries
- Included:
  - tenant-host-only impersonation status, start, and stop endpoints and browser flow
  - server-issued cookie-backed impersonation state with actor-vs-effective request context
  - durable tenant-scoped `ImpersonationStarted` and `ImpersonationEnded` persistence plus purge-retention compatibility
  - retrofit of binders, documents, lease extension, and tenant-user administration attribution fields to preserve `ActorUserId`, `EffectiveUserId`, and `IsImpersonated`
  - logout or cookie-expiry teardown, safe not-found or conflict behavior, active tenant-shell banner ownership, and `/app/users` start ownership
  - integration, frontend, browser, and closeout-doc coverage for the locked CP15 behavior
- Not included:
  - root-host, system-host, support, or cross-tenant impersonation
  - nested or replace-in-place impersonation stacks
  - generic audit browsing, search, export, or reporting UI
  - server-side session infrastructure, JWT or token auth, BFF routes, SSR, or a second SPA
  - password reset, profile editing, user deletion, document editing, archive UX, or broader CP16 hardening or refactoring

## Critic Review
- Scope-lock outcome: passed via [critic-review.md](./critic-review.md) on `2026-04-17`; no blocking findings remained after the same-day plan revision.
- Scope-lock blocker resolutions implemented in this change set:
  - durable append-only tenant-scoped impersonation audit persistence landed with migration, infrastructure seam, and ADR alignment
  - retrofit scope is deterministic across binders, documents, lease extension, and tenant-user administration with explicit `ActorUserId`, `EffectiveUserId`, and `IsImpersonated` fields
  - logout, cookie-expiry teardown, self-target rejection, DELETE CSRF enforcement, and purge-retention behavior are implemented and covered by focused tests
  - `/app/users` safe eligibility copy, concurrent-start serialization, and first-start effective authorization behavior follow the locked plan
- Post-implementation outcome: pending. This artifact includes software author notes and validation evidence for critic handoff; manual VS Code and Visual Studio launch verification are also still pending before checkpoint closeout.

## Risks And Rollout Notes
- Config or migration considerations:
  - adds `src/PaperBinder.Migrations/Migrations/202604170001_AddTenantImpersonationAuditEvents.cs` and the tenant-scoped `tenant_impersonation_audit_events` table
  - reuses the existing auth cookie rather than introducing a server-side session store or token model
  - no new third-party dependencies were added
- Security or operational considerations:
  - impersonation remains tenant-host-only, tenant-local, and server-issued; no client-built tenant identity or impersonation state is accepted
  - `POST` and `DELETE` `/api/tenant/impersonation` require the existing CSRF protections
  - logout while impersonating records `ImpersonationEnded` before the actor session is torn down
  - cookie-expiry closure is best-effort on the first tenant-host request that detects the expired impersonated ticket, which matches the observable server boundary of cookie expiry
- Checkpoint closure considerations:
  - automated validation is complete and recorded in this artifact
  - post-implementation critic review is not yet complete
  - manual VS Code and Visual Studio launch verification are not yet recorded, so `CP15` remains `active` in `docs/55-execution/checkpoint-status.md`

## Validation Evidence
- `npm.cmd run build` from `src/PaperBinder.Web`: passed on `2026-04-17`
- `npm.cmd run test -- --run` from `src/PaperBinder.Web`: passed on `2026-04-17`
  - 9 test files, 32 tests, 0 failures
- `powershell -ExecutionPolicy Bypass -File .\scripts\run-root-host-e2e.ps1`: passed on `2026-04-17`
  - root-host Playwright suite: 3 passed
  - tenant-host Playwright suite: 3 passed
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`: passed on `2026-04-17`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`: passed on `2026-04-17`
  - frontend tests: 9 files, 32 tests, 0 failures
  - unit suite: 111 passed, 0 failed
  - non-Docker integration suite: 25 passed, 0 failed
  - Docker-backed integration suite: 81 passed, 0 failed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`: passed on `2026-04-17`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`: re-ran on `2026-04-17` after the final CP15 closeout-artifact updates and passed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`: passed on `2026-04-17`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require`: passed on `2026-04-17`
  - checkpoint output still preserves the separate browser gate and manual VS Code plus Visual Studio verification requirement
- Static invariant checks: passed on `2026-04-17`
  - no direct `fetch(` usage in `src/PaperBinder.Web/src/app`, `src/PaperBinder.Web/src/test`, or `src/PaperBinder.Web/e2e`
  - no `localStorage` or `sessionStorage` usage in `src/PaperBinder.Web/src` or `src/PaperBinder.Web/e2e`
  - no client-controlled `X-Impersonate*` header or `impersonate=` query handling found; `paperbinder.impersonation.*` matches are only the server-issued claim constants in `src/PaperBinder.Api/PaperBinderImpersonationClaims.cs`
  - the locked `ActorUserId`, `EffectiveUserId`, and `IsImpersonated` fields are present in the four retrofitted mutation seams
  - the tenant-scoped audit table, append seam, cleanup delete, and migration wiring are present across API, infrastructure, and migration code

## Author Notes For Critic
- Changed files:
  - Backend impersonation flow and request context: `src/PaperBinder.Api/PaperBinderExecutionUserRequestContext.cs`, `src/PaperBinder.Api/PaperBinderImpersonationClaims.cs`, `src/PaperBinder.Api/PaperBinderImpersonationService.cs`, `src/PaperBinder.Api/PaperBinderImpersonationEndpoints.cs`, `src/PaperBinder.Api/TenantResolutionMiddleware.cs`, `src/PaperBinder.Api/PaperBinderAuthEndpoints.cs`, and related auth or endpoint modules
  - Audit substrate and mutation attribution: `src/PaperBinder.Application/Tenancy/TenantImpersonationAuditContracts.cs`, `src/PaperBinder.Infrastructure/Persistence/TenantImpersonationAuditEventStorageModel.cs`, `src/PaperBinder.Infrastructure/Tenancy/DapperTenantImpersonationAuditService.cs`, the four retrofitted Dapper mutation services, `src/PaperBinder.Infrastructure/Persistence/PaperBinderDbContext.cs`, and the CP15 migration plus snapshot
  - Frontend runtime and tests: `src/PaperBinder.Web/src/api/client.ts`, `src/PaperBinder.Web/src/app/tenant-host.tsx`, `src/PaperBinder.Web/src/app/tenant-host-errors.ts`, `src/PaperBinder.Web/src/test/test-helpers.ts`, the matching component or client tests, and `src/PaperBinder.Web/e2e/tenant-host.spec.ts`
  - Canonical docs and delivery artifacts: `README.md`, `docs/40-contracts/api-contract.md`, the CP15-touched architecture, security, testing, operations, product, ADR, execution, taskboard, and repo-navigation docs, plus `docs/05-taskboard/tasks/T-0030-cp15-tenant-local-impersonation-and-audit-safety.md`
- Validation results:
  - frontend build passed
  - frontend tests passed with 9 files and 32 tests
  - browser E2E gate passed with 6 Playwright tests total across root-host and tenant-host suites
  - repo build, full test, docs validation, launch-profile validation, and checkpoint validation scripts all passed
  - static invariant searches passed for shared-client-only impersonation transport, no browser storage, locked actor-vs-effective attribution, and the tenant-scoped audit substrate
- Intentional deviations:
  - none from the locked CP15 design
- Residual risks:
  - manual VS Code and Visual Studio launch verification are still outstanding
  - post-implementation critic review is still pending
  - cookie-expiry audit closure depends on the first tenant-host request that observes the expired impersonated ticket; there is no out-of-band session-expiry writer, by design
  - `scripts/run-root-host-e2e.ps1` remains the browser gate name even though it now covers impersonation flows; that naming cleanup remains deferred beyond CP15

## Follow-Ups
- Required before checkpoint closeout:
  - complete the post-implementation critic review for CP15
  - record manual VS Code and Visual Studio launch verification
- Deferred non-blocking items:
  - keep the browser-gate script rename or broader delivery cleanup deferred beyond CP15
  - consider `tenant-host.tsx` extraction in CP16 if the post-implementation review judges the file too large for comfortable maintenance
