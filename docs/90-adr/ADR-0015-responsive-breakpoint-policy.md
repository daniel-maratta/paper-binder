# ADR-0015: Responsive Breakpoint Policy

Status: Approved

## Date / Scope

- Date: 2026-07-25
- Scope: The set of CSS/JS viewport breakpoints the frontend is allowed to use, and the QA widths used to verify them, for `v1.1` and forward.

## Decision

PaperBinder adopts four canonical breakpoints for all layout-collapsing CSS and JS viewport logic:

| Breakpoint | Expressed as | Meaning |
| --- | --- | --- |
| 420px | `max-width: 420px` | Narrowest-mobile refinement (brand mark, header CTA sizing). Rare; most components don't need a tier this narrow. |
| 768px | `max-width: 768px` | Tablet / narrow-window collapse (single-column grids, stacked actions). |
| 1024px | CSS `max-width: 1023px` paired with JS `desktopShellMediaQuery = "(min-width: 1024px)"` | The one shell-chrome threshold: mobile hamburger nav vs. desktop sidebar, and any component that must switch in lockstep with the shell (e.g. table-vs-mobile-card list layouts). |
| 1180px | `max-width: 1180px` | Dense multi-column content collapse (split detail layouts, the lease banner's stat grid, public product-mockup sizing) — content that needs more breathing room than the shell threshold alone guarantees. |

A new component-level breakpoint must reuse one of these four values. Introducing a fifth value requires recording it in this ADR (a short addendum is enough — this doesn't need a new ADR) with the specific reason the existing four don't fit.

Reference QA widths for manual/automated visual verification: **390, 768, 1024 (both sides: 1023 and 1024), 1180 (both sides: 1179 and 1180), 1280, 1440, 1600**. 1280/1440/1600 aren't breakpoints — they exist to catch exactly the failure class below at widths comfortably past the last breakpoint, where slack usually hides a bug.

## Rationale

Two confirmed defects motivated this — both were the same root cause wearing different clothes: a component using a *different* threshold than a visually-related sibling, leaving a band of viewport width where neither the "mobile" nor the "wide desktop" styling was correctly active.

- T-0039 found the authenticated shell's sidebar collapsing at 1180px in CSS while the JS mobile/desktop switch happened at 1024px — any width in 1024–1180px got the desktop sidebar *and* the mobile-collapsed grid at once, stacking the sidebar above the content instead of beside it. Fixed by aligning the CSS threshold to the JS one (1023px).
- This pass found the lease-extension banner's stat-card grid still using the old 1024px threshold while the *conceptually similar* `.pb-auth-layout-split`/`.pb-auth-detail-grid` split already used 1180px, so the banner's three-column grid kept a real minimum content width (444px) inside the narrower 1024–1180px band. Moving it onto the existing 1180px tier is still correct hygiene under this ADR, but it turned out **not** to be the primary cause of the reported clipping: the banner's true bug was a viewport-*height* flex-shrink issue (`overflow: hidden` disabling a flex item's normal minimum-size protection, letting it get squeezed toward 0 whenever `100vh`-constrained content didn't fit — fixed separately with `flex-shrink: 0`). Recorded here as a caution: breakpoint misalignment is a real, recurring bug class, but confirm the actual computed layout before assuming a width-threshold fix has resolved a specific report.

Neither bug was exotic — both were two components disagreeing about where "narrow" ends. An undocumented, ad hoc breakpoint set makes that disagreement easy to introduce and hard to notice, since each component's CSS reads correctly in isolation; the bug only appears in the gap between two components' independently-chosen numbers. A small, named, canonical set — reused everywhere, with new values requiring a recorded reason — removes the easy path to that class of bug without adding real constraint (four tiers already cover every layout need currently in the app).

## Consequences

- `styles.css` should not introduce a fifth `max-width` value without updating this ADR.
- Any new authenticated-shell component that needs to switch between a dense/table layout and a simplified/card layout should key off the same 1024px shell threshold (via `useIsDesktopShell()`), not a bespoke CSS-only breakpoint, so it can never drift from the JS-driven chrome switch the way the historical bug did.
- QA/screenshot sweeps (`scripts/capture-responsive-qa-screenshots.ps1` and equivalents) should keep testing at least one width on each side of 1024px and 1180px, not just round numbers like 1280/1440, since the failure class this ADR addresses only appears in those narrow bands.
- This does not mandate a design-system rewrite or new tooling — it's a naming/reuse discipline applied to breakpoints that already existed in the codebase.

## Out Of Scope

- New visual breakpoints beyond the four above (e.g., a dedicated large-desktop/ultra-wide tier) — none of the app's content currently needs one; 1280/1440/1600 remain QA reference widths only.
- Automated breakpoint-drift linting (e.g., a script that fails CI if a new `max-width` value appears in `styles.css`) — worth considering later, not required to land this policy.
- Any change to the actual pixel values of the four breakpoints themselves; this ADR consolidates and documents the values already in use, it doesn't renumber them.

## Follow-On Actions

1. Both confirmed drift bugs (shell/sidebar in T-0039, lease-banner in T-0041's product/responsive/accessibility review) are fixed as of this ADR landing.
2. `docs/10-product/component-specification-v1.md`'s implementation guidance references this ADR for the canonical breakpoint list.
3. Adopting this policy itself requires no migration; it is a documentation-and-discipline decision.
4. **Identified during RC1 verification and resolved during Phase 4 RC remediation:** an audit scoped strictly to actual `@media` viewport rules (as opposed to unrelated element `max-width` properties like text-column widths) confirmed the app uses exactly the five documented breakpoint expressions (420/768/1023/1024/1180px) and nothing else — no undocumented fifth value exists. One pre-existing, narrower inconsistency survived within that set: the dashboard summary-grid collapse (`styles.css`, `.pb-auth-summary-grid`) used `1024px` rather than the `1023px` half of this ADR's own documented shell-threshold pairing, a 1px overlap with the JS `min-width: 1024px` check. It predated T-0041's commits and caused only a column-count nuance (2 vs. 3) at exactly 1024px, not the sidebar/nav stacking defect class this ADR targets. Resolved by moving `.pb-auth-summary-grid` (and its `--2`/`--3` variants) into the existing `@media (max-width: 1023px)` shell-threshold block, leaving the unrelated public-site rules that still legitimately share the `1024px` block untouched. See `docs/05-taskboard/v1-1-backlog.md`.

## Sources

- `docs/05-taskboard/tasks/T-0039-v1-1-responsive-qa.md` — Decision Notes section, the original shell/sidebar breakpoint-mismatch fix and its root cause.
- This session's T-0041 product/responsive/accessibility review — the lease-banner finding that surfaced the same class of bug a second time.
