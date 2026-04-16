# CP13 Implementation Plan: Root-Host Frontend Flows
Status: Implemented

## Goal

Implement CP13 so the CP12 root-host placeholder shell becomes a live browser onboarding surface: visitors can provision a demo tenant or log in from the root host, complete challenge verification, receive clear safe failure feedback, and land on the correct tenant host using the existing backend contracts without pulling CP14 tenant-host feature work forward.

## Scope

Included:
- root-host `/` provisioning flow and `/login` login flow inside the existing `src/PaperBinder.Web` SPA
- a thin root-host challenge integration plus minimal client-side required-field validation before pre-auth submission
- shared API client additions for `POST /api/provision` and `POST /api/auth/login`
- root-host success handling for one-time provisioning credentials, redirect handoff via server-provided `redirectUrl`, loading states, and retry-safe user feedback
- user-facing ProblemDetails handling for root-host pre-auth failures, including stable messaging for `CHALLENGE_REQUIRED`, `CHALLENGE_FAILED`, `RATE_LIMITED`, `INVALID_CREDENTIALS`, `TENANT_EXPIRED`, `TENANT_NAME_INVALID`, and `TENANT_NAME_CONFLICT`
- the first browser E2E automation for root-host happy and deny paths, including explicit closure of the remaining `CHALLENGE_FAILED` coverage gap tracked in `T-0024`
- synchronized product, architecture, testing, operations, execution, and delivery docs directly affected by CP13

Not included:
- tenant-host dashboard, binder, document, user-management, lease-countdown, lease-extend, or logout UI (`CP14`)
- new backend auth/provision contracts, new bootstrap/session endpoints, or a BFF layer
- a separate root-host SPA, SSR/framework-mode routing, server loaders/actions, browser token storage, or query-string tenant handoff
- password reset/recovery, remembered-tenant helpers, saved credentials, or any credential re-fetch path after the provisioning response
- advanced client-side schema validation, new form/state-management frameworks, or challenge-provider switching
- broad browser-matrix expansion, public-demo smoke automation, or reviewer-workflow coverage beyond root-host provision/login flows

## Locked Design Decisions

CP13 scope is stable at the checkpoint boundary. Implementation must not reopen these decisions without updating this plan and the affected canonical docs first.

- Reuse the current single React SPA, root-host shell, and shared API client from CP12. CP13 does not introduce a BFF, SSR, React Router framework mode, or a second app/workspace.
- Root-host browser work stays on the canonical routes `/` and `/login`; `/about` remains static. Tenant-host route behavior remains as-shipped in CP12.
- Provisioning and login requests continue to send only the existing backend payloads plus `challengeToken`; the browser does not construct tenant identity, redirect hosts, or challenge outcomes locally.
- Successful provision and login must use the absolute server-provided `redirectUrl` returned by the API. The client must not synthesize tenant-host URLs from `tenantSlug`, email domain, or any other client-held value.
- Provisioning credentials are displayed only from the successful `POST /api/provision` response and remain in transient in-memory UI state only. CP13 must not persist generated credentials to localStorage, sessionStorage, cookies, query params, or any new backend store.
- To satisfy both "shown once" and redirect requirements without inventing cross-host credential transport, successful provisioning uses a short-lived root-host handoff state: show credentials once, keep the user already signed in, and expose an explicit user-initiated `Continue to tenant` action that navigates to `redirectUrl`. CP13 must not auto-fire the redirect while credentials are still being shown.
- Challenge UX is a thin root-host adapter over the existing provider contract. Prefer a small local component/hook and the provider script over adding a wrapper dependency; if raw integration proves untenable, stop and request approval before introducing a new frontend challenge package.
- Challenge-wrapper accessibility obligations apply to browser-owned markup only: CP13 must provide the widget container label, helper/error association, and visible focus/error affordances around the provider surface, while the provider widget internals remain a third-party constraint rather than a reason to widen scope or add a wrapper dependency.
- Minimal client-side validation is allowed only for empty/required input and obvious submit guards. Server-side validation and ProblemDetails remain authoritative for tenant-name normalization, challenge rejection, invalid credentials, rate limits, and expired tenants.
- CP13 continues to use lightweight native React form handling. Do not add `react-hook-form`, `zod`, TanStack Query, Redux/Zustand, or another state/form stack to simplify the root-host flows.
- The shared API client remains the only browser path for `/api/*` requests. Root-host route components may not call `fetch` directly or duplicate ProblemDetails parsing.
- Browser automation uses the existing test-only challenge bypass contract under `PB_ENV=Test`; do not weaken the default local/demo runtime by enabling bypass outside an explicit E2E test environment.
- If the explicit E2E runtime uses Docker Compose, it must be isolated behind a dedicated override file or dedicated startup entrypoint that is excluded from the default `scripts/start-local.ps1`, `scripts/reviewer-full-stack.ps1`, and base `docker-compose.yml` reviewer path.
- CP13 closeout must record one explicit E2E validation rule: either the root-host E2E suite is integrated into `scripts/validate-checkpoint.ps1`, or `docs/70-operations/runbook-local.md` declares it as a separate required command/manual gate. Ambiguous "run this somewhere during closeout" wording is not acceptable.

