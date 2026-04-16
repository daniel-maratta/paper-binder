# T-0027: CP12 Frontend Foundation And Shared UI System

## Status
done

## Type
feature

## Priority
P0

## Owner
agent

## Created
2026-04-15

## Updated
2026-04-16

## Checkpoint
CP12

## Phase
Phase 4

## Summary
Implement CP12 so the current CP11 placeholder SPA becomes a host-aware, testable frontend foundation with canonical route skeletons, a shared browser API client, a small shared UI primitive set, and repo-native frontend test execution without pulling CP13 or CP14 feature flows forward.

## Context
- CP11 left the browser surface intentionally skeletal even though the root-host auth/provisioning APIs and tenant-host product APIs are already live.
- CP12 must stay bounded to frontend foundation work: route skeleton, shells, browser client infrastructure, shared primitives, component and utility tests, and directly affected documentation only.
- Locked design decisions require one SPA in `src/PaperBinder.Web`, direct API calls with cookie auth, host-derived root versus tenant behavior, tenant-shell bootstrap via `GET /api/tenant/lease`, and no CP13 or CP14 form submissions, CRUD flows, or E2E automation.
- The repo currently has no frontend component-test runner, so CP12 must close that tooling decision through the canonical docs before broad implementation starts.

## Acceptance Criteria
- [x] Canonical product, architecture, engineering, testing, execution, taskboard, ADR, repo-navigation, and delivery docs agree on the CP12 route skeleton, primitive baseline, and chosen frontend component-test stack before broad implementation begins
- [x] `src/PaperBinder.Web` replaces the CP11 placeholder with host-aware root-shell and tenant-shell routing that matches the canonical route map for `/`, `/login`, `/about`, `/app`, `/app/binders`, `/app/binders/:binderId`, `/app/documents/:documentId`, and `/app/users`
- [x] Tenant-host auth awareness uses only the existing `GET /api/tenant/lease` backend seam and renders safe loading, forbidden, expired, not-found, and generic failure states without introducing a new bootstrap endpoint, BFF layer, or token flow
- [x] A single shared API client owns browser `/api/*` calls and centralizes `credentials: "include"`, `X-Api-Version`, CSRF header attachment for unsafe requests, correlation-id capture, ProblemDetails normalization, and `Retry-After` parsing
- [x] Shared UI primitives exist for Button, Card, Banner, form fields, tables, alerts, dialogs, and status badges with accessible baseline behavior aligned to the UI contract
- [x] Placeholder root-host and tenant-host pages exercise the shared shells and primitives without wiring provisioning/login submissions, binder/document reads, tenant-user CRUD, lease countdown, or lease extension actions
- [x] Frontend component and utility tests cover host-context detection, route skeleton rendering, shared API-client behavior, ProblemDetails normalization, tenant-shell safe states, and the shared primitives
- [x] `src/PaperBinder.Web/package.json`, `scripts/test.ps1`, and CI execute the frontend component-test command explicitly so frontend regressions fail repo-native validation
- [x] Validation evidence and any remaining manual checkpoint-closeout work are recorded in this task and the CP12 PR artifact

