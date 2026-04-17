# CP14 Critic Review: Tenant-Host Frontend Flows
Status: Pre-Implementation Review Complete

Reviewer: PaperBinder Critic
Date: 2026-04-16

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

## Blocking Findings

None.

---

## Non-Blocking Findings

### NB-1: ProblemDetails error-code enumeration is incomplete for document-creation validation

The cross-cutting ProblemDetails acceptance criterion enumerates `TENANT_FORBIDDEN`, `BINDER_POLICY_DENIED`, `TENANT_EXPIRED`, `TENANT_NOT_FOUND`, `RATE_LIMITED`, `LAST_TENANT_ADMIN_REQUIRED`, `TENANT_USER_EMAIL_CONFLICT`, `TENANT_USER_PASSWORD_INVALID`, `TENANT_ROLE_INVALID`, `BINDER_POLICY_INVALID`, `BINDER_NAME_INVALID`, and generic/network failures. The following API-contract error codes are reachable from CP14 tenant-host flows but absent from that enumeration:

- `DOCUMENT_TITLE_INVALID` (400 from `POST /api/documents`)
- `DOCUMENT_CONTENT_REQUIRED` (400 from `POST /api/documents`)
- `DOCUMENT_CONTENT_TOO_LARGE` (400 from `POST /api/documents`)
- `DOCUMENT_CONTENT_TYPE_INVALID` (422 from `POST /api/documents`)
- `DOCUMENT_BINDER_REQUIRED` (400 from `POST /api/documents`)
- `DOCUMENT_SUPERSEDES_INVALID` (422 from `POST /api/documents`)
- `BINDER_NOT_FOUND` (404 from `GET /api/binders/{binderId}`)
- `DOCUMENT_NOT_FOUND` (404 from `GET /api/documents/{documentId}`)
- `TENANT_USER_NOT_FOUND` (404 from `POST /api/tenant/users/{userId}/role`)

The document-creation acceptance criterion separately says "surfaces safe validation feedback for binder-required, title/content/content-type, supersedes, and policy-denied failures," which covers the document validation codes semantically. The 404 codes are covered by the existing not-found state handling. Coverage intent is present but the explicit enumeration is incomplete, which could lead to an implementor missing a display-safe mapping for a specific document or user error code.

Recommendation: add the missing codes to the ProblemDetails enumeration in the acceptance criteria, or explicitly note that the document-creation and user-management ACs own their route-specific codes and the cross-cutting list covers only shared/non-route-specific codes.

Severity: Low.

### NB-2: Lease-extend visibility versus TenantAdmin policy

The plan correctly states that `POST /api/tenant/lease/extend` requires the `TenantAdmin` policy (matching the API contract and `docs/20-architecture/demo-tenant-lease.md`). The lease-extend acceptance criterion says "The lease-extend action is wired through the shared API client only, uses the existing CSRF contract, refreshes lease state from the server response on success." However, the plan does not explicitly state whether the extend action affordance should be hidden or disabled for non-admin callers, or left visible with safe API-boundary denial.

The locked decision "Admin affordances may be hidden or disabled for better UX, but API policy behavior remains authoritative" covers this generically, and the plan is correct that the API is the security boundary. This is a UX-level ambiguity that the step-1 doc reconciliation pass should resolve: should a `BinderRead` user see "Extend lease" and get a 403, or should the affordance be absent? The answer affects both the tenant-shell component design and the E2E forbidden-path spec.

Recommendation: resolve during the step-1 doc reconciliation pass alongside the lease refresh cadence open decision. Record the decision in `docs/10-product/ux-notes.md` or the implementation plan.

Severity: Low.

### NB-3: Pre-CP13 "username" terminology drift remains in `component-specification-v1.md` and `prd.md`

