# CP12 Critic Review: Frontend Foundation And Shared UI System

Reviewer: Critic
Review phases: scope-lock (2026-04-15), post-implementation (2026-04-15)

Historical note: This artifact records the critic's point-in-time review on `2026-04-15`. Later executor closeout updates on `2026-04-16` closed `NB-POST-1` and `NB-POST-2`, increased the frontend suite to 8 tests, and recorded the completed manual VS Code plus Visual Studio launch verification in the CP12 task and PR artifacts.

---

# Phase 1: Scope-Lock Review

Review phase: scope-lock (2026-04-15)

Inputs reviewed:
- `docs/55-execution/execution-plan.md` (CP12 section)
- `docs/95-delivery/pr/cp12-frontend-foundation-and-shared-ui-system/implementation-plan.md`
- `docs/20-architecture/frontend-spa.md`
- `docs/20-architecture/frontend-app-route-map.md`
- `docs/50-engineering/frontend-standards.md`
- `docs/50-engineering/tech-stack.md`
- `docs/10-product/ui-ux-contract-v1.md`
- `docs/10-product/ui-style.md`
- `docs/80-testing/test-strategy.md`
- `docs/80-testing/e2e-tests.md`
- `docs/00-intent/documentation-integrity-contract.md`
- `docs/55-execution/checkpoint-status.md`
- `docs/90-adr/ADR-0005-no-bff.md`
- `AGENTS.md`
- `src/PaperBinder.Web/package.json`
- `src/PaperBinder.Web/src/App.tsx`
- `src/PaperBinder.Web/src/environment.ts`
- `src/PaperBinder.Web/vite.config.ts`
- `scripts/test.ps1`
- `.github/workflows/ci.yml`
- Private-boundary scan across all plan text

## Verdict

**No blocking findings. The plan is scope-locked.**

The CP12 implementation plan matches the checkpoint outcome in the execution plan, respects all locked stack and architecture decisions, draws explicit and defensible scope boundaries against CP13/CP14 feature work, and includes a credible vertical-slice TDD plan. The doc-reconciliation-first sequencing is correct. The open decisions are appropriately flagged and the plan contains clear stop-and-revise language if either open decision requires scope expansion.

Seven non-blocking findings are recorded below. All are resolvable during the step-1 doc reconciliation pass or early implementation without changing the plan's structure or checkpoint boundary.

## Blocking Findings

None.

## Non-Blocking Findings

### NB-1: Test tooling open decision should be resolved during step-1 doc pass, not left open into implementation

The plan lists "Component-test stack" as an Open Decision and notes the possibility that the owner might treat the choice as a stack expansion requiring approval. `scripts/test.ps1` currently runs only `dotnet test` buckets. `package.json` has no `test` script and no test runner dependency. The test strategy doc explicitly acknowledges "the current frontend remains a placeholder surface and has no automated tests."

Introducing a frontend test runner (likely Vitest given the Vite baseline) is new infrastructure. The plan's step-1 doc reconciliation pass is the correct place to lock this choice so that `tech-stack.md`, `frontend-standards.md`, and `test-strategy.md` all agree before step 2 begins. If the owner classifies the choice as a stack expansion, the approval and ADR must happen in step 1, not mid-implementation.

Severity: Low. The plan already has the right structure; this finding asks for an explicit commitment that the test-runner decision is closed by the end of step 1.

### NB-2: Button and Card primitives from the UI/UX contract are absent from the acceptance criteria

`docs/10-product/ui-ux-contract-v1.md` Section 8 defines Button (primary/secondary/danger variants with hover/focus/disabled/loading states) and Card as component primitives. The CP12 acceptance criteria explicitly list form fields, tables, alerts, dialogs, and status badges but do not list Button or Card. The current `App.tsx` contains an inline Button component that will be replaced.

Both primitives are needed before CP13/CP14 route work. If they are intended as CP12 deliverables, add them to the acceptance criteria and the TDD slice for primitives. If they are intentionally deferred, state that explicitly so CP13/CP14 planning can account for them.

Severity: Low. Likely an omission rather than a scope question.

### NB-3: Banner primitive for lease-status is referenced in the UI/UX contract but not listed as a CP12 primitive

