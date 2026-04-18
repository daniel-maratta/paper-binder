# T-0030: CP15 Tenant-Local Impersonation And Audit Safety

## Status
done

## Type
feature

## Priority
P0

## Owner
agent

## Created
2026-04-17

## Updated
2026-04-18

## Checkpoint
CP15

## Phase
Phase 4

## Summary
Implement CP15 so a `TenantAdmin` can safely view as a same-tenant user from the tenant host, the browser clearly signals active impersonation, the request pipeline preserves both actor and effective identity, durable tenant-scoped audit events record impersonation start and stop, and the task, PR, and canonical docs stay synchronized without widening into generic audit UI, cross-tenant impersonation, or CP16 hardening work.

## Context
- CP15 scope is locked by `docs/55-execution/execution-plan.md`, `docs/95-delivery/pr/cp15-tenant-local-impersonation-and-audit-safety/implementation-plan.md`, and `docs/95-delivery/pr/cp15-tenant-local-impersonation-and-audit-safety/critic-review.md`.
- CP14 shipped the authenticated tenant-host SPA and `/app/users` administration surface, so CP15 can add a bounded tenant-local impersonation flow on top of the existing shared client and cookie-auth baseline.
- The locked design requires tenant-host-only impersonation, server-issued impersonation state, effective-role authorization during impersonation, durable append-only tenant-scoped audit evidence, and explicit actor-vs-effective identity preservation across the retrofitted mutation seams.
- Checkpoint closeout is complete: the post-implementation critic review is ship-ready, and manual VS Code plus Visual Studio launch verification is now recorded with the challenge-limited scope noted explicitly.

## Acceptance Criteria
- [x] Canonical product, architecture, security, testing, operations, execution, taskboard, repo-navigation, ADR, and delivery docs agree on CP15 endpoint ownership, actor-vs-effective identity semantics, durable audit expectations, purge-retention behavior, tenant-shell banner ownership, and `/app/users` start-affordance ownership
- [x] `GET`, `POST`, and `DELETE` `/api/tenant/impersonation` are live on the tenant host with same-tenant target validation, safe not-found behavior, self-target rejection, nested-session conflict handling, and CSRF enforcement on both unsafe mutations
- [x] Impersonation state is server-issued and cookie-backed only; no client-controlled impersonation headers, query params, local storage, or session storage participate in impersonation state
- [x] Request-scoped execution context preserves `ActorUserId`, `EffectiveUserId`, `IsImpersonated`, and impersonation session identity, and normal tenant-host authorization evaluates the effective impersonated membership or role
- [x] `DELETE /api/tenant/impersonation` remains available while the effective user is downgraded, and logout or cookie expiry closes the impersonation session with audit-safe teardown behavior
- [x] Durable tenant-scoped impersonation audit events are recorded in append-only storage, participate correctly in both purge-retention modes, and are not written by system-execution paths
- [x] Existing tenant-host mutation seams for binders, documents, lease extension, and tenant-user administration preserve `ActorUserId`, `EffectiveUserId`, and `IsImpersonated` explicitly in their structured log or audit output
- [x] `/app/users` exposes the safe start affordance, the tenant shell owns active impersonation signaling plus stop behavior, and stopping impersonation restores the actor's same-route experience without a root-host login round-trip
- [x] Backend integration tests, frontend tests, browser E2E coverage, and checkpoint validation evidence cover same-tenant success, safe denial paths, stop behavior, logout or expiry teardown, purge-retention behavior, and browser banner behavior
- [x] Post-implementation critic review is recorded with a ship-ready verdict and no remaining blocking findings
- [x] Manual VS Code plus Visual Studio launch verification is recorded before checkpoint closeout