## Planned Work

1. Reconcile the CP13 contract docs before broad implementation. This blocking doc pass must align `docs/20-architecture/frontend-app-route-map.md`, `docs/20-architecture/frontend-spa.md`, `docs/10-product/user-stories.md`, `docs/10-product/ux-notes.md`, `docs/10-product/ui-ux-contract-v1.md`, `docs/80-testing/e2e-tests.md`, `docs/50-engineering/frontend-standards.md`, `docs/70-operations/runbook-local.md`, and `docs/05-taskboard/tasks/T-0024-track-remaining-test-coverage-gaps.md` on:
   - root-host route responsibilities between `/` and `/login`
   - `email` as the canonical login field label, matching the live API contract
   - the provisioning success handoff sequence for one-time credentials plus redirect
   - the explicit user-owned accessibility responsibilities for the challenge wrapper markup
   - the exact CP13 error UX expectations for challenge, credentials, expiry, and rate limits
   - the small repo-native E2E command, its dedicated test-runtime expectations, and whether checkpoint closeout runs it through `scripts/validate-checkpoint.ps1` or through a separately documented required gate
2. Extend the shared browser API client with typed `provision` and `login` methods plus any root-host-specific error-mapping helpers needed on top of the existing client error model.
3. Replace the CP12 disabled root-host placeholders with live provision and login forms, loading/disabled states, root-host navigation links, route-local safe fallbacks, and refreshed root-route metadata that no longer describes the pages as placeholders.
4. Add the thin challenge adapter and lifecycle handling needed to collect a challenge token, prevent empty submissions, and refresh/reset the token after relevant failures without storing provider secrets in the browser.
5. Add root-host success handoff behavior for provisioning and login that uses the server-provided `redirectUrl`, displays one-time credentials only on provision success, and preserves the existing signed-in cookie flow.
6. Add component and utility tests for root-host form behavior, redirect orchestration, ProblemDetails-to-UI mapping, and challenge/reset behavior.
7. Add the first browser E2E harness and a small stable root-host suite that covers provisioning success, login success, and representative deny paths, including the remaining explicit `CHALLENGE_FAILED` gap.
8. Wire the root-host E2E command into the repo's validation surface, document the explicit E2E startup/runtime path so automation does not depend on a manually prepared environment, and verify any Compose-based test runtime stays isolated from the default reviewer/local stack.
9. Synchronize the remaining canonical docs, delivery navigation, and repository metadata in the same change set.

## Open Decisions

- E2E startup shape: the plan requires an explicit automation-only runtime that enables `PB_ENV=Test` without changing the default local/demo stack. Whether this lands as a Compose override, a dedicated startup script, or an equivalent isolated path can be chosen during the step-1 doc pass as long as the default runtime stays unchanged and the closeout gate is recorded unambiguously.

## Vertical-Slice TDD Plan

Public interfaces under test:
- new shared API client methods for `POST /api/provision` and `POST /api/auth/login`
- the root-host route components and their submit/redirect orchestration
- the thin challenge adapter and any root-host error-mapping helpers
- the repo-native browser E2E entrypoint for root-host flows

Planned `RED -> GREEN -> REFACTOR` slices:

