# CP13 Critic Review: Root-Host Frontend Flows
Status: Post-Implementation Review Complete

Reviewer: PaperBinder Critic
Date: 2026-04-16

Historical note: This artifact records the critic's point-in-time post-implementation review on `2026-04-16`. Later executor closeout updates on `2026-04-16` recorded completed manual VS Code plus Visual Studio launch verification in the CP13 task and PR artifacts, so the checkpoint is now fully closed out.

---

## Scope-Lock Review (Pre-Implementation)

Reviewer: PaperBinder Critic
Date: 2026-04-16
Inputs reviewed:
- `docs/55-execution/execution-plan.md` (CP13 checkpoint definition)
- `docs/95-delivery/pr/cp13-root-host-frontend-flows/implementation-plan.md`
- All documents referenced by the plan's scope, locked decisions, touch points, and validation plan
- Current CP12 frontend implementation state in `src/PaperBinder.Web/`

Verdict: **The plan is scope-locked. No blocking findings.**

The implementation plan correctly translates the CP13 checkpoint outcome into a bounded, testable, and doc-synchronized change. Scope boundaries, locked decisions, acceptance criteria, ADR triggers, and boundary risks are all explicit and aligned with the execution plan, AGENTS contract, and canonical architecture/security docs.

Pre-implementation non-blocking findings `NB-1` through `NB-5` were all addressed during implementation. Resolution details are recorded in the implementation plan's Critic Review Resolution Log.

---

## Post-Implementation Review

Reviewer: PaperBinder Critic
Date: 2026-04-16
Inputs reviewed:
- `docs/95-delivery/pr/cp13-root-host-frontend-flows/implementation-plan.md` (final state)
- `docs/95-delivery/pr/cp13-root-host-frontend-flows/description.md` (PR artifact)
- Full working-tree diff against `main`
- All changed source files in `src/PaperBinder.Web/`
- All changed infrastructure files: `docker-compose.yml`, `docker-compose.e2e.yml`, `src/PaperBinder.Api/Dockerfile`, `scripts/run-root-host-e2e.ps1`
- All changed documentation under `docs/`
- Author notes provided with the review request

---

## Verdict

**Ship-ready. No blocking findings.**

The implementation correctly translates the locked CP13 plan into working code. All acceptance criteria are met. Boundary invariants hold: no direct fetch in root-host components, no credential persistence, no client-constructed tenant URLs, `PB_ENV=Test` isolated to the dedicated E2E runtime. The pre-implementation non-blocking findings are all resolved. Test coverage is credible across component, utility, and browser E2E layers. Documentation is synchronized in the same change set.

CP13 may proceed to checkpoint closeout once the remaining manual VS Code and Visual Studio launch verification is recorded in the PR artifact.

---

## Blocking Findings

None.

---

## Non-Blocking Findings

### NB-POST-1: Mock challenge script ships in the production image

The `e2e-turnstile.js` stub lives in `src/PaperBinder.Web/public/`, which means `vite build` copies it into `dist/` and the Dockerfile bundles it into the production container image. The file is inert unless the `VITE_PAPERBINDER_CHALLENGE_SCRIPT_URL` environment variable points to it (default points to the real Cloudflare Turnstile URL), so there is no behavioral risk. However, the test fixture is physically accessible at `/e2e-turnstile.js` on any deployment. Since PaperBinder is a demo/hiring artifact rather than a production system, this is acceptable for CP13. A later hardening pass could move the mock to a path excluded from the production build.

Severity: Low.

### NB-POST-2: Login redirect guard is less defensive than provision redirect guard

The provision flow's `handleContinueToTenant()` re-validates `isAbsoluteRedirectUrl(provisionedTenant.redirectUrl)` before calling `navigator()`. The login flow's "Continue manually" fallback button at line 512 of `root-host.tsx` calls `navigator(redirect.redirectUrl)` without re-validating, relying solely on the earlier `useEffect` check. In practice the server is authoritative for the URL and the `useEffect` already shows an error when validation fails, so the risk is negligible. The asymmetry is a minor hygiene observation, not a defect.

Severity: Informational.

### NB-POST-3: Residual "username" terminology in pre-CP13 product docs

`docs/10-product/component-specification-v1.md` (line 157) contains a generic `Username is required.` validation example and `docs/10-product/prd.md` (line 129) references "Username/password authentication." Neither document was in the CP13 step-1 reconciliation scope, and the CP13-owned docs (`ui-ux-contract-v1.md`, `user-stories.md`, `ux-notes.md`, route-registry metadata, and the implementation itself) all correctly use `Email`. This is pre-existing drift, not introduced by CP13, but could seed confusion if a future checkpoint copies terminology from these older docs without checking the API contract.

