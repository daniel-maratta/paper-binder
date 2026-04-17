# CP14 PR Description: Tenant-Host Frontend Flows
Status: Review Ready

## Checkpoint
- `CP14`: Tenant-Host Frontend Flows
- Task IDs: `T-0029`

## Summary
- Replaces the CP12 tenant-host placeholders with live `/app`, `/app/binders`, `/app/binders/:binderId`, `/app/documents/:documentId`, and `/app/users` flows inside the existing single SPA, using the shared browser API client and the existing tenant-host contracts rather than adding a new frontend architecture layer or dashboard endpoint.
- Adds tenant-shell lease ownership, countdown presentation, lease extension, logout-to-root-host behavior, tenant-host-safe ProblemDetails mapping, and tenant-admin binder-policy plus user-management flows without weakening the existing policy boundary.
- Broadens the isolated frontend browser gate so `scripts/run-root-host-e2e.ps1` now covers both root-host and tenant-host Playwright workflows in separate fresh runtimes, preserving `PB_ENV=Test` isolation and deterministic tenant-per-spec setup.
- Synchronizes the checkpoint taskboard, execution artifacts, canonical product and architecture docs, testing and operations docs, repo navigation metadata, and this PR artifact in the same change set.

## Scope Boundaries
- Included:
  - live tenant-host dashboard, binders list/detail, document detail, document create, binder-policy, tenant-user, lease, and logout browser flows
  - typed shared-client methods for tenant-host routes and centralized tenant-host error mapping
  - tenant-shell lease refresh ownership and safe root-host return after logout
  - isolated tenant-host browser E2E coverage for admin, forbidden, expired, and logout/login-cycle behavior
  - synchronized taskboard, delivery, testing, operations, product, execution, and navigation docs
- Not included:
  - CP15 tenant-local impersonation, audit UI, or session masquerade
  - document edit, replace, history, archive or unarchive UI, or a dedicated document-list route
  - password reset, profile editing, user deletion, or multi-role aggregation work
  - new backend endpoints, a BFF, SSR or framework-mode routing, a second SPA, or browser token storage

## Critic Review
- Scope-lock outcome: passed via [critic-review.md](./critic-review.md) on `2026-04-16`; no blocking findings remained before implementation.
- Post-implementation outcome: completed via [critic-review.md](./critic-review.md) on `2026-04-17`; ship-ready verdict, no blocking findings, and the one required low-severity documentation follow-up (`NB-POST-1`) is now closed in executor closeout.
- Scope-lock non-blocking findings addressed in this change set:
  - `NB-1`: tenant-host error handling and acceptance-criteria coverage now include the route-specific document and tenant-user validation and not-found codes required by CP14 flows.
  - `NB-2`: lease-extend UX is now documented as lease-eligibility-driven at the shell level, while API authorization remains authoritative and non-admin attempts fail safely.
  - `NB-3`: CP14-touched product docs now use `Email` terminology instead of residual `username` wording.
  - `NB-4`: the browser suite now uses tenant-per-spec ownership by default, with the same-tenant admin-to-restricted-user continuity covered deliberately inside one serial scenario.
  - `NB-5`: the inert mock challenge script remains deferred to a later hardening checkpoint and was not pulled into CP14.
- Post-implementation non-blocking findings:
  - `NB-POST-1` resolved in follow-up: removed the stale duplicate CP12 paragraph from `docs/20-architecture/frontend-app-route-map.md` and re-ran docs validation.
  - `NB-POST-2` deferred: the inert mock challenge script remains a later hardening concern and was not pulled into CP14 closeout.

## Risks And Rollout Notes
- Config or migration considerations:
  - adds tenant-host browser coverage and E2E helper utilities without changing backend contracts or the default local stack
  - tightens the E2E runtime configuration so lease timing and pre-auth rate limits remain deterministic during browser automation
  - no schema migration or API expansion was required
