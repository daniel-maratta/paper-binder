# CP12 Implementation Plan: Frontend Foundation And Shared UI System
Status: Implemented

## Goal

Implement CP12 so the current CP11 placeholder SPA becomes a host-aware, testable frontend foundation: the route skeleton matches the canonical frontend route map, browser API behavior is centralized behind one client layer, and a small shared UI system exists for later root-host and tenant-host feature work without pulling CP13 or CP14 flows forward.

## Scope

Included:
- replace the current placeholder-only `src/PaperBinder.Web` app composition with root-host and tenant-host shell structure plus route skeletons that align to `docs/20-architecture/frontend-app-route-map.md`
- frontend runtime utilities for host-context detection, API request composition, ProblemDetails normalization, correlation-id exposure, and CSRF header wiring for unsafe authenticated requests
- shared UI primitives for buttons, cards, banners, form fields, tables, alerts, dialogs, and status badges, plus the minimal shell/layout wrappers needed to consume them consistently
- auth-aware tenant-route bootstrap behavior that stays inside existing backend contracts and does not introduce a new BFF or token flow
- checked-in frontend component/utility test coverage and repo-level test-pipeline wiring for the new frontend surface
- synchronized product, architecture, engineering, testing, execution, and delivery docs directly affected by CP12

Not included:
- root-host provisioning or login form wiring, challenge UX, redirect handling, or user-facing provisioning/login success flows (`CP13`)
- tenant-host binder, document, tenant-user, or lease feature implementations beyond route placeholders and generic shell/error states (`CP14`)
- lease countdown UI, lease-extension interaction, binder-policy editing UI, or logout-flow polish beyond shared primitives and client plumbing (`CP14+`)
- E2E browser automation, Playwright flow coverage, or reviewer-workflow end-to-end validation beyond CP12 foundation checks (`CP13+` and `CP14+`)
- new backend feature endpoints, a BFF/session API layer, SSR/framework-mode routing, realtime channels, or a second SPA/workspace
- new state-management, form-management, or data-fetching frameworks unless the owner explicitly approves a stack change first

## Locked Design Decisions

CP12 scope is stable at the checkpoint boundary. Implementation must not reopen these decisions without updating this plan and the affected canonical docs first.

- The frontend stays in the existing `src/PaperBinder.Web` workspace. CP12 does not split root-host and tenant-host experiences into separate apps.
- PaperBinder remains a client-rendered React SPA with direct API calls. No BFF, SSR, React Router framework mode, server loaders/actions, or token-storage flow is introduced in CP12.
- Host context remains browser-derived from the current request host plus the existing `VITE_PAPERBINDER_*` configuration contract. Client payloads, query parameters, or local/session storage must not become tenant-authoritative inputs.
- The frontend component-test tooling decision is a step-1 gate. Step 2 implementation does not begin until the chosen test command and its stack-governance posture are closed in the doc pass; if the owner classifies the chosen runner as a stack expansion, approval and any required ADR land in step 1 or implementation pauses.
- CP12 route skeleton must align to the canonical route map:
  - root host: `/`, `/login`, `/about`
  - tenant host: `/app`, `/app/binders`, `/app/binders/:binderId`, `/app/documents/:documentId`, `/app/users`
- Tenant-route auth awareness must stay inside existing backend contracts and use the existing `GET /api/tenant/lease` bootstrap seam in CP12. If implementation proves that endpoint insufficient, stop and revise this plan and the canonical docs before introducing any new bootstrap/session contract.
- The shared API client is the only browser path for `/api/*` calls in CP12. It must centralize `credentials: "include"`, `X-Api-Version`, CSRF header attachment for unsafe authenticated requests, ProblemDetails parsing, and correlation-id capture.
- CP12 shared UI work is limited to generic primitives and shell-level wrappers. Button, Card, and Banner are part of the CP12 primitive baseline; Banner lands as a structural shell primitive and reserved tenant-shell slot only, while lease countdown and extend interaction remain deferred to CP14.
- Do not build binder cards, document viewers, tenant-user tables, challenge widgets, or other feature-specific composites yet.
- Styling and tokens must converge toward `docs/10-product/ui-ux-contract-v1.md` and `docs/10-product/ui-style.md`; the current CP11 placeholder aesthetic is not the long-term UI baseline.
- Frontend automated coverage in CP12 stops at component and utility tests. E2E coverage begins in later frontend checkpoints.
- Do not add `react-hook-form`, `zod`, TanStack Query, Redux/Zustand, generated design-system scaffolding, or alternative frontend architecture layers in CP12 unless the owner explicitly approves that stack expansion first.