`ui-ux-contract-v1.md` defines a Banner primitive for tenant lease status and expiration warnings and says it is "persistent at top of tenant shell." CP12 builds the tenant shell layout. Either add Banner to the CP12 shared primitive set or explicitly note it is deferred to CP14 (when the lease-countdown UI lands) so the tenant shell layout can reserve the slot without building the component.

Severity: Low. Acceptable either way as long as the decision is stated.

### NB-4: Frontend test wiring in `scripts/test.ps1` must not silently pass when no tests exist

The plan says "Add a checked-in frontend test command and wire it into repo-native validation." If the frontend test command is wired into `test.ps1` before any test files exist, the step could pass vacuously and mask the testing gap instead of closing it. The TDD plan's first RED test should exist in the same commit as (or before) the `test.ps1` wiring change so the pipeline proves it can actually fail.

Severity: Low. A sequencing detail the Executor should confirm during implementation.

### NB-5: CI workflow frontend test step is implied but not in acceptance criteria

The acceptance criteria say "CI and repo scripts fail clearly when frontend component tests fail" and the "Likely Touch Points" list includes `.github/workflows/ci.yml`. However, no acceptance criterion explicitly states that the CI workflow must include a dedicated frontend test step. The current CI runs `scripts/test.ps1` which has no frontend step. Either add an explicit acceptance criterion ("CI workflow includes a frontend test step that fails independently of backend tests") or confirm that wiring the frontend test command into `test.ps1` is sufficient for CI coverage.

Severity: Low. The intent is present; the criterion should be tightened slightly.

### NB-6: `docs/55-execution/checkpoint-status.md` is not in the Likely Touch Points list

The operating model requires updating the checkpoint status ledger when a checkpoint starts and when it completes. At scope-lock time, the ledger still showed CP12 as `queued`. This file should be listed in Likely Touch Points alongside the other execution and delivery docs.

Severity: Trivial. The Executor will update it regardless per the operating model.

### NB-7: Post-implementation check for shared API client exclusivity has no validation step

The locked decision says "the shared API client is the only browser path for `/api/*` calls in CP12." The acceptance criteria correctly state the client must centralize credentials, headers, CSRF, and ProblemDetails handling. However, no validation step or test verifies that no other code path bypasses the shared client with a direct `fetch` or alternative HTTP call. For this scope-lock review, this is acceptable — the risk is low in a fresh foundation checkpoint. Flag it as a post-implementation review check.

Severity: Trivial. Flag for post-implementation critic pass.

## Locked Decisions

All locked design decisions in the implementation plan have been verified against the current canonical docs and existing codebase:

| Decision | Consistent | Evidence |
|---|---|---|
| Frontend stays in `src/PaperBinder.Web` workspace | Yes | Current structure confirms single workspace; no split proposed |
| Client-rendered React SPA with direct API calls, no BFF/SSR | Yes | `frontend-spa.md`, `ADR-0005-no-bff.md`, `tech-stack.md` all agree |
| Host context from browser host plus `VITE_PAPERBINDER_*` contract | Yes | `environment.ts` already implements this; plan extends it |
| Route skeleton matches canonical route map | Yes | Plan routes match `frontend-app-route-map.md` exactly: root `/`, `/login`, `/about`; tenant `/app`, `/app/binders`, `/app/binders/:binderId`, `/app/documents/:documentId`, `/app/users` |
| Tenant-route auth uses existing backend contracts only | Yes | Plan prefers `GET /api/tenant/lease` (shipped in CP11); stop-and-revise if new endpoint needed |
| Shared API client centralizes credentials, versioning, CSRF, ProblemDetails, correlation-id | Yes | `frontend-spa.md` and `frontend-app-route-map.md` require exactly these behaviors |
| No `react-hook-form`, `zod`, TanStack Query, Redux/Zustand without owner approval | Yes | `tech-stack.md` and `frontend-standards.md` explicitly exclude these from V1 baseline |
| Tailwind CSS and Radix UI as UI baseline | Yes | `tech-stack.md`, `ui-ux-contract-v1.md`, `frontend-standards.md` all lock this stack |
| E2E coverage deferred to CP13+ | Yes | `e2e-tests.md` minimum flow set references provisioning/login/navigation which are CP13/CP14 |
| Frontend component tests only in CP12 | Yes | `test-strategy.md` says "Re-evaluate frontend test coverage when real root-host or tenant-host UI behavior lands" |

No locked decision is violated. No ADR trigger is hit by the plan as written.

## Required Plan Edits