1. `RED`: `Should_SubmitProvisionRequest_WithTenantNameAndChallengeToken_When_RootHostProvisionFormIsValid`
   `GREEN`: add the minimal shared API client method and root-host provision submit wiring.
   `REFACTOR`: centralize root-host submit helpers so provision and login do not duplicate request-state handling.
2. `RED`: `Should_ShowProvisionedCredentialsOnce_AndRedirectUsingServerProvidedUrl_When_ProvisionSucceeds`
   `GREEN`: add the minimal success handoff state for one-time credentials plus redirect.
   `REFACTOR`: isolate handoff-state management so credentials remain transient and in-memory only.
3. `RED`: `Should_SubmitLoginRequest_AndRedirectUsingServerProvidedUrl_When_RootHostLoginSucceeds`
   `GREEN`: add the minimal `/login` submit path using the shared client and returned `redirectUrl`.
   `REFACTOR`: share root-host loading and success orchestration without inventing a generic auth framework.
4. `RED`: `Should_RenderSafeRootHostErrors_When_ProvisionOrLoginReturnsProblemDetails`
   `GREEN`: add route-aware error presentation for challenge failures, invalid credentials, tenant-name failures, rate limits, expired tenants, and unexpected network failures.
   `REFACTOR`: centralize user-facing root-host error mapping on top of the shared API error model.
5. `RED`: `Should_ResetChallengeState_When_PreAuthSubmissionFails_AndRetryIsAllowed`
   `GREEN`: add the minimal challenge lifecycle behavior needed to retry after failure without bypassing the server-side contract.
   `REFACTOR`: keep provider-specific browser details behind one local seam.
6. `RED`: `Should_ProvisionAndAutoLogin_FromRootHost_InBrowser_AgainstTheExplicitE2ERuntime`
   `GREEN`: add the minimal browser harness plus one provisioning happy-path spec using the test-only challenge bypass token through the real UI seam.
   `REFACTOR`: extract stable root-host helpers only after the first browser flow passes.
7. `RED`: `Should_SurfaceChallengeFailureInvalidCredentialsAndRateLimit_InBrowserWithoutLeakingInternals`
   `GREEN`: add the deny-path E2E cases, including explicit `CHALLENGE_FAILED` coverage that closes `T-0024`.
   `REFACTOR`: keep E2E fixtures deterministic and route-local rather than growing a large browser test framework.

Broad implementation should not start until the first failing root-host behavior test exists. Each later behavior must land through one new failing test at a time; CP13 is not a multi-flow implementation dump.

## Acceptance Criteria

- The root host exposes a live provisioning flow on `/` and a live login flow on `/login`, and the CP12 disabled placeholders for those routes are removed.
- Root-host forms use semantic labels, visible focus treatment, inline validation/help messaging, and loading/disabled states consistent with the existing shared UI primitives.
- The login field label is `Email`, matching the API contract payload and avoiding any remaining `username` terminology drift in CP13-owned docs.
- Provisioning submits tenant name plus `challengeToken` through the shared API client only; empty submissions are blocked client-side, but authoritative normalization and validation remain server-side.
- Login submits email, password, and `challengeToken` through the shared API client only and does not require any client-side tenant selector.
- Successful provisioning shows one-time generated credentials exactly once in the root-host handoff state, keeps those credentials transient in memory only, and redirects to the tenant host only through an explicit user-initiated continue action that uses the server-provided `redirectUrl`.
- Successful login redirects to the tenant host using the server-provided `redirectUrl` and does not require the client to derive tenant routing from user-entered data.
- Root-host ProblemDetails handling renders safe, actionable messaging for `CHALLENGE_REQUIRED`, `CHALLENGE_FAILED`, `RATE_LIMITED` including `Retry-After` guidance when present, `INVALID_CREDENTIALS`, `TENANT_EXPIRED`, `TENANT_NAME_INVALID`, `TENANT_NAME_CONFLICT`, and generic unexpected/network failures.
- The challenge UI is required before submit and resets or refreshes after relevant failures; CP13 does not introduce browser-side provider verification, provider secrets, or a non-root-host challenge surface.
- The browser-owned challenge wrapper markup meets the project's accessibility baseline for label, helper/error association, keyboard reachability, and visible state messaging, even though the provider widget internals remain third-party-controlled.
- No root-host component uses direct `fetch`, stores generated credentials in browser storage, or builds tenant URLs locally; all API calls flow through the shared client and all redirects use the server-provided `redirectUrl`.
- Root-host route metadata and navigation descriptions are refreshed from CP12 placeholder wording to live CP13 onboarding wording.
- CP13 introduces a checked-in browser E2E suite and repo-native command that covers:
  - provisioning success with the test-only challenge bypass in the explicit E2E runtime
  - login success with existing credentials
  - representative deny paths for `CHALLENGE_FAILED`, `INVALID_CREDENTIALS`, and `RATE_LIMITED`
