# T-0056: V1.1.2 Presentation Positioning Release

## Status
done

## Type
feature

## Priority
P1

## Owner
agent

## Created
2026-08-21

## Updated
2026-08-21

## Checkpoint
CP1

## Phase
V1.1.2 patch

## Summary
Ship a narrow `v1.1.2` positioning patch that helps first-time visitors understand what PaperBinder is, what it is for, why it exists, how to explore the demo, and where to find the flagship engineering article.

## Context
- Reviewer feedback says the demo looks polished but initially feels clinical because visitors are placed into an application before the product purpose is clear.
- The current landing page leads with "production-shaped SaaS demo" framing before a layperson product explanation.
- The flagship article is hosted at `/articles/building-paperbinder-production-shaped-saas-demo` but is currently discoverable from the About page and direct route, not from the homepage.
- The first tenant screen is the workspace dashboard; it already has a short intro and empty-state action, so orientation can stay lightweight.
- The public footer exposes project links, legal links, and copyright text, but the copyright attribution is currently plain text.
- GoatCounter analytics are production-gated direct `/count` requests through the existing frontend abstraction. Individual GoatCounter pageview collection must remain disabled.

## Acceptance Criteria
- [x] Homepage explains in plain language that PaperBinder is a lightweight document workspace for important internal documents.
- [x] Homepage hero subheadline describes PaperBinder itself rather than defining the product through demo-workspace framing.
- [x] Homepage includes concise concrete use cases such as policies, procedures, handbooks, internal reference material, or governance documents.
- [x] Homepage distinguishes the product concept from the reason the project exists as a deliberately scoped engineering demonstration.
- [x] The flagship article is directly discoverable from the homepage through an appropriately prominent CTA/link.
- [x] Mobile and narrow-tablet public visitors can reach the same meaningful Product, Demo, and About destinations exposed by the desktop public navigation.
- [x] Short public/root-host pages, including unavailable routes such as `/app`, visually terminate at the footer without orphaned decorative artwork.
- [x] The first tenant dashboard gives a new guest enough context to understand the workspace, binders/documents, and useful first actions.
- [x] The public footer `Daniel Maratta` attribution links to `https://danielmaratta.com` using existing external-link conventions.
- [x] New or modified public CTAs retain or gain GoatCounter event coverage through the existing analytics abstraction.
- [x] Individual GoatCounter pageview collection remains disabled by contract; no PII, tenant slugs, document content, form values, or high-cardinality identifiers are tracked.
- [x] Current-artifact visible version labels and public repository/history links align with the `v1.1.2` release and browser-facing repository URL.
- [x] Version metadata and release docs were consistently staged for `1.1.2` without describing the tag as stable before close-out.
- [x] Tests assert stable user-observable behavior rather than implementation details or brittle full-page copy.
- [x] Final rendered desktop/mobile review confirms the changes still look native to the existing PaperBinder site.
- [x] Validation evidence is recorded before this task is marked done.

## Dependencies
- `docs/10-product/presentation-contract-v1-1.md`
- `docs/90-adr/ADR-0013-v1-1-presentation-direction-and-canon-reset.md`
- `docs/90-adr/ADR-0016-goatcounter-usage-analytics.md`
- `docs/95-delivery/staging-and-versioning.md`
- `docs/95-delivery/release-workflow.md`

## Blocked By
- (none)

## Review Gates
- Scope Lock: Positioning, discoverability, demo orientation, footer attribution, analytics coverage, version/docs only. No product feature expansion, architecture change, or redesign.
- Pre-PR Critique: Review final copy against the v1.1 presentation contract, forbidden implication rules, and analytics privacy contract.
- Escalation Notes: Frontend/Vitest, browser E2E, build, Docker-backed integration, and git write workflows may require known elevated PaperBinder commands.

