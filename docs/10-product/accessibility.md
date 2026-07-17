# Accessibility
Status: Current baseline with required post-upgrade audit

V1 targets baseline accessibility for primary demo flows.

## Requirements

- Keyboard access for all interactive elements.
- Visible focus indicators.
- Proper labels for form fields.
- Meaningful button and link text.
- Error messaging that is not color-only.
- Toast notifications that remain keyboard reachable and manually dismissible.

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

## Upgrade Posture

- During the UI/UX upgrade, preserve this baseline rather than widening scope mid-slice.
- After the visual/content upgrade is complete, run a broader accessibility audit and remediation pass across the changed public and authenticated surfaces.

## Non-goals

- Formal WCAG certification in V1.
- Full accessibility audit program before the UI/UX upgrade lands.

## Alternatives Considered

- WCAG 2.1 AA commitment now: rejected due to scope overhead for V1.
- No explicit accessibility target: rejected due to poor reviewer signal.
