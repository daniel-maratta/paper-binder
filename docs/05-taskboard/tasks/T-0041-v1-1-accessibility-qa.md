# T-0041: V1.1 Accessibility QA And Documentation

## Status
done

## Type
risk

## Priority
P1

## Owner
agent

## Created
2026-07-22

## Updated
2026-07-23

## Checkpoint
Cross-checkpoint

## Phase
V1.1 close-out

## Summary
Run the comprehensive accessibility QA pass after documentation cleanup/product screenshot refresh and responsive QA, remediate release-blocking findings, and update docs with the resulting evidence.

## Context
- Accessibility should be audited after the layout is stable so findings reflect the actual release candidate.
- Documentation must record what was checked, what changed, and any residual limitations.
- Owner direction on 2026-07-23 keeps accessibility QA after responsive QA.

## Acceptance Criteria
- [x] Public and authenticated routes receive accessibility QA. Live browser pass against the isolated Docker E2E stack, not code reading alone: 60+ screenshots at 390/768/1280/1600px plus the 1024-1180px seam, and a scripted keyboard/focus/dialog/heading interaction test across every public and authenticated route.
- [x] Keyboard, focus, labels, landmarks, contrast, and screen-reader-relevant states are checked. See Outcome below; contrast was computed by hand via the WCAG relative-luminance formula for the muted-text and focus-ring tokens (both pass, no finding).
- [x] The Binders-table binder-ID `CopyValueChip` (`tenant-binders-route.tsx`, via `copy-value-chip.tsx`) is given a mobile-friendly treatment at narrow widths (<420px), where it currently wraps character-by-character in the plain `DataTable`; align with the Users-page mobile-card pattern rather than a CSS-only truncation (two CSS-only attempts during `T-0039` regressed the authenticated shell layout and were reverted). **Fixed**: ported and generalized the Users mobile-card pattern (`pb-auth-mobile-list`/`pb-auth-mobile-list-card*`) onto Binders via the same `useIsDesktopShell()` switch Users already used.
- [x] Release-blocking findings are fixed. All three (Binders mobile-card, lease-banner grid overflow, markdown heading hierarchy) plus five medium/low-priority accessibility findings — see Outcome.
- [x] Residual non-blocking findings are explicitly deferred or tracked. One: F20-style Add-User form password-manager risk was fixed outright rather than deferred (see Outcome); a not-found-binder loading-state observation was flagged inconclusive (test-methodology gap, not a confirmed defect) and left as a documented follow-up, not fixed.
- [x] Accessibility docs reflect the audit and remediation outcome. `docs/10-product/accessibility.md` updated with the audit methodology and a summary of findings/fixes.

