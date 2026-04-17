# CP14 Implementation Plan: Tenant-Host Frontend Flows
Status: Implemented

## Goal

Implement CP14 so the CP12 tenant-host shell and CP13 onboarding handoff become a live authenticated product surface: tenant members can land on `/app`, navigate binders and documents, create new binders and documents through the existing tenant-host contracts, tenant admins can manage users and binder policy, lease state is actionable, logout is real, and browser E2E covers the main reviewer workflow without pulling CP15 impersonation or broader hardening work forward.

## Scope

Included:
- live tenant-host `/app`, `/app/binders`, `/app/binders/:binderId`, `/app/documents/:documentId`, and `/app/users` views inside the existing `src/PaperBinder.Web` SPA
- a reviewer-useful tenant dashboard composed from existing tenant-host APIs rather than a new dashboard-specific backend contract
- binder list plus inline create flow, binder detail rendering, document-summary rendering, and document creation from binder detail using the existing binder and document contracts
- read-only document detail rendering for markdown content and archived-state visibility using the existing document contract
- tenant-admin-only user-management UI for list/create/role-change behavior and binder-policy read/update UI
- tenant-shell top-bar/banner wiring for lease countdown/status, lease extend, and logout
- tenant-host-safe ProblemDetails handling for authz, expiry, rate-limit, validation, and conflict failures across read and mutation flows
- browser E2E expansion for normal-user, admin, forbidden, expired, lease, and logout/login-cycle flows
- synchronized product, architecture, testing, operations, execution, and delivery docs directly affected by CP14

Not included:
- tenant-local impersonation, audit flows, or session masquerade (`CP15`)
- new backend endpoints, a new dashboard aggregator/bootstrap contract, a BFF layer, SSR/framework-mode routing, a second SPA, or browser token storage
- document editing, replace/version-history UI, archive/unarchive affordances, a dedicated document-list route, or search/filter/pagination work beyond what this checkpoint needs
- user deletion, password reset/recovery, profile editing, email verification, or multi-role aggregation
- realtime/push lease updates, websocket channels, or background browser sync beyond a minimal lease refresh strategy
- public-demo smoke expansion, broad browser-matrix work, or CI policy changes beyond the CP14 browser gate

## Locked Design Decisions

CP14 scope is stable at the checkpoint boundary. Implementation must not reopen these decisions without updating this plan and the affected canonical docs first.

- Reuse the current single React SPA, route map, and shared browser API client from CP12/CP13. CP14 does not introduce a BFF, SSR, React Router framework mode, route loaders/actions, or a second frontend workspace.
- Tenant-host routes remain the canonical paths already shipped in `docs/20-architecture/frontend-app-route-map.md`; binder and document create flows live inside those routes rather than on new create-only pages.
- Dashboard composition must stay on existing tenant-host endpoints. If CP14 needs a new dashboard-specific contract, stop and revise this plan plus the canonical docs before implementation begins.
- Tenant identity, binders, documents, roles, and lease authority remain server-resolved. The browser may hold route params and form state, but it must not construct tenant identity or policy decisions from local hints.
- The shared API client remains the only browser path for `/api/*` calls. Tenant-host route code may not call `fetch` directly or duplicate ProblemDetails parsing, CSRF handling, or correlation-id capture.
- Lease state is owned once at tenant-shell level. Countdown is presentation derived from the latest authoritative lease snapshot; successful extend must refresh from the server response rather than trust local arithmetic alone.
- CP14 does not add a new current-user role/bootstrap endpoint just to gate lease extension. When the lease window is open, the extend affordance may be rendered from lease eligibility alone; any non-admin extend attempt must fail safely through the existing API policy boundary.
- Logout runs only on tenant hosts through `POST /api/auth/logout` with the existing cookie-plus-CSRF contract, then returns the browser to the configured root host. CP14 does not add a tenant-host login form or client-built tenant redirect path.
- Binder creation is available only to callers allowed by `BinderWrite`; document creation is available only within a binder context and uses the binder route parameter plus server-side binder validation. CP14 does not add cross-binder document composition or client-side binder-policy shortcuts.
- Admin affordances may be hidden or disabled for better UX, but API policy behavior remains authoritative. CP14 must not treat local role state as a security boundary.
- Document detail remains read-only in v1. CP14 may render markdown, supersedes metadata, and archived state, but it must not add edit or replace flows.
- Browser E2E continues to run only through an isolated repo-native runtime that keeps `PB_ENV=Test` out of the default reviewer/local stack.
- Tenant-host browser E2E uses tenant-per-spec isolation by default. Shared tenant state is allowed only inside a deliberate serial scenario that validates same-tenant continuity, such as logout/login cycle or admin-to-non-admin transitions, and lease-window behavior must be made deterministic through isolated E2E setup or configuration rather than waiting for wall-clock countdown decay.
- If markdown rendering or another tenant-host feature requires a new sticky frontend dependency or sanitization strategy, the ADR must land before implementation. Unreviewed raw HTML injection is not acceptable.

