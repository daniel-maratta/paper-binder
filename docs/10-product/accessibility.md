# Accessibility
Status: V1 (Baseline, WCAG-Oriented)

V1 targets practical accessibility for primary demo flows. The baseline follows WCAG 2.2 AA-oriented implementation practices where feasible, but PaperBinder does not claim formal WCAG 2.1 or 2.2 AA conformance, ADA compliance, or certification without a formal audit.

## Decision

- Accepted: WCAG 2.2 AA-oriented implementation practices for touched UI.
- Rejected: formal WCAG 2.1 or 2.2 AA conformance claim as a V1 gate.
- Rejected: ADA compliance or accessibility certification language without a formal audit.
- Rationale: WCAG-oriented implementation is a strong reviewer signal and improves usability, while a formal conformance claim would require a broader audit and remediation program outside V1 scope.

## Requirements

- Keyboard access for all interactive elements.
- Visible focus indicators.
- Proper labels for form fields.
- Meaningful button and link text.
- Error messaging that is not color-only.
- Semantic HTML and logical heading structure for touched UI.
- Color contrast that follows WCAG AA thresholds where feasible.
- Reduced-motion support for nonessential motion.
- Responsive behavior at mobile widths and 200% browser zoom.

## Validation Approach

- Keyboard-only walkthrough:
  - challenge
  - provision + login
  - tenant navigation
  - binder create + document create
  - document view
  - tenant-admin user management + binder policy
  - lease extend
  - logout
- Quick screen-reader sanity check (best effort).

## Non-goals

- Formal WCAG 2.1 or 2.2 AA certification in V1.
- Formal ADA compliance claim in V1.
- Full accessibility audit program.

## Alternatives Considered

- Full WCAG 2.1 or 2.2 AA conformance commitment now: rejected due to audit and remediation scope overhead for V1.
- No formal conformance claim, but WCAG 2.2 AA-oriented implementation baseline: accepted as the right V1 balance.
- No explicit accessibility target: rejected due to poor reviewer signal.
