# V1.1 Presentation Adoption Plan

Status: Historical implementation planning record
Scope: Repo-specific adoption and implementation planning under the approved `v1.1` presentation canon
Authority: `ADR-0013` and `docs/10-product/presentation-contract-v1-1.md`

This document translated the approved `v1.1` presentation canon into repo-specific adoption scope, impact, sequencing, and validation requirements.

It is preserved as a planning and decision-history record. Current execution order lives in `docs/05-taskboard/v1-1-backlog.md`.

## Executive Summary

The approved `v1.1` presentation canon changed PaperBinder's presentation target without changing product scope, tenancy behavior, or core API scope. The public presentation redesign and authenticated shell realignment have been implemented; remaining V1.1 work is documentation/screenshot cleanup, responsive QA, accessibility QA, and final release close-out.

In repo terms, the work is concentrated in the React SPA's root-host framing, tenant-shell presentation hierarchy, shared visual tokens, and copy-heavy route components. The most significant implementation seams are the public root-host routes in `src/PaperBinder.Web/src/app/root-host.tsx`, the authenticated shell in `src/PaperBinder.Web/src/app/tenant-shell.tsx`, the current orange token system in `src/PaperBinder.Web/src/styles.css`, and the Vitest and Playwright assertions that currently encode shipped V1 wording.

The adoption plan should preserve three boundaries throughout implementation:

1. Approved `v1.1` canon controls forward presentation direction on this branch.
2. Shipped V1 docs remain available as historical reference for the pre-V1.1 surface.
3. The exploratory redesign packet was superseded and pruned during T-0040; durable decision history remains in the audit, ADR, contract, adoption plan, and taskboard records.

## Canon / Doc Disposition Matrix

| Disposition | Documents | Planning Treatment |
| --- | --- | --- |
| Approved active canon | `docs/90-adr/ADR-0013-v1-1-presentation-direction-and-canon-reset.md`; `docs/10-product/presentation-contract-v1-1.md` | Controlling policy for V1.1 presentation decisions. |
| Superseded for forward presentation planning | `docs/archive/presentation-history/v1-shipped/ui-ux-contract-v1.md`; `docs/archive/presentation-history/v1-shipped/ui-style.md` | Do not use these as forward canon. Keep them only as shipped V1 presentation reference until implementation lands. |
| Active and still controlling | `docs/10-product/prd.md`; `docs/10-product/domain-nouns.md`; `docs/10-product/user-stories.md`; `docs/10-product/accessibility.md`; `docs/00-intent/project-scope.md`; `docs/00-intent/non-goals.md`; `docs/20-architecture/frontend-spa.md`; `docs/20-architecture/frontend-app-route-map.md` | These continue to control scope, feature truth, route truth, accessibility baseline, and architectural boundaries. Presentation work must stay inside them. |
| Active reviewer-support subset | `REVIEWERS.md`; `review/README.md`; `review/architecture-overview.md`; `review/multi-tenancy-diagram.md`; `review/request-lifecycle.md`; `review/user-flows.md`; `review/security-model-summary.md` | This is the curated reviewer lane for future public-path linking. It supports reviewer depth without replacing canon or turning the main product UI into the primary reviewer-evidence surface. |
| Active but narrowed by the new canon | `docs/10-product/information-architecture.md`; `docs/10-product/component-specification-v1.md` | Keep using these for route and component truth, but reinterpret presentation-facing language through the approved `v1.1` canon. Any conflicting old framing is non-controlling for forward work. |
| Historical shipped-reference docs | `docs/archive/presentation-history/v1-shipped/ui-ux-contract-v1.md`; `docs/archive/presentation-history/v1-shipped/ui-style.md`; `docs/archive/presentation-history/v1-shipped/ux-notes.md`; `docs/archive/v1/checkpoints/pr/cp17-release-preparation-and-reviewer-snapshot/description.md` | Use only to understand the currently shipped V1 surface, prior wording, and release-era reviewer packaging. Do not treat them as active forward direction. |
| Historical critique input | `docs/archive/presentation-history/product-design-audit-2026-07-03.md` | Informative critique and decision-history input only. Useful for understanding why V1.1 presentation work existed, but not controlling canon. |

## Phase 1 Branch-Local Implementation Brief

Phase 1 resolves the current canon-reconciliation decisions for this branch without starting visual-system replacement or UI implementation work.

- `/about` remains a distinct public route, but it becomes a lighter supporting route.
  `/` owns the primary product story and live-demo entry.
  `/about` should read as "About this demo" rather than checkpoint or reviewer narration.