## Planned Work

1. Reconcile the CP14 contract docs before broad implementation. This blocking pass must align `docs/20-architecture/frontend-app-route-map.md`, `docs/20-architecture/frontend-spa.md`, `docs/20-architecture/authn-authz.md`, `docs/20-architecture/identity-aspnet-core-identity.md`, `docs/20-architecture/demo-tenant-lease.md`, `docs/10-product/prd.md`, `docs/10-product/user-stories.md`, `docs/10-product/ux-notes.md`, `docs/10-product/ui-ux-contract-v1.md`, `docs/10-product/component-specification-v1.md`, `docs/80-testing/e2e-tests.md`, `docs/50-engineering/frontend-standards.md`, and `docs/70-operations/runbook-local.md` on:
   - live tenant-host route responsibilities versus remaining CP15 and CP16 work
   - binder creation living on `/app/binders` and document creation living on binder detail rather than new routes
   - route-specific ProblemDetails ownership for document-create and tenant-user flows versus the cross-cutting tenant-host error model
   - the rule that lease extension does not get a new role/bootstrap contract and therefore may rely on safe API-boundary denial for non-admin callers
   - tenant-shell logout ownership and the reviewer-visible post-logout landing behavior
   - lease banner/countdown/extend UX expectations and refresh model
   - residual `username` -> `Email` terminology cleanup in CP14-touched product docs
   - browser E2E tenant-data ownership, same-tenant serial-flow exceptions, and deterministic lease-window setup
   - the browser E2E entrypoint and closeout rule for the CP14 browser suite
   - whether document markdown rendering requires a new dependency and therefore an ADR
2. Extend the shared browser API client with typed tenant-host methods for binders, binder policy, documents, tenant users, lease extend, and logout, plus any tenant-host-specific error-mapping helpers built on the existing client error model.
3. Replace the CP12 tenant-host placeholders with a live shell-state seam that owns lease snapshot, countdown presentation, extend mutation, and logout mutation across the authenticated tenant routes.
4. Implement the `/app` dashboard using existing APIs only, with live lease visibility, quick links, and reviewer-useful summary content that does not require a new dashboard endpoint.
5. Implement `/app/binders` and `/app/binders/:binderId` with binder list/create, binder detail, visible document summaries, document-create affordances, and binder-policy management for `TenantAdmin`.
6. Implement `/app/documents/:documentId` with read-only document rendering, archived-state visibility, and safe fallback states that preserve tenant and binder boundary semantics.
7. Implement `/app/users` with tenant-admin list/create/role-change flows and safe deny behavior for non-admin callers.
8. Add component and utility coverage for tenant-shell state ownership, route rendering, binder/document/user mutations, logout, lease extend, and tenant-host ProblemDetails-to-UI mapping.
9. Expand the isolated browser E2E surface to cover tenant-host reviewer flows, explicit forbidden and expired paths, logout/login cycle, and API-header verification on a representative `/api/*` request.
10. Synchronize the remaining canonical docs, delivery navigation, and repository metadata in the same change set.

## Open Decisions

- Resolved on `2026-04-17`: CP14 broadens `scripts/run-root-host-e2e.ps1` into the explicit frontend browser gate rather than adding a second tenant-host-specific script. The broadened gate remains separate from `scripts/validate-checkpoint.ps1` and is documented in the runbook and PR artifact.
- Resolved on `2026-04-17`: document detail stays dependency-free and read-only. CP14 does not add a sticky markdown dependency or raw HTML injection path.
- Resolved on `2026-04-17`: lease refresh occurs on bootstrap, successful extend, route changes, focus or visibility regain, and a coarse periodic refresh so the countdown remains presentation-only without turning the shell into a noisy polling feature.