- Security or operational considerations:
  - tenant-host routes continue to use the shared API client as the only browser `/api/*` path
  - tenant identity remains host-derived and server-authoritative
  - logout continues to use the existing CSRF-protected tenant-host `POST /api/auth/logout` contract
  - `PB_ENV=Test` remains isolated to the dedicated browser runtime path
- Checkpoint closure considerations:
  - automated validation is complete and recorded below
  - post-implementation critic review is complete
  - the only required critic follow-up (`NB-POST-1`) is closed
  - manual VS Code and Visual Studio launch verification completed and passed on `2026-04-17`
  - CP14 closeout evidence is complete

## Validation Evidence
- `npm.cmd run build` from `src/PaperBinder.Web`: passed on `2026-04-17`
- `npm.cmd run test` from `src/PaperBinder.Web`: passed on `2026-04-17`
  - 9 test files, 30 tests, 0 failures
- `powershell -ExecutionPolicy Bypass -File .\scripts\run-root-host-e2e.ps1`: passed on `2026-04-17`
  - root-host Playwright suite: 3 passed
  - tenant-host Playwright suite: 2 passed
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`: passed on `2026-04-17`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`: passed on `2026-04-17`
  - frontend tests: 9 files, 30 tests, 0 failures
  - unit suite: 111 passed, 0 failed
  - non-Docker integration suite: 25 passed, 0 failed
  - Docker-backed integration suite: 72 passed, 0 failed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`: passed on `2026-04-17`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`: re-ran on `2026-04-17` after the post-review route-map cleanup and closeout artifact updates and passed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`: re-ran on `2026-04-17` after the manual-verification closeout artifact updates and passed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`: passed on `2026-04-17`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require`: passed on `2026-04-17`
  - checkpoint output still requires the separate browser gate and manual VS Code plus Visual Studio verification before closeout
- Static invariant checks: passed on `2026-04-17`
  - no direct `fetch(` under `src/PaperBinder.Web/src/app`
  - no `localStorage` or `sessionStorage` usage under `src/PaperBinder.Web/src/app`
  - tenant-host `redirectUrl` usage is limited to shared-client DTOs plus logout navigation wiring
  - tenant slug usage is limited to host-context resolution and display-only metadata
  - `PB_ENV=Test` remains isolated to the explicit browser E2E runtime path
- Manual verification:
  - VS Code launch: passed on `2026-04-17`
  - Visual Studio launch: passed on `2026-04-17`

## Author Notes For Critic
- Changed files:
  - Frontend tenant-host runtime and tests: `src/PaperBinder.Web/src/app/tenant-host.tsx`, `src/PaperBinder.Web/src/app/tenant-host-errors.ts`, `src/PaperBinder.Web/src/api/client.ts`, `src/PaperBinder.Web/src/test/test-helpers.ts`, `src/PaperBinder.Web/src/App.tsx`, route metadata, and the matching component and client tests
  - Browser E2E/runtime wiring: `src/PaperBinder.Web/e2e/helpers.ts`, `src/PaperBinder.Web/e2e/tenant-host.spec.ts`, `src/PaperBinder.Web/e2e/root-host.spec.ts`, `scripts/run-root-host-e2e.ps1`, and `docker-compose.e2e.yml`
  - Canonical docs and execution artifacts: `README.md`, the CP14 task/PR artifacts, product docs under `docs/10-product/`, architecture/testing/operations docs, `docs/55-execution/checkpoint-status.md`, `docs/ai-index.md`, and `docs/repo-map.json`
- Validation results:
  - frontend build and component tests passed
  - broadened browser E2E gate passed with 5 Playwright tests total
  - repo build/test/docs/launch-profile/checkpoint scripts passed
  - static invariant searches passed for shared-client-only transport, no browser storage, no client-built tenant redirects, and `PB_ENV=Test` isolation
- Intentional deviations:
  - none from the locked CP14 design
- Residual risks:
  - the inert mock challenge script carried forward from CP13 remains a deferred hardening item outside CP14 scope

## Follow-Ups
- Deferred non-blocking critic item:
  - `NB-POST-2`: move the inert mock challenge script out of the production image during a later hardening checkpoint.
