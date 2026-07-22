# T-0033: Phase 4.1 V1.1 Presentation Realignment

## Status
done

## Type
feature

## Priority
P1

## Owner
agent

## Created
2026-07-09

## Updated
2026-07-15

## Checkpoint
Cross-checkpoint

## Phase
Phase 4.1

## Summary
Plan and execute the first post-`V1` presentation realignment cut: split the public landing from the demo-entry auth flow, restyle the authenticated shell and core product routes toward the approved sample direction using PaperBinder truth, introduce in-theme async feedback and toast patterns, and complete the dedicated presentation/UI tranche before handing backend, docs/copy, and final close-out work to successor tasks.

## Context
- The owner approved the sample layouts as visual direction, with explicit repo-specific constraints:
  - no `Settings` nav item
  - replace sample `category`, `files`, and `status` fields with real PaperBinder fields
  - transfer video/proof media without inheriting the sample route model
- The public landing should become product-first, while root-host sign-in, challenge verification, and one-time credential handoff move behind `Start Demo` on `/start-demo`.
- Root-host `/login` remains available as the direct-login route and the logout return target; it is no longer the primary first-time entry point.
- Pre-implementation remediation is now part of this task: back out the stale root-host public-flow work that still assumes `/` owns demo entry, then evaluate the remaining uncommitted authenticated-surface/UI WIP and keep only the pieces that align with the locked Phase 4.1 direction.
- The authenticated experience should mirror the sample's visual hierarchy where it fits PaperBinder truth:
  - dashboard landing page
  - dark persistent workspace shell
  - countdown metric plus top-of-page lease-extension notice when eligible
  - product-first binders, documents, and users surfaces
- Users remain on `/app/users`; create-user, role-change, owner-badge context, and `View as` actions should appear as same-route expandable panels rather than a family of new management routes.
- `View as` start affordances must remain available only from the Users surface, and user-management entry points should not be shown as primary actions for callers who cannot manage users or who are currently impersonating a non-user-manager role.
- Search and filtering controls implied by the sample are explicitly out of scope for this cut.
- Toast notifications must render at top-center above page content, use in-theme green/yellow/red/blue status coloring, and require manual dismissal.
- Public reviewer-facing notes and supporting material may be reachable from the unauthenticated public surface as secondary content, but the main story remains product-first.
- The current code already has the right structural seams in `src/PaperBinder.Web/src/app/root-host.tsx`, `tenant-shell.tsx`, and the route-level files. This work is primarily route composition, shared-primitive expansion, copy/layout redesign, and test/audit reconciliation.
- Auth handling, redirect trust, host-derived tenant identity, lease state, and API-authoritative policy boundaries remain non-negotiable. This task explicitly includes a final post-implementation hotspot audit in the style of `docs/50-engineering/code-quality-review.md` and `docs/50-engineering/code-quality-gap-analysis.md`.
- `main` is normally protected from direct pushes. `v1.1.0` closeout must therefore plan for branch completion, PR-based merge to `main`, then tag and deploy from the merged `main` commit.

## Acceptance Criteria
- [x] `/` becomes a product-led landing page and no longer embeds the inline root-host provisioning or login workflow.
- [x] The stale root-host public-flow implementation that still assumed `/` owned live demo entry is removed before the new public-flow direction proceeds.
- [x] Remaining pre-implementation UI WIP is classified as salvageable or revertable, and only the aligned slices remain in scope for the presentation tranche.
- [x] `Start Demo` leads to `/start-demo`, a dedicated root-host demo-entry flow that preserves challenge, provisioning, login, one-time credential handoff, and server-authoritative redirect behavior.
- [x] The authenticated shell, dashboard, binders, document-detail, and users surfaces adopt the approved sample direction without adding unsupported product features or a `Settings` route.
- [x] The binders/list surfaces use PaperBinder fields and semantics rather than the sample's placeholder `category`, `files`, and `status` model.
- [x] Lease UX uses a dashboard time-remaining metric plus an extension-window banner only when the server says the extension window is open, with qualitative threshold messaging retained where no explicit contract field exists.
- [x] `/app/users` keeps management work on the same route through expandable panels for create-user, role-change, owner-badge context, and `View as` actions; `View as` start affordances exist only on Users surfaces, and user-management dashboard entry points are gated for callers who cannot manage users or who are impersonating a non-user-manager role.
- [x] Shared in-theme async feedback patterns exist for loading, success, warning, and failure states, including the top-center toast system and inline mutation feedback used by the upgraded presentation surfaces.
- [x] Product-proof visuals on the public path are replaced with truthful screenshots from the authenticated product surface.
- [x] Vitest and Playwright coverage are updated in the same change set as the behavior and route changes used by this presentation tranche.
- [x] Canonical product, architecture, testing, taskboard, and navigation docs are updated alongside the implemented presentation tranche.
- [x] Remaining backend carry-forwards, tenant-host failure externalization, docs/public-copy reconciliation, and final close-out work are promoted to successor tasks instead of remaining as unchecked spillover inside this task.