## Vertical-Slice TDD Plan

Public interfaces under test:
- new shared API client methods for binders, binder policy, documents, tenant users, lease extend, and logout
- the tenant-shell state/controller and tenant-host route components
- tenant-host error-mapping helpers on top of `PaperBinderApiError`
- the repo-native tenant-host browser E2E entrypoint and specs

Planned `RED -> GREEN -> REFACTOR` slices:

1. `RED`: `Should_RenderLiveTenantDashboard_When_TenantBootstrapAndSummaryReadsSucceed`
   `GREEN`: add the minimal tenant-shell controller and `/app` route wiring that renders live lease data and reviewer-useful dashboard content through existing endpoints only.
   `REFACTOR`: isolate shared tenant-shell state so later routes reuse one source of truth for lease, auth state, and host-local actions.
2. `RED`: `Should_ListVisibleBinders_AndCreateBinder_When_BinderRouteActionsSucceed`
   `GREEN`: add the minimal `/app/binders` list and binder-create mutation using the shared API client and existing shared primitives.
   `REFACTOR`: centralize tenant-host mutation-state handling so form, error, and loading behavior do not fork per route.
3. `RED`: `Should_RenderBinderDetail_AndCreateDocument_When_BinderReadAndDocumentCreateSucceed`
   `GREEN`: add binder-detail reads plus the smallest document-create flow that stays within the current binder route.
   `REFACTOR`: extract binder-detail document state so create success refreshes and error handling do not duplicate list behavior.
4. `RED`: `Should_RenderReadOnlyDocument_When_DocumentDetailSucceeds`
   `GREEN`: add the minimal document-detail route and safe markdown rendering path for read-only content plus archived-state visibility.
   `REFACTOR`: isolate document rendering and metadata presentation behind one reviewed seam.
5. `RED`: `Should_RenderTenantAdminUsersAndRoleChanges_When_AdminMutationsSucceed`
   `GREEN`: add `/app/users` list/create/role-change flows for `TenantAdmin`.
   `REFACTOR`: consolidate admin-route mutation helpers and role-presentation utilities.
6. `RED`: `Should_ReadAndUpdateBinderPolicy_When_TenantAdminSubmitsValidAllowedRoles`
   `GREEN`: add the minimal binder-policy read/update surface on binder detail without widening the route map.
   `REFACTOR`: centralize policy-form serialization and action-state mapping.
7. `RED`: `Should_RenderSafeTenantHostFailures_When_ReadsOrMutationsReturnProblemDetails`
   `GREEN`: add tenant-host-safe messaging for `TENANT_FORBIDDEN`, `BINDER_POLICY_DENIED`, `TENANT_EXPIRED`, `TENANT_NOT_FOUND`, `RATE_LIMITED`, validation failures, and conflict responses across the live routes.
   `REFACTOR`: consolidate tenant-host error mapping so dashboard, binders, documents, users, lease, and logout use one display-safe model.
8. `RED`: `Should_ExtendLeaseAndLogout_FromTenantShell_When_ActionsSucceed`
   `GREEN`: add the minimal extend and logout actions, server-authoritative lease refresh, and root-host return behavior after logout.
   `REFACTOR`: keep shell actions local to one controller rather than scattering route-level action seams.
9. `RED`: `Should_ExerciseNormalAdminForbiddenExpiredAndLogoutTenantFlows_InBrowser`
   `GREEN`: add the smallest stable Playwright tenant-host suite plus repo-native command wiring that proves the reviewer workflow through the isolated E2E runtime.
   `REFACTOR`: extract stable browser helpers only after the first end-to-end tenant flow passes.

Broad implementation should not start until the first failing tenant-host behavior test exists. Each later behavior must land through one new failing test at a time; CP14 is not a multi-route implementation dump.

## Acceptance Criteria