None required before implementation begins. The following are recommended improvements that can be applied during the step-1 doc reconciliation pass:

1. Add Button (and optionally Card) to the acceptance criteria primitive list, or add an explicit deferral note.
2. State whether Banner is a CP12 primitive or a CP14 deferral.
3. Add `docs/55-execution/checkpoint-status.md` to Likely Touch Points.
4. Add a note to the TDD plan or step 7 that `test.ps1` frontend wiring and the first failing test must land together to avoid vacuous pass.
5. Tighten the acceptance criterion about CI to explicitly mention the frontend test step in the CI workflow.

## Scope-Lock NB Resolution Log

All seven scope-lock non-blocking findings were resolved during implementation:

- `NB-1` Resolved: Vitest chosen and recorded in ADR-0009 before broad implementation began. `tech-stack.md`, `frontend-standards.md`, and `test-strategy.md` all reference the decision.
- `NB-2` Resolved: Button and Card appear in the primitive baseline, acceptance criteria, TDD slice 5, and implementation.
- `NB-3` Resolved: Banner is a CP12 structural shell primitive. `ui-ux-contract-v1.md` now states CP12 ships the shell slot and generic presentation; countdown/extend stays later-checkpoint.
- `NB-4` Resolved: `vite.config.ts` sets `passWithNoTests: false` and the first tests landed with the wiring.
- `NB-5` Resolved: CI runs `scripts/test.ps1` which now includes the frontend test command as its first step. The CI label was updated to "Repo tests (frontend + backend)."
- `NB-6` Resolved: `checkpoint-status.md` is updated in the change set.
- `NB-7` Resolved: Static search confirms `fetch` usage only in `src/PaperBinder.Web/src/api/client.ts` and test doubles. The task file records the invariant check.

---

# Phase 2: Post-Implementation Review

Review phase: post-implementation (2026-04-15)

Inputs reviewed:
- `docs/95-delivery/pr/cp12-frontend-foundation-and-shared-ui-system/implementation-plan.md`
- `docs/95-delivery/pr/cp12-frontend-foundation-and-shared-ui-system/description.md`
- `docs/05-taskboard/tasks/T-0027-cp12-frontend-foundation-and-shared-ui-system.md`
- `docs/90-adr/ADR-0009-frontend-component-test-stack-for-cp12.md`
- Full working-tree diff against `main` (23 modified files, ~1860 insertions)
- All new source files under `src/PaperBinder.Web/src/api/`, `src/PaperBinder.Web/src/app/`, `src/PaperBinder.Web/src/components/ui/`, `src/PaperBinder.Web/src/lib/`, `src/PaperBinder.Web/src/test/`
- Canonical doc diffs for `docs/10-product/`, `docs/20-architecture/`, `docs/50-engineering/`, `docs/55-execution/`, `docs/80-testing/`, `docs/90-adr/`, `docs/ai-index.md`, `docs/repo-map.json`
- `scripts/test.ps1`, `.github/workflows/ci.yml` diffs
- `src/PaperBinder.Web/package.json`, `vite.config.ts` diffs
- Executor author notes and validation evidence
- Private-boundary scan across all committed artifacts
- Static search for `fetch` and `/api/` usage exclusivity

---

## Verdict

**No blocking findings. The checkpoint is ship-ready.**

The CP12 implementation matches the locked design decisions, acceptance criteria, and vertical-slice TDD plan from the implementation plan. All scope-lock non-blocking findings from Phase 1 were addressed. Route skeleton, host-context resolution, shared API client, tenant-shell bootstrap states, shared UI primitives, frontend test coverage, repo-native validation wiring, and documentation propagation are all present and internally consistent.

At the time of this review, the only outstanding pre-closure item was manual VS Code plus Visual Studio launch verification, which the author correctly disclosed as still pending. That gate was external to this code review and did not block the critic verdict.

Four non-blocking findings and three residual risks are recorded below.

---

## Blocking Findings

None.

---

## Non-Blocking Findings

### NB-POST-1: Tenant-shell 401 unauthorized path is not exercised by tests

`tenant-host.tsx` handles the `401` bootstrap state at lines 265-276 and renders a safe "Authentication required" shell. However, `tenant-shell.test.tsx` tests only the `403`, `410`, and `404` paths. The `401` path is implemented correctly but has no automated coverage.