## Dependencies
- `docs/90-adr/ADR-0013-v1-1-presentation-direction-and-canon-reset.md`
- `docs/10-product/presentation-contract-v1-1.md`
- `docs/10-product/presentation-adoption-plan-v1-1.md`

## Blocked By
- (none)

## Review Gates
- Scope Lock: Keep this task inside presentation, route composition, shared UI, and validation work for the existing PaperBinder product surface. Do not add a `Settings` route, new backend aggregator endpoints, SSR/BFF layers, richer document-editing scope, or unsupported collaboration features.
- Pre-PR Critique: Complete a post-implementation hotspot audit modeled on `docs/50-engineering/`, sampling at least one root-host auth file, one tenant-shell or dashboard file, one users/admin file, one shared async-feedback file, and one browser test file. Findings must explicitly address auth handling, redirect trust, role gating, naming precision, and repetitive/generated-looking patterns.
- Escalation Notes: If exact lease-threshold messaging requires a new server field, split that into a small contract-focused sub-slice and do not hardcode an unowned threshold into the SPA.

## Current State
- Done as the completed presentation/UI tranche.
- `Checkpoint D` landed on branch via `df893cd` (`feat(ui): make root home product-led and move demo entry`), but the initial implementation proved to be a reskin of the old root-host shell rather than a true public-layout replacement.
- `Checkpoint E` is complete on branch via `d326b9a` (`feat(ui): refine start-demo root-host flow`).
- The unauthenticated root-host surface remediation is complete on branch via `292b1bf` (`fix(ui): replace root-host reskin with dedicated public shell`) and has been revalidated through focused root-host Vitest coverage, the full frontend Vitest/build gates, visual screenshot review, and the repo-native browser E2E gate.
- Slice 3 / `Checkpoint F` remains behaviorally complete on branch via `6d70fd6` (`feat(ui): refine authenticated shell and lease dashboard`).
- The authenticated remediation foundation checkpoint is now complete on branch via `ef2a31f` (`fix(ui): replace authenticated shell reskin with dedicated workspace foundation`), replacing the remaining generic rounded-card/dashboard reskin with a dedicated authenticated shell, banner, dashboard, and binders-route layout foundation that matches the approved direction more closely.
- Binder detail and document detail presentation seams have now been pushed onto the dedicated authenticated layout system as part of the ongoing binder/document checkpoint work, including refreshed route-level Vitest assertions and reconciled tenant-host reviewer-browser expectations.
- The users and async-feedback slice is now complete on branch: `/app/users` keeps the list visible while same-route action panels expand inside the main users surface, and authenticated-shell toasts now provide top-center manual-dismiss mutation feedback without reintroducing the old reskinned layout language.
- The screenshot-truth replacement slice is now complete on branch: the public landing no longer relies on the handcrafted faux workspace preview and instead reads from committed authenticated-product proof assets under `src/PaperBinder.Web/public/presentation/`.
- The batch-4 user/admin follow-up slice landed on branch via `7842ec5` (`feat(ui): finish batch 4 workspace polish`): tenant-user creation can generate one-time passwords, visible IDs on the upgraded app surfaces are copyable through the shared chip pattern, the active impersonation stop action is intentionally high-signal, the authenticated-shell about link now opens the public supporting context in a new tab, and the landing-stage proof now combines updated desktop screenshots with a handheld preview overlay.
- The authenticated remediation checkpoint has now been revalidated after the dedicated shell/token rewrite: the focused tenant-shell and primitive Vitest coverage, the full frontend Vitest suite, the frontend production build, and the browser reviewer flow all pass against the updated workspace shell and users/dashboard language.
- The current worktree now contains a smaller post-batch-4 polish tail rather than a new major presentation checkpoint: softened host/tenant outage copy, copyable correlation IDs, the default markdown document-preview surface plus source toggle, toast timeout/border integration tuning, the authenticated logo return path, the non-copyable tenant slug, and minor lease/users layout cleanup.
- The temporary workflow under `docs/temp-ui-ux-design-docs/` superseded the earlier assumption that the next step was the final audit tranche.
- During the 2026-07-15 backlog reconciliation pass, the remaining cross-cutting work was promoted out of `T-0033` into explicit successor tasks so this task could close honestly as the completed presentation tranche.

