# CP14 Critic Review: Tenant-Host Frontend Flows
Status: Post-Implementation Review Complete

Historical note: This artifact records the critic's point-in-time post-implementation review on `2026-04-17`. Later executor closeout updates on `2026-04-17` closed `NB-POST-1` by removing the duplicate route-map paragraph, re-ran `scripts/validate-docs.ps1`, and recorded completed manual VS Code plus Visual Studio launch verification in the CP14 task and PR artifacts.

Reviewer: PaperBinder Critic
Date: 2026-04-17

---

## Scope-Lock Review (Pre-Implementation)

Reviewer: PaperBinder Critic
Date: 2026-04-16
Inputs reviewed:
- `docs/55-execution/execution-plan.md` (CP14 checkpoint definition)
- `docs/95-delivery/pr/cp14-tenant-host-frontend-flows/implementation-plan.md`
- All documents referenced by the plan's scope, locked decisions, touch points, and validation plan
- Current CP12/CP13 frontend implementation state in `src/PaperBinder.Web/`
- Current shared API client state in `src/PaperBinder.Web/src/api/client.ts`
- API contract surface in `docs/40-contracts/api-contract.md`
- Canonical architecture, security, product, and testing docs

Verdict: **The plan is scope-locked. No blocking findings.**

The implementation plan correctly translates the CP14 checkpoint outcome ("the main authenticated product workflow is complete") into a bounded, testable, and doc-synchronized change. Scope boundaries are explicit and well-drawn. Locked decisions, acceptance criteria, ADR triggers, boundary risks, open decisions, and the vertical-slice TDD plan are all aligned with the execution plan, AGENTS contract, and canonical architecture, security, product, and testing docs. The three open decisions are correctly gated: all must be resolved during the step-1 doc reconciliation pass before broad code changes begin.

---

## Post-Implementation Review

Reviewer: PaperBinder Critic
Date: 2026-04-17
Inputs reviewed:
- `docs/95-delivery/pr/cp14-tenant-host-frontend-flows/implementation-plan.md` (locked plan)
- `docs/95-delivery/pr/cp14-tenant-host-frontend-flows/description.md` (PR artifact)
- Full diff of `checkpoint-14-tenant-host-frontend-flows` against `main` (41 files, +4017 / -637 lines)
- All changed source files in `src/PaperBinder.Web/`
- All changed docs under `docs/`
- `docs/40-contracts/api-contract.md` (API error-code cross-reference)
- Author validation evidence and author notes
- Pre-implementation scope-lock review and post-implementation check table

### Verdict

**The checkpoint is ship-ready. No blocking findings.**

The implementation correctly translates the locked CP14 plan into working code. All 15 post-implementation checks pass. All boundary invariants hold: no direct `fetch` in tenant-host route code, no credential persistence, no client-constructed tenant URLs, `PB_ENV=Test` isolated to the E2E runtime, lease countdown is presentation-only with server-authoritative extension eligibility, and no CP15 feature bleed. Pre-implementation non-blocking findings NB-1 through NB-5 are all resolved in the implemented change set. Test coverage is credible across shared API client, tenant-host error mapping, tenant-shell component, and browser E2E layers. Documentation is synchronized in the same change set. The required manual VS Code and Visual Studio launch verification is correctly called out as still pending in both the PR artifact and checkpoint-status doc.

---

## Blocking Findings

None.

---

## Non-Blocking Findings

### NB-POST-1: Duplicate paragraph in `frontend-app-route-map.md`

`docs/20-architecture/frontend-app-route-map.md` contains a duplicate paragraph in the "Route-Linked Actions" section. Both the stale CP12 sentence and the new CP14 sentence are present on consecutive lines:

> These are action endpoints triggered from multiple views rather than dedicated pages. CP12 reserves the banner and shell slots but does not yet ship lease-extend or logout interaction wiring.
> These are action endpoints triggered from multiple views rather than dedicated pages. CP14 wires both actions into the live tenant shell.

The first line should have been replaced rather than having the second line appended below it.

Recommendation: remove the stale CP12 line and keep only the CP14 replacement.

Severity: Low (documentation integrity).

### NB-POST-2: Mock challenge script still ships in the production image

Carried forward from CP13 (NB-POST-1) and CP14 scope-lock (NB-5). The `e2e-turnstile.js` stub in `src/PaperBinder.Web/public/` is bundled into the production container image by Vite. It is inert under default configuration but physically accessible. CP14 correctly deferred this; CP16 hardening remains the natural home.