This is thin coverage rather than a gap in behavior. The code structure for all error states is uniform, so the risk of a silent 401 regression is low.

Severity: Low. Consider adding the 401 case to the existing parameterized test in a follow-up.

### NB-POST-2: Invalid-host rendering path has no component test

`invalid-host.tsx` renders a safe fallback when the browser host matches neither the configured root host nor a valid tenant subdomain. The `resolveHostContext` function correctly produces the `invalid` context, but no component-level test renders the `InvalidHostRoutes` path through `AppRouter`.

The invalid-host path is defensive infrastructure for misconfigured or stale DNS entries. It is low-risk because it renders only static content and environment metadata, but it is untested at the rendering level.

Severity: Low. Acceptable for CP12 foundation scope; flag for CP13 if host-context tests are expanded.

### NB-POST-3: CSRF cookie name matching uses a suffix convention rather than an exact name

`client.ts:55` uses `rawName.endsWith(".csrf")` to locate the CSRF token cookie. This matches the current backend contract (`paperbinder.auth.csrf`) but would also match any other cookie ending in `.csrf` if one were present. This is not a security issue because the CSRF token value is server-validated, but it is a fragile coupling point if the cookie-naming convention changes.

Severity: Trivial. The current convention works correctly. Document or tighten if the cookie contract changes.

### NB-POST-4: CI label change is cosmetic but accurate

`.github/workflows/ci.yml` renames the step from "Test" to "Repo tests (frontend + backend)". This is accurate and helpful for reviewers but will show as a changed step name in CI history. No behavioral impact.

Severity: Trivial. Noted for completeness.

---

## Post-Implementation Verification Checklist

Each item from the scope-lock Post-Implementation Checks section has been verified against the diff and source:

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Route skeleton matches canonical route map for both host contexts | Pass | Root: `/`, `/login`, `/about`, `*` in `root-host.tsx:254-257`. Tenant: `/app`, `/app/binders`, `/app/binders/:binderId`, `/app/documents/:documentId`, `/app/users`, `*` in `tenant-host.tsx:568-574`. Both match `frontend-app-route-map.md`. |
| 2 | Shared API client is the only `/api/*` code path | Pass | `grep fetch src/PaperBinder.Web/src/` shows `fetch` only in `api/client.ts` and test doubles. `grep /api/ src/PaperBinder.Web/src/` shows live usage only through the shared client module plus documentation strings. |
| 3 | CSRF header on unsafe methods only | Pass | `client.ts:48-49` defines `isUnsafeMethod` excluding GET/HEAD/OPTIONS. `client.ts:232-236` attaches CSRF only when unsafe. |
| 4 | ProblemDetails normalization covers required status codes | Pass | `client.ts:154-176` normalizes from response body. `tenant-host.tsx:32-45` classifies 401/403/404/410. `client.test.ts` validates 429 with correlation-id and Retry-After. `PaperBinderApiError` exposes `status`, `errorCode`, `detail`, `correlationId`, `retryAfterSeconds`, `traceId`, and `validationErrors`. |
| 5 | Shared UI primitives have accessible baseline | Pass | Button: `focus-visible:outline`, `aria-busy`, `disabled`/`aria-disabled` for `asChild`. Card: semantic `section`/`header`/`footer`. Banner: `role="status"`. Alert: `role="alert"` for danger, `role="status"` otherwise. Dialog: Radix primitives with `Title`, `Description`, `aria-label` close button. Field: `htmlFor`/`id`, `aria-describedby`, `aria-invalid`. Table: `caption` (sr-only), `scope="col"`. StatusBadge: variant-specific border plus background (not color-only). |
| 6 | No CP13/CP14 feature wiring | Pass | All form inputs are `disabled`. No provisioning/login POST calls. No binder/document/user API calls. Route params `binderId` and `documentId` are displayed but never used for data fetching. Lease extend/countdown are explicitly deferred. |
| 7 | Host context derived only from browser host and environment variables | Pass | `host-context.ts` uses `locationLike.host`, `locationLike.hostname`, and `FrontendEnvironment` fields only. No query params, path params, localStorage, or sessionStorage. `environment.ts` reads only `VITE_PAPERBINDER_*` values from `import.meta.env`. |
| 8 | Frontend tests run in `scripts/test.ps1` and CI | Pass | `test.ps1` runs `npm run test` before dotnet test steps. CI runs `test.ps1`. `vite.config.ts` sets `passWithNoTests: false`. |
| 9 | All planned doc touch points updated in the same change set | Pass | `ui-style.md`, `ui-ux-contract-v1.md`, `frontend-app-route-map.md`, `frontend-spa.md`, `frontend-standards.md`, `tech-stack.md`, `checkpoint-status.md`, `phase-4-frontend-experience.md`, `e2e-tests.md`, `test-strategy.md`, `testing-standards.md`, `ADR README`, `ai-index.md`, `repo-map.json`, `work-queue.md`, and all CP12 delivery artifacts are present in the diff. |
| 10 | Manual VS Code and Visual Studio launch verification | Outstanding at review time | Author correctly discloses this as pending. External to this code review. |