## Dependencies
- [T-0029](./T-0029-cp14-tenant-host-frontend-flows.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Passed via [critic-review.md](../../95-delivery/pr/cp15-tenant-local-impersonation-and-audit-safety/critic-review.md) on `2026-04-17`; implementation must honor the locked decisions and stay inside CP15.
- Pre-PR Critique: Scope-lock critique completed. The blocking findings were resolved in the implementation plan before code changes broadened.
- Post-Implementation Critique: Completed via [critic-review.md](../../95-delivery/pr/cp15-tenant-local-impersonation-and-audit-safety/critic-review.md) on `2026-04-17`; ship-ready verdict and no blocking findings remain.
- Escalation Notes: Stop rather than widening scope if CP15 appears to need root-host or cross-tenant impersonation, a server-side session store, token auth or JWTs, generic audit browsing or export, or broader CP16 hardening and refactoring work.

## Current State
- CP15 implementation is in place across API, infrastructure, migrations, frontend runtime, browser coverage, and the synchronized canonical docs.
- Automated validation is complete and the post-implementation critic review is recorded in the CP15 PR artifact.
- Manual VS Code and Visual Studio launch verification completed and passed on `2026-04-18`. Because the challenge flow is not yet implemented, manual editor verification was limited to successful startup and the initial public pages rather than authenticated or impersonation flows.

## Touch Points
- `src/PaperBinder.Api`
- `src/PaperBinder.Application/Tenancy`
- `src/PaperBinder.Infrastructure/Binders`
- `src/PaperBinder.Infrastructure/Documents`
- `src/PaperBinder.Infrastructure/Persistence`
- `src/PaperBinder.Infrastructure/Tenancy`
- `src/PaperBinder.Migrations/Migrations`
- `src/PaperBinder.Web`
- `tests/PaperBinder.IntegrationTests`
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

## Implementation Plan
- Slice 1 `RED -> GREEN -> REFACTOR`
  - Public interface: tenant-host impersonation status/start/stop endpoints plus request-scoped actor-or-effective execution context
  - First failing behavior: same-tenant start succeeds and immediately applies effective authorization
  - Green target: add the minimal cookie-backed impersonation session issuance and effective-membership resolution without introducing client-controlled state
- Slice 2 `RED -> GREEN -> REFACTOR`
  - Public interface: durable tenant-scoped impersonation audit-event persistence
  - First failing behavior: `ImpersonationStarted` and `ImpersonationEnded` are stored durably and purge with the tenant under both retention modes
  - Green target: add the audit table, migration, append seam, and purge participation without widening into generic audit browsing
- Slice 3 `RED -> GREEN -> REFACTOR`
  - Public interface: logout or expiry teardown plus retrofitted mutation attribution
  - First failing behavior: stop and teardown remain audit-safe while the effective role is downgraded, and existing mutation seams keep actor vs. effective attribution explicit
  - Green target: update logout, expiry detection, and the four locked mutation seams with the smallest cohesive actor-or-effective metadata surface
- Slice 4 `RED -> GREEN -> REFACTOR`
  - Public interface: shared browser client impersonation methods, tenant-shell banner, and `/app/users` start affordance
  - First failing behavior: the shell renders active impersonation state and `/app/users` can start and stop the flow through the shared client only
  - Green target: add the minimal status bootstrap, safe affordance copy, and same-route stop recovery without adding new routes or browser storage
- Slice 5 `RED -> GREEN -> REFACTOR`
  - Public interface: repo-native integration, component, and browser validation surfaces
  - First failing behavior: admin starts same-tenant impersonation, sees the restricted experience, and returns to the admin session in browser coverage
  - Green target: add focused integration probes, client or shell tests, and the smallest stable Playwright flow for CP15 reviewer evidence

## Next Action
- None for `CP15`. Next planned checkpoint is `CP16`.

## Validation Evidence
- `npm.cmd run build` from `src/PaperBinder.Web` passed on `2026-04-17`
- `npm.cmd run test -- --run` from `src/PaperBinder.Web` passed on `2026-04-17`
  - 9 test files, 32 tests, 0 failures
- `powershell -ExecutionPolicy Bypass -File .\scripts\run-root-host-e2e.ps1` passed on `2026-04-17`
  - root-host Playwright suite: 3 passed
  - tenant-host Playwright suite: 3 passed
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release` passed on `2026-04-17`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require` passed on `2026-04-17`
  - frontend tests: 9 files, 32 tests, 0 failures
  - unit suite: 111 passed, 0 failed
  - non-Docker integration suite: 25 passed, 0 failed
  - Docker-backed integration suite: 81 passed, 0 failed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` passed on `2026-04-17`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` re-ran on `2026-04-17` after the final CP15 closeout-artifact updates and passed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` re-ran on `2026-04-18` after the critic-closeout status reconciliation and passed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1` passed on `2026-04-17`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require` passed on `2026-04-17`
  - checkpoint output still requires the separate browser gate and manual VS Code plus Visual Studio verification before closeout
- Manual verification:
  - VS Code launch verification: passed on `2026-04-18`
  - Visual Studio launch verification: passed on `2026-04-18`
  - Scope note: because the challenge flow is not yet implemented, manual editor verification was limited to successful startup and the initial public pages; deeper interactive browser coverage remains the responsibility of the automated validation already recorded above
- Static invariant checks passed on `2026-04-17`
  - `rg -n "fetch\\(" src/PaperBinder.Web/src/app src/PaperBinder.Web/src/test src/PaperBinder.Web/e2e` returned no matches
  - `rg -n "localStorage|sessionStorage" src/PaperBinder.Web/src src/PaperBinder.Web/e2e` returned no matches
  - `rg -n "X-Impersonate|impersonate=|paperbinder\\.impersonation" src tests` found only the server-issued impersonation claim constants in `src/PaperBinder.Api/PaperBinderImpersonationClaims.cs`
  - `rg -n "ActorUserId|EffectiveUserId|IsImpersonated" src/PaperBinder.Infrastructure/Binders/DapperBinderService.cs src/PaperBinder.Infrastructure/Documents/DapperDocumentService.cs src/PaperBinder.Infrastructure/Tenancy/DapperTenantLeaseService.cs src/PaperBinder.Infrastructure/Tenancy/DapperTenantUserAdministrationService.cs` confirmed the locked attribution fields across the four retrofitted mutation seams
  - `rg -n "tenant_impersonation_audit_events|TenantImpersonationAuditEvent|TryAppendAsync" src/PaperBinder.Api src/PaperBinder.Infrastructure src/PaperBinder.Migrations` confirmed the tenant-scoped audit table, append seam, cleanup delete, and migration wiring

## Decision Notes
- CP15 reuses the existing cookie-auth model and stores impersonation state in trusted server-issued claims rather than introducing a session store, token auth, or client-controlled impersonation state.
- The durable audit substrate is the tenant-scoped append-only `tenant_impersonation_audit_events` table, which stores start and stop events only and participates in tenant purge behavior under both supported retention modes.
- The tenant shell owns active impersonation state and stop behavior; `/app/users` owns the start affordance and uses safe `Not eligible` copy rather than exposing detailed ineligibility reasons.
- Tenant-host route reads refresh when the effective impersonated user changes so stopping impersonation restores the actor's authorized same-route view without requiring a manual navigation round-trip.

## Validation Plan
- `npm.cmd run build` from `src/PaperBinder.Web`
- `npm.cmd run test -- --run` from `src/PaperBinder.Web`
- `powershell -ExecutionPolicy Bypass -File .\scripts\run-root-host-e2e.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require`
- static review proving no client-controlled impersonation transport, no browser storage usage, no direct tenant-host impersonation `fetch` calls outside the shared client, tenant-scoped audit-event writes and purge behavior, and actor-vs-effective attribution across the retrofitted seams
- manual reviewer verification of the impersonation flow plus required VS Code and Visual Studio launch evidence before checkpoint closeout

## Outcome (Fill when done)
- CP15 tenant-local impersonation is implemented across the API, audit substrate, tenant-host runtime, and synchronized docs with focused integration, frontend, and browser coverage.
- Automated validation is complete and recorded in this task plus the CP15 PR artifact, including the separate browser gate and the scripted checkpoint closeout path.
- CP15 closeout is complete: automated validation, post-implementation critic review, launch-profile validation, and manual VS Code plus Visual Studio launch verification are all recorded, with the manual verification scope limited to successful startup and the initial public pages because the challenge flow is not yet implemented.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