- The tenant-host routes `/app`, `/app/binders`, `/app/binders/:binderId`, `/app/documents/:documentId`, and `/app/users` are live product routes rather than CP12 placeholders.
- Tenant-host interactive flows use semantic labels, visible focus treatment, keyboard-reachable navigation and actions, and non-color-only error or status messaging consistent with the existing shared UI primitives.
- The tenant shell always shows current lease status, expiry timestamp, and a visible countdown derived from authoritative lease data.
- The lease-extend action is wired through the shared API client only, uses the existing CSRF contract, refreshes lease state from the server response on success, and surfaces safe handling for `TENANT_LEASE_EXTENSION_WINDOW_NOT_OPEN`, `TENANT_LEASE_EXTENSION_LIMIT_REACHED`, `RATE_LIMITED`, `TENANT_EXPIRED`, and unexpected failures.
- CP14 does not add a new current-user role/bootstrap contract just to gate lease extension; when the extend action is shown to a non-admin caller, the attempt must fail safely through the existing API policy boundary and surface a display-safe forbidden state.
- Logout is available from the tenant shell, uses `POST /api/auth/logout` through the shared client only, and returns the browser to the configured root host without inventing a tenant-host login route.
- The `/app` dashboard renders live tenant-host content using existing APIs only and does not require a new dashboard-specific backend contract.
- `/app/binders` lists only binders visible to the current caller, consistent with the omission semantics of `GET /api/binders`.
- Binder creation is available on `/app/binders` for callers allowed by `BinderWrite`, and CP14 does not add a separate create-binder page or client-side tenant or binder authority.
- `/app/binders/:binderId` renders binder metadata plus visible document summaries from the live binder-detail contract.
- Document creation lives inside binder detail, uses the existing `POST /api/documents` contract, and surfaces safe validation feedback for binder-required, title/content/content-type, supersedes, and policy-denied failures.
- `/app/documents/:documentId` renders read-only document content and metadata from the live contract, including archived-state visibility, without introducing edit or replace affordances.
- `/app/users` is a live tenant-admin route that supports list, create, and role-change flows through the existing tenant-user APIs.
- Non-admin callers receive safe forbidden behavior for admin-only tenant-user and binder-policy actions; frontend visibility guards improve UX but do not replace API policy enforcement.
- Binder-policy management is available to `TenantAdmin` on binder detail, reads the existing policy contract, submits only the documented `mode` and `allowedRoles` payload, and surfaces safe handling for invalid or denied updates.
- Tenant-host ProblemDetails handling renders safe, actionable messaging for shared tenant-host failures including `TENANT_FORBIDDEN`, `BINDER_POLICY_DENIED`, `TENANT_EXPIRED`, `TENANT_NOT_FOUND`, `RATE_LIMITED`, `LAST_TENANT_ADMIN_REQUIRED`, `TENANT_USER_EMAIL_CONFLICT`, `TENANT_USER_PASSWORD_INVALID`, `TENANT_ROLE_INVALID`, `BINDER_POLICY_INVALID`, `BINDER_NAME_INVALID`, and generic unexpected or network failures.
- Route-specific tenant-host validation and not-found handling also renders display-safe messaging for `BINDER_NOT_FOUND`, `DOCUMENT_NOT_FOUND`, `DOCUMENT_TITLE_INVALID`, `DOCUMENT_CONTENT_REQUIRED`, `DOCUMENT_CONTENT_TOO_LARGE`, `DOCUMENT_CONTENT_TYPE_INVALID`, `DOCUMENT_BINDER_REQUIRED`, `DOCUMENT_SUPERSEDES_INVALID`, and `TENANT_USER_NOT_FOUND`.
- No tenant-host component uses direct `fetch`, browser token storage, generated client tenant URLs, or cross-host tenant guesses; all API calls flow through the shared client and tenant identity remains host-derived and server-authoritative.
- The CP14 browser suite covers:
  - provision or login into a tenant host, then navigate the authenticated tenant routes
  - binder creation plus document creation and document view
  - tenant-admin user-management and binder-policy flows
  - lease extension behavior when eligible
  - forbidden same-tenant behavior for a restricted or admin-only path
  - expired-tenant behavior
  - logout and root-host login or return cycle
  - at least one representative assertion that `X-Api-Version` is sent and `X-Correlation-Id` is returned
- The CP14 browser suite uses deterministic tenant-owned setup: each spec or explicit serial scenario owns its tenant data inside the isolated E2E runtime, and lease-extend scenarios do not wait on real-time countdown decay.
- The implementation ships without CP15 impersonation, document editing or history UI, archive or unarchive UX, user deletion or reset flows, new backend aggregator endpoints, or a second frontend architecture layer.
- Canonical product, architecture, testing, operations, execution, and delivery docs are updated in the same change set as the implementation.