## Touch Points
- `src/PaperBinder.Web/src/App.tsx`
- `src/PaperBinder.Web/src/styles.css`
- `src/PaperBinder.Web/src/api/client.ts`
- `src/PaperBinder.Web/src/api/client.test.ts`
- `src/PaperBinder.Web/src/app/root-host.tsx`
- `src/PaperBinder.Web/src/app/route-registry.ts`
- `src/PaperBinder.Web/src/app/tenant-shell.tsx`
- `src/PaperBinder.Web/src/app/tenant-dashboard-route.tsx`
- `src/PaperBinder.Web/src/app/tenant-binders-route.tsx`
- `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx`
- `src/PaperBinder.Web/src/app/tenant-document-detail-route.tsx`
- `src/PaperBinder.Web/src/app/tenant-users-route.tsx`
- `src/PaperBinder.Web/src/app/tenant-lease-banner.tsx`
- `src/PaperBinder.Web/src/app/tenant-impersonation-banner.tsx`
- `src/PaperBinder.Web/src/app/challenge-widget.tsx`
- `src/PaperBinder.Web/src/components/ui/`
- `src/PaperBinder.Web/e2e/root-host.spec.ts`
- `src/PaperBinder.Web/e2e/tenant-host.spec.ts`
- `docs/10-product/presentation-adoption-plan-v1-1.md`
- `docs/20-architecture/frontend-app-route-map.md`
- `docs/20-architecture/frontend-spa.md`
- `docs/10-product/prd.md`
- `docs/10-product/user-stories.md`
- `docs/10-product/accessibility.md`
- `docs/80-testing/test-strategy.md`
- `docs/80-testing/testing-standards.md`
- `docs/50-engineering/coding-standards.md`
- `docs/50-engineering/code-quality-review.md`
- `docs/50-engineering/code-quality-gap-analysis.md`

## Implementation Plan
- Planning sequence:
  1. Scope-lock the route, presentation, testing, audit, and remediation expectations in docs before broad code changes begin.
  2. Run the pre-implementation remediation pass:
     - back out the stale root-host public-flow work that still assumes `/` owns demo entry
     - evaluate dirty authenticated-surface/shared-UI WIP and keep only the slices worth salvaging
  3. Extend the shared visual system and async-feedback primitives so route work does not fork one-off styles per page.
  4. Split the public landing from the demo-entry auth flow while preserving root-host security and redirect truth.
  5. Recompose the authenticated shell and dashboard around the sample hierarchy, with PaperBinder lease and role truth.
  6. Restyle binders, document, and users surfaces to match the sample language where it fits the real product surface, keeping users actions on `/app/users`.
  7. Replace any temporary public product-image placeholders with truthful screenshots from finished authenticated pages.
  8. Reconcile tests, browser coverage, and docs in the same change set.
  9. Run the controlled copy pass, accessibility pass, responsive verification, and final auth/code-quality audit before merge-ready status.
  10. Execute the `v1.1.0` close-out planning pass:
     - record final validation evidence in this task and the eventual PR artifact
     - prepare the version-bump, changelog, and release-doc follow-on work needed for `v1.1.0`
     - merge to protected `main` through the normal PR path
     - tag the merged `main` commit as `v1.1.0`
     - deploy from the `main`-based release cut rather than from a side branch
- Commit hygiene:
  - Keep commits logically separated and in a sensible execution order so repo history stays understandable.
  - Preferred order:
    1. docs and scope-lock/remediation-plan updates
    2. pre-implementation cleanup or rollback of stale public-flow work
    3. shared visual-system and primitive changes
    4. root-host public-flow implementation
    5. authenticated shell and dashboard hierarchy changes
    6. binders, document, and users route slices
    7. tests, docs reconciliation, and final audit evidence
    8. version-bump, release-doc, and tag-closeout work for `v1.1.0`
  - Do not mix unrelated rollback, route redesign, shared-primitives, and validation work into one commit.
  - Treat the following as explicit commit checkpoints. Each checkpoint should be independently reviewable, buildable where practical, and narrow enough that a reviewer can understand the intent without reading the whole branch.