Severity: Informational (carried forward).

---

## Pre-Implementation Non-Blocking Findings Resolution

| # | Finding | Status | Resolution |
| --- | --- | --- | --- |
| NB-1 | ProblemDetails error-code enumeration incomplete | Resolved | `tenant-host-errors.ts` maps all 22 reachable error codes including all 9 codes identified in the finding. The `mapTenantHostError` function covers every shared and route-specific code from the API contract with display-safe UI messages, field targeting, correlation-id passthrough, and retry-after guidance. Unit tests verify representative shared, route-specific, rate-limited, generic-403, and network-failure mappings. |
| NB-2 | Lease-extend visibility versus TenantAdmin policy | Resolved | Implementation shows the extend button from `lease.canExtend` (server-authoritative eligibility) and disables it when not eligible. Non-admin callers who attempt extend fail safely through the API boundary and receive display-safe error mapping. `docs/10-product/ux-notes.md` documents the decision. |
| NB-3 | Residual "username" terminology in product docs | Resolved | `docs/10-product/component-specification-v1.md` changed "Username is required." to "Email is required." and `docs/10-product/prd.md` changed "Username/password authentication" to "Email/password authentication." Grep for "username" in `docs/10-product/` returns zero matches. |
| NB-4 | E2E test-data complexity | Resolved | Each tenant-host E2E spec provisions its own fresh tenant via `provisionTenantAndContinue`. The browser gate script (`run-root-host-e2e.ps1`) starts a fresh isolated runtime for each spec file. `docker-compose.e2e.yml` sets `PAPERBINDER_LEASE_DEFAULT_MINUTES: 10` and `PAPERBINDER_LEASE_EXTENSION_MINUTES: 10` so fresh tenants start inside the extension window, making extend immediately available without waiting for countdown decay. `PAPERBINDER_LEASE_CLEANUP_INTERVAL_SECONDS: 3600` on the worker prevents cleanup from interfering during test execution. The expired-tenant spec uses direct SQL via `expireTenant()` helper rather than wall-clock timing. `docs/80-testing/e2e-tests.md` documents the deterministic strategy. |
| NB-5 | Mock challenge script in production image | Deferred | Correctly deferred to CP16 hardening. Carried forward as NB-POST-2. |

---

## Post-Implementation Check Results