## Planned Work

1. Reconcile the CP12 doc boundary before broad implementation. This blocking pass must align `docs/20-architecture/frontend-spa.md`, `docs/20-architecture/frontend-app-route-map.md`, `docs/50-engineering/frontend-standards.md`, `docs/50-engineering/tech-stack.md`, `docs/10-product/ui-ux-contract-v1.md`, `docs/80-testing/test-strategy.md`, and `docs/80-testing/e2e-tests.md` on:
   - the CP12-only route skeleton versus later CP13/CP14 feature wiring
   - the shared primitive set expected from this checkpoint, including Button, Card, and Banner
   - the frontend component-test posture that replaces the current "placeholder-only UI" testing gap
   - the chosen frontend test command and whether that choice requires owner approval and ADR treatment under the stack-governance rules
2. Replace the current `App.tsx` placeholder surface with host-aware root-shell and tenant-shell app composition, route registration, and safe host-local catch-all behavior.
3. Add frontend infrastructure utilities for host detection, shared request/response handling, ProblemDetails normalization, correlation-id capture, retry-after extraction, and CSRF cookie/header bridging.
4. Add shared UI primitives for buttons, cards, banners, form fields, table structure, alert messaging, dialog composition, and status badges, along with shared tokens/layout wrappers that let later checkpoints build on one consistent baseline.
5. Add route-placeholder views that exercise the shell and primitive system without pulling forward provisioning, login, binder, document, or tenant-user feature logic.
6. Add component and utility tests in vertical slices for routing, host-awareness, API-client behavior, error handling, and the shared primitives.
7. Add a checked-in frontend test command and wire it into repo-native validation so `scripts/test.ps1` and CI can fail on frontend regressions with clear tool-native output. The first RED frontend test must land in the same change set as, or before, this wiring so the new pipeline cannot pass vacuously with zero CP12 tests discovered.
8. Synchronize the remaining canonical docs, delivery navigation, and repo metadata in the same change set.

## Open Decisions

- Closed on `2026-04-15`: CP12 uses Vitest with React Testing Library on jsdom plus `@testing-library/jest-dom` matchers. This is recorded in [ADR-0009](../../../90-adr/ADR-0009-frontend-component-test-stack-for-cp12.md) and synchronized through the canonical frontend/testing docs before broad implementation begins.

## Vertical-Slice TDD Plan

Public interfaces under test:
- new host-context and route-selection utilities under `src/PaperBinder.Web/src/`
- the CP12 app router and shell composition
- the shared API client and ProblemDetails/error-normalization layer
- shared UI primitives under a new `components/ui/`-style slice
- new frontend component/utility test entrypoints wired through `package.json` and repo scripts

Planned `RED -> GREEN -> REFACTOR` slices:

1. `RED`: `Should_ResolveRootOrTenantHostContext_When_LocationMatchesConfiguredDomains`
   `GREEN`: add the minimal host-context parser that distinguishes root-host and tenant-host runtime behavior from the configured environment contract.
   `REFACTOR`: centralize environment and host parsing so route selection and API helpers share one source of truth.
2. `RED`: `Should_RenderCanonicalRouteSkeleton_ForCurrentHostContext`
   `GREEN`: add the root-host and tenant-host route registry with shell layouts and route placeholders that match the canonical path map.
   `REFACTOR`: move route metadata into a shared registry so navigation and future feature routes do not drift from the router definition.
3. `RED`: `Should_SendCredentialsApiVersionAndCsrfHeader_When_ApiClientMakesRequest`
   `GREEN`: add the shared API client with `credentials: "include"`, `X-Api-Version`, unsafe-request CSRF header attachment, and basic JSON request composition.
   `REFACTOR`: split request construction from transport so later feature calls reuse one composable client seam.
4. `RED`: `Should_NormalizeProblemDetails_AndExposeErrorCodeCorrelationIdAndRetryAfter`
   `GREEN`: add shared ProblemDetails parsing and a stable client-error model for `401`, `403`, `404`, `410`, `429`, validation failures, and unexpected server failures.
   `REFACTOR`: centralize user-facing error mapping so later CP13/CP14 routes do not duplicate failure parsing.
5. `RED`: `Should_RenderAccessibleButtonCardBannerFormTableAlertDialogAndStatusBadgePrimitives`
   `GREEN`: add the shared UI primitives with accessible labeling, focus treatment, error messaging, banner-slot support, and variant support aligned to the CP12 baseline.
   `REFACTOR`: extract shared token/variant helpers so component styling stays consistent and easy to extend.
