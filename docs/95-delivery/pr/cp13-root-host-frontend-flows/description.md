# CP13 PR Description: Root-Host Frontend Flows
Status: Review Ready

## Checkpoint
- `CP13`: Root-Host Frontend Flows
- Task IDs: `T-0028`, `T-0024`

## Summary
- Replaces the CP12 root-host placeholders with live `/` provisioning and `/login` login flows inside the existing single SPA, using the shared browser API client and a thin challenge adapter rather than a new frontend stack.
- Adds root-host-safe ProblemDetails mapping, required-field guards, challenge reset behavior, and the explicit one-time provisioning handoff that shows generated credentials once before a user-initiated continue action navigates to the server-provided `redirectUrl`.
- Adds the isolated CP13 browser E2E runtime with `docker-compose.e2e.yml`, `scripts/run-root-host-e2e.ps1`, Playwright coverage for happy and deny paths, and the dedicated mock challenge script needed to keep `PB_ENV=Test` out of the default reviewer/local stack.
- Synchronizes the checkpoint taskboard, test-gap tracker, README/runbook/testing docs, ADR-0010, repo navigation metadata, and this PR artifact in the same change set.

## Scope Boundaries
- Included:
  - live root-host provision and login browser flows
  - typed shared-client methods for `/api/provision` and `/api/auth/login`
  - transient in-memory provisioning credential handoff plus server-authoritative redirect handling
  - root-host-safe challenge/error UX, component coverage, and isolated browser E2E coverage
  - synchronized taskboard, delivery, ADR, testing, operations, and navigation docs
- Not included:
  - tenant-host dashboard, binders, documents, users, lease countdown/extend, logout polish, or other CP14 browser work
  - a second SPA, SSR/framework-mode routing, BFF/server loaders, or browser token storage
  - password recovery, remembered-tenant helpers, saved credentials, or any client-built tenant redirect path

## Critic Review
- Scope-lock outcome: passed via [critic-review.md](./critic-review.md) on `2026-04-16`; no blocking findings remained before implementation.
- Post-implementation outcome: completed via [critic-review.md](./critic-review.md) on `2026-04-16`; ship-ready verdict, no blocking findings, and no required fixes before merge.
- Scope-lock non-blocking findings addressed in this change set:
  - `NB-1`: CP13-owned docs now use `Email` consistently for the root-host login field.
  - `NB-2`: the separate CP13 browser gate is now documented consistently in the runbook, README, taskboard, and checkpoint validator output.
  - `NB-3`: the challenge adapter provides the browser-owned label, helper, error, and visible state seam without adding a wrapper dependency.
  - `NB-4`: the E2E runtime stays isolated behind `docker-compose.e2e.yml` plus `scripts/run-root-host-e2e.ps1` and does not modify the default reviewer/local startup path.
  - `NB-5`: root-host route metadata now describes live onboarding routes instead of CP12 placeholders.
- Post-implementation non-blocking findings:
  - `NB-POST-1` deferred: the mock challenge script still ships in the production image because it lives in the then-current frontend public tree. The file is inert under default configuration, the critic marked it low-severity and acceptable for CP13, and moving it out of the production bundle belongs in a later hardening pass rather than this checkpoint closeout.
  - `NB-POST-2` resolved in this follow-up: the login flow's manual continue action now re-validates `redirect.redirectUrl` before calling `navigator()`, matching the provision flow's defensive guard.
  - `NB-POST-3` deferred: residual `username` wording remains in older pre-CP13 product docs outside the CP13 scope-lock set. The critic marked this informational and pre-existing; reconciling those broader docs is better handled in a later documentation-hardening pass instead of widening CP13.

## Risks And Rollout Notes
- Config or migration considerations:
  - adds `@playwright/test` plus the isolated CP13 E2E runtime artifacts
  - exposes build-time challenge site-key/script-url configuration for the SPA and Docker image build
  - no schema migration or backend contract expansion was required
- Security or operational considerations:
  - root-host routes continue to use the shared API client as the only browser `/api/*` path
  - generated provisioning credentials remain transient in-memory UI state only
  - redirect navigation uses only the server-provided absolute `redirectUrl`
  - `PB_ENV=Test` remains isolated to the dedicated E2E runtime path
- Checkpoint closure considerations:
  - automated validation is green, including the separate CP13 browser gate
  - `T-0024` is closed by the new browser-level `CHALLENGE_FAILED` coverage
  - post-implementation critic review is complete
  - manual VS Code and Visual Studio launch verification completed and passed on `2026-04-16`
  - CP13 closeout evidence is complete
  - the build/test/checkpoint scripts required unsandboxed execution in this environment because nested Vite/esbuild and Docker access were sandbox-restricted

## Validation Evidence
- `npm.cmd run build` from `src/PaperBinder.Web`: passed on `2026-04-16`
- `npm.cmd run test` from `src/PaperBinder.Web`: passed on `2026-04-16`
  - 8 test files, 18 tests, 0 failures
