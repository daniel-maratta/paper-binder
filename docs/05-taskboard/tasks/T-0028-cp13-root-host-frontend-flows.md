# T-0028: CP13 Root-Host Frontend Flows

## Status
done

## Type
feature

## Priority
P0

## Owner
agent

## Created
2026-04-16

## Updated
2026-04-16

## Checkpoint
CP13

## Phase
Phase 4

## Summary
Implement CP13 so the CP12 root-host placeholder shell becomes a live browser onboarding surface with provisioning, login, challenge handling, safe ProblemDetails UX, isolated root-host E2E coverage, and synchronized checkpoint/task/PR/docs artifacts without pulling CP14 tenant-host work forward.

## Context
- CP12 shipped the single-SPA foundation, shared API client, shared UI primitives, and route skeletons, but deliberately left root-host forms disabled.
- CP13 scope is locked by `docs/55-execution/execution-plan.md`, `docs/95-delivery/pr/cp13-root-host-frontend-flows/implementation-plan.md`, and `docs/95-delivery/pr/cp13-root-host-frontend-flows/critic-review.md`.
- The live backend contracts for `POST /api/provision` and `POST /api/auth/login` already exist and remain authoritative for redirects, challenge enforcement, error codes, and session establishment.
- Root-host challenge UX must stay a thin local adapter over the existing provider contract; no wrapper dependency, BFF, SSR layer, second SPA, or browser token storage is allowed.
- The remaining explicit `CHALLENGE_FAILED` test gap tracked in `T-0024` must close at the browser boundary as part of this checkpoint.

## Acceptance Criteria
- [x] Canonical product, architecture, engineering, testing, operations, execution, taskboard, repo-navigation, and delivery docs agree on root-host route ownership, `email` terminology, user-initiated provisioning handoff, challenge-wrapper accessibility duties, and the explicit CP13 E2E closeout rule before broad implementation begins
- [x] The root host exposes a live provisioning flow on `/` and a live login flow on `/login`, and the CP12 disabled placeholders are removed
- [x] Root-host API calls use only the shared browser client and typed provision/login methods; root-host route code does not call `fetch` directly
- [x] Successful provisioning shows one-time generated credentials exactly once in transient in-memory UI state and redirects only through an explicit user-initiated continue action that uses the server-provided `redirectUrl`
- [x] Successful login redirects using the server-provided `redirectUrl` without any client-constructed tenant URL logic
- [x] Root-host ProblemDetails handling renders safe messages for `CHALLENGE_REQUIRED`, `CHALLENGE_FAILED`, `RATE_LIMITED`, `INVALID_CREDENTIALS`, `TENANT_EXPIRED`, `TENANT_NAME_INVALID`, `TENANT_NAME_CONFLICT`, and unexpected/network failures
- [x] The challenge adapter requires a token before submit, resets after relevant failures, and keeps browser-owned wrapper markup aligned to the project accessibility baseline
- [x] Component and utility tests cover root-host submit behavior, redirect orchestration, ProblemDetails-to-UI mapping, and challenge reset behavior
- [x] A checked-in browser E2E suite covers provisioning success, login success, and representative deny paths including explicit `CHALLENGE_FAILED` coverage via an isolated explicit E2E runtime
- [x] Validation evidence and remaining manual checkpoint-closeout work are recorded in this task and the CP13 PR artifact