6. `RED`: `Should_RenderSafeTenantShellStates_When_BootstrapFailsWithoutFeatureData`
   `GREEN`: add generic loading, forbidden, expired, and not-found tenant-shell states backed by the shared client error model and UI primitives.
   `REFACTOR`: consolidate shell-state wrappers for later feature routes instead of hard-coding per-page placeholders.

Broad implementation should not start until these initial failing tests are named and the first slice is driving the route/bootstrap foundation. The frontend test-command wiring in planned work step 7 must land with a real failing test so the pipeline proves it can fail before broad implementation continues.

## Acceptance Criteria

- `src/PaperBinder.Web` exposes a route skeleton that matches the canonical CP12 route map for root-host and tenant-host contexts, and the current CP11 single-page placeholder is removed.
- Root-host routes render inside a root-shell layout, tenant-host routes render inside a tenant-shell layout, and route behavior stays host-local without inventing cross-host shortcuts or tenant identity from client-controlled inputs.
- The frontend uses one shared API client for `/api/*` calls, and that client:
  - sends `credentials: "include"`
  - sends `X-Api-Version: 1`
  - attaches `X-CSRF-TOKEN` on unsafe authenticated requests using the existing readable CSRF cookie contract
  - captures `X-Correlation-Id`
  - normalizes ProblemDetails into a stable client error shape
- Shared client error handling preserves at least `status`, `errorCode`, `detail`/message, correlation id, and `Retry-After` when present so later routes can render consistent failure UX without reparsing raw responses.
- Shared UI primitives exist for buttons, cards, banners, form fields, tables, alerts, dialogs, and status badges, and each primitive has an accessible baseline consistent with the product UI docs:
  - button primitives support primary, secondary, and danger variants plus hover, focus, disabled, and loading states
  - card primitives provide minimal grouped-content structure for shell and placeholder composition
  - banner primitives provide a tenant-shell banner slot and generic warning/notice presentation without pulling forward lease-specific countdown behavior
  - form primitives support labels, helper/error text, disabled state, and visible focus treatment
  - table primitives provide semantic table structure plus empty/loading affordances
  - alert primitives cover error and non-error states without color-only meaning
  - dialog primitives expose accessible title/description/open-close behavior
  - status badges provide neutral, success, warning, and danger-style variants suitable for lease and policy states
- Route-placeholder views prove the shells and primitives are usable without pulling forward real provisioning/login submissions, binder/document reads, tenant-user management, or lease-extension actions.
- Tenant-shell auth awareness uses existing backend contracts only and does not add a new BFF/session endpoint, JWT flow, or browser token storage path.
- A checked-in frontend test command exists, targeted component/utility tests cover the shared client and shared primitives, and repo-level validation runs that frontend test command explicitly.
- The first CP12 RED test lands before or with the frontend test-command wiring so the pipeline cannot pass vacuously with zero frontend tests discovered.
- CI includes explicit frontend test execution, either through an updated `scripts/test.ps1` path or a dedicated workflow step, and CI plus repo scripts fail clearly when frontend component tests fail.
- The implementation ships without root-host onboarding flows, tenant-host CRUD flows, E2E coverage, or feature-complete lease UI.
- Canonical product, architecture, engineering, testing, execution, and delivery docs are updated in the same change set as the implementation.

## Validation Plan

