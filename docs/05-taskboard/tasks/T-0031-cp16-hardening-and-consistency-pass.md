# T-0031: CP16 Hardening And Consistency Pass

## Status
done

## Type
hardening

## Priority
P0

## Owner
agent

## Created
2026-04-18

## Updated
2026-04-19

## Checkpoint
CP16

## Phase
Phase 5

## Summary
Implement CP16 so PaperBinder closes the remaining hardening and consistency gaps before release: authenticated tenant-host mutations are rate-limited safely, redirect/XSS/browser-runtime claims match the shipped implementation, the minimum OpenTelemetry baseline is real, the browser E2E runtime is isolated from the default build, the tenant-host shell is decomposed into smaller modules, and the task/PR/docs stay synchronized without widening into CP17 release packaging.

## Context
- CP16 scope is locked by `docs/55-execution/execution-plan.md`, `docs/95-delivery/pr/cp16-hardening-and-consistency-pass/implementation-plan.md`, and `docs/95-delivery/pr/cp16-hardening-and-consistency-pass/critic-review.md`.
- CP13 through CP15 carried forward three explicit CP16 hardening items: the browser-gate naming drift, the E2E-only challenge fixture leaking into the default public tree, and the oversized `tenant-host.tsx` shell module.
- CP16 also turns the observability docs into a real runtime contract by landing `ADR-0011`, wiring OpenTelemetry for API/worker/representative database paths, and locking the low-cardinality metric set.
- Scripted validation is complete, the post-implementation critic review is recorded with a ship-ready verdict, and manual VS Code plus Visual Studio launch verification completed and passed on `2026-04-19`.

## Acceptance Criteria
- [x] Canonical execution, architecture, security, testing, operations, engineering, ADR, taskboard, and delivery docs agree on the authenticated tenant-host mutation limiter, redirect trust boundary, observability baseline, browser-gate rename, E2E fixture isolation, and the shipped safe-source document-rendering posture
- [x] Authenticated unsafe tenant-host `/api/*` mutations are protected by the canonical fixed-window limiter sourced from `PAPERBINDER_RATE_LIMIT_AUTHENTICATED_PER_MINUTE`, keyed by `(tenant_id, effective_user_id)`, and exempting `POST /api/auth/logout` plus `DELETE /api/tenant/impersonation`
- [x] Root-host provision/login and tenant-host logout redirect construction remain anchored to trusted `PAPERBINDER_PUBLIC_ROOT_URL`, and tenant-host logout now returns a server-provided `redirectUrl`
- [x] The minimum observability baseline is live across API, worker, and representative database execution paths, with console export in Development/Test and optional OTLP export via `PAPERBINDER_OTEL_OTLP_ENDPOINT`
- [x] Structured logs and metrics stay within the locked field names, metric names, and low-cardinality label set
- [x] The E2E-only challenge fixture no longer publishes into the default frontend build or committed app `wwwroot`, `run-browser-e2e.ps1` is the canonical browser gate, and `PB_ENV=Test` remains isolated to the browser runtime
- [x] The tenant-host browser surface is decomposed into the locked route and shell modules, `tenant-host.tsx` is under the 400-line ceiling, and the shared-client boundary remains intact
- [x] Static grep checks prove zero direct `fetch(` usage, zero `localStorage` / `sessionStorage` usage, and zero custom impersonation or tenant header usage across the extracted tenant-host modules
- [x] Scripted validation passes for build, tests, browser E2E, docs validation, launch-profile validation, and checkpoint validation
- [x] Post-implementation critic review is recorded in the CP16 PR artifact
- [x] Manual VS Code plus Visual Studio launch verification is recorded before checkpoint closeout