## Validation Plan

- pre-implementation scope-lock check that `docs/20-architecture/frontend-app-route-map.md`, `docs/20-architecture/frontend-spa.md`, `docs/20-architecture/authn-authz.md`, `docs/20-architecture/identity-aspnet-core-identity.md`, `docs/20-architecture/demo-tenant-lease.md`, `docs/10-product/prd.md`, `docs/10-product/user-stories.md`, `docs/10-product/ux-notes.md`, `docs/10-product/ui-ux-contract-v1.md`, `docs/10-product/component-specification-v1.md`, `docs/80-testing/e2e-tests.md`, `docs/50-engineering/frontend-standards.md`, and `docs/70-operations/runbook-local.md` explicitly agree on route ownership, binder and document create locations, route-specific ProblemDetails ownership, lease-extend visibility and denial behavior, tenant-shell logout behavior, lease refresh model, browser E2E tenant-data strategy and closeout, residual `Email` terminology, and markdown-rendering or ADR posture before broad code changes begin
- `npm.cmd run build` from `src/PaperBinder.Web`
- `npm.cmd run test` from `src/PaperBinder.Web`
- the resolved tenant-host browser E2E command from the repo-native CP14 entrypoint
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
- the resolved CP14 browser-gate closeout path:
  - either the broadened browser E2E script or entrypoint that now owns both root-host and tenant-host flows
  - or the existing root-host gate plus a second required tenant-host browser command documented in `docs/70-operations/runbook-local.md`