## Current State
- Slices 1 through 6 are implemented and focused validation is green. The homepage now includes an early product-model explanation and a direct flagship-article discovery path, the first tenant dashboard now explains the workspace/binder/document model with a clear first action, the public footer attribution links Daniel Maratta to the author site, GoatCounter event tracking now drops unapproved synthetic event names at runtime, and `1.1.2` metadata/release evidence was staged without treating `v1.1.2` as stable before release close-out. A pre-PR copy review then replaced public-facing clinical terms with friendlier workspace, access-control, and read-only-record language.
- The Fable cold-review correction pass is implemented in scope: the hero subheadline now describes PaperBinder rather than demo workspaces, mobile public navigation exposes Product/Demo/About with the existing header analytics event taxonomy, unsupported short root-host routes use clipped public decoration, user-facing repository/history links use the browser-facing GitHub URL, the hosted article chip reads `V1.1.2 public artifact`, and the users-page role hint no longer says `one role in v1`.

## Touch Points
- `src/PaperBinder.Web/src/app/root-host.tsx`
- `src/PaperBinder.Web/src/app/root-host.test.tsx`
- `src/PaperBinder.Web/e2e/root-host.spec.ts`
- `src/PaperBinder.Web/src/styles.css`
- `src/PaperBinder.Web/src/app/tenant-dashboard-route.tsx`
- `src/PaperBinder.Web/src/app/tenant-shell.test.tsx`
- `src/PaperBinder.Web/src/app/tenant-users-route.tsx`
- `src/PaperBinder.Web/src/analytics/goatcounter.ts`
- `src/PaperBinder.Web/src/analytics/goatcounter.test.ts`
- `docs/90-adr/ADR-0016-goatcounter-usage-analytics.md` if event taxonomy changes materially
- `Directory.Build.props`
- `src/PaperBinder.Web/package.json`
- `src/PaperBinder.Web/package-lock.json`
- `CHANGELOG.md`
- `README.md`
- `REVIEWERS.md`
- `docs/00-intent/canonical-decisions.md`
- `docs/95-delivery/release-workflow.md`
- `docs/95-delivery/release-checklist.md`
- `docs/95-delivery/staging-and-versioning.md`
- `docs/05-taskboard/work-queue.md`
- `docs/05-taskboard/v1-1-2-backlog.md`
- `docs/95-delivery/v1-1-2-implementation-plan.md`
- `docs/ai-index.md`
- `docs/repo-map.json`

## Implementation Plan
- Slice 1 - Homepage product comprehension: `RED -> GREEN -> REFACTOR`
  - Public seam: public root route `/`.
  - First failing test: focused root-host test that asserts the homepage exposes a durable "What is PaperBinder?" style explanation, concrete document/use-case concepts, and the existing Start demo CTA without asserting full prose or layout wrappers.
- Slice 2 - Homepage article discovery: `RED -> GREEN -> REFACTOR`
  - Public seam: public root route `/`.
  - First failing test: focused root-host test that asserts a homepage link/CTA reaches `flagshipArticle.path` and carries the appropriate analytics event.
- Slice 3 - Demo orientation: `RED -> GREEN -> REFACTOR`
  - Public seam: tenant route `/app`.
  - First failing test: focused tenant-shell/dashboard test that asserts dashboard orientation explains what the workspace contains and points guests toward binders/documents or first useful actions.
- Slice 4 - Footer attribution link: `RED -> GREEN -> REFACTOR`
  - Public seam: public footer on root-host pages.
  - First failing test: focused root-host test that asserts the footer attribution links `Daniel Maratta` to `productIdentity.authorUrl`, opens externally using established conventions, and is analytics-instrumented.
- Slice 5 - GoatCounter taxonomy and regression guard: `RED -> GREEN -> REFACTOR`
  - Public seam: `publicAnalyticsEventNames` and `trackPaperBinderEvent`.
  - First failing test: focused GoatCounter/root-host tests for any new public event names, preserving low-cardinality namespaced events and direct `/count` behavior.
- Slice 6 - Version and release evidence: `RED -> GREEN -> REFACTOR` where practical
  - Public seam: version validation script and release-facing docs.
  - First failing check: `scripts/validate-version.ps1` before metadata alignment, if version bump is not already staged.
  - Update version metadata, changelog, current-state docs, taskboard outcome, and release readiness only after behavior slices are implemented and validated.