## Dependencies
- [T-0030](./T-0030-cp15-tenant-local-impersonation-and-audit-safety.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Passed via [critic-review.md](../../95-delivery/pr/cp16-hardening-and-consistency-pass/critic-review.md) on `2026-04-18`; implementation must honor the locked CP16 decisions.
- Pre-PR Critique: Completed; the same-day plan revision resolved every blocker and non-blocker before implementation broadened.
- Post-Implementation Critique: Completed via [critic-review.md](../../95-delivery/pr/cp16-hardening-and-consistency-pass/critic-review.md) on `2026-04-18`; ship-ready verdict, no blocking findings, and no required fixes before merge.
- Escalation Notes: Stop rather than widening into CP17 release packaging, CSP/header middleware, generalized audit tooling, a session store, JWT/token auth, distributed rate limiting, or broader reviewer-flow redesign.

## Current State
- CP16 implementation is in place across API, infrastructure, worker, frontend, scripts, and synchronized docs.
- Scripted validation passed on `2026-04-18`, including the separate browser gate and the full checkpoint bundle, and the post-implementation critic review is now recorded in the CP16 PR artifact.
- Manual VS Code and Visual Studio launch verification completed and passed on `2026-04-19`.
- Checkpoint closeout is complete; `CP16` is ready to remain recorded as `done` while `CP17` stays queued.

## Touch Points
- `src/PaperBinder.Api`
- `src/PaperBinder.Infrastructure`
- `src/PaperBinder.Worker`
- `src/PaperBinder.Web`
- `scripts`
- `docker-compose.yml`
- `docker-compose.e2e.yml`
- `tests/PaperBinder.IntegrationTests`
- `docs/00-intent`
- `docs/20-architecture`
- `docs/30-security`
- `docs/40-contracts`
- `docs/50-engineering`
- `docs/55-execution`
- `docs/70-operations`
- `docs/80-testing`
- `docs/90-adr`
- `docs/95-delivery/pr`
- `docs/ai-index.md`
- `docs/repo-map.json`

## Implementation Plan
- Slice 1 `RED -> GREEN -> REFACTOR`
  - Public seam: authenticated tenant-host mutation limiter plus CSRF-before-limiter precedence
  - Green target: canonical fixed-window limiter keyed by `(tenant_id, effective_user_id)` with safe exempt routes
- Slice 2 `RED -> GREEN -> REFACTOR`
  - Public seam: request/worker/database trace correlation and the locked metric vocabulary
  - Green target: minimal OpenTelemetry wiring plus PaperBinder-owned trace and metric constants
- Slice 3 `RED -> GREEN -> REFACTOR`
  - Public seam: redirect trust boundary, logout contract, and structured denial/rate-limit logging
  - Green target: keep redirect construction anchored to `PAPERBINDER_PUBLIC_ROOT_URL` and preserve teardown behavior
- Slice 4 `RED -> GREEN -> REFACTOR`
  - Public seam: isolated browser runtime wiring and fixture ownership
  - Green target: move the mock challenge fixture out of the default build, rename the browser gate, and add non-leakage guards
- Slice 5 `RED -> GREEN -> REFACTOR`
  - Public seam: behavior-preserving tenant-host extraction
  - Green target: split the locked shell and route modules without adding new browser-boundary violations

## Next Action
- None for `CP16`. Next planned checkpoint is `CP17`.

## Validation Evidence
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`: passed on `2026-04-18`
  - frontend production build passed
  - solution build passed with 0 warnings and 0 errors
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`: passed on `2026-04-18`
  - frontend tests: 9 files, 32 tests, 0 failures
  - unit suite: 111 passed, 0 failed
  - non-Docker integration suite: 27 passed, 0 failed
  - Docker-backed integration suite: 88 passed, 0 failed
- `powershell -ExecutionPolicy Bypass -File .\scripts\run-browser-e2e.ps1`: passed on `2026-04-18`
  - root-host Playwright suite: 3 passed
  - tenant-host Playwright suite: 3 passed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`: passed on `2026-04-18`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`: re-ran on `2026-04-18` after the final CP16 closeout-artifact reconciliation and passed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`: re-ran on `2026-04-19` after recording the manual launch-verification closeout and passed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`: passed on `2026-04-18`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require`: passed on `2026-04-18`
  - checkpoint bundle re-ran build, full tests, docs validation, launch-profile validation, and the browser-runtime isolation guards
- Manual verification:
  - VS Code launch verification: passed on `2026-04-19`
  - Visual Studio launch verification: passed on `2026-04-19`
  - Scope note: the canonical reviewer launch surfaces opened and started successfully in both editors, satisfying the checkpoint-closeout requirement that cannot be replaced by the scripted validation bundle
- Static invariant checks passed on `2026-04-18`
  - `tenant-host.tsx` is 57 lines after extraction
  - `rg -n "fetch\\("` returned no matches across the extracted tenant-host modules
  - `rg -n "localStorage|sessionStorage"` returned no matches across the extracted tenant-host modules
  - `rg -n "X-Impersonate-|X-Tenant|X-Tenant-Id|tenant-identifier"` returned no matches across the extracted tenant-host modules
  - `rg -n "e2e-turnstile" src/PaperBinder.Web/dist src/PaperBinder.Api/wwwroot` returned no matches

## Decision Notes
- CP16 keeps the existing cookie-auth, tenant-resolution, Dapper runtime, and tenant-local impersonation model intact while tightening the surrounding runtime boundary.
- `ADR-0011` locks the OpenTelemetry dependency choice, console default exporter, optional OTLP endpoint, and the minimum metric vocabulary rather than leaving observability aspirational.
- `scripts/run-browser-e2e.ps1` is now the canonical browser gate, while `scripts/run-root-host-e2e.ps1` remains only as a historical compatibility shim so archived docs still validate.
- The E2E compose path now selects its database host port through `PAPERBINDER_DB_HOST_PORT` so the isolated browser runtime does not inherit the default local-stack database binding.

## Validation Plan
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
- `powershell -ExecutionPolicy Bypass -File .\scripts\run-browser-e2e.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require`
- static review for tenant-host boundary greps, fixture absence, and the post-refactor `tenant-host.tsx` line ceiling
- post-implementation critic review and manual VS Code plus Visual Studio launch verification before checkpoint closeout

## Outcome (Fill when done)
- CP16 runtime hardening, observability, browser-runtime hygiene, and tenant-host extraction are implemented and validated.
- The post-implementation critic review is recorded with a ship-ready verdict and no required fixes before merge.
- CP16 closeout is complete: automated validation, post-implementation critic review, launch-profile validation, and manual VS Code plus Visual Studio launch verification are all recorded as passing.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
