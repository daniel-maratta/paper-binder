# T-0029: CP14 Tenant-Host Frontend Flows

## Status
active

## Type
feature

## Priority
P0

## Owner
agent

## Created
2026-04-17

## Updated
2026-04-17

## Checkpoint
CP14

## Phase
Phase 4

## Summary
Implement CP14 so the CP12 tenant-host shell and CP13 onboarding handoff become a live authenticated product surface with dashboard, binders, document detail and create flows, tenant-admin user management and binder policy UI, lease countdown and extend behavior, real tenant-host logout, tenant-host-safe ProblemDetails handling, expanded browser E2E coverage, and synchronized checkpoint/task/PR/docs artifacts without pulling CP15 impersonation or wider hardening work forward.

## Context
- CP12 shipped the single-SPA tenant shell, shared client, shared primitives, and route skeletons, but tenant-host routes were still placeholder-oriented.
- CP13 shipped the root-host onboarding handoff, so the next bounded checkpoint is the authenticated tenant-host browser workflow.
- CP14 scope is locked by `docs/55-execution/execution-plan.md`, `docs/95-delivery/pr/cp14-tenant-host-frontend-flows/implementation-plan.md`, and `docs/95-delivery/pr/cp14-tenant-host-frontend-flows/critic-review.md`.
- The live backend contracts for lease, binders, documents, tenant users, binder policy, and logout already exist and remain authoritative for tenant identity, policy enforcement, CSRF, and error semantics.
- Tenant-host browser work must stay inside the existing SPA and shared API client; no BFF, no new backend aggregation endpoint, no browser token storage, and no client-built tenant redirects are allowed.

## Acceptance Criteria
- [x] Canonical product, architecture, engineering, testing, operations, execution, taskboard, repo-navigation, and delivery docs agree on live tenant-host route ownership, binder/document create locations, lease countdown and extend behavior, logout return behavior, browser-gate ownership, tenant-per-spec E2E setup, safe markdown posture, and `Email` terminology before handoff
- [x] The tenant host exposes live `/app`, `/app/binders`, `/app/binders/:binderId`, `/app/documents/:documentId`, and `/app/users` routes, and the CP12 tenant-host placeholders are removed
- [x] Tenant-host API calls use only the shared browser client and typed tenant-host methods; tenant-host route code does not call `fetch` directly
- [x] The tenant shell owns lease snapshot state, renders current expiry plus countdown from authoritative data, refreshes from the server response after extend, and routes logout back to the configured root-host `/login`
- [x] `/app/binders` lists visible binders and supports binder creation without adding a separate create-binder route
- [x] `/app/binders/:binderId` renders binder metadata and visible document summaries, supports document creation inside the binder route, and exposes binder-policy read/update behavior for `TenantAdmin`
- [x] `/app/documents/:documentId` renders read-only document content and metadata, including archived-state visibility, without adding edit or replace behavior
- [x] `/app/users` supports tenant-admin list, create, and role-change flows and preserves safe forbidden behavior for non-admin callers
- [x] Tenant-host ProblemDetails handling covers the shared and route-specific error codes required by CP14 flows, including safe handling for generic authorization failures that arrive as bare `403`
- [x] Component and browser tests cover tenant-shell state ownership, tenant-host route behavior, lease extend, logout, binder/document/user flows, binder policy, forbidden behavior, expired-tenant behavior, and the root-host plus tenant-host browser gate
- [x] Validation evidence and remaining manual checkpoint-closeout work are recorded in this task and the CP14 PR artifact