## Dependencies
- [T-0039](./T-0039-v1-1-responsive-qa.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Accessibility QA/remediation only.
- Pre-PR Critique: Findings-first review posture with file/route references.
- Escalation Notes: Browser and accessibility tooling may require local runtime access.

## Current State
- Done. An independent product/responsive/accessibility review was performed against the live
  application (not source-only), producing 3 release-blocking findings, 4 medium-priority
  findings, and 4 low-priority findings (11 total) across product quality, responsive layout, and
  accessibility. All were fixed rather than deferred. See Outcome for the full list.
- **Correction (independent Phase 3 verification, 2026-07-25):** this section and the Outcome
  below originally claimed "12 findings" (3+4+5). The itemized breakdown in Outcome only ever
  named 11 distinct findings, and the 14-commit history on the review/v1.1.0-product branch confirms
  exactly 11 (two commits are a lease-banner correction pass on the same finding, one is an ADR
  correction pass, one is closing bookkeeping — none is a 12th distinct finding). Corrected here
  rather than left standing; no finding was silently dropped.

## Touch Points
- `src/PaperBinder.Web/src/`
- `docs/10-product/accessibility.md`
- `docs/80-testing/`
- `docs/05-taskboard/`

## Implementation Plan
- Define route and interaction matrix.
- Run manual and automated checks.
- Remediate release-blocking findings.
- Record evidence and residual risks.

## Next Action
- None for this task — closed. `docs/90-adr/ADR-0015-responsive-breakpoint-policy.md` is a
  follow-on artifact from this pass; no further action required to adopt it (documentation-only).

## Validation Evidence
- **Discovery pass**: live browser capture matrix (60+ screenshots) at 390/768/1280/1600px plus
  the 1024-1180px seam, across every public page and authenticated state (empty, populated,
  denied, validation-error, delete-dialog, view-as), and a scripted accessibility interaction test
  (tab order, skip-link activation, dialog focus trap/return, heading/landmark DOM extraction,
  form validation) against the isolated Docker E2E stack.
- **Remediation-phase validation**: `build.ps1 -Configuration Release` (0 warnings) after every
  code change; `validate-docs.ps1` passed (caught and fixed two review/v1.1.0-product inline
  path-literal collisions in the same pattern seen during `T-0045`); full `test.ps1
  -DockerIntegrationMode Require` re-run after all fixes landed — 142/142 unit, 32/32 non-Docker
  integration, 102/102 Docker integration, 63/63 frontend, matching baseline exactly, no
  regressions.
- **Re-audit of the changed surface** (explicitly requested, not assumed sufficient from unit
  tests alone): re-ran the full live capture + accessibility interaction matrix against the fixed
  code. Confirmed via live DOM/computed-style evidence, not just re-reading source:
  - Skip link: activation now lands on `#public-main` (was `BODY`), with a solid 2px focus
    outline.
  - Document heading tree with a `# Top` + `## Second` markdown body: h3 → h2 → h3 → **h4** →
    **h5** → h3 → h3 — correctly nested, no more out-of-order h1.
  - Delete-document dialog: focus after Escape lands back on the "Delete document" button with a
    visible outline (was `BODY`).
  - Mobile "Viewing as" badge: visible in the collapsed header without opening the menu
    (`.pb-auth-mobile-viewing-as` visibility check returned `true`).
  - Public logo link: focus outline now solid 2px matching sibling nav links (was the browser's
    1px native fallback).
  - Lease banner at the original 1100×800/900 repro case: computed height is 298.56px (matches
    natural content height) — was 34px squeezed before the fix.
- **Root-cause correction during re-audit**: the first banner fix (moving the stat-grid's 2-column
  collapse from the 1024px shell threshold to the 1180px dense-content threshold) did not actually
  resolve the reported clipping when re-verified live — computed styles still showed the banner
  squeezed to 34px at the original repro viewport. A second, targeted diagnostic (comparing
  computed height at a very tall vs. the original short viewport height) isolated the real cause:
  `.pb-auth-banner`'s `overflow: hidden` disables a flex item's normal minimum-size protection
  per the CSS Flexbox spec, letting it absorb all shrinkage whenever `100vh`-constrained content
  didn't fit, while sibling panels (no `overflow: hidden`) correctly kept their size. Fixed with
  `flex-shrink: 0` on `.pb-auth-banner`; confirmed via the same computed-style check
  (`docs/90-adr/ADR-0015-responsive-breakpoint-policy.md`'s Rationale was corrected to match).
- **Copy-chip outline re-check methodology note**: an initial automated check using Playwright's
  `.focus()` reported `outlineStyle: none`, which looked like the fix hadn't landed. Re-checked
  with an actual keyboard Tab sequence instead (`:focus-visible` doesn't activate for programmatic
  `.focus()` calls, only real keyboard-driven focus, per browser heuristics) — confirmed
  `outlineStyle: solid, 2px` once reached via real Tab presses. Recorded as a reminder that
  `.focus()` and keyboard navigation aren't interchangeable when testing `:focus-visible` CSS.

## Decision Notes
- The not-found-binder loading-state observation (a denied-session request to a nonexistent
  binder appeared stuck on "Loading binder") was **not** treated as a confirmed defect — the
  capture script screenshotted that state without waiting for the network response to settle, so
  the evidence doesn't distinguish a genuine hang from a normal async delay. Recorded as an
  inconclusive follow-up check, not fixed and not counted among the findings above.
- F20 (from the prior `T-0045` engineering review — "Add user" form's email+password heuristic)
  was independently re-confirmed by this pass and fixed outright (moved the credential display
  outside the `<form>`) rather than left as the previously-recommended "cheap follow-up check."

## Validation Plan
- Focused frontend tests.
- Browser accessibility/keyboard pass.
- Docs validation.

## Outcome (Fill when done)
- **Done.** An independent product/responsive/accessibility review was performed live against the
  running application (Docker E2E stack), not source-reading alone, producing 11 findings across
  three severity tiers, all fixed (none deferred), each in its own commit on
  review/v1.1.0-product:
  - **Release blockers (3):**
    - Binders-table binder-ID chip wrapped character-by-character below ~420px (already a named
      T-0041 AC item). Fixed by generalizing the Users page's mobile-card CSS
      (`pb-auth-mobile-list`/`pb-auth-mobile-list-card*`, renamed from user-specific class names)
      and adopting the same `useIsDesktopShell()` switch on Binders.
    - Lease-banner content clipped/overlapped at intermediate viewport heights. Fixed in two
      passes: an initial grid-column-threshold consolidation (still valid CSS hygiene, see
      ADR-0015) that turned out insufficient on its own, followed by the actual primary fix
      (`flex-shrink: 0` on `.pb-auth-banner`, correcting a `overflow:hidden`-disables-flex-min-size
      interaction) found and confirmed during re-audit.
    - Document markdown headings rendered as literal, unnested h1-h6 with no relationship to page
      chrome. Fixed by offsetting markdown heading levels by 3 (capped at h6) so a document's own
      top-level heading nests under the "Document preview" panel heading instead of jumping to h1
      mid-page.
  - **Medium-priority (4):** skip link not moving focus (added `tabIndex={-1}` to the target);
    delete-dialog focus not returning to its trigger on close (explicit ref + `onCloseAutoFocus`
    on all three delete dialogs); systemic `outline: none` on three custom control families (copy
    chips, credential icon buttons, mobile menu toggle) plus the public logo link missing the
    shared focus-ring treatment; Add User's generated password sharing a `<form>` with the email
    input (moved the credential display outside the form boundary).
  - **Low-priority (4):** mobile "Viewing as" status hidden unless the hamburger menu is open
    (added an always-visible warning strip); toast auto-dismiss pausing on mouse hover but not
    keyboard focus (added matching `onFocus`/`onBlur` handlers); toast component-spec wording
    overstating "manual dismissal only"; and the breakpoint-policy documentation gap itself
    (`docs/90-adr/ADR-0015-responsive-breakpoint-policy.md`).
  - **Not fixed, not counted as findings:** a not-found-binder loading-state observation flagged
    inconclusive (own test-methodology gap — the capture script didn't wait for the network
    response before screenshotting), recorded as a follow-up check rather than a defect.
- Every code-level fix was re-verified live after landing (not just re-read), via the same
  scripted browser interaction test used for discovery — see Validation Evidence. The one
  discrepancy the re-audit caught (the first banner fix not actually resolving the reported
  symptom) was itself found and corrected within this same pass, with the record corrected in
  ADR-0015 rather than left overstated.
- Full validation bundle green throughout: build (0 warnings), docs validation, and the complete
  test suite (142/142 unit, 32/32 non-Docker integration, 102/102 Docker integration, 63/63
  frontend) — matching the pre-existing baseline exactly, confirming no regressions across 15
  commits. One frontend test flake was observed and confirmed unrelated to this work (passed on
  immediate re-run with no code change).
- `docs/90-adr/ADR-0015-responsive-breakpoint-policy.md` is a new governance artifact from this
  pass, establishing four canonical breakpoints (420/768/1024/1180px) that all layout-collapsing
  CSS/JS must reuse, directly motivated by two confirmed instances of the same bug class (a
  component using a different threshold than a visually-related sibling).

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