- Commit checkpoints:
  1. `Checkpoint A: plan lock`
     - Scope: taskboard, product-plan, and scope-lock doc updates only.
     - Commit when: the route direction, remediation expectations, audit passes, responsive verification, validation-evidence home, and `v1.1.0` close-out path are all explicitly written down.
  2. `Checkpoint B: remediation baseline`
     - Scope: stale root-host public-flow rollback plus explicit salvage-or-revert treatment of dirty WIP.
     - Commit when: `/` no longer carries the stale live-demo assumption and the remaining in-tree WIP boundary is intentionally narrowed.
  3. `Checkpoint C: shared presentation primitives`
     - Scope: shared tokens, layout primitives, cards, buttons, fields, tables, alerts, toast scaffolding, and related tests if introduced.
     - Commit when: route work can consume the new presentation system without page-local one-off styling forks.
  4. `Checkpoint D: public landing`
     - Scope: product-led `/` landing only.
     - Commit when: the public home no longer embeds inline provisioning or login, and the landing story is product-first even if `/start-demo` polish is not fully finished yet.
  5. `Checkpoint E: start-demo and root-host auth flow`
     - Scope: `/start-demo`, `/login`, one-time credential handoff, challenge flow, and redirect-safe root-host behavior.
     - Commit when: the new public-to-demo entry path works end to end and root-host security truth is preserved.
  6. `Checkpoint F: authenticated shell and dashboard`
     - Scope: tenant shell, dashboard hierarchy, lease countdown metric, extension-window banner behavior, and dashboard entry-point gating.
     - Commit when: the core authenticated frame matches the approved direction and lease UX still follows API authority.
  7. `Checkpoint F1: authenticated remediation foundation`
     - Scope: dedicated authenticated shell/page/panel/table foundations that replace the remaining generic card-heavy reskin on the authenticated side before more route-specific polish continues.
     - Commit when: the authenticated workspace frame, dashboard body, and route-level foundation visibly read as their own layout system rather than the old rounded-card shell with new copy.
  8. `Checkpoint G: binder and document surfaces`
     - Scope: binders list, binder detail, document detail, and related route-level tests.
     - Commit when: placeholder sample table semantics are gone and the product surfaces read as PaperBinder rather than generic sample UI.
  9. `Checkpoint H: users and async feedback`
     - Scope: `/app/users`, same-route action panels, `View as` gating, top-center manual-dismiss toasts, and inline mutation feedback.
     - Commit when: user-management interactions and async-feedback patterns are coherent enough to validate as one surface family.
  10. `Checkpoint I: screenshot truth and final validation`
     - Scope: truthful product-proof screenshots, docs reconciliation, copy pass, accessibility pass, responsive verification, final hotspot audit, and recorded validation evidence.
     - Commit when: the upgraded product surface is ready for merge review rather than still needing presentation cleanup.
  11. `Checkpoint J: v1.1.0 close-out`
      - Scope: version-bump, release-doc alignment, merge-to-`main` follow-through notes, tag strategy, and release-facing evidence.
      - Commit when: the branch is ready to enter the protected-`main` release path without ad hoc close-out work.
  - If a checkpoint proves too large in practice, split it into adjacent cohesive commits rather than pulling work backward or forward across checkpoint boundaries.
  - If two adjacent checkpoints end up being mechanically tiny and behaviorally inseparable, they may collapse into one commit only if the resulting history still preserves one clear intent.
- Skill TDD posture:
  - Use vertical-slice TDD for every behavior-changing slice.
  - Use Vitest for route composition, component gating, state ownership, error mapping, and shared async-feedback behavior.
  - Use targeted backend integration coverage only if a small API contract extension is introduced, most likely for exact lease-threshold messaging.
  - Use Playwright for the end-to-end root-host to tenant-host flow, especially where auth, redirects, lease state, and users gating intersect.
  - Visual-only polish must ride inside the nearest behavior slice; do not land a large untested CSS or copy dump.
- Public interfaces under test:
  - `RootHostRoutes`, `rootRouteDefinitions`, and the root-host route components
  - tenant-shell and authenticated route components
  - any new shared toast/async-feedback primitives or route-local presentation helpers
  - the shared browser API client if a lease-threshold contract extension is added
  - the root-host and tenant-host Playwright flows
