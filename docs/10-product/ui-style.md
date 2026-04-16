# UI Style
Status: V1 (Minimal)

V1 styling prioritizes clarity, speed, and accessibility.

## Style Direction

- Clean typography and spacing.
- Minimal animation.
- Neutral palette with clear action emphasis.
- Consistent action hierarchy:
  - primary: provision/login
  - secondary: extend lease/logout

## Core Components

- Form inputs with inline validation.
- ProblemDetails-driven error alerts.
- Lease status banner in tenant views.
- Shared button, card, dialog, and status-badge primitives with restrained visual styling.

## Performance Guidelines

- Keep bundle size modest.
- Avoid heavyweight state libraries unless justified by usage.

## Alternatives Considered

- Heavy branded design system now: rejected due to scope.
- Animation-heavy interaction model: rejected due to risk/complexity.