- targeted component and utility tests for tenant-shell countdown behavior, lease-extend success and forbidden failure, logout, binder list and create, binder detail and document create, document detail rendering, users list and create and role change, binder-policy form serialization, and tenant-host error mapping including the route-specific document and tenant-user codes owned by CP14 flows
- targeted browser tests for normal-user, admin, forbidden, expired, and logout/login-cycle flows, including explicit ownership of tenant setup and deterministic lease-window setup for any lease-extend scenario
- static review or repo search that tenant-host route code does not use direct `fetch`, local or session storage for auth or lease state, or client-built tenant redirects
- static review that lease countdown presentation does not become the source of truth for extension eligibility and always re-validates against server responses
- static review that `PB_ENV=Test` remains isolated to the browser E2E runtime and is not added to the default local or reviewer startup path
- static review that browser E2E specs do not rely on undeclared cross-spec shared tenant state and do not wait for wall-clock lease decay to enter the extension window
- static review that the CP12 placeholder wording is removed from tenant-host route metadata, docs, and route copy
- static review that markdown rendering does not use unreviewed raw HTML injection and that any new dependency lands with an ADR if required
- static review that CP14-touched product docs use `Email` rather than residual `username` terminology
- acceptance-criteria traceability review that every CP14 acceptance criterion maps to at least one automated test or explicit manual verification step
- manual reviewer verification with the local stack: provision a tenant, land on `/app`, create a binder, create a document, view the document, manage a user and binder policy as admin, confirm forbidden behavior as a lower-privilege user, extend the lease when eligible, log out, and log back in from the root host
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require`
- manual VS Code and Visual Studio launch verification recorded in the eventual CP14 PR artifact before checkpoint closeout

## Likely Touch Points

- `src/PaperBinder.Web/package.json`
- `src/PaperBinder.Web/src/api/client.ts`
- `src/PaperBinder.Web/src/api/client.test.ts`
- `src/PaperBinder.Web/src/app/tenant-host.tsx`
- `src/PaperBinder.Web/src/app/route-registry.ts`
- `src/PaperBinder.Web/src/app/root-host.tsx` only if logout and return-to-root behavior needs small alignment with the existing onboarding surface
- new or updated tenant-host state, error, and test slices under `src/PaperBinder.Web/src/app/` and `src/PaperBinder.Web/src/test/`
- `src/PaperBinder.Web/src/components/ui/`
- `src/PaperBinder.Web/e2e/`
- `scripts/run-root-host-e2e.ps1` or a new broader browser E2E script if the CP14 browser gate changes ownership
- `docs/10-product/user-stories.md`
- `docs/10-product/prd.md`
- `docs/10-product/ux-notes.md`
- `docs/10-product/ui-ux-contract-v1.md`
- `docs/10-product/component-specification-v1.md`
- `docs/10-product/accessibility.md`
- `docs/20-architecture/frontend-spa.md`
- `docs/20-architecture/frontend-app-route-map.md`
- `docs/20-architecture/authn-authz.md`
- `docs/20-architecture/identity-aspnet-core-identity.md`
- `docs/20-architecture/demo-tenant-lease.md`
- `docs/40-contracts/api-contract.md`
- `docs/50-engineering/frontend-standards.md`
- `docs/70-operations/runbook-local.md`
- `docs/80-testing/test-strategy.md`
- `docs/80-testing/testing-standards.md`
- `docs/80-testing/e2e-tests.md`
- `docs/55-execution/phases/phase-4-frontend-experience.md`
- `docs/55-execution/checkpoint-status.md`
- `docs/90-adr/` if markdown rendering or frontend dependency choices trigger a new ADR
- `docs/95-delivery/pr/cp14-tenant-host-frontend-flows/`
- `docs/ai-index.md`
- `docs/repo-map.json`

## Critic Review Resolution Log

- `NB-1` Accepted and resolved: the acceptance criteria and validation plan now distinguish shared tenant-host error handling from route-specific document and tenant-user validation/not-found codes, including `BINDER_NOT_FOUND`, `DOCUMENT_NOT_FOUND`, `DOCUMENT_TITLE_INVALID`, `DOCUMENT_CONTENT_REQUIRED`, `DOCUMENT_CONTENT_TOO_LARGE`, `DOCUMENT_CONTENT_TYPE_INVALID`, `DOCUMENT_BINDER_REQUIRED`, `DOCUMENT_SUPERSEDES_INVALID`, and `TENANT_USER_NOT_FOUND`.
- `NB-2` Accepted and resolved: locked design decisions, planned work step 1, acceptance criteria, and validation now explicitly state that CP14 will not add a new current-user role/bootstrap contract for lease extension; the extend affordance may rely on lease eligibility and non-admin attempts must fail safely through the API policy boundary.
- `NB-3` Accepted and resolved: planned work step 1, the validation plan, and likely touch points now include residual `username` -> `Email` terminology cleanup in `docs/10-product/component-specification-v1.md` and `docs/10-product/prd.md` as part of the step-1 doc reconciliation pass.
- `NB-4` Accepted and resolved: locked design decisions, planned work step 1, acceptance criteria, and validation now require an explicit CP14 browser E2E tenant-data strategy with tenant-per-spec ownership by default, narrow serial same-tenant exceptions, and deterministic lease-window setup instead of waiting on wall-clock timing.
- `NB-5` Deferred intentionally: the inert mock challenge script carried forward from CP13 remains a CP16 hardening concern rather than CP14 scope. This plan continues to require `PB_ENV=Test` isolation for the browser runtime but does not widen CP14 to rework the production image bundle.

## ADR Triggers And Boundary Risks

- ADR trigger: adding a new sticky frontend dependency for markdown rendering, sanitization, rich form handling, state management, or browser E2E beyond the current stack lock.
- ADR trigger: introducing a new dashboard bootstrap endpoint, a BFF, a second SPA, SSR or framework-mode routing, or another long-lived frontend architecture layer.
- ADR trigger: changing the server-authoritative logout, lease, or tenant-host boundary model already locked by the current auth and tenancy docs.
- Boundary risk: CP14 can easily sprawl into CP15 impersonation, archive or history UX, broader hardening work, or other reviewer polish that is real but out of checkpoint scope.
- Boundary risk: binder-list omission semantics versus explicit `403` and `404` route behavior can be flattened incorrectly into empty states if the UI does not preserve the API contract distinctions.
- Boundary risk: treating client countdown state or local role state as authoritative would create misleading UX and could mask real lease or policy behavior.
- Boundary risk: markdown rendering can become an XSS surface or dependency-sprawl decision if the strategy is not locked before implementation.
- Boundary risk: expanding the browser suite without a clear repo-native entrypoint and closeout rule will create ambiguous checkpoint completion criteria.
- Boundary risk: bypassing the shared API client would reintroduce header, CSRF, ProblemDetails, and correlation-id drift across the tenant-host routes just as the main reviewer workflow goes live.