## Dependencies
- [T-0027](./T-0027-cp12-frontend-foundation-and-shared-ui-system.md)
- [T-0028](./T-0028-cp13-root-host-frontend-flows.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Passed via [critic-review.md](../../95-delivery/pr/cp14-tenant-host-frontend-flows/critic-review.md) on `2026-04-16`; implementation must honor the locked decisions and stay inside CP14.
- Pre-PR Critique: Scope-lock critique completed. Post-implementation critic review is still pending.
- Post-Implementation Critique: Pending author handoff and critic review on the implemented diff.
- Escalation Notes: Stop rather than widening scope if the tenant-host UI needs a new backend endpoint, a new sticky frontend dependency for markdown or state management, browser credential persistence, or any client-built tenant redirect or tenant-identity shortcut.

## Current State
- Implementation and automated validation are complete on the current branch across tenant-host routes, shared client, browser/runtime wiring, tests, and the synchronized canonical docs.
- The only remaining checkpoint-closeout work is the required manual VS Code plus Visual Studio launch verification evidence before CP14 can be marked `done`.

## Touch Points
- `src/PaperBinder.Web`
- `docker-compose.e2e.yml`
- `scripts`
- `docs/05-taskboard`
- `docs/10-product`
- `docs/20-architecture`
- `docs/50-engineering`
- `docs/55-execution`
- `docs/70-operations`
- `docs/80-testing`
- `docs/95-delivery/pr`
- `docs/ai-index.md`
- `docs/repo-map.json`

## Implementation Plan
- Slice 1 `RED -> GREEN -> REFACTOR`
  - Public interface: shared API client tenant-host methods plus tenant-shell bootstrap seam
  - First failing test: `Should_RenderLiveTenantDashboard_When_TenantBootstrapAndSummaryReadsSucceed`
  - Green target: add the minimal tenant-shell controller and `/app` route wiring using existing endpoints only
- Slice 2 `RED -> GREEN -> REFACTOR`
  - Public interface: binder list and binder create behavior
  - First failing test: `Should_ListVisibleBinders_AndCreateBinder_When_BinderRouteActionsSucceed`
  - Green target: add `/app/binders` list/create behavior with shared-client transport and safe mutation states
- Slice 3 `RED -> GREEN -> REFACTOR`
  - Public interface: binder detail and document create behavior
  - First failing test: `Should_RenderBinderDetail_AndCreateDocument_When_BinderReadAndDocumentCreateSucceed`
  - Green target: add live binder-detail reads plus the smallest in-route document create flow
- Slice 4 `RED -> GREEN -> REFACTOR`
  - Public interface: document detail rendering
  - First failing test: `Should_RenderReadOnlyDocument_When_DocumentDetailSucceeds`
  - Green target: add read-only document detail with safe archived-state visibility and reviewed markdown presentation
- Slice 5 `RED -> GREEN -> REFACTOR`
  - Public interface: tenant-user management and binder-policy behavior
  - First failing test: `Should_RenderTenantAdminUsersAndRoleChanges_When_AdminMutationsSucceed`
  - Green target: add `/app/users` admin flows plus binder-policy read/update behavior on binder detail
- Slice 6 `RED -> GREEN -> REFACTOR`
  - Public interface: tenant-host error mapping and shell actions
  - First failing test: `Should_RenderSafeTenantHostFailures_When_ReadsOrMutationsReturnProblemDetails`
  - Green target: centralize tenant-host-safe error mapping, lease extend, and logout behavior
- Slice 7 `RED -> GREEN -> REFACTOR`
  - Public interface: repo-native browser E2E gate
  - First failing test: `Should_ExerciseNormalAdminForbiddenExpiredAndLogoutTenantFlows_InBrowser`
  - Green target: add the smallest stable tenant-host Playwright coverage and broaden the existing frontend browser gate

## Next Action
- Record manual VS Code plus Visual Studio launch verification in the CP14 PR artifact after a human operator performs those checks, then move `T-0029` to `done` and mark `CP14` complete.

## Validation Evidence
- `npm.cmd run build` from `src/PaperBinder.Web` passed on `2026-04-17`
- `npm.cmd run test` from `src/PaperBinder.Web` passed on `2026-04-17`
  - 9 test files, 30 tests, 0 failures
- `powershell -ExecutionPolicy Bypass -File .\scripts\run-root-host-e2e.ps1` passed on `2026-04-17`
  - root-host Playwright suite: 3 passed
  - tenant-host Playwright suite: 2 passed
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release` passed on `2026-04-17`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require` passed on `2026-04-17`
  - frontend tests: 9 files, 30 tests, 0 failures
  - unit suite: 111 passed, 0 failed
  - non-Docker integration suite: 25 passed, 0 failed
  - Docker-backed integration suite: 72 passed, 0 failed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` passed on `2026-04-17`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1` passed on `2026-04-17`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require` passed on `2026-04-17`
  - checkpoint output correctly preserves the browser suite as a separate required gate and reminds that manual VS Code plus Visual Studio verification is still required
- Static invariant checks passed on `2026-04-17`
  - `rg -n "fetch\\(" src/PaperBinder.Web/src/app` returned no matches
  - `rg -n "localStorage|sessionStorage" src/PaperBinder.Web/src/app` returned no matches
  - `rg -n "redirectUrl" src/PaperBinder.Web/src/app/tenant-host.tsx src/PaperBinder.Web/src/api/client.ts` found only shared-client DTO fields plus tenant-host logout navigation wiring
  - `rg -n "tenantSlug" src/PaperBinder.Web/src/app/tenant-host.tsx src/PaperBinder.Web/src/app/host-context.ts src/PaperBinder.Web/src/api/client.ts` found only host-context resolution, provision/login DTOs, and display-only shell metadata
  - `rg -n "PB_ENV: Test|PB_ENV=Test|run-root-host-e2e|docker-compose.e2e|paperbinder-e2e" docker-compose.yml docker-compose.e2e.yml scripts docs src/PaperBinder.Api` confirmed `PB_ENV=Test` remains isolated to the browser E2E runtime path
- Manual verification:
  - VS Code launch verification: pending
  - Visual Studio launch verification: pending

## Decision Notes
- The existing `scripts/run-root-host-e2e.ps1` entrypoint is broadened into the CP14 frontend browser gate instead of adding a second browser script.
- Tenant-host document detail stays dependency-free and avoids raw HTML injection by rendering reviewed read-only text content without introducing a new markdown library.
- Lease state is owned at tenant-shell level and refreshes on bootstrap, route changes, focus or visibility regain, successful extend, and a coarse periodic refresh rather than noisy polling.

## Validation Plan
- `npm.cmd run build` from `src/PaperBinder.Web`
- `npm.cmd run test` from `src/PaperBinder.Web`
- `powershell -ExecutionPolicy Bypass -File .\scripts\run-root-host-e2e.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require`
- static review proving no direct `fetch` in tenant-host route code, no browser storage for auth or lease state, no client-built tenant redirects or client-side tenant identity, and `PB_ENV=Test` isolation to the explicit browser runtime only
- manual reviewer verification of tenant-host browser flows plus required VS Code and Visual Studio launch evidence recorded in the CP14 PR artifact before checkpoint closeout

## Outcome (Fill when done)
- CP14 tenant-host flows are implemented and review-ready with synchronized docs and green automated validation, but the checkpoint is not fully closed until the required manual launch verification is completed and recorded.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