Severity: Informational.

---

## Post-Implementation Checks

| # | Check | Result |
| --- | --- | --- |
| 1 | **No direct fetch in root-host components.** Grep for `fetch(` in `src/PaperBinder.Web/src/app/`: zero matches. All API calls route through the shared client. | Pass |
| 2 | **No credential persistence.** Grep for `localStorage`, `sessionStorage`, `cookie` in `src/PaperBinder.Web/src/app/`: only a hint-text string mentioning `cookie-auth session model`. No storage writes. `ProvisionResponse` stays in React `useState` only. | Pass |
| 3 | **No client-constructed tenant URLs.** All redirect navigation uses `provisionedTenant.redirectUrl` or `redirect.redirectUrl` from the server response. `window.location.assign` is called only with the server-provided value after `isAbsoluteRedirectUrl` validation. No `tenantSlug`-derived URL construction in route code. | Pass |
| 4 | **`PB_ENV=Test` isolation.** Grep across `*.ps1`, `*.yml`, `*.yaml`, `*.json`: `PB_ENV: Test` appears only in `docker-compose.e2e.yml`. Not present in `docker-compose.yml`, `scripts/start-local.ps1`, `scripts/reviewer-full-stack.ps1`, or any other default-stack path. | Pass |
| 5 | **T-0024 gap closure.** `e2e/root-host.spec.ts` test 3 explicitly submits `challengeFailToken`, asserts HTTP 403, and verifies the `CHALLENGE_FAILED` heading. `T-0024` status is `done` with recorded validation evidence. | Pass |
| 6 | **Doc reconciliation completeness.** `ui-ux-contract-v1.md`, `user-stories.md`, `ux-notes.md`, `frontend-spa.md`, `frontend-app-route-map.md`, `e2e-tests.md`, `frontend-standards.md`, `runbook-local.md`, `test-strategy.md`, `checkpoint-status.md`, `work-queue.md`, `ai-index.md`, `repo-map.json`, `README.md`, and `T-0024`/`T-0028` are all updated in the same change set. ADR-0010 is new and records the Playwright decision. | Pass |
| 7 | **Route-registry metadata refresh.** `route-registry.ts` now reads "Create a tenant, review one-time credentials, then continue to the tenant host" and "Sign in with existing demo credentials and redirect with the server-provided URL" instead of CP12 placeholder wording. | Pass |
| 8 | **E2E runtime default-stack isolation.** `scripts/start-local.ps1` has zero matches for `e2e` or `docker-compose.e2e`. `scripts/validate-checkpoint.ps1` has zero matches. `docker-compose.e2e.yml` uses a separate compose project name `paperbinder-e2e` and a dedicated port `5081`. | Pass |
| 9 | **Checkpoint validation wiring.** `docs/70-operations/runbook-local.md` line 113 explicitly states: "CP13 closeout also requires `powershell -ExecutionPolicy Bypass -File .\scripts\run-root-host-e2e.ps1`; this browser suite remains a separate required gate and is not bundled into `scripts/validate-checkpoint.ps1`." This is unambiguous. | Pass |
| 10 | **Acceptance criteria traceability.** All 24 acceptance criteria from the implementation plan map to at least one automated check. See traceability detail below. | Pass |

---

## Acceptance Criteria Traceability