- `powershell -ExecutionPolicy Bypass -File .\scripts\run-root-host-e2e.ps1`: passed on `2026-04-16`
  - 3 Playwright tests passed covering provision success, login success, and deny behavior for `CHALLENGE_FAILED`, `INVALID_CREDENTIALS`, and `RATE_LIMITED`
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`: passed on `2026-04-16`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`: passed on `2026-04-16`
  - frontend tests: 8 files, 18 tests, 0 failures
  - unit suite: 111 passed, 0 failed
  - non-Docker integration suite: 25 passed, 0 failed
  - Docker-backed integration suite: 72 passed, 0 failed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`: passed on `2026-04-16`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`: passed on `2026-04-16`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require`: passed on `2026-04-16`
  - checkpoint output now explicitly states that checkpoint-specific browser E2E suites remain separate required gates
- `npm.cmd run build` from `src/PaperBinder.Web`: re-ran on `2026-04-16` after the post-review login redirect-guard cleanup and passed
- `npm.cmd run test` from `src/PaperBinder.Web`: re-ran on `2026-04-16` after the post-review login redirect-guard cleanup and passed
  - 8 test files, 18 tests, 0 failures
- `powershell -ExecutionPolicy Bypass -File .\scripts\run-root-host-e2e.ps1`: re-ran on `2026-04-16` after the post-review login redirect-guard cleanup and passed
  - 3 Playwright tests, 0 failures
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`: re-ran on `2026-04-16` after the post-review closeout artifact updates and passed
- Static invariant checks: passed on `2026-04-16`
  - shared-client exclusivity search
  - no credential persistence search
  - no client-built redirect search
  - `PB_ENV=Test` runtime-isolation search
- Manual verification:
  - VS Code launch passed on `2026-04-16`
  - Visual Studio launch passed on `2026-04-16`

## Author Notes For Critic
- Changed files:
  - Frontend runtime and root-host UX: `src/PaperBinder.Web/src/App.tsx`, `src/PaperBinder.Web/src/app/root-host.tsx`, `src/PaperBinder.Web/src/app/challenge-widget.tsx`, `src/PaperBinder.Web/src/app/root-host-errors.ts`, `src/PaperBinder.Web/src/app/route-registry.ts`, `src/PaperBinder.Web/src/environment.ts`, `src/PaperBinder.Web/vite.config.ts`, `src/PaperBinder.Web/src/vite-env.d.ts`, and `src/PaperBinder.Web/src/test/test-helpers.ts`
  - Shared client and component coverage: `src/PaperBinder.Web/src/api/client.ts`, `src/PaperBinder.Web/src/api/client.test.ts`, `src/PaperBinder.Web/src/app/root-host.test.tsx`, `src/PaperBinder.Web/src/app/root-host-errors.test.ts`, `src/PaperBinder.Web/src/app/app-router.test.tsx`, `src/PaperBinder.Web/src/app/tenant-shell.test.tsx`, and `src/PaperBinder.Web/src/components/ui/button.tsx`
  - Browser E2E/runtime wiring: `src/PaperBinder.Web/playwright.config.ts`, `src/PaperBinder.Web/e2e/root-host.spec.ts`, the historical mock challenge fixture in the former frontend public tree, `src/PaperBinder.Web/package.json`, `package-lock.json`, `docker-compose.e2e.yml`, `docker-compose.yml`, `src/PaperBinder.Api/Dockerfile`, and `scripts/run-root-host-e2e.ps1`
  - Documentation and execution artifacts: `README.md`, `docs/80-testing/test-strategy.md`, `docs/70-operations/runbook-local.md`, `docs/90-adr/ADR-0010-playwright-root-host-e2e-runtime.md`, `docs/05-taskboard/tasks/T-0024-track-remaining-test-coverage-gaps.md`, `docs/05-taskboard/tasks/T-0028-cp13-root-host-frontend-flows.md`, `docs/05-taskboard/work-queue.md`, `docs/55-execution/checkpoint-status.md`, `docs/ai-index.md`, `docs/repo-map.json`, and the CP13 delivery artifacts
- Validation results:
  - frontend build, component tests, isolated browser E2E, repo build/test/docs/launch-profile/checkpoint scripts, and static invariant searches all passed on `2026-04-16`
  - the post-review login redirect-guard cleanup revalidated the frontend unit suite and isolated browser E2E suite successfully
  - the root-host browser suite closed the remaining `CHALLENGE_FAILED` coverage gap tracked in `T-0024`
- Intentional deviations:
  - `NB-POST-1` deferred intentionally: the inert mock challenge script remains in the production image for CP13 to avoid widening checkpoint scope during closeout
  - `NB-POST-3` deferred intentionally: pre-existing `username` wording in older product docs remains outside the CP13-owned reconciliation set
- Residual risks:
  - the canonical scripted validation path needed unsandboxed execution in this environment because sandboxed Vite/esbuild child processes and Docker access were restricted

## Follow-Ups
- Deferred non-blocking critic items:
  - `NB-POST-1`: move the inert mock challenge script out of the production bundle during a later hardening pass
  - `NB-POST-3`: reconcile pre-CP13 `username` terminology drift in older product docs during a later documentation-hardening pass
