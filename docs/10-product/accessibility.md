# Accessibility
Status: Post-upgrade audit complete (T-0041, 2026-07-25)

V1 targets baseline accessibility for primary demo flows.

## Requirements

- Keyboard access for all interactive elements.
- Visible focus indicators.
- Proper labels for form fields.
- Meaningful button and link text.
- Error messaging that is not color-only.
- Toast notifications that remain keyboard reachable and manually dismissible.

## Validation Approach

- Live browser pass against the isolated Docker E2E stack (not code reading alone): a scripted
  keyboard-interaction test covering tab order, focus visibility, skip-link activation, dialog
  focus trapping and focus-return on close, form validation, and live DOM heading/landmark
  extraction, run across the public host and the full authenticated workflow (provision, binder
  create, document create with markdown headings, user create, view-as).
- Keyboard-only walkthrough:
  - challenge
  - provision + login
  - tenant navigation
  - binder create + document create
  - document view
  - tenant-admin user management + binder policy
  - lease extend
  - logout
- Screen-reader-relevant structure (headings, landmarks, ARIA labels, live regions) verified
  programmatically via DOM queries rather than a screen-reader application; no NVDA/VoiceOver
  session was run directly.

## T-0041 Audit Outcome (2026-07-25)

A full product/responsive/accessibility review found and fixed:

- Two heading-hierarchy defects: document markdown content rendering literal, unnested h1-h6
  tags (fixed by offsetting document markdown headings below the page chrome), and the
  Binders-table mobile-card gap that T-0041's own acceptance criteria required closing.
- Two focus-management defects: the public skip link not moving focus to its target, and delete
  confirmation dialogs not returning focus to their trigger button on close.
- A systemic focus-visible-outline gap across three custom control families (copy chips,
  credential show/copy buttons, the mobile menu toggle) that silently overrode the app's own
  focus-ring convention, plus the public logo link missing the same treatment its sibling nav
  links already had.
- A toast-timer keyboard-parity gap (auto-dismiss paused on mouse hover but not keyboard focus).
- A product-experience/form-boundary issue on Add User (the generated workspace password sharing
  a `<form>` with an email input, the classic browser password-manager heuristic trigger).

All fixes are committed on the review/v1.1.0-product branch, one commit per finding, each validated against
the full test suite (build, unit, integration, frontend component tests) with no regressions, and
re-verified live against the isolated Docker E2E stack after landing. See the T-0041 task file's
Outcome section for the complete list with file/line evidence.

**Identified during RC1 verification and resolved during Phase 4 RC remediation:** the heading-nesting
fix's original level-offset scheme (offset by 3, capped at `h6`) correctly eliminated the out-of-order
`h1` defect, but as a side effect collapsed markdown heading levels 4-6 (`####`/`#####`/`######`) onto
the same literal `<h6>` tag, so a screen-reader user could no longer distinguish a document's own H4
from its H6. The offset was reduced to 2, preserving one more level of semantic distinction
(`# -> h3`, `## -> h4`, `### -> h5`, `#### -> h6`, `##### -> h6`, `###### -> h6`) while still keeping
document markdown out of the page's `h1`/`h2` chrome levels. See `docs/05-taskboard/v1-1-backlog.md`.

## Non-goals

- Formal WCAG certification in V1.
- Automated accessibility tooling (axe, Lighthouse, pa11y) — this audit used a scripted live
  keyboard-interaction pass instead; adding automated tooling remains a possible future task, not
  required by this pass.
- A live screen-reader (NVDA/VoiceOver) session — DOM/ARIA structure was verified programmatically.

## Alternatives Considered

- WCAG 2.1 AA commitment now: rejected due to scope overhead for V1.
- No explicit accessibility target: rejected due to poor reviewer signal.