| Criterion | Covered By |
| --- | --- |
| Live provisioning on `/`, live login on `/login`, CP12 placeholders removed | `root-host.test.tsx` tests 1-2 (provision), test 3 (login); E2E tests 1-2; route-registry updated |
| Semantic labels, focus, loading/disabled states | `root-host.tsx` Field/Button usage; `challenge-widget.tsx` label/describedBy/focus-within; `button.tsx` isLoading/disabled |
| Login field label is `Email` | `root-host.tsx:454` label prop; `root-host.test.tsx` test 3 `getByLabelText("Email")` |
| Provisioning submits tenant name + challengeToken via shared client | `root-host.test.tsx` test 1 asserts `provisionMock` called with correct payload |
| Login submits email + password + challengeToken via shared client | `root-host.test.tsx` test 3 asserts `loginMock` called with correct payload |
| One-time credentials shown, user-initiated continue, server-provided redirectUrl | `root-host.test.tsx` test 2; E2E test 1 verifies heading then explicit button click |
| Login redirects using server-provided redirectUrl | `root-host.test.tsx` test 3; E2E test 2 |
| ProblemDetails mapping for all 7 error codes + network/generic | `root-host-errors.test.ts` 3 tests covering CHALLENGE_FAILED, TENANT_NAME_CONFLICT, INVALID_CREDENTIALS, RATE_LIMITED, network failure |
| Challenge required before submit, resets after failure | `root-host.test.tsx` test 5 verifies `resetMock` called after INVALID_CREDENTIALS |
| Challenge wrapper accessibility baseline | `challenge-widget.tsx` label/aria-labelledby/aria-describedby/focus-within/error-border/status-badge |
| No direct fetch in root-host | Static grep: zero matches |
| No credential persistence | Static grep: no storage writes |
| No client-constructed tenant URLs | Static review: only server-provided redirectUrl used |
| Route metadata refreshed | `route-registry.ts` live descriptions confirmed |
| Browser E2E: provision success, login success, deny paths | E2E tests 1 (provision), 2 (login), 3 (CHALLENGE_FAILED + INVALID_CREDENTIALS + RATE_LIMITED) |
| E2E runtime isolated | `docker-compose.e2e.yml` separate project/port; `run-root-host-e2e.ps1` standalone |
| E2E closeout rule documented | `runbook-local.md` line 113 |
| T-0024 CHALLENGE_FAILED gap closed | E2E test 3; `T-0024` status `done` |
| No CP14 feature bleed | No tenant-host CRUD, lease, logout, or dashboard data in the diff |
| Canonical docs updated in same change set | All listed docs confirmed updated |

---

## Locked Decisions Verification

All locked decisions from the implementation plan remain honored in the final implementation.

| Decision | Implementation Evidence |
| --- | --- |
| Single React SPA, no BFF/SSR/framework-mode | `App.tsx` uses `BrowserRouter`; no server loaders, no second app entry |
| Root-host routes `/` and `/login`; `/about` remains static | `root-host.tsx` line 586-589; `RootAboutPage` is static content |
| Server-provided `redirectUrl` for all post-auth navigation | `navigator(provisionedTenant.redirectUrl)` and `navigator(redirect.redirectUrl)` only |
| Transient in-memory-only credential display | `ProvisionResponse` in `useState`; no storage writes |
| Shared API client as sole browser `/api/*` path | `apiClient.provision()` and `apiClient.login()`; no direct fetch |
| No new form/state/query/challenge dependencies | `package.json` adds only `@playwright/test` (devDependency for E2E) |
| ProblemDetails-first error UX | `mapRootHostError()` switches on `error.errorCode` from `PaperBinderApiError` |
| `PB_ENV=Test` challenge bypass isolated to E2E runtime only | Only in `docker-compose.e2e.yml` |
| Lightweight native React form handling, no new form/state library | Native `<form onSubmit>`, `useState`, no react-hook-form/zod/etc. |
| User-initiated provisioning handoff | Explicit "Continue to tenant" button, not auto-redirect |
| E2E runtime isolated from default reviewer/local stack | Separate compose file, project name, port, startup script |

---

## Residual Risks

Even with no blockers, these risks should stay visible:

- **Manual launch verification was still pending at review time.** This was a checkpoint-closeout gate rather than a code-correctness issue. Later executor closeout updates recorded completed manual VS Code and Visual Studio verification in the PR artifact and task file.
- **E2E environmental sensitivity.** The isolated root-host E2E suite depends on Docker container startup, port `5081` availability, database readiness, and Playwright browser binaries. The `run-root-host-e2e.ps1` script handles health-check polling and cleanup, but CI integration may surface timing or resource contention that needs stabilization in a later hardening pass.
- **Mock challenge script in production bundle.** As noted in NB-POST-1, `e2e-turnstile.js` is physically present in the production image. It is inert under default configuration but is a hygiene item for a future pass.
- **Pre-CP13 "username" drift.** As noted in NB-POST-3, `component-specification-v1.md` and `prd.md` still use "username" in generic contexts. These are not CP13-scoped, but a future checkpoint should reconcile them to prevent terminology drift into new UI work.

---

## Required Fixes Before Merge

None. The implementation is correct against the locked plan, all static checks pass, and no boundary violations were found. The non-blocking findings are informational or low-severity items that do not require changes before this checkpoint merges.

---

## Closeout Follow-Up

Executor closeout updates recorded on `2026-04-16` after this review:

- Manual VS Code launch verification completed and passed.
- Manual Visual Studio launch verification completed and passed.
- Current done-state evidence lives in `T-0028`, the CP13 `description.md`, `work-queue.md`, and `docs/55-execution/checkpoint-status.md`.