## Dependencies
- [T-0026](./T-0026-cp11-worker-runtime-and-lease-lifecycle.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Passed via [critic-review.md](../../95-delivery/pr/cp12-frontend-foundation-and-shared-ui-system/critic-review.md) on `2026-04-15`; no blocking findings remain.
- Pre-PR Critique: Scope-locked. The component-test tooling decision, stack-governance posture, and doc reconciliation landed before broad implementation.
- Post-Implementation Critique: Completed via [critic-review.md](../../95-delivery/pr/cp12-frontend-foundation-and-shared-ui-system/critic-review.md) on `2026-04-15`; ship-ready verdict, no blockers, and no required fixes before merge. Follow-up closed `NB-POST-1` and `NB-POST-2` with explicit `401` and invalid-host render coverage; `NB-POST-3` remains deferred because exact-name CSRF cookie matching would require a new frontend configuration contract or hardcoding a backend-overrideable cookie name.
- Escalation Notes: Frontend dependency installation succeeded after moving the npm cache into the workspace. The canonical checkpoint validator still required unsandboxed execution because its nested frontend build path hit the sandbox child-process restriction for Vite/esbuild.

## Current State
- CP12 implementation is in place across the SPA foundation, shared client layer, shared UI primitives, frontend tests, repo validation scripts, CI labeling, and the directly affected canonical docs.
- Post-implementation critic review is complete, and the follow-up change set now closes the remaining low-cost coverage gaps for tenant-shell `401` and invalid-host fallback rendering.
- Automated validation remains green, including the canonical checkpoint validation bundle and the `2026-04-16` re-run of frontend tests, repo-native tests, and docs validation.
- Manual VS Code and Visual Studio launch verification completed on `2026-04-16` and is now recorded in the PR artifact, so CP12 closeout is complete.

## Touch Points
- `src/PaperBinder.Web`
- `scripts/test.ps1`
- `.github/workflows/ci.yml`
- `docs/10-product`
- `docs/20-architecture`
- `docs/50-engineering`
- `docs/55-execution`
- `docs/80-testing`
- `docs/90-adr`
- `docs/95-delivery/pr`
- `docs/ai-index.md`
- `docs/repo-map.json`

## Implementation Plan
- Slice 1 `RED -> GREEN -> REFACTOR`
  - Public interface: host-context resolution
  - First failing test: `Should_ResolveRootOrTenantHostContext_When_LocationMatchesConfiguredDomains`
  - Green target: add one shared host-context parser that distinguishes root-host, tenant-host, loopback debug root-host, and invalid-host runtime behavior from the environment contract
- Slice 2 `RED -> GREEN -> REFACTOR`
  - Public interface: CP12 route skeleton and shell composition
  - First failing test: `Should_RenderCanonicalRouteSkeleton_ForCurrentHostContext`
  - Green target: add root-shell and tenant-shell route registries plus host-local catch-all behavior that matches the canonical route map
- Slice 3 `RED -> GREEN -> REFACTOR`
  - Public interface: shared browser API client
  - First failing test: `Should_SendCredentialsApiVersionAndCsrfHeader_When_ApiClientMakesRequest`
  - Green target: add one shared request path for `/api/*` that composes credentials, headers, CSRF, and JSON request behavior
- Slice 4 `RED -> GREEN -> REFACTOR`
  - Public interface: normalized client error model
  - First failing test: `Should_NormalizeProblemDetails_AndExposeErrorCodeCorrelationIdAndRetryAfter`
  - Green target: normalize ProblemDetails and unexpected failures into one stable client-error shape for later route reuse
- Slice 5 `RED -> GREEN -> REFACTOR`
  - Public interface: shared primitive library
  - First failing test: `Should_RenderAccessibleButtonCardBannerFormTableAlertDialogAndStatusBadgePrimitives`
  - Green target: add the CP12 primitive baseline plus minimal shell/layout wrappers
- Slice 6 `RED -> GREEN -> REFACTOR`
  - Public interface: tenant-shell bootstrap safety states
  - First failing test: `Should_RenderSafeTenantShellStates_When_BootstrapFailsWithoutFeatureData`
  - Green target: add lease-bootstrap loading, forbidden, expired, not-found, and generic failure states without adding feature data calls

## Next Action
- None for `CP12`. Next planned checkpoint is `CP13`.

## Validation Evidence
- `npm.cmd run test` from `src/PaperBinder.Web` passed when rerun unsandboxed on `2026-04-16`
  - 5 test files, 8 tests, 0 failures
- `npm.cmd run build` from `src/PaperBinder.Web` passed
- `npx.cmd tsc -b` from `src/PaperBinder.Web` passed during the TypeScript validation pass
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release` passed
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require` passed on `2026-04-16`
  - frontend component tests: 5 files, 8 tests, 0 failures
  - unit suite: 111 passed, 0 failed
  - non-Docker integration suite: 25 passed, 0 failed
  - Docker-backed integration suite: 72 passed, 0 failed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` passed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` re-run after the post-implementation critic follow-up and closeout artifact updates passed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1` passed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require` passed when rerun unsandboxed
- Static invariant checks passed:
  - `rg -n fetch src/PaperBinder.Web/src` shows browser `fetch` usage only in `src/PaperBinder.Web/src/api/client.ts` plus test doubles
  - `rg -n /api src/PaperBinder.Web/src` shows live `/api/*` route usage only through the shared client module plus documentation strings and tests
- Manual verification recorded in the CP12 PR artifact on `2026-04-16`
  - VS Code launch passed
  - Visual Studio launch passed

## Decision Notes
- CP12 will use a Vite-native component-test stack so the SPA foundation can be exercised without introducing browser E2E tooling before CP13.
- ADR-0009 records the chosen frontend component-test stack: Vitest, React Testing Library, jsdom, and `@testing-library/jest-dom`.
- Tenant-shell bootstrap remains bound to `GET /api/tenant/lease`; no additional session/bootstrap endpoint is permitted in CP12.
- Loopback process-debug hosts such as `localhost` are treated as root-host debug aliases only and never establish tenant context.
- Shared primitives remain generic and shell-level only; feature-specific composites remain deferred.
- `NB-POST-3` remains deferred: the backend auth cookie name is configuration-driven, so tightening the frontend CSRF lookup from suffix matching to exact-name matching would require either a new browser-visible configuration contract or hardcoding a backend-overrideable setting.

## Validation Plan
- `npm.cmd run build` from `src/PaperBinder.Web`
- the checked-in frontend component-test command from `src/PaperBinder.Web`
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require`
- targeted manual verification of compiled SPA deep-link behavior for `/login`, `/app`, and `/app/binders`
- manual VS Code and Visual Studio launch verification recorded in the PR artifact before checkpoint closeout

## Outcome (Fill when done)
- The placeholder-only CP11 SPA was replaced with host-aware root-shell and tenant-shell route foundations, a shared browser API client, and reusable shared primitives for the later frontend checkpoints.
- Frontend component coverage now exercises host-context resolution, route skeleton rendering, API-client headers and ProblemDetails normalization, primitive accessibility, tenant-shell `401`/`403`/`404`/`410` safe states, and invalid-host fallback rendering through a repo-native Vitest command.
- Repo validation now includes frontend component tests through `scripts/test.ps1`, and the canonical checkpoint validation bundle passes.
- CP12 closeout is complete: automated validation, post-implementation critic review, launch-profile validation, and manual VS Code plus Visual Studio verification are all recorded as passing.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