- Correction Slice 7 - Fable public-header/mobile navigation: `RED -> GREEN -> REFACTOR`
  - Public seam: public root-host header at the existing mobile navigation breakpoint.
  - First failing test: focused root-host test asserting a semantic mobile public-navigation button, Product/Demo/About links, aria-expanded state, route navigation, and reuse of existing header analytics events.
- Correction Slice 8 - Fable short-page decoration: `RED -> GREEN -> REFACTOR`
  - Public seam: unsupported root-host route rendering, especially `/app`.
  - First failing test: focused root-host test asserting the unavailable route renders the known public error state and receives the short-page clipped-decoration treatment while retaining decorative nodes.
- Correction Slice 9 - Fable copy/link/version cleanup: `RED -> GREEN -> REFACTOR`
  - Public seam: homepage hero copy, hosted article metadata, public repository links, and users-page role hint.
  - First failing tests: focused root-host and tenant-shell assertions for durable visible text/link outcomes.

## Next Action
- Owner review and PR/release close-out.

## Validation Evidence
- RED Slice 1: `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/root-host.test.tsx` failed on 2026-08-21 before implementation because the homepage did not expose a `What is PaperBinder?` heading or the planned plain-language product explanation.
- GREEN Slice 1: `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/root-host.test.tsx` passed on 2026-08-21 after implementation: `23/23` root-host tests passed.
- RED Slice 2: `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/root-host.test.tsx` failed on 2026-08-21 before implementation because the homepage did not expose a `Behind the build` article section or direct article link.
- GREEN Slice 2: `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/root-host.test.tsx` passed on 2026-08-21 after implementation: `24/24` root-host tests passed.
- Analytics guard after Slice 2: `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/analytics/goatcounter.test.ts` passed on 2026-08-21: `14/14` analytics tests passed.
- RED Slice 3: `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/tenant-shell.test.tsx` failed on 2026-08-21 before implementation because the first tenant dashboard did not explain the workspace/binder/document model for a new guest.
- GREEN Slice 3: `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/tenant-shell.test.tsx` passed on 2026-08-21 after implementation: `30/30` tenant-shell tests passed.
- RED Slice 4: `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/root-host.test.tsx` failed on 2026-08-21 before implementation because the public footer did not expose an accessible `Daniel Maratta` author link.
- GREEN Slice 4: `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/root-host.test.tsx` passed on 2026-08-21 after implementation: `25/25` root-host tests passed.
- Analytics guard after Slice 4: `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/analytics/goatcounter.test.ts` passed on 2026-08-21: `14/14` analytics tests passed.
- RED Slice 5: `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/analytics/goatcounter.test.ts` failed on 2026-08-21 before implementation because an event-shaped but unapproved synthetic event still produced a direct GoatCounter request.
- GREEN Slice 5: `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/analytics/goatcounter.test.ts` passed on 2026-08-21 after implementation: `15/15` analytics tests passed.
- Root-host regression after Slice 5: `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/root-host.test.tsx` passed on 2026-08-21: `25/25` root-host tests passed.
- RED Slice 6: `powershell -ExecutionPolicy Bypass -File .\scripts\validate-version.ps1 -ExpectedVersion 1.1.2` failed on 2026-08-21 before implementation because `Directory.Build.props` still declared `1.1.1`.
- GREEN Slice 6: `powershell -ExecutionPolicy Bypass -File .\scripts\validate-version.ps1` passed on 2026-08-21 after implementation: version validation passed for `1.1.2`.
- Candidate docs validation after Slice 6: `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` passed on 2026-08-21.
- Diff hygiene after Slice 6: `git diff --check` passed on 2026-08-21.
- RED Correction Slice 7: `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/root-host.test.tsx` failed on 2026-08-21 before implementation because no accessible `Public navigation` mobile menu button existed.
- GREEN Correction Slice 7: `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/root-host.test.tsx` passed on 2026-08-21 after implementation: `27/27` root-host tests passed.
- RED Correction Slice 8: `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/root-host.test.tsx` failed on 2026-08-21 before implementation because `/app` rendered the unavailable route without `pb-public-site--clipped-decor`.
- GREEN Correction Slice 8: `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/root-host.test.tsx` passed on 2026-08-21 after implementation: `28/28` root-host tests passed.
- RED Correction Slice 9a: `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/root-host.test.tsx` failed on 2026-08-21 before implementation because the old hero subheadline, `.git` repository URL, and `V1.1.1 public artifact` label were still rendered.
- GREEN Correction Slice 9a: `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/root-host.test.tsx` passed on 2026-08-21 after implementation: `28/28` root-host tests passed.
- RED Correction Slice 9b: `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/tenant-shell.test.tsx` failed on 2026-08-21 before implementation because the users page still rendered `Each workspace member has one role in v1.`
- GREEN Correction Slice 9b: `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/tenant-shell.test.tsx` passed on 2026-08-21 after implementation: `30/30` tenant-shell tests passed.
- Final frontend validation: `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1` passed on 2026-08-21: `10/10` test files, `95/95` tests.
- Final version validation: `powershell -ExecutionPolicy Bypass -File .\scripts\validate-version.ps1` passed on 2026-08-21: version validation passed for `1.1.2`.
- Final build validation: `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release` passed on 2026-08-21: frontend production build completed and .NET build succeeded with `0 Warning(s), 0 Error(s)`.
- Final full test validation: `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require` passed on 2026-08-21: frontend `95/95`, unit `143/143`, non-Docker integration `34/34`, Docker-backed integration `103/103`.
- Final browser validation: `powershell -ExecutionPolicy Bypass -File .\scripts\run-browser-e2e.ps1` passed on 2026-08-21: root-host `6/6`, tenant-host `3/3`.
- Final docs and launch validation: `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` and `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1` passed on 2026-08-21.
- Final reviewer stack validation: `powershell -ExecutionPolicy Bypass -File .\scripts\reviewer-full-stack.ps1 -NoBrowser` passed on 2026-08-21: root host, demo tenant URL, live/ready health endpoints, compose services, and worker cleanup logs were available.
- Final rendered review passed on 2026-08-21 at desktop and mobile widths: homepage hero, public navigation, mobile menu, footer, and `/app` unavailable-route decoration rendered without horizontal overflow or orphaned post-footer artwork.