- Planned vertical slices:
  - Slice 1 `RED -> GREEN -> REFACTOR`
    - Public interface: `RootHostRoutes`, `rootRouteDefinitions`, public landing sections in `root-host.tsx`
    - First failing test: `Should_RenderProductLedLanding_Without_InlineProvisioningOrLogin_When_PublicHomeLoads`
    - Coverage: Vitest route and component coverage
  - Slice 2 `RED -> GREEN -> REFACTOR`
    - Public interface: dedicated start-demo route plus existing root-host challenge, provision, login, and redirect behavior
    - First failing test: `Should_ProvisionOrLogin_FromStartDemoFlow_When_ChallengeAndServerRedirectsSucceed`
    - Coverage: Vitest route behavior plus Playwright root-host flow coverage
  - Slice 3 `RED -> GREEN -> REFACTOR`
    - Public interface: tenant shell and dashboard lease presentation seams
    - First failing test: `Should_RenderWorkspaceDashboard_With_CountdownMetric_And_ExtensionWindowBanner_When_TenantBootstrapSucceeds`
    - Coverage: Vitest tenant-shell and dashboard coverage; targeted Playwright authenticated flow coverage
  - Slice 4 `RED -> GREEN -> REFACTOR`
    - Public interface: binders route toolbar, table, and create flow using PaperBinder fields
    - First failing test: `Should_RenderBinderTableToolbar_With_PaperBinderFields_When_BindersLoad`
    - Coverage: Vitest binders-route coverage plus existing browser binders flow expansion
  - Slice 5 `RED -> GREEN -> REFACTOR`
    - Public interface: binder-detail and document-detail presentation seams
    - First failing test: `Should_RenderSampleStyledDocumentSourceView_AndArchivedMessaging_When_DocumentReadSucceeds`
    - Coverage: Vitest binder/detail and document/detail coverage
  - Slice 6 `RED -> GREEN -> REFACTOR`
    - Public interface: users entry-point gating, same-route action panels, and `View as` start affordances
    - First failing test: `Should_GateUsersEntryPoints_AndKeepViewAsStartOnlyOnUsers_When_EffectiveRoleChanges`
    - Coverage: Vitest users-route and dashboard gating coverage plus Playwright admin/non-admin flow coverage
  - Slice 7 `RED -> GREEN -> REFACTOR`
    - Public interface: shared toast and inline async-feedback primitives
    - First failing test: `Should_RenderTopCenterManualDismissToast_And_InlineAsyncFeedback_For_MutationSuccessAndProblemDetailsFailures`
    - Coverage: Vitest shared-primitives and route-integration coverage
  - Slice 8 `RED -> GREEN -> REFACTOR`
    - Public interface: root-host and tenant-host browser reviewer flow
    - First failing test: `Should_PreserveAuthRedirectLeaseAndUsersSafety_Across_StartDemoAndAuthenticatedBrowserFlows`
    - Coverage: Playwright browser gate; add targeted Vitest coverage only where browser failures expose a missing local seam
- Final audit pass (required, not optional polish):
  - Re-open the final changed versions of `root-host.tsx`, `tenant-shell.tsx`, `tenant-users-route.tsx`, the shared async/toast seam, and one updated browser test file.
  - Sample against the `docs/50-engineering/` audit questions:
    - Are auth and redirect boundaries still server-authoritative?
    - Is UI gating clearly UX-only rather than a security boundary?
    - Are helper names precise and non-overclaiming?
    - Did any route or shared primitive introduce template-like repetition that should be consolidated?
    - Do the critical seams explain themselves without relying on hidden context?
  - Record any findings in the eventual PR artifact or task outcome before merge-ready status.

## Next Action
- No further execution remains in this task.
- Continue `v1.1` work through the promoted successor tasks listed in `docs/05-taskboard/v1-1-backlog.md`.

## Post-UI Backend Follow-Ups
- Promoted to successor tasks during backlog reconciliation:
  - [T-0034: V1.1 API And Backend Carry-Forwards](./T-0034-v1-1-api-and-backend-carry-forwards.md)
  - [T-0035: Tenant-Host Failure Externalization And Trusted Expiry Recovery](./T-0035-tenant-host-failure-externalization-and-trusted-expiry-recovery.md)
  - [T-0036: V1.1 Docs And Public-Copy Reconciliation](./T-0036-v1-1-docs-and-public-copy-reconciliation.md)
  - [T-0037: V1.1 Controlled Copy And Public Proof Refresh](./T-0037-v1-1-final-validation-and-close-out.md)

