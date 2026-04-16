# CP12 PR Description: Frontend Foundation And Shared UI System
Status: Review Ready

## Checkpoint
- `CP12`: Frontend Foundation And Shared UI System
- Task IDs: `T-0027`

## Summary
- Replaces the CP11 placeholder SPA with host-aware root-shell and tenant-shell route skeletons that match the canonical CP12 route map, including safe host-local catch-all behavior and tenant-shell bootstrap through the existing `GET /api/tenant/lease` seam.
- Adds one shared browser API client for `/api/*` transport so credentials, `X-Api-Version`, CSRF headers, correlation ids, ProblemDetails normalization, and `Retry-After` handling are centralized before real browser flows land.
- Adds the CP12 shared primitive baseline for Button, Card, Banner, form fields, tables, alerts, dialogs, and status badges, then exercises those primitives in root-host and tenant-host placeholder views without pulling CP13 or CP14 feature behavior forward.
- Adds repo-native frontend component and utility coverage with Vitest plus React Testing Library on jsdom, wires that command into `scripts/test.ps1`, and synchronizes the checkpoint, ADR, testing, engineering, and delivery docs in the same change set.

## Scope Boundaries
- Included:
  - host-aware SPA shell and canonical route skeleton work
  - shared API-client and ProblemDetails normalization work
  - shared UI primitive baseline and component-test wiring
  - synchronized taskboard, execution, ADR, navigation, and PR artifacts
- Not included:
  - root-host provisioning or login form submission flows
  - tenant-host binder, document, tenant-user, or lease CRUD/browser workflows
  - E2E automation beyond CP12 foundation validation

## Critic Review
- Scope-lock outcome: passed via [critic-review.md](./critic-review.md) on `2026-04-15`; no blocking findings remain.
- Post-implementation outcome: completed via [critic-review.md](./critic-review.md) on `2026-04-15`; ship-ready verdict, no blockers, and no required fixes before merge.
- Findings summary:
  - `NB-POST-1` closed in follow-up: tenant-shell `401` now has explicit component coverage.
  - `NB-POST-2` closed in follow-up: invalid-host fallback rendering is now exercised through `AppRouter`.
  - `NB-POST-3` remains deferred: exact-name CSRF cookie matching would require surfacing the backend-configurable auth cookie name to the browser or hardcoding a backend-overrideable value.
  - `NB-POST-4` is informational only: the CI label change is cosmetic and accurate.

## Risks And Rollout Notes
- Config or migration considerations:
  - CP12 adds frontend component-test dependencies (`vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`) plus `@radix-ui/react-dialog` and the matching ADR/documentation updates
  - no schema or backend configuration changes were required
- Security or operational considerations:
  - the shared API client must remain the only browser `/api/*` transport path
  - tenant identity must stay host-derived and server-authoritative
  - loopback process-debug hosts are intentionally treated as root-host aliases only; tenant context is never inferred from loopback paths
- Checkpoint closure considerations:
  - automated checkpoint validation is green
  - post-implementation critic review is complete
  - manual VS Code and Visual Studio launch verification completed on `2026-04-16`
  - CP12 closeout evidence is complete
  - the canonical checkpoint validator required unsandboxed execution in this environment because its nested frontend build path hit the sandbox Vite/esbuild child-process restriction

## Validation Evidence
- `npm.cmd run test` from `src/PaperBinder.Web`: passed when rerun unsandboxed on `2026-04-16`
  - 5 test files, 8 tests, 0 failures
- `npm.cmd run build` from `src/PaperBinder.Web`: passed
- `npx.cmd tsc -b` from `src/PaperBinder.Web`: passed
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`: passed
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`: passed on `2026-04-16`
  - frontend component tests: 5 files, 8 tests, 0 failures
  - unit suite: 111 passed, 0 failed
  - non-Docker integration suite: 25 passed, 0 failed
  - Docker-backed integration suite: 72 passed, 0 failed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`: passed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`: re-run after the post-implementation critic follow-up and closeout artifact updates passed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`: passed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require`: passed when rerun unsandboxed
- Manual verification:
  - VS Code launch passed on `2026-04-16`
  - Visual Studio launch passed on `2026-04-16`

## Author Notes For Critic
- Changed files:
  - Frontend runtime and routing: `src/PaperBinder.Web/src/App.tsx`, `src/PaperBinder.Web/src/environment.ts`, `src/PaperBinder.Web/src/app/host-context.ts`, `route-registry.ts`, `root-host.tsx`, `tenant-host.tsx`, `invalid-host.tsx`, `src/PaperBinder.Web/src/styles.css`
  - Shared browser client and primitives: `src/PaperBinder.Web/src/api/client.ts`, `src/PaperBinder.Web/src/lib/cn.ts`, and the new `src/PaperBinder.Web/src/components/ui/` slice
  - Frontend tests and tooling: `src/PaperBinder.Web/src/test/setup.ts`, `src/PaperBinder.Web/src/test/test-helpers.ts`, the new `*.test.ts(x)` files under `src/PaperBinder.Web/src/`, `src/PaperBinder.Web/package.json`, `package-lock.json`, and `vite.config.ts`
  - Repo validation and docs: `scripts/test.ps1`, `.github/workflows/ci.yml`, the CP12 task/PR artifacts, ADR-0009, checkpoint ledger, canonical frontend/testing docs, `docs/ai-index.md`, and `docs/repo-map.json`
- Validation results:
  - frontend build passed
  - frontend component follow-up coverage for tenant-shell `401` and invalid-host rendering passed
  - canonical repo tests passed again on `2026-04-16`
  - `scripts/validate-docs.ps1` re-run after the post-implementation critic follow-up and closeout artifact updates passed
  - canonical build, launch-profile, and checkpoint validation scripts remain passing from the prior closeout run
  - shared API-client exclusivity static search passed
- Intentional deviations:
  - none from the locked CP12 design
- Residual risks:
  - the checkpoint-validation bundle required unsandboxed execution in this environment because nested Vite/esbuild child processes hit the sandbox restriction even though the standalone build and test scripts passed

## Follow-Ups
- Deferred non-blocking critic finding:
  - `NB-POST-3`: keep the CSRF cookie lookup on the current suffix convention until PaperBinder either exposes the configurable auth cookie name to the frontend contract or deliberately locks that backend setting.