- The canonical committed home for screenshot and workflow-proof assets used by the product UI is `src/PaperBinder.Web/public/presentation/`.
  Docs should reference those same committed assets rather than maintaining a parallel docs-only screenshot library.
  Phase 1 does not require creating or populating that asset directory yet.
- The public-path reviewer-support link target is `REVIEWERS.md`, not a broad raw docs index.
  `REVIEWERS.md` remains the curated reviewer entrypoint and narrows readers into `review/README.md`, the core reviewer artifacts, and selected canonical docs.
- Authenticated-shell metadata should be demoted rather than removed.
  Tenant slug remains visible somewhere in the authenticated experience.
  Lease and impersonation states remain prominent when relevant.
  Current origin, binder ids, and document ids should move into secondary metadata placement rather than headline hierarchy.
- The document detail surface should not continue to headline `Markdown source` as the primary product phrase.
  Forward implementation should use a softer heading such as `Document source` or `Source document` while retaining an explicit smaller indicator that the content is read-only markdown/source truth.
- `docs/archive/presentation-history/v1-shipped/ux-notes.md` is treated as historical shipped-reference material during this implementation sequence.
  It is not rewritten in Phase 1.

## Code / Test Impact Matrix

| Area | Concrete Surfaces | Current Coupling | Required Planning Treatment |
| --- | --- | --- | --- |
| Public-path routes and pages | `src/PaperBinder.Web/src/app/root-host.tsx`; `src/PaperBinder.Web/src/app/route-registry.ts` | Root-host copy is still onboarding-heavy, reviewer-heavy, and route-contract-heavy. Nav labels and descriptions also encode the old framing. | Reframe `/`, `/login`, and `/about` around product proof and live demo entry while preserving current route truth, challenge requirements, and server-authoritative redirect behavior. `/about` remains a distinct supporting route while `/` owns the primary story. |
| Shared layout and shell surfaces | `src/PaperBinder.Web/src/app/root-host.tsx`; `src/PaperBinder.Web/src/app/tenant-shell.tsx`; `src/PaperBinder.Web/src/App.tsx` | Both shells foreground host mechanics and metadata cards ahead of product value. | Keep host-context behavior intact, but rebalance layout hierarchy so public-path product framing and authenticated work surfaces lead. |
| Visual token and theme surfaces | `src/PaperBinder.Web/src/styles.css`; `src/PaperBinder.Web/src/components/ui/button.tsx`; `src/PaperBinder.Web/src/components/ui/card.tsx`; `src/PaperBinder.Web/src/components/ui/table.tsx`; `src/PaperBinder.Web/src/components/ui/status-badge.tsx`; `src/PaperBinder.Web/src/components/ui/banner.tsx` | The current token set and component variants are still centered on the orange-accent V1 system. | Replace the old token intent with a blue-neutral semantic system and propagate it through shared primitives before route-level polishing. |
| Copy-bearing product components | `src/PaperBinder.Web/src/app/tenant-dashboard-route.tsx`; `src/PaperBinder.Web/src/app/tenant-binders-route.tsx`; `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx`; `src/PaperBinder.Web/src/app/tenant-document-detail-route.tsx`; `src/PaperBinder.Web/src/app/tenant-users-route.tsx` | Descriptions currently expose reviewer language, contract narration, ids, and implementation mechanics more prominently than product tasks. | Rewrite toward product-first, scope-honest wording while preserving read-only, immutable, role-aware, and tenant-isolated truth. |
| Reviewer-heavy or system-heavy authenticated surfaces to demote | `src/PaperBinder.Web/src/app/tenant-shell.tsx`; `src/PaperBinder.Web/src/app/tenant-dashboard-route.tsx`; `src/PaperBinder.Web/src/app/tenant-lease-banner.tsx`; `tenant-impersonation-banner.tsx` (removed 2026-07-24, see `T-0045`); `src/PaperBinder.Web/src/app/tenant-document-detail-route.tsx` | Lease, impersonation, host, slug, route-contract, and source-format framing currently dominate above-the-fold space. | Keep truthful safety and state messaging, keep tenant slug visible, and keep lease or impersonation states prominent when relevant, but demote current origin and object ids out of the main hierarchy. |
| Screenshot and product-proof assets | No committed canonical screenshot library found in the repo; local `.tmp-*.png` files at repo root are untracked only | The approved canon now expects truthful product-proof surfaces, but there is no committed source-of-truth asset set yet. | Use `src/PaperBinder.Web/public/presentation/` as the single committed source when product-facing assets are added. Keep local temporary captures out of repo history unless intentionally curated. |
| Copy-coupled tests | `src/PaperBinder.Web/src/app/app-router.test.tsx`; `src/PaperBinder.Web/src/app/root-host.test.tsx`; `src/PaperBinder.Web/src/app/tenant-shell.test.tsx`; `src/PaperBinder.Web/e2e/root-host.spec.ts`; `src/PaperBinder.Web/e2e/tenant-host.spec.ts` | Current tests assert shipped V1 headings, CTA text, nav labels, and route-state messages directly. | Treat test updates as first-class implementation work. Every copy or nav change must be reconciled with unit and browser coverage in the same change set. |
| Visual snapshot coupling | `src/PaperBinder.Web/playwright.config.ts` uses failure screenshots only; no committed visual snapshot or golden-test surface was found under `src/PaperBinder.Web` | There is no current automated visual-regression baseline for the presentation reset. | Rely on existing browser tests plus manual screenshot review unless a later explicit decision adds visual-regression coverage. |