## Validation Evidence
- `2026-07-15`: `npm.cmd run test -- --run src/app/root-host.test.tsx src/app/tenant-shell.test.tsx` passed in `src/PaperBinder.Web` after the post-batch-4 polish tail covering correlation-id copy affordances, softened outage copy, the authenticated logo/home affordance follow-up, the tenant-slug/header cleanup, toast timing/layout refinement, and the document markdown-preview toggle (`2` files, `28` tests).
- `2026-07-15`: `npm.cmd run build` passed in `src/PaperBinder.Web` after the post-batch-4 polish tail covering the document markdown-preview surface, correlation-id copy affordances, and shell/toast/layout follow-ups.
- `2026-07-14`: `npm.cmd run test` passed in `src/PaperBinder.Web` after the batch-4 user/admin UX follow-up slice (copyable IDs, generated tenant-user passwords, new-tab about link, impersonation emphasis, and screenshot-backed landing phone preview) (`9` files, `47` tests).
- `2026-07-14`: `npm.cmd run build` passed in `src/PaperBinder.Web` after the batch-4 user/admin UX follow-up slice and screenshot refresh.
- `2026-07-10`: `npm.cmd run test -- --run src/app/tenant-shell.test.tsx` passed in `src/PaperBinder.Web` after consolidating the dashboard binders CTA, adding the main-site recovery action on terminal tenant bootstrap failures, and routing post-bootstrap tenant expiry back into the dedicated failure screen (`1` file, `15` tests).
- `2026-07-10`: `npm.cmd run test` passed in `src/PaperBinder.Web` after the dashboard CTA and terminal tenant-expiry UX reconciliation (`9` files, `41` tests).
- `2026-07-10`: `npm.cmd run build` passed in `src/PaperBinder.Web` after the dashboard CTA and terminal tenant-expiry UX reconciliation.
- `2026-07-10`: `npm.cmd run test` passed in `src/PaperBinder.Web` after the `/start-demo` root-host flow reconciliation (`9` files, `37` tests).
- `2026-07-10`: `npm.cmd run build` passed in `src/PaperBinder.Web` after the `Start Demo` and `/start-demo` route/copy reconciliation.
- `2026-07-10`: `powershell -ExecutionPolicy Bypass -File .\scripts\run-browser-e2e.ps1` passed; both root-host and tenant-host Playwright suites are green against the isolated browser runtime after reconciling stale expectations to the current root-host login copy and same-route users action-panel model.
- `2026-07-10`: Root-host route assertions were updated so `/start-demo` is the canonical `Start Demo` entry route, `/login` remains the direct-login route, and the router-level login heading matches the current demo-sign-in copy.
- `2026-07-10`: Active v1.1 planning docs under `docs/temp-ui-ux-design-docs/` were reconciled to the implemented `Start Demo` and `/start-demo` language where they serve as forward direction rather than historical reference.
- `2026-07-10`: `npm.cmd run test -- --run src/app/tenant-shell.test.tsx` passed in `src/PaperBinder.Web` after moving lease countdown emphasis into dashboard metrics, making the lease banner extension-window-only, and gating the dashboard users entry point by effective-role capability (`13` tests).
- `2026-07-10`: `npm.cmd run test` passed in `src/PaperBinder.Web` after the Slice 3 authenticated-shell/dashboard changes (`9` files, `39` tests).
- `2026-07-10`: `npm.cmd run build` passed in `src/PaperBinder.Web` after the Slice 3 authenticated-shell/dashboard hierarchy changes.
- `2026-07-10`: `powershell -ExecutionPolicy Bypass -File .\scripts\run-browser-e2e.ps1` passed after reconciling tenant-host lease-flow expectations to the new dashboard-metric plus extension-window-banner UX; both root-host and tenant-host Playwright suites are green against the isolated browser runtime.
- `2026-07-10`: `npm.cmd run test -- --run src/app/root-host.test.tsx` passed in `src/PaperBinder.Web` after replacing the reskinned root-host shell approach with a dedicated public-site unauthenticated layout (`8` tests).
- `2026-07-10`: `npm.cmd run test` passed in `src/PaperBinder.Web` after the unauthenticated public-shell rewrite (`9` files, `39` tests).
- `2026-07-10`: `npm.cmd run build` passed in `src/PaperBinder.Web` after the unauthenticated public-shell rewrite.
- `2026-07-10`: `powershell -ExecutionPolicy Bypass -File .\scripts\run-browser-e2e.ps1` passed after reconciling tenant-host logout expectations to the rewritten unauthenticated login page; both root-host and tenant-host Playwright suites are green against the isolated browser runtime.
- `2026-07-10`: Manual screenshot review against `docs/temp-ui-ux-design-docs/src-landing-page-concept.png` confirmed that the root-host landing is now a dedicated dark public layout with top navigation, hero-led product framing, and an embedded product stage rather than the prior light-shell/sidebar reskin.
- `2026-07-10`: `npm.cmd run test -- --run src/app/tenant-shell.test.tsx` passed in `src/PaperBinder.Web` after replacing the authenticated shell/dashboard reskin with a dedicated workspace foundation (`13` tests).
- `2026-07-10`: `npm.cmd run build` passed in `src/PaperBinder.Web` after the authenticated workspace foundation rewrite.
- `2026-07-10`: `powershell -ExecutionPolicy Bypass -File .\scripts\run-browser-e2e.ps1` passed after updating the tenant-host expired-workspace browser expectation to the new authenticated fallback layout; both root-host and tenant-host Playwright suites are green against the isolated browser runtime.
- `2026-07-10`: `npm.cmd run test -- --run src/app/tenant-shell.test.tsx` passed in `src/PaperBinder.Web` after replacing binder-detail and document-detail route bodies with the dedicated authenticated panel/stat/source layout system and strengthening the route-structure assertions (`13` tests).
- `2026-07-10`: `npm.cmd run build` passed in `src/PaperBinder.Web` after the binder-detail and document-detail route rewrite.
- `2026-07-10`: `powershell -ExecutionPolicy Bypass -File .\scripts\run-browser-e2e.ps1` passed after reconciling the tenant-host reviewer browser expectations to the updated lease-count wording and the new binder/document detail route layouts; both root-host and tenant-host Playwright suites are green against the isolated browser runtime.
- `2026-07-10`: `npm.cmd run test -- --run src/components/ui/primitives.test.tsx src/app/tenant-shell.test.tsx` passed in `src/PaperBinder.Web` after adding the authenticated-shell toast primitive and moving `/app/users` actions into the same-route expanded panel flow (`2` files, `14` tests).
- `2026-07-10`: `npm.cmd run test` passed in `src/PaperBinder.Web` after the users-and-async-feedback slice (`9` files, `39` tests).
- `2026-07-10`: `npm.cmd run build` passed in `src/PaperBinder.Web` after the users-and-async-feedback slice.
- `2026-07-10`: `powershell -ExecutionPolicy Bypass -File .\scripts\run-browser-e2e.ps1` passed after reconciling tenant-host reviewer expectations to the locked `Users and access` language and the new same-route users action-panel plus toast behavior; both root-host and tenant-host Playwright suites are green against the isolated browser runtime.
- `2026-07-10`: Real product-proof assets were captured from the current authenticated surface into `src/PaperBinder.Web/public/presentation/dashboard-proof.png` and `src/PaperBinder.Web/public/presentation/users-proof.png`, replacing the previous handcrafted landing-page workspace mockup direction with truthful current product imagery.
- `2026-07-10`: `npm.cmd run test -- --run src/app/root-host.test.tsx` passed in `src/PaperBinder.Web` after replacing the landing-page faux workspace preview with committed screenshot-backed proof assets (`1` file, `8` tests).
- `2026-07-10`: `npm.cmd run test` passed in `src/PaperBinder.Web` after the screenshot-truth landing-page update (`9` files, `39` tests).
- `2026-07-10`: `npm.cmd run build` passed in `src/PaperBinder.Web` after the screenshot-truth landing-page update.
- `2026-07-10`: `powershell -ExecutionPolicy Bypass -File .\scripts\run-browser-e2e.ps1` passed after wiring the public landing to committed screenshot-backed product proof; both root-host and tenant-host Playwright suites are green against the isolated browser runtime.
- `2026-07-10`: `npm.cmd run test -- --run src/app/tenant-shell.test.tsx` passed in `src/PaperBinder.Web` after the authenticated shell/token remediation pass (`1` file, `13` tests).
- `2026-07-10`: `npm.cmd run test -- --run src/components/ui/primitives.test.tsx` passed in `src/PaperBinder.Web` after flattening the authenticated-facing button/card/table/field foundation (`1` file, `1` test).
- `2026-07-10`: `npm.cmd run test` passed in `src/PaperBinder.Web` after the authenticated remediation checkpoint (`9` files, `39` tests).
- `2026-07-10`: `npm.cmd run build` passed in `src/PaperBinder.Web` after the authenticated remediation checkpoint shell/token rewrite.
- `2026-07-10`: `powershell -ExecutionPolicy Bypass -File .\scripts\run-browser-e2e.ps1` passed after revalidating the updated authenticated workspace shell, dashboard actions, users language, and tenant-host reviewer flow; both root-host and tenant-host Playwright suites are green against the isolated browser runtime.