- pre-implementation scope-lock check that `docs/20-architecture/frontend-spa.md`, `docs/20-architecture/frontend-app-route-map.md`, `docs/50-engineering/frontend-standards.md`, `docs/50-engineering/tech-stack.md`, `docs/10-product/ui-ux-contract-v1.md`, `docs/80-testing/test-strategy.md`, and `docs/80-testing/e2e-tests.md` explicitly agree on the CP12 route skeleton, shared primitive set, chosen frontend test command, and component-test posture before broad code changes begin
- `npm.cmd run build` from `src/PaperBinder.Web`
- the checked-in frontend component-test command from `src/PaperBinder.Web`
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
- targeted frontend component/utility tests for host-context detection, route skeleton rendering, API client headers/CSRF behavior, ProblemDetails normalization, correlation-id and retry-after extraction, and each shared primitive's critical states
- static review that the frontend test-command wiring and the first RED test land together so the new path cannot pass with zero CP12 tests discovered
- static review or repo search that only the shared API client owns browser `/api/*` transport calls and no direct `fetch` or alternate HTTP path bypasses it
- CI workflow review that frontend tests execute explicitly, either through the updated repo test script or a dedicated CI step
- targeted manual verification of compiled SPA deep-link behavior for representative routes such as `/login`, `/app`, and `/app/binders` so route skeleton and fallback hosting stay aligned
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require`
- manual VS Code and Visual Studio launch verification recorded in the eventual CP12 PR artifact before checkpoint closeout

## Likely Touch Points

- `src/PaperBinder.Web/package.json`
- `src/PaperBinder.Web/vite.config.ts`
- `src/PaperBinder.Web/src/App.tsx`
- `src/PaperBinder.Web/src/main.tsx`
- `src/PaperBinder.Web/src/environment.ts`
- `src/PaperBinder.Web/src/styles.css`
- new frontend slices under `src/PaperBinder.Web/src/` for app composition, routing, API client utilities, shared UI primitives, and component/utility tests
- `scripts/test.ps1`
- `.github/workflows/ci.yml`
- `docs/10-product/ui-ux-contract-v1.md`
- `docs/10-product/ui-style.md`
- `docs/20-architecture/frontend-spa.md`
- `docs/20-architecture/frontend-app-route-map.md`
- `docs/50-engineering/frontend-standards.md`
- `docs/50-engineering/tech-stack.md`
- `docs/80-testing/test-strategy.md`
- `docs/80-testing/testing-standards.md`
- `docs/80-testing/e2e-tests.md`
- `docs/55-execution/phases/phase-4-frontend-experience.md`
- `docs/55-execution/checkpoint-status.md`
- `docs/90-adr/ADR-0009-frontend-component-test-stack-for-cp12.md`
- `docs/95-delivery/pr/cp12-frontend-foundation-and-shared-ui-system/`
- `docs/ai-index.md`
- `docs/repo-map.json`
- `src/PaperBinder.Api/Program.Partial.cs` and `tests/PaperBinder.IntegrationTests/FrontendHostingPolicyTests.cs` only if compiled frontend fallback behavior needs small alignment to support the CP12 route skeleton

## Critic Review Resolution Log

- `NB-1` Accepted and resolved: the plan now makes the frontend test-tooling decision a step-1 gate, adds `docs/50-engineering/tech-stack.md` to the reconciliation pass, and states that step 2 cannot begin until the test command and any approval/ADR posture are closed.
- `NB-2` Accepted and resolved: Button and Card are now part of the explicit CP12 primitive baseline, planned work, TDD slice 5, and acceptance criteria.
- `NB-3` Accepted and resolved: Banner is now part of the CP12 primitive baseline as a structural shell primitive and reserved tenant-shell slot, while lease-countdown and extend interaction remain explicitly deferred to CP14.
- `NB-4` Accepted and resolved: planned work, the TDD section, acceptance criteria, and validation now require the frontend test-command wiring to land with the first RED test so the pipeline cannot pass vacuously.
- `NB-5` Accepted and resolved: acceptance criteria and validation now explicitly require CI to execute frontend tests, whether through `scripts/test.ps1` or a dedicated workflow step.
- `NB-6` Accepted and resolved: `docs/55-execution/checkpoint-status.md` is now included in Likely Touch Points.
- `NB-7` Accepted and resolved: the validation plan now includes a static-review/search check that the shared API client remains the only browser path for `/api/*` calls; the post-implementation critic pass should verify the same invariant against the final diff.

## ADR Triggers And Boundary Risks

- ADR trigger: adding a new sticky frontend architecture dependency or pattern such as TanStack Query, Redux/Zustand, `react-hook-form`, `zod`, generated design-system scaffolding, or an alternate routing/runtime model beyond the current baseline.
- ADR trigger: introducing a new backend bootstrap/session endpoint, a BFF layer, or any server-assisted frontend composition path instead of keeping the SPA on direct API calls.
- ADR trigger: splitting root-host and tenant-host into separate frontend apps or adopting SSR/framework-mode behavior.
- Boundary risk: pulling CP13 onboarding work forward by wiring real provisioning/login submissions or challenge UI into CP12.
- Boundary risk: pulling CP14 tenant-product work forward by wiring binder/document/user/lease feature calls instead of keeping CP12 to shells, primitives, and generic route states.
- Boundary risk: letting route guards or layout state derive tenant identity from query params, path params, local storage, or other client-editable values would violate the server-authoritative tenant boundary.
- Boundary risk: bypassing the shared API client would create header, CSRF, ProblemDetails, and correlation-id drift across routes before real UI flows even land.
- Boundary risk: leaving frontend tests outside repo-native validation would preserve the current reviewer-visible testing gap and fail the checkpoint intent.
- Boundary risk: adding too much visual specificity in CP12 could accidentally hard-code feature behavior into primitives; the checkpoint should build foundations, not product-specific widgets.