| # | Check | Result |
| --- | --- | --- |
| 1 | **No direct fetch in tenant-host components.** Grep for `fetch(` in `src/PaperBinder.Web/src/app/`: zero matches. All tenant-host API calls route through the shared client. | Pass |
| 2 | **No credential or auth-token persistence.** Grep for `localStorage`, `sessionStorage` in `src/PaperBinder.Web/src/app/`: zero matches. No storage writes for auth, lease, or tenant state. | Pass |
| 3 | **No client-constructed tenant URLs or client-side tenant identity.** `tenantSlug` usage in tenant-host code is limited to `hostContext.tenantSlug` for display-only metadata in the shell header and dashboard. No tenant-slug-derived URL construction in route code. Tenant identity remains host-derived via `host-context.ts` resolution. | Pass |
| 4 | **`PB_ENV=Test` isolation.** `PB_ENV: Test` appears only in `docker-compose.e2e.yml`. Not present in `docker-compose.yml`, `scripts/start-local.ps1`, `scripts/reviewer-full-stack.ps1`, or any default-stack path. | Pass |
| 5 | **CP12 placeholder wording removed.** No "placeholder", "deferred to CP14", or CP12 placeholder copy in `tenant-host.tsx` or `route-registry.ts`. The `placeholder` attribute hits in `tenant-host.tsx` are HTML form input placeholders (e.g., `placeholder="Operations"`), which are appropriate. Root-host copy in `root-host.tsx` is also updated to reflect live CP14 state. | Pass |
| 6 | **Lease countdown does not become source of truth.** `countdownSeconds` is derived from `calculateCountdownSeconds(lease.expiresAt)` using `Date.parse(expiresAt) - Date.now()`. The extend button is gated by `!lease.canExtend` from the server lease snapshot. `handleExtendLease` calls `apiClient.extendTenantLease()` and refreshes `lease` and `countdownSeconds` from the server response. Countdown state is never used to determine extend eligibility. | Pass |
| 7 | **Shared API client methods cover all CP14 tenant-host endpoints.** Typed methods exist for: `listBinders`, `createBinder`, `getBinderDetail`, `getBinderPolicy`, `updateBinderPolicy`, `getDocumentDetail`, `createDocument`, `listTenantUsers`, `createTenantUser`, `updateTenantUserRole`, `extendTenantLease`, and `logout`. All use the shared `request` path with CSRF, correlation-id, and API-version header handling. All use `encodeURIComponent` for path parameters. | Pass |
| 8 | **Binder-list omission semantics preserved.** `/app/binders` renders "No binders are visible for this tenant session yet." for empty lists (info-level alert) and a distinct `TenantRouteFailureCard` with access-denied messaging for 403/forbidden errors. Empty state is semantically distinct from denied state. | Pass |
| 9 | **Markdown rendering safety.** No new dependency was added. Document content is rendered inside a `<pre>` element as text content (`{documentDetail.content}`). No `dangerouslySetInnerHTML` or raw HTML injection path in any tenant-host component. The only `innerHTML` usage in the SPA is in `challenge-widget.tsx` (pre-existing CP13 Turnstile cleanup), which is not tenant-host route code. No ADR was needed. | Pass |
| 10 | **Doc reconciliation completeness.** All docs listed in the plan's likely touch points are updated in the same change set: `prd.md`, `component-specification-v1.md`, `ux-notes.md`, `ui-ux-contract-v1.md`, `user-stories.md`, `accessibility.md`, `frontend-spa.md`, `frontend-app-route-map.md`, `demo-tenant-lease.md`, `identity-aspnet-core-identity.md`, `frontend-standards.md`, `e2e-tests.md`, `test-strategy.md`, `runbook-local.md`, `checkpoint-status.md`, `phase-4-frontend-experience.md`, `ai-index.md`, `repo-map.json`, plus the CP14 delivery artifacts. One minor duplicate paragraph exists in `frontend-app-route-map.md` (see NB-POST-1). | Pass (minor issue noted) |
| 11 | **Route-registry metadata refresh.** `route-registry.ts` tenant navigation items use live descriptions: "Live tenant dashboard, lease visibility, and reviewer quick actions", "Visible binders, inline binder creation, and binder-detail entry", and "Tenant-admin user list, user creation, and role-change management." No CP12 placeholder wording. | Pass |
| 12 | **E2E runtime isolation.** E2E runtime uses compose project `paperbinder-e2e` with separate port `5081`, fully isolated from `scripts/start-local.ps1` and `scripts/validate-checkpoint.ps1`. The browser gate script starts and stops the runtime per spec file, ensuring fresh state for root-host and tenant-host suites. | Pass |
| 13 | **E2E closeout rule documented.** `docs/70-operations/runbook-local.md` documents the browser gate command as "Run frontend browser E2E" and the CP14 closeout requirement. `docs/80-testing/e2e-tests.md` documents the CP14 browser-gate ownership covering both root-host and tenant-host flows. Both confirm the browser suite is a separate required gate not bundled into `scripts/validate-checkpoint.ps1`. | Pass |
| 14 | **Acceptance criteria traceability.** Every acceptance criterion maps to automated coverage: live routes (E2E + component tests), shared-client-only transport (static grep), lease shell ownership (`Should_ExtendLeaseAndLogout_FromTenantShell_When_ActionsSucceed`), binder list/create (`Should_ListVisibleBinders_AndCreateBinder`), binder detail/doc create/policy (`Should_RenderBinderDetail_CreateDocument_AndUpdateBinderPolicy`), document detail (`Should_RenderReadOnlyArchivedDocument`), users (`Should_RenderTenantUsersAndApplyMutations`), error mapping (`Should_MapSharedAndRouteSpecificProblemDetailsCodes`), forbidden path (`Should_RenderSafeDeniedState_When_NonAdminRequestsUsersRoute`), and browser E2E for admin/normal/forbidden/expired/logout flows plus API header verification. | Pass |
| 15 | **No CP15 feature bleed.** No impersonation, audit, document editing, archive/unarchive UX, user deletion/reset, password recovery, new backend endpoints, BFF, SSR, second SPA, or browser token storage in the diff. | Pass |

---

## Locked Decisions Verification (Post-Implementation)

All locked decisions from the implementation plan hold in the implemented code.