## Decision Notes
- `Phase 4.1` is the next logical numbered execution cut under the broad Phase 4 presentation work already captured in `docs/10-product/presentation-adoption-plan-v1-1.md`.
- This task does not create a new checkpoint. It is tracked as cross-checkpoint, post-`V1` owner-directed work.
- The public landing to `Start Demo` split is a presentation and flow-composition change, not a scope expansion of the auth model.
- `/start-demo` is the canonical `Start Demo` route for this cut; `/login` remains the direct-login route and logout return target.
- The current stale root-host implementation that still treats `/` as the live demo-entry surface is expected to be backed out as part of this task before new public-flow slices land.
- Dirty authenticated-surface/shared-UI WIP may be salvaged only if it aligns with the locked Phase 4.1 route, lease, users, and toast decisions; otherwise it should be reverted before commit.
- Exact lease-threshold copy should come from an explicit contract field if the UI needs a numeric threshold. Otherwise the message stays qualitative.
- The preferred users-surface composition is same-route expandable panels on `/app/users`, not a net-new family of admin subroutes.
- Preferred product language for the upgraded authenticated pages is:
  - document detail: `Document details` plus `Document source`
  - users page: nav label `Users`, page title `Users and access`
- Toast notifications are top-center overlays with manual dismissal and conventional green/yellow/red/blue status coloring.
- Search and filtering controls implied by the sample are out of scope for this cut.
- Public reviewer-facing support material may be reachable from the unauthenticated surface as secondary content.
- The final `docs/50-engineering/`-style audit is part of the exit criteria, especially for auth handling, redirect trust, and users gating.
- The unauthenticated root-host surface and the authenticated workspace shell are intentionally different layout systems for `v1.1.0`; root-host pages should not reuse the authenticated-shell sidebar/card composition.