## Recommended Implementation Phases

### Phase 1: Canon Reconciliation And Branch-Local Implementation Brief

- Lock `/` as the primary product-story and live-demo route while keeping `/about` as a lighter supporting route.
- Lock `REVIEWERS.md` as the curated reviewer-support entrypoint for future public-path linking.
- Lock `src/PaperBinder.Web/public/presentation/` as the single committed home for product-facing screenshot and workflow-proof assets.
- Lock `docs/archive/presentation-history/v1-shipped/ux-notes.md` as historical shipped-reference material during implementation.
- Lock the authenticated-shell metadata posture: tenant slug retained, lease and impersonation kept prominent when relevant, current origin and object ids demoted from the primary hierarchy.
- Lock the document-detail naming direction away from `Markdown source` toward a softer product phrase with explicit read-only markdown/source truth preserved.

Exit gate:
- Approved canon, implementation planning, and actively discoverable product-navigation docs all reflect these decisions with no remaining canon-state conflict.

### Phase 2: Token-System Replacement And Primitive Restyling

- Replace the orange-first token system in `src/PaperBinder.Web/src/styles.css` with the approved darker blue-neutral semantic system.
- Update shared primitives so buttons, cards, tables, badges, and banners consume the new token intent consistently.
- Preserve accessibility baselines, focus states, and status clarity while reducing diagnostic visual dominance.

Exit gate:
- Shared primitives read as one coherent system before route-by-route copy and layout work begins.

### Phase 3: Root-Host Public-Path Reframing

- Update `src/PaperBinder.Web/src/app/root-host.tsx` and `src/PaperBinder.Web/src/app/route-registry.ts` so the public path is product-led rather than onboarding-led.
- Keep the current live flows intact: provision, challenge, one-time credential handoff, login, and `/about`.
- Move reviewer or architecture explanation out of headline positions and into secondary supporting placement.

Exit gate:
- The root host presents a truthful live demo path and product story without implying unshipped capability or changing route semantics.

### Phase 4: Authenticated Shell Demotion And Product-Surface Tightening

- Rework `src/PaperBinder.Web/src/app/tenant-shell.tsx` so workspace purpose outranks host/slug and boundary narration.
- Tighten copy on dashboard, binders, binder detail, document detail, and users so task guidance leads and implementation commentary recedes.
- Preserve safety-critical states for lease expiry, impersonation, forbidden, and not-found handling.

Exit gate:
- Authenticated surfaces still reflect shipped V1 truth, but reviewer-heavy and system-heavy framing no longer dominates the main experience.

#### Current execution cut: Phase 4.1