---

## Locked Decision Compliance (Post-Implementation)

| Decision | Compliant | Evidence |
|---|---|---|
| Frontend stays in `src/PaperBinder.Web` workspace | Yes | All new source under `src/PaperBinder.Web/src/`. No second app or workspace introduced. |
| Client-rendered React SPA with direct API calls, no BFF/SSR | Yes | `App.tsx` renders in `BrowserRouter`. API calls go direct to origin. No server loaders, actions, or framework-mode routing. |
| Host context from browser host plus `VITE_PAPERBINDER_*` contract | Yes | `host-context.ts` reads `location.host`/`hostname` and `FrontendEnvironment`. No other identity sources. |
| Route skeleton matches canonical route map | Yes | Root and tenant routes match `frontend-app-route-map.md` exactly. Host-local catch-all on both shells. |
| Tenant-route auth uses `GET /api/tenant/lease` only | Yes | `tenant-host.tsx:64-66` calls `apiClient.getTenantLease()`. No other bootstrap or session endpoint introduced. |
| Shared API client centralizes all browser `/api/*` behavior | Yes | `fetch` exclusivity confirmed by static search. Client sends `credentials: "include"`, `X-Api-Version: 1`, CSRF on unsafe, captures correlation-id, normalizes ProblemDetails. |
| No `react-hook-form`, `zod`, TanStack Query, Redux/Zustand | Yes | `package.json` adds only `@radix-ui/react-dialog`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, and `jsdom`. |
| Tailwind CSS and Radix UI as UI baseline | Yes | `styles.css` uses Tailwind. Dialog primitive uses `@radix-ui/react-dialog`. Button uses `@radix-ui/react-slot`. |
| E2E coverage deferred to CP13+ | Yes | No Playwright or Cypress dependencies. Test stack is component/utility only per ADR-0009. |
| Frontend component tests only in CP12 | Yes | At review time: 5 test files, 6 tests. All were Vitest + RTL + jsdom component/utility tests. |
| No ADR trigger hit | Yes | No new sticky architecture dependency beyond the approved ADR-0009 test stack. |

---

## Residual Risks

1. **Manual launch verification was still outstanding at review time.** The author correctly flagged that CP12 should not be marked `done` until VS Code and Visual Studio launch verification was recorded. This was external to the code diff but remained a checkpoint-closure gate per the operating model.

2. **Thin test coverage for 401 and invalid-host paths.** The tenant-shell 401 unauthorized state and the invalid-host fallback rendering are implemented correctly but have no dedicated component tests. The risk is low because these paths are structurally identical to the tested error states, but a regression in either path would not be caught by the current test suite.

3. **Checkpoint validator required unsandboxed execution.** The canonical `validate-checkpoint.ps1` script needed to run outside the sandbox because nested Vite/esbuild child processes hit the sandbox boundary. The standalone frontend build and test commands passed normally. This is an environment-specific constraint, not a product defect, but it means the full checkpoint validation bundle cannot run in all sandboxed contexts.

---

## Required Fixes Before Merge

None. The implementation was complete and internally consistent at review time. The checkpoint was ship-ready pending the then-outstanding manual launch verification gate.

---

## Closeout Follow-Up

Executor closeout updates recorded on `2026-04-16` after this review:

- `NB-POST-1` closed: tenant-shell `401` now has explicit component coverage.
- `NB-POST-2` closed: invalid-host fallback rendering is now exercised through `AppRouter`.
- Manual VS Code and Visual Studio launch verification completed and passed.
- Current done-state evidence lives in `T-0027`, the CP12 `description.md`, and `docs/55-execution/checkpoint-status.md`.