- The E2E runtime path is isolated from the default reviewer/local stack, and CP13 closeout unambiguously records whether the browser suite runs inside `scripts/validate-checkpoint.ps1` or as a separately required gate documented in `docs/70-operations/runbook-local.md`.
- The remaining explicit `CHALLENGE_FAILED` coverage gap tracked in `T-0024` is closed at the appropriate browser boundary.
- The implementation ships without tenant-host feature CRUD, lease countdown/extend UI, logout polish, password recovery, or a second frontend architecture layer.
- Canonical product, architecture, testing, operations, execution, and delivery docs are updated in the same change set as the implementation.

## Validation Plan

- pre-implementation scope-lock check that `docs/20-architecture/frontend-app-route-map.md`, `docs/20-architecture/frontend-spa.md`, `docs/10-product/user-stories.md`, `docs/10-product/ux-notes.md`, `docs/10-product/ui-ux-contract-v1.md`, `docs/80-testing/e2e-tests.md`, `docs/50-engineering/frontend-standards.md`, `docs/70-operations/runbook-local.md`, and `docs/05-taskboard/tasks/T-0024-track-remaining-test-coverage-gaps.md` explicitly agree on root-host route ownership, `email` as the canonical login field label, the user-initiated provisioning handoff, challenge-wrapper accessibility duties, the E2E runtime path, and the checkpoint-closeout rule for running the E2E suite before broad code changes begin
- `npm.cmd run build` from `src/PaperBinder.Web`
- `npm.cmd run test` from `src/PaperBinder.Web`
- the checked-in root-host E2E command from `src/PaperBinder.Web` against the explicit E2E runtime (likely `npm.cmd run test:e2e` or equivalent)
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
- the resolved checkpoint closeout path for the CP13 E2E suite:
  - either `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require` once it includes the browser suite
  - or the separate required E2E command documented in `docs/70-operations/runbook-local.md` and recorded in the CP13 PR artifact
