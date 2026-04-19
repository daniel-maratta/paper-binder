# CP16 PR Description: Hardening And Consistency Pass
Status: Review Ready

## Checkpoint
- `CP16`: Hardening And Consistency Pass
- Task IDs: `T-0031`

## Summary
- Adds the canonical authenticated tenant-host mutation limiter, keeps CSRF-before-limiter precedence intact, and preserves safe teardown behavior by exempting `POST /api/auth/logout` and `DELETE /api/tenant/impersonation`.
- Makes the observability baseline real by landing `ADR-0011`, wiring OpenTelemetry for API, worker, and representative database paths, standardizing structured logging fields, and locking the minimum low-cardinality metric set.
- Fixes the carried-forward browser/runtime hygiene gaps by moving the E2E-only challenge fixture out of the default build, renaming the browser gate to `scripts/run-browser-e2e.ps1`, adding isolation guards, and fixing the E2E Compose port-selection bug.
- Refactors the tenant-host browser surface into the locked route and shell modules, updates the logout contract to return a server-provided root-host `redirectUrl`, and synchronizes the affected taskboard, execution, security, operations, testing, ADR, and navigation docs in the same change set.

## Scope Boundaries
- Included:
  - authenticated unsafe tenant-host `/api/*` mutation limiting keyed by `(tenant_id, effective_user_id)`
  - redirect trust-boundary hardening for provision/login/logout
  - minimal OpenTelemetry instrumentation plus the locked metric vocabulary
  - E2E fixture isolation, browser-gate rename, and `PB_ENV=Test` non-leakage guards
  - behavior-preserving tenant-host extraction into the locked module list
  - targeted backend, frontend, worker, script, and documentation fixes needed to satisfy the CP16 merge gate
- Not included:
  - CP17 release packaging, changelog freeze, reviewer snapshot curation, or rollback-finalization work
  - new CSP or browser-security-header middleware
  - password reset, profile editing, user deletion, document editing, archive UX expansion, search, uploads, or audit browsing/export
  - JWT/token auth, a session store, SSR/BFF work, distributed rate limiting, or generalized audit tooling

## Critic Review
- Scope-lock outcome: passed via [critic-review.md](./critic-review.md) on `2026-04-18`; no blocking findings remained after the same-day plan revision.
- Scope-lock resolutions implemented in this change set:
  - one canonical authenticated tenant-host mutation limiter with the locked partition key and exempt routes
  - docs-only narrowing of stale CSP/browser-security-header and markdown-sanitizer claims
  - `ADR-0011-observability-opentelemetry-baseline.md` landed with the instrumentation
  - fixed redirect-construction and CSRF-precedence regressions covered by integration tests
  - locked tenant-host extraction completed under the line-ceiling and grep guards
- Post-implementation outcome: completed via [critic-review.md](./critic-review.md) on `2026-04-18`; ship-ready verdict, no blocking findings, and no required fixes before merge.
- Post-implementation non-blocking carry-forwards:
  - sub-PR sequencing stayed collapsed into one local change set; accepted as a process note rather than a merge blocker because the runtime slices and extraction still have independent validation evidence
  - `tenant-shell.tsx` absorbed most of the extracted surface and remains larger than ideal, but the locked `tenant-host.tsx` ceiling and behavior-preservation guardrails are satisfied
  - `scripts/run-root-host-e2e.ps1` remains as a compatibility shim so archived CP13-CP15 artifacts stay path-valid
  - coverage-parity evidence for the extraction remains qualitative rather than a side-by-side test-list artifact; the automated suites still pass on the extracted structure

## Risks And Rollout Notes
- Config or dependency considerations:
  - adds OpenTelemetry runtime packages to the API and worker hosts
  - adds optional `PAPERBINDER_OTEL_OTLP_ENDPOINT` configuration
  - keeps `PAPERBINDER_RATE_LIMIT_AUTHENTICATED_PER_MINUTE` as the canonical authenticated tenant-host mutation budget
  - adds `PAPERBINDER_DB_HOST_PORT` as a local/E2E compose host-port selector, used by the isolated browser runtime to avoid the default local-stack database port