| Decision | Verified Against | Post-Implementation Evidence |
| --- | --- | --- |
| Single React SPA, no BFF/SSR/framework-mode | `docs/20-architecture/frontend-spa.md` | All tenant-host routes are React components in `tenant-host.tsx`, rendered inside the existing `AppRouter` via `react-router-dom`. No new entry points, SSR, or framework-mode routing. |
| Tenant-host routes match canonical route map | `docs/20-architecture/frontend-app-route-map.md` | Routes `/app`, `/app/binders`, `/app/binders/:binderId`, `/app/documents/:documentId`, `/app/users` match the updated canonical table exactly. `TenantNotFoundPage` catches unmatched paths. |
| No new dashboard-specific backend contract | `docs/40-contracts/api-contract.md` | `DashboardPage` composes from `apiClient.listBinders()` plus the shell-owned lease state. No new backend endpoint was added. |
| Server-authoritative tenant identity | AGENTS.md hard invariants | `tenantSlug` in tenant-host code is display-only. Tenant resolution is in `host-context.ts`. No client-constructed tenant URLs. |
| Shared API client as sole browser `/api/*` path | `docs/50-engineering/frontend-standards.md` | Zero `fetch(` calls in `src/PaperBinder.Web/src/app/`. All 12 tenant-host API methods route through the shared `request` function with CSRF, correlation-id, and API-version handling. |
| Lease state owned at tenant-shell level | `docs/20-architecture/demo-tenant-lease.md` | `TenantShell` owns `lease` and `countdownSeconds` state. Refreshes on bootstrap, extend, route change, focus/visibility, and 60-second periodic interval. Child routes receive lease via `useOutletContext`. |
| Logout runs on tenant host only via `POST /api/auth/logout` | `docs/40-contracts/api-contract.md` | `handleLogout` calls `apiClient.logout()` which POSTs to `/api/auth/logout`, then navigates to root-host `/login`. No tenant-host login form. |
| Binder creation gated by `BinderWrite`; document creation within binder context | `docs/40-contracts/api-contract.md` RBAC | Binder creation on `/app/binders`; document creation on `/app/binders/:binderId` using route `binderId`. API policy is authoritative; no client-side policy shortcuts. |
| API policy remains authoritative; frontend guards are UX only | `docs/20-architecture/authn-authz.md` | Forbidden API responses are caught and rendered as `TenantRouteFailureCard`. Local role state is never used as a security boundary. |
| Document detail is read-only in V1 | `docs/00-intent/project-scope.md` | `DocumentDetailPage` renders content in a `<pre>` tag. No edit, replace, or archive controls. |
| E2E isolated from default reviewer/local stack | `docs/80-testing/e2e-tests.md` | Separate compose project `paperbinder-e2e`, separate `docker-compose.e2e.yml`, isolated port. Default stack is untouched. |
| ADR required before sticky markdown dependency | `docs/90-adr/README.md` | No new dependency was added. Document content renders as safe pre-formatted text. |

---

## Residual Risks

- **Manual VS Code and Visual Studio launch verification is still pending.** The PR artifact and checkpoint-status doc correctly call this out. CP14 cannot be marked `done` until this evidence is recorded. This is an external gate, not a code defect.
- **Mock challenge script still ships in the production image.** Carried forward from CP13. `e2e-turnstile.js` in `src/PaperBinder.Web/public/` is bundled by Vite and physically accessible in the container image, though inert under default configuration. CP16 hardening is the natural cleanup point.
- **E2E browser suite is now 5 specs across 2 files.** The suite exercises provisioning, login, binder/document CRUD, user management, binder policy, lease extension, logout/login cycle, forbidden path, and expired-tenant behavior. Environmental sensitivity (Docker, network, Playwright) creates a larger flakiness surface than the CP13 3-spec suite. The fresh-runtime-per-file strategy mitigates shared-state risk but increases total execution time.
- **`tenant-host.tsx` is 1841 lines.** The file is internally well-structured with clear component boundaries and the route tree at the bottom, but it is large for a single module. If CP15 or CP16 adds significant tenant-host complexity, extraction into per-route modules would reduce cognitive load. This is a natural refactoring opportunity, not a defect.

---

## Required Fixes Before Merge

- **NB-POST-1 (Low):** Remove the duplicate stale CP12 paragraph from `docs/20-architecture/frontend-app-route-map.md` line 56. This is a one-line documentation edit and does not require re-running validation.

All other findings are informational or deferred. The checkpoint is otherwise ship-ready pending the manual launch verification gate.