- targeted component and utility tests for root-host submit enable/disable behavior, redirect orchestration, ProblemDetails-to-UI mapping, and the rule that generated credentials never leave transient UI state
- targeted component or browser-level verification that the challenge wrapper exposes label, helper/error association, and visible state feedback even though the provider widget internals remain third-party-controlled
- static review or repo search that root-host components do not use direct `fetch`, do not write generated credentials into local/session storage or query params, and do not construct tenant-host redirects locally
- static review that `PB_ENV=Test` is isolated to the explicit E2E runtime path and is not enabled in the default local/demo startup path
- static review that `src/PaperBinder.Web/src/app/route-registry.ts` no longer describes the root-host routes as CP12 placeholders
- static review that any Compose-based E2E runtime uses a dedicated override/entrypoint and leaves `scripts/start-local.ps1`, `scripts/reviewer-full-stack.ps1`, and the default reviewer/local stack behavior unchanged
- static review that `scripts/validate-checkpoint.ps1`, `docs/70-operations/runbook-local.md`, and the eventual CP13 PR artifact all describe the same E2E closeout rule
- acceptance-criteria traceability review that every CP13 acceptance criterion maps to at least one automated test or explicit manual verification step
- manual reviewer verification with the local stack: provision from the root host, observe one-time credentials in the handoff state, land on the tenant host, return to the root host, log in with existing credentials, and verify safe failure messaging for invalid credentials and representative challenge/rate-limit failures as feasible
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require`
- manual VS Code and Visual Studio launch verification recorded in the eventual CP13 PR artifact before checkpoint closeout

## Likely Touch Points

- `src/PaperBinder.Web/package.json`
- `src/PaperBinder.Web/src/api/client.ts`
- `src/PaperBinder.Web/src/api/client.test.ts`
- `src/PaperBinder.Web/src/app/root-host.tsx`
- `src/PaperBinder.Web/src/app/route-registry.ts`
- `src/PaperBinder.Web/src/app/`
- `src/PaperBinder.Web/src/test/`
- new browser E2E files under `src/PaperBinder.Web/` such as `playwright.config.ts` and `e2e/`
- `scripts/test.ps1`
- `scripts/start-local.ps1` or a new explicit E2E startup/validation script if automation needs an isolated `PB_ENV=Test` runtime
- `.github/workflows/ci.yml`
- `docker-compose.yml` and `.env.example` only if the isolated E2E runtime needs a Compose-level override rather than a pure process-level harness
- `docs/10-product/user-stories.md`
- `docs/10-product/ux-notes.md`
- `docs/10-product/ui-ux-contract-v1.md`
- `docs/20-architecture/frontend-spa.md`
- `docs/20-architecture/frontend-app-route-map.md`
- `docs/20-architecture/authn-authz.md`
- `docs/70-operations/runbook-local.md`
- `docs/80-testing/test-strategy.md`
- `docs/80-testing/testing-standards.md`
- `docs/80-testing/e2e-tests.md`
- `docs/55-execution/phases/phase-4-frontend-experience.md`
- `docs/55-execution/checkpoint-status.md`
- `docs/05-taskboard/tasks/T-0024-track-remaining-test-coverage-gaps.md`
- `docs/95-delivery/pr/cp13-root-host-frontend-flows/`
- `docs/ai-index.md`
- `docs/repo-map.json`

## Critic Review Resolution Log

- `NB-1` Accepted and resolved: planned work step 1 and the validation plan now explicitly require reconciling the remaining `username` versus `email` drift by making `email` the canonical CP13 login field label in the UI/UX docs.
- `NB-2` Accepted and resolved: locked decisions, planned work step 1, acceptance criteria, and the validation plan now require one explicit closeout rule for the CP13 E2E suite, either through `scripts/validate-checkpoint.ps1` or through a separately documented required gate in `docs/70-operations/runbook-local.md`.
- `NB-3` Accepted and resolved: locked decisions, acceptance criteria, and the validation plan now explicitly scope accessibility obligations to the browser-owned challenge wrapper markup while treating provider widget internals as third-party controlled.
- `NB-4` Accepted and resolved: locked decisions, planned work step 8, acceptance criteria, and the validation plan now explicitly require any Compose-based E2E runtime to stay isolated from `scripts/start-local.ps1`, `scripts/reviewer-full-stack.ps1`, and the default reviewer/local stack.
- `NB-5` Accepted and resolved: planned work step 3, acceptance criteria, and the validation plan now explicitly require refreshing `route-registry.ts` root-host metadata from CP12 placeholder wording to live CP13 onboarding wording.

## ADR Triggers And Boundary Risks

- ADR trigger: introducing a BFF, a second SPA, SSR/framework-mode routing, or browser token storage to simplify redirect or session handling.
- ADR trigger: adding a new sticky frontend dependency for forms, state, challenge integration, or browser E2E outside the current stack lock.
- ADR trigger: changing the challenge model, test-bypass contract, or server-authoritative redirect/tenant-boundary model already locked by the existing auth and security docs.
- Boundary risk: persisting generated credentials anywhere beyond transient in-memory UI state would create reviewer-visible credential leakage and violate the "shown once" constraint.
- Boundary risk: constructing redirect URLs client-side or trusting client tenant hints would weaken the server-authoritative membership and tenancy boundary.
- Boundary risk: enabling `PB_ENV=Test` in the default local/demo runtime would weaken the shipped abuse-control posture outside the explicit E2E environment.
- Boundary risk: root-host UI must not distinguish provider-outage versus challenge-rejection internals beyond the safe `CHALLENGE_FAILED` UX already locked at the API boundary.
- Boundary risk: browser automation will be flaky if it depends on live challenge verification, shared mutable tenants between runs, or undeclared machine-local state.
- Boundary risk: CP13 can easily bleed into CP14 by wiring tenant-host logout, dashboard data, or lease UI instead of stopping at the root-host handoff.
- Boundary risk: bypassing the shared API client in root-host route code would reintroduce header, CSRF, ProblemDetails, and correlation-id drift before the tenant-host product flows even begin.
