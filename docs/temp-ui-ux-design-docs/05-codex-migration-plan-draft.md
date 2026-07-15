# 05. Codex Migration Plan (Draft)

## 1. Purpose

This plan is a draft transformation path from the current PaperBinder presentation to the redesign direction defined in this document set.

It is intentionally **implementation-aware but not repo-authoritative**. Codex must verify real routes, components, layouts, data dependencies, and styling systems before making changes.

## 2. Migration objective

Deliver a more product-first, marketing-aware, reviewer-respectful presentation of PaperBinder by:
- reworking the public narrative
- introducing the new visual language
- reducing architecture-heavy copy on the main path
- improving authenticated-screen prioritization
- preserving existing working product flows wherever possible

## 3. Constraints

- do not break the live demo path
- do not expand functional scope unnecessarily
- do not invent unsupported product features
- do not remove reviewer/architecture context if it is still useful; relocate it instead
- do not assume route/path changes are cheap until verified
- prefer incremental, shippable steps over one giant refactor

## 4. Assumptions Codex must verify

Before coding, verify:
1. where public routes are defined
2. where authenticated layout/shell lives
3. whether marketing pages and authenticated pages share a design-token system
4. whether screenshots are already generated in e2e/test workflows
5. how copy is currently organized
6. whether root-host onboarding and login are separate pages/components
7. what parts of the current orange/cream styling are global vs page-local
8. whether metadata blocks are reused components
9. whether there is already a docs/reviewer-notes surface in the site
10. whether existing tests snapshot important public markup or strings

## 5. Recommended implementation phases

## Phase 0 — Repo reality audit
### Goal
Map the real codebase before touching design.

### Codex tasks
- identify route tree and top-level page ownership
- identify public-page layout components
- identify authenticated shell components
- identify global theme/token sources
- identify hard-coded strings on public and authenticated pages
- identify screenshot assets and e2e flows that can supply marketing imagery
- identify tests likely to break from copy/layout changes

### Output
A repo-specific implementation map and risk report.

## Phase 1 — Design token foundation
### Goal
Introduce the new visual direction safely.

### Codex tasks
- create or refine semantic color tokens
- add dark-marketing and light-product surface roles
- update button, card, border, and status styles
- ensure accessible contrast for both the dark public hero and light product surfaces

### Output
A token/theme layer that can support both the homepage redesign and authenticated-shell cleanup.

### Acceptance
The design system can express:
- dark hero
- navy primary action
- cool neutral product surfaces
- restrained status tones

## Phase 2 — Public-site IA and homepage redesign
### Goal
Make the public entry point product-first.

### Codex tasks
- simplify public navigation
- redesign homepage structure
- replace onboarding-first hero copy
- add screenshot-driven proof
- add capability strip/cards
- add closing/footer with honest demo framing
- optionally stub or create secondary reviewer-notes page

### Acceptance
The homepage leads with:
- what PaperBinder is
- product screenshot proof
- start live demo CTA
- secondary reviewer context, not primary

## Phase 3 — Demo-entry flow rewrite
### Goal
Convert root-host onboarding into a cleaner demo-start experience.

### Codex tasks
- rewrite page title, section labels, and buttons
- simplify the layout
- keep challenge and validation behavior intact
- hide local-only challenge bypass messaging outside development
- reduce route/redirect explanation
- ensure the disposable-workspace framing is visible

### Acceptance
A first-time user can start the demo without parsing implementation terms.

## Phase 4 — Authenticated shell prioritization
### Goal
Reduce metadata dominance and make the app feel more product-grade.

### Codex tasks
- redesign the top-of-screen shell/header regions
- demote tenant host, slug, ids, and technical helper text
- keep session/lease state visible but calmer
- increase prominence of recent content and task-oriented actions

### Acceptance
The dashboard and key product screens prioritize work, not runtime metadata.

## Phase 5 — Product screen polish
### Goal
Improve the perceived depth and clarity of the actual product modules.

### Codex tasks
- refine dashboard cards and layout
- polish binder list/table styling
- strengthen binder detail hierarchy
- improve document detail reading surface
- polish users/admin table and action states
- standardize status badges and secondary text

### Acceptance
The main product screens feel visually coherent and intentionally designed.

## Phase 6 — Reviewer lane extraction
### Goal
Move deeper technical context into its own place.

### Codex tasks
- create or refine reviewer-notes/architecture page
- relocate overly technical explanatory copy from homepage, demo page, and product screens
- preserve technical truth while reducing its prominence

### Acceptance
Technical reviewers can still find the context, but the main path remains product-led.

## Phase 7 — QA, regression, and content hardening
### Goal
Ensure the redesign is stable and truthful.

### Codex tasks
- run existing tests
- update snapshots as needed
- verify responsive layouts
- verify challenge flow behavior
- verify expiry/session messaging still works
- verify no production-only notes leak into public UI
- verify screenshots/assets reflect current UI accurately

### Acceptance
The redesign ships without breaking demo usability or undermining technical honesty.

## 6. Suggested PR slicing

If the codebase allows it, prefer this PR sequence:

### PR 1
Theme/token groundwork + shared button/card/status cleanup

### PR 2
Homepage/public IA redesign

### PR 3
Demo-entry page rewrite

### PR 4
Authenticated shell and dashboard prioritization

### PR 5
Binders, document detail, and users polish

### PR 6
Reviewer-notes extraction + final copy cleanup

If smaller PRs are impractical, keep the internal commit structure aligned to these slices.

## 7. High-risk areas

Codex should treat these as risk hotspots:
- route behavior tied to onboarding copy/layout
- challenge flow and local bypass behavior
- shared components reused across public and authenticated contexts
- tests that assert exact strings
- metadata panels that may encode important state explanations
- layout changes that affect mobile stack order
- screenshots or marketing assets drifting from real UI

## 8. Content migration checklist

Codex should explicitly search for and review text resembling:
- Root-host onboarding
- Tenant workspace
- server-authoritative
- checkpoint scope
- canonical host
- shared API client
- current tenant session can request...
- browser routing remains canonical...
- live summary content is composed...

Each instance should be categorized as:
- keep as-is
- rewrite in product language
- move to reviewer-notes lane
- hide in local/dev only
- remove entirely

## 9. Data-display checklist

Codex should review whether these fields are genuinely user-helpful on primary screens:
- tenant slug
- tenant host
- root host
- internal IDs
- raw created timestamps
- supersedes metadata
- countdown/session metrics

For each one, decide:
- primary
- secondary
- collapsible
- reviewer-only
- dev-only

## 10. Screenshot/content asset plan

Codex should determine the cheapest truthful path for homepage imagery:
1. reuse current e2e-generated product states if visually acceptable after redesign
2. generate new deterministic demo screenshots from the app after UI updates
3. avoid illustrative mockups if real screens can be used instead

The homepage should ideally use:
- one dashboard or binders hero screenshot
- one supporting crop for documents or access management

## 11. Definition of done

The migration is complete when:
- the public site reads as a product experience first
- the live app is shown early and credibly
- reviewer context exists but no longer dominates
- the authenticated app feels calmer and more product-like
- the orange/cream reviewer-console feel is materially reduced
- the live demo still works
- the resulting presentation supports both portfolio credibility and future product optionality

## 12. Hand-off note for Codex

Use these docs as the desired direction, then produce a repo-specific remediation plan that names:
- actual files to edit
- actual components/routes involved
- string inventories
- styling dependencies
- test updates required
- what can ship immediately vs what should wait

Do not blindly implement the wording or route model in this draft if the codebase suggests a cleaner structure.