The CP13 critic review (NB-POST-3) noted that `docs/10-product/component-specification-v1.md` (line 157, "Username is required.") and `docs/10-product/prd.md` (line 129, "Username/password authentication") still use "username" terminology, while all CP13-era docs and the implementation use "Email." The CP14 plan lists `component-specification-v1.md` as a likely touch point. Since CP14 is updating that document anyway, this is a low-cost opportunity to fix the residual drift and prevent it from propagating into new UI copy.

Recommendation: include the "username" -> "email" fix in the step-1 doc reconciliation pass for `component-specification-v1.md`. Consider fixing `prd.md` as well if it is being touched.

Severity: Informational.

### NB-4: E2E test-data complexity is higher than CP13

CP13's E2E suite only needed provisioning and login, which are self-bootstrapping flows. CP14's E2E suite needs to exercise binder creation, document creation, user management, binder policy, and lease extension, all of which require prior setup state. The plan correctly identifies the E2E browser suite as TDD slice 9, but does not explicitly discuss how test data will be created (e.g., inline E2E setup, shared fixture, or API-driven seeding within each spec).

This is an implementation detail rather than a plan defect, but the increased E2E setup complexity is a reliability risk for the browser suite, especially around test isolation and cleanup in a demo-tenant-with-lease environment. The step-1 doc reconciliation should confirm whether each E2E spec creates its own tenant or reuses a shared one, and how lease expiry timing interacts with test execution duration.

Recommendation: address E2E test-data strategy explicitly during the step-1 doc pass or early in TDD slice 9. Record the decision in the implementation plan or `docs/80-testing/e2e-tests.md`.

Severity: Low.

### NB-5: Mock challenge script still ships in the production image

Carried forward from CP13 critic review (NB-POST-1). The `e2e-turnstile.js` stub in `src/PaperBinder.Web/public/` is bundled into the production container image by Vite. It is inert under default configuration but physically accessible. CP14 does not need to fix this, but the residual risk remains visible. CP16 hardening is the natural home for this cleanup.

Severity: Informational (carried forward).

---

## Locked Decisions Verification

All locked decisions in the implementation plan are consistent with the canonical docs and prior checkpoint state.

| Decision | Verified Against |
| --- | --- |
| Single React SPA, no BFF/SSR/framework-mode | `docs/20-architecture/frontend-spa.md`, `docs/50-engineering/frontend-standards.md`, CP12 implementation |
| Tenant-host routes match canonical route map | `docs/20-architecture/frontend-app-route-map.md` tenant-host table |
| No new dashboard-specific backend contract | `docs/40-contracts/api-contract.md` (no dashboard aggregator endpoint exists) |
| Server-authoritative tenant identity | `docs/20-architecture/authn-authz.md`, `docs/30-security/AGENTS.md`, AGENTS.md hard invariants |
| Shared API client as sole browser `/api/*` path | `docs/50-engineering/frontend-standards.md`, CP12/CP13 implementation |
| Lease state owned at tenant-shell level | `docs/20-architecture/demo-tenant-lease.md`, `docs/20-architecture/frontend-app-route-map.md` |
| Logout runs on tenant host only via `POST /api/auth/logout` | `docs/20-architecture/identity-aspnet-core-identity.md`, `docs/40-contracts/api-contract.md` |
| Binder creation gated by `BinderWrite`; document creation within binder context | `docs/40-contracts/api-contract.md` RBAC policy map |
| API policy remains authoritative; frontend guards are UX only | `docs/20-architecture/authn-authz.md`, `docs/50-engineering/frontend-standards.md` |
| Document detail is read-only in V1 | `docs/00-intent/project-scope.md`, `docs/00-intent/non-goals.md`, `docs/40-contracts/api-contract.md` |
| E2E isolated from default reviewer/local stack | `docs/80-testing/e2e-tests.md`, CP13 `docker-compose.e2e.yml` precedent |
| ADR required before sticky markdown dependency | `docs/90-adr/README.md`, plan's own ADR triggers section |

---

## Required Plan Edits

None required before implementation begins. The non-blocking findings are recommendations that can be addressed during the step-1 doc reconciliation pass.