## Validation Plan
- `npm.cmd run build` from `src/PaperBinder.Web`
- `npm.cmd run test` from `src/PaperBinder.Web`
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
- `powershell -ExecutionPolicy Bypass -File .\scripts\run-browser-e2e.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- When the `v1.1.0` release cut begins:
  - release-doc and version-alignment commands from `docs/95-delivery/release-workflow.md` and `docs/95-delivery/release-checklist.md`
- If a lease-threshold contract field is added:
  - targeted backend integration coverage for the lease read contract and any auth or policy invariants it touches
- Manual verification:
  - public landing renders without inline provisioning or login
  - `Start Demo` flow on `/start-demo` still provisions, signs in, and redirects safely
  - authenticated dashboard shows countdown metric, and extension-window banner appears only when eligible
  - users entry points and `View as` start affordances respect the effective role and impersonation posture
  - toast and inline async-feedback states are present and in-theme across representative success and failure mutations
  - public product-image placeholders, if used temporarily, are replaced with truthful captures from the finished authenticated pages
  - representative desktop viewport and representative mobile or tablet viewport both render the public and authenticated surfaces without layout breakage or hidden critical actions
- Post-implementation hotspot audit:
  - sample one root-host auth file, one tenant-shell/dashboard file, one users/admin file, one shared async/toast file, and one browser test file
  - explicitly review auth handling, redirect trust, host-derived tenant identity, role gating, helper naming precision, and repetitive/generated-looking patterns
- Final validation evidence record:
  - record command results, manual verification notes, responsive verification notes, copy-pass notes, accessibility audit findings, and auth/code-quality audit findings in this task's `Validation Evidence` section
  - mirror the final release-closeout evidence into the eventual `v1.1.0` PR artifact plus the canonical release docs when the version-bump and merge-to-`main` work begins

## Outcome (Fill when done)
- The `v1.1` presentation/UI tranche is complete enough to close as its own task.
- Remaining backend carry-forwards, tenant-host failure policy work, docs/public-copy reconciliation, and final validation/close-out work were promoted into dedicated successor tasks so they can be reviewed and landed as coherent follow-up slices.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