## Decision Notes
- The canonical article process favors outcome/constraint definition, scoped implementation, validation, independent review, scoped remediation, verification, and release acceptance. This task follows that sequence.
- Existing UI patterns should be reused: `PublicHero`, `PublicStorySection`, `PublicPanel`, `ArticleCard`, current button hierarchy, and the existing tenant dashboard intro/empty-state patterns.
- Candidate new analytics events should stay in the existing `pb_event_public_...` taxonomy. Likely additions are a homepage article CTA event and, if needed for clearer exit telemetry, a footer author-link event.
- The footer author URL already exists as `productIdentity.authorUrl`.

## Validation Plan
- Focused frontend tests:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/root-host.test.tsx`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/tenant-shell.test.tsx`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/analytics/goatcounter.test.ts`
- Broader validation after focused tests:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-version.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\run-browser-e2e.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\reviewer-full-stack.ps1 -NoBrowser`
  - `git diff --check`
- Manual/rendered review:
  - Review homepage and first tenant dashboard at desktop and mobile widths.
  - Confirm the homepage answers what PaperBinder is within the first screen or early page.
  - Confirm final copy does not imply compliance, classified-data suitability, regulated-record suitability, production service guarantees, document versioning, collaboration, audit-history browsing, or commercial maturity beyond repo truth.

## Outcome
- Done for the scoped `v1.1.2` correction pass. The minimal Fable cold-review correction set was implemented, validated, merged through PR #60, tagged as `v1.1.2`, deployed to Test with smoke validation, and published as a canonical GitHub Release. The later unauthenticated mobile-header fix is staged separately as `v1.1.3` so the published `v1.1.2` tag is not rewritten.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/` if needed.