- `Phase 4.1` was the execution cut for the approved `v1.1` presentation adoption on this branch.
- Scope:
  - perform a short pre-implementation remediation pass: back out the stale root-host public-flow work that still assumes `/` owns live demo entry, then decide which remaining uncommitted authenticated-surface/UI changes are worth salvaging versus reverting before broad Phase 4.1 implementation begins
  - split the public landing from the demo-entry auth surface so `/` becomes product-first, `/start-demo` owns challenge/provision/login or one-time-credential handoff work, and `/login` remains the direct-login route and logout return target
  - align the authenticated shell, dashboard, binders, document detail, and users surfaces to the approved sample direction using PaperBinder truth rather than the sample's placeholder route or field model
  - keep users on `/app/users` and present create/role-change/owner-badge/view-as work as same-route expandable panels rather than a family of new management routes
  - add in-theme async feedback and toast patterns as first-class presentation work rather than late polish, with top-center overlay placement, manual dismissal, and conventional green/yellow/red/blue status colors
  - ignore sample-implied search and filtering controls unless a later scope decision explicitly introduces them
  - use placeholder product-image shells during implementation, then replace them in Phase 5 with truthful screenshots from the finished authenticated product pages
  - defer the broader accessibility audit/remediation pass until after the UI/UX upgrade lands, while preserving the current accessibility baseline during implementation
  - require a controlled final copy pass against the forbidden-implication rules after the visual/content work is complete
  - require explicit responsive verification on representative desktop and mobile/tablet viewports before merge-ready status
  - require a final post-implementation auth and implementation-quality audit modeled on the `docs/50-engineering/` audit posture
  - finish with a release-closeout strategy for `v1.1.0` that merges the approved branch into protected `main`, then tags and deploys from `main` rather than pushing release commits directly to `main`
- Detailed execution state and vertical-slice TDD planning live in [T-0033: Phase 4.1 V1.1 Presentation Realignment](../../05-taskboard/tasks/T-0033-phase-4-1-v1-1-presentation-realignment.md).
- Later close-out work is tracked by [T-0040](../../05-taskboard/tasks/T-0040-v1-1-documentation-truth-pruning.md), [T-0039](../../05-taskboard/tasks/T-0039-v1-1-responsive-qa.md), [T-0041](../../05-taskboard/tasks/T-0041-v1-1-accessibility-qa.md), and [T-0043](../../05-taskboard/tasks/T-0043-v1-1-final-staff-review-and-release-closeout.md).

### Phase 5: Product-Proof Surface Curation

- Replace any temporary placeholder image shells with committed screenshots and workflow visuals from shipped product states only.
- Ensure any public-path or doc-linked proof surfaces are sourced from real routes and current behavior.
- Keep docs and articles as the primary reviewer-evidence layer; product-proof visuals should support that posture, not replace it.

Exit gate:
- Every committed screenshot or workflow visual is truthful, current, and free of unimplemented capability cues.

### Phase 6: Test, Docs, And Validation Reconciliation

- Update Vitest and Playwright assertions that depend on old labels, headings, or nav wording.
- Reconcile any affected docs that still describe the shipped V1 surface once implementation changes are complete.
- Run the controlled forbidden-implication copy pass across the changed public and authenticated surfaces.
- Complete the broader post-upgrade accessibility audit/remediation pass.
- Complete the final changed-surface code-quality audit modeled on the recent `docs/50-engineering/` audit posture.
- Record final validation evidence in the active task record first, then mirror release-closeout evidence into the eventual `v1.1.0` PR artifact and the canonical delivery docs when the version-bump and release cut begin.
- Complete the `v1.1.0` merge/tag/deploy closeout sequence in a way that respects protected `main` ownership.
- Run the existing frontend and browser validation suite and perform a manual public-path plus tenant-path review.

Exit gate:
- Code, tests, and doc surfaces all describe the same presentation truth for this branch.

## Risks And Validation Gates

### Primary Risks

- Presentation drift into unshipped capability claims, especially around collaboration, history, workflow depth, or richer document preview.
- Accidental route or behavior drift while trying to improve IA or copy.
- Accessibility regressions caused by token replacement or reduced metadata emphasis.
- Broken unit or browser tests due to direct copy assertions.
- False product-proof evidence if screenshots are captured from local experiments, staged markup, or partially implemented states.
- Overcorrection inside authenticated flows that hides safety-relevant lease or impersonation state.

### Validation Gates

- Public and in-app copy must remain inside `docs/10-product/prd.md`, `docs/00-intent/project-scope.md`, and `docs/00-intent/non-goals.md`.
- Route behavior must remain consistent with `docs/20-architecture/frontend-app-route-map.md` unless a later explicit route decision changes the contract.
- Document detail must not imply a richer preview surface than the shipped read-only markdown-source truth.
- Reviewer-support links may exist, but docs and articles remain the primary reviewer-evidence layer.
- Temporary placeholder image shells are allowed only during implementation; completion requires truthful product captures.
- Screenshots, crops, and workflow visuals must come from shipped product states only.
- Vitest, Playwright, and docs validation must be updated in the same change set as any user-visible wording changes.
- Responsive verification must cover at least one representative desktop viewport and one representative mobile or tablet viewport for both public and authenticated surfaces.

## Remaining Questions Before Implementation

No additional canon-level or governance-level decisions remain open. Implementation has moved to the V1.1 close-out task sequence.