---

## Post-Implementation Checks

The following checks should be executed during the post-implementation critic review. They are listed now so the implementor can design toward them.

| # | Check |
| --- | --- |
| 1 | **No direct fetch in tenant-host components.** Grep for `fetch(` in `src/PaperBinder.Web/src/app/`: zero matches outside the shared client. All API calls route through the shared client. |
| 2 | **No credential or auth-token persistence.** Grep for `localStorage`, `sessionStorage` in `src/PaperBinder.Web/src/app/`: no storage writes for auth, lease, or tenant state. |
| 3 | **No client-constructed tenant URLs or client-side tenant identity.** Static review that tenant identity is always host-derived and server-authoritative. No `tenantSlug`-derived URL construction in route code. |
| 4 | **`PB_ENV=Test` isolation.** Grep confirms `PB_ENV: Test` appears only in `docker-compose.e2e.yml`, not in the default local or reviewer startup path. |
| 5 | **CP12 placeholder wording removed.** Grep for "CP12", "placeholder", and "deferred to CP14" in `tenant-host.tsx` and `route-registry.ts`: no residual placeholder copy in live route content or navigation metadata. |
| 6 | **Lease countdown does not become source of truth.** Static review that extension eligibility is never derived from client-side countdown state; all extend attempts go through the API and refresh from the server response. |
| 7 | **Shared API client methods cover all CP14 tenant-host endpoints.** Verify typed methods exist for binders (list, create, detail), binder policy (read, update), documents (detail, create), tenant users (list, create, role-change), lease extend, and logout. |
| 8 | **Binder-list omission semantics preserved.** Verify that `/app/binders` empty state is distinct from a 403 or 404 state: an empty list means "no visible binders" per the API contract, not "access denied." |
| 9 | **Markdown rendering safety.** If a new dependency was added, verify an ADR exists. Verify that raw HTML injection is not used. Verify that the rendering path is reviewed for XSS safety. |
| 10 | **Doc reconciliation completeness.** All docs listed in the plan's validation plan and likely touch points are updated in the same change set. |
| 11 | **Route-registry metadata refresh.** `route-registry.ts` tenant navigation items use live descriptions, not CP12 placeholder wording. |
| 12 | **E2E runtime isolation.** E2E runtime uses a separate compose project/port, isolated from `scripts/start-local.ps1` and `scripts/validate-checkpoint.ps1`. |
| 13 | **E2E closeout rule documented.** `docs/70-operations/runbook-local.md` and/or `docs/80-testing/e2e-tests.md` explicitly document the CP14 browser-gate command and closeout rule. |
| 14 | **Acceptance criteria traceability.** Every acceptance criterion from the implementation plan maps to at least one automated check (component test, utility test, or E2E spec). |
| 15 | **No CP15 feature bleed.** No impersonation, audit, document editing, archive/unarchive UX, user deletion/reset, or second frontend architecture layer in the diff. |

---

## Residual Risks

Even with no blockers, these risks should stay visible:

- **Markdown rendering dependency decision.** The open decision must land during step 1. If the chosen library has a large bundle, non-trivial sanitization requirements, or license concerns, the ADR gate could delay implementation. The plan correctly gates this.
- **E2E suite stability at scale.** CP14's browser suite is significantly more complex than CP13's three-spec root-host suite. Binder/document/user CRUD, lease timing, and multi-role flows increase environmental sensitivity and test duration. Flakiness could delay checkpoint closeout.
- **Lease timing in E2E.** Tests that exercise lease-extension behavior depend on the tenant being within the extension window (remaining <= 10 minutes). If E2E test execution takes longer than expected, lease state may drift. The test-data strategy should account for this.
- **Binder-policy UX complexity.** The `inherit` vs. `restricted_roles` mode with exact-role `allowedRoles` is the most complex form in CP14. Incorrect serialization or missing validation feedback could create a confusing admin experience. The TDD slice (slice 6) correctly isolates this.