- Security or operational considerations:
  - logout now returns `200` with a server-provided `redirectUrl` anchored to `PAPERBINDER_PUBLIC_ROOT_URL`
  - the E2E-only challenge fixture is no longer part of the default frontend build or committed app `wwwroot`
  - the browser gate remains isolated from the default runtime; `PB_ENV=Test` is still confined to the Playwright path
  - the low-cardinality metric vocabulary is locked and excludes tenant/user/correlation identifiers from metric labels
- Checkpoint closure considerations:
  - scripted validation is complete and recorded below
  - post-implementation critic review is complete with no required fixes before merge
  - manual VS Code and Visual Studio launch verification completed and passed on `2026-04-19`
  - `CP16` is now recorded as `done` in `docs/55-execution/checkpoint-status.md`

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
  - Scope note: the canonical reviewer launch surfaces opened and started successfully in both editors, satisfying the checkpoint-closeout requirement that remains separate from the scripted validation bundle
- Static invariant checks: passed on `2026-04-18`
  - `tenant-host.tsx` is 57 lines after extraction
  - no direct `fetch(` usage across the extracted tenant-host modules
  - no `localStorage` or `sessionStorage` usage across the extracted tenant-host modules
  - no custom `X-Impersonate-*` or tenant-identifier header usage across the extracted tenant-host modules
  - no `e2e-turnstile` hits in `src/PaperBinder.Web/dist` or `src/PaperBinder.Api/wwwroot`

## Author Notes For Critic
- Changed files:
  - runtime hardening and auth boundary: authenticated mutation limiter, logout redirect contract, correlated structured logging, and request-boundary telemetry in `src/PaperBinder.Api/`
  - observability and worker/persistence seams: `src/PaperBinder.Infrastructure/Diagnostics/PaperBinderTelemetry.cs`, the Npgsql connection/transaction seams, cleanup metrics, `src/PaperBinder.Worker/`, and `docs/90-adr/ADR-0011-observability-opentelemetry-baseline.md`
  - browser/runtime hygiene and extraction: `src/PaperBinder.Web/e2e/e2e-turnstile.js`, `src/PaperBinder.Web/src/app/tenant-shell.tsx` plus the seven extracted tenant-host route/banner modules, `src/PaperBinder.Web/src/api/client.ts`, `scripts/run-browser-e2e.ps1`, `scripts/run-root-host-e2e.ps1`, `scripts/validate-checkpoint.ps1`, `docker-compose.yml`, and `docker-compose.e2e.yml`
  - validation and contract coverage: `tests/PaperBinder.IntegrationTests/HardeningConsistencyIntegrationTests.cs`, the logout/redirect integration tests, the frontend client or shell tests, and the synchronized taskboard/execution/security/operations/testing/navigation docs
- Validation results:
  - release build passed
  - full automated test suite passed, including Docker-backed integration coverage
  - isolated browser E2E gate passed with 6 Playwright tests total
  - docs validation, launch-profile validation, and full checkpoint validation passed
  - static invariant searches passed for extracted-module browser-boundary rules and fixture absence
- Intentional deviations:
  - kept `scripts/run-root-host-e2e.ps1` as a compatibility shim so archived docs remain path-valid under `validate-docs.ps1`; active scripts and canonical docs use `scripts/run-browser-e2e.ps1`
  - the plan's recommended sub-PR sequencing was not reproduced as separate review boundaries because this implementation was completed as one local change set; runtime and extraction slices were still validated independently before handoff
- Residual risks:
  - the critic's accepted non-blockers remain process and maintainability observations only: collapsed sub-PR sequencing, the larger `tenant-shell.tsx` owner, the compatibility shim for `scripts/run-root-host-e2e.ps1`, and qualitative rather than side-by-side coverage-parity evidence
  - historical CP13-CP15 delivery evidence still references `run-root-host-e2e.ps1` intentionally; the compatibility shim exists only to keep that history path-valid

## Follow-Ups
- None required for `CP16` closeout. Next planned checkpoint is `CP17`.