## Dependencies
- [T-0027](./T-0027-cp12-frontend-foundation-and-shared-ui-system.md)
- [T-0024](./T-0024-track-remaining-test-coverage-gaps.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Passed via [critic-review.md](../../95-delivery/pr/cp13-root-host-frontend-flows/critic-review.md) on `2026-04-16`; implementation must honor the locked decisions and complete the doc reconciliation pass before broad code changes.
- Pre-PR Critique: Completed. The post-implementation critic review recorded a ship-ready verdict with no blockers on `2026-04-16`.
- Post-Implementation Critique: Completed via [critic-review.md](../../95-delivery/pr/cp13-root-host-frontend-flows/critic-review.md) on `2026-04-16`; no blocking findings remain.
- Escalation Notes: Stop rather than widening scope if challenge integration requires a new dependency, if `PB_ENV=Test` cannot stay isolated to the explicit E2E runtime, or if redirect handling would require browser credential persistence or client-built tenant URLs.

## Current State
- Done. CP13 implementation is in place across the root-host routes, shared API client, challenge adapter, browser/runtime wiring, tests, ADR updates, and the directly affected canonical docs.
- Automated validation is green: frontend build/test, isolated root-host Playwright E2E, repo build/test scripts, docs validation, launch-profile validation, and checkpoint validation all passed on `2026-04-16`.
- Static invariant checks passed: root-host route code uses the shared API client only, generated credentials are not persisted in browser storage, redirects use only the server-provided `redirectUrl`, and `PB_ENV=Test` remains isolated to the explicit E2E runtime.
- The post-implementation critic review is complete and ship-ready with no blockers.
- Manual VS Code and Visual Studio launch verification were completed and passed on `2026-04-16`, so CP13 closeout evidence is now complete.

## Touch Points
- `src/PaperBinder.Web`
- `scripts`
- `.github/workflows/ci.yml`
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
  - Public interface: shared API client provision method plus root-host provision submit seam
  - First failing test: `Should_SubmitProvisionRequest_WithTenantNameAndChallengeToken_When_RootHostProvisionFormIsValid`
  - Green target: add typed provision/login client methods and the minimal root-host submit wiring
- Slice 2 `RED -> GREEN -> REFACTOR`
  - Public interface: provision success handoff state
  - First failing test: `Should_ShowProvisionedCredentialsOnce_AndRedirectUsingServerProvidedUrl_When_ProvisionSucceeds`
  - Green target: add transient in-memory credential display and explicit continue action
- Slice 3 `RED -> GREEN -> REFACTOR`
  - Public interface: root-host login submit/redirect flow
  - First failing test: `Should_SubmitLoginRequest_AndRedirectUsingServerProvidedUrl_When_RootHostLoginSucceeds`
  - Green target: add live `/login` submit behavior with the existing cookie-auth contract
- Slice 4 `RED -> GREEN -> REFACTOR`
  - Public interface: root-host error mapping and challenge lifecycle
  - First failing test: `Should_RenderSafeRootHostErrors_When_ProvisionOrLoginReturnsProblemDetails`
  - Green target: centralize display-safe root-host error mapping and retry/reset behavior
- Slice 5 `RED -> GREEN -> REFACTOR`
  - Public interface: root-host challenge lifecycle
  - First failing test: `Should_ResetChallengeState_When_PreAuthSubmissionFails_AndRetryIsAllowed`
  - Green target: keep provider-specific browser details behind one local seam
- Slice 6 `RED -> GREEN -> REFACTOR`
  - Public interface: root-host browser E2E command and isolated runtime
  - First failing test: `Should_ProvisionAndAutoLogin_FromRootHost_InBrowser_AgainstTheExplicitE2ERuntime`
  - Green target: add the smallest stable browser harness plus happy and deny paths, including `CHALLENGE_FAILED`

## Next Action
- None for `CP13`. Next planned checkpoint is `CP14`.

## Validation Evidence
- `npm.cmd run build` from `src/PaperBinder.Web` passed on `2026-04-16`
- `npm.cmd run test` from `src/PaperBinder.Web` passed on `2026-04-16`
  - 8 test files, 18 tests, 0 failures
- `powershell -ExecutionPolicy Bypass -File .\scripts\run-root-host-e2e.ps1` passed on `2026-04-16`
  - 3 Playwright tests passed covering provision success, login success, and browser deny paths for `CHALLENGE_FAILED`, `INVALID_CREDENTIALS`, and `RATE_LIMITED`
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release` passed on `2026-04-16`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require` passed on `2026-04-16`
  - frontend tests: 8 files, 18 tests, 0 failures
  - unit suite: 111 passed, 0 failed
  - non-Docker integration suite: 25 passed, 0 failed
  - Docker-backed integration suite: 72 passed, 0 failed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` passed on `2026-04-16`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1` passed on `2026-04-16`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require` passed on `2026-04-16`
- `npm.cmd run build` from `src/PaperBinder.Web` re-ran on `2026-04-16` after the post-review login redirect-guard cleanup and passed
- `npm.cmd run test` from `src/PaperBinder.Web` re-ran on `2026-04-16` after the post-review login redirect-guard cleanup and passed
  - 8 test files, 18 tests, 0 failures
- `powershell -ExecutionPolicy Bypass -File .\scripts\run-root-host-e2e.ps1` re-ran on `2026-04-16` after the post-review login redirect-guard cleanup and passed
  - 3 Playwright tests, 0 failures
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` re-ran on `2026-04-16` after the post-review closeout artifact updates and passed
- Static invariant checks passed on `2026-04-16`
  - `rg -n "fetch\\(|/api/" src/PaperBinder.Web/src`
  - `rg -n "localStorage|sessionStorage|document\\.cookie|tenantSlug|redirectUrl" src/PaperBinder.Web/src/app src/PaperBinder.Web/src/api`
  - `rg -n "PB_ENV: Test|PB_ENV=Test|PAPERBINDER_PUBLIC_ROOT_URL|docker-compose.e2e|run-root-host-e2e|paperbinder-e2e" docker-compose.yml docker-compose.e2e.yml scripts docs src/PaperBinder.Api`
- Manual verification recorded on `2026-04-16`
  - VS Code launch passed
  - Visual Studio launch passed

## Decision Notes
- The explicit CP13 E2E closeout rule will be recorded unambiguously in the runbook and validation scripts; ambiguous manual wording is not acceptable.
- Root-host success flows must use the absolute server-provided `redirectUrl`; client-built tenant URLs remain out of bounds.
- Generated provisioning credentials remain transient in-memory UI state only and must never be written to browser storage, cookies, query params, or any new backend store.

## Validation Plan
- `npm.cmd run build` from `src/PaperBinder.Web`
- `npm.cmd run test` from `src/PaperBinder.Web`
- the checked-in root-host E2E command from `src/PaperBinder.Web` against the isolated explicit E2E runtime
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require`
- static review proving no direct `fetch` in root-host route code, no credential persistence, no client-built tenant redirects, and `PB_ENV=Test` isolation to the E2E runtime only
- manual reviewer verification of root-host provision/login flows plus required VS Code and Visual Studio launch evidence recorded in the CP13 PR artifact before checkpoint closeout

## Outcome (Fill when done)
- Root-host provisioning and login flows are live in the browser with shared-client transport, safe error UX, isolated browser E2E coverage, synchronized docs/taskboard artifacts, and checkpoint validation evidence.
- Post-implementation critic review is complete with a ship-ready verdict and no blockers.
- CP13 closeout is complete: automated validation, launch-profile validation, manual VS Code plus Visual Studio verification, and synchronized delivery/taskboard artifacts are all recorded as passing.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
