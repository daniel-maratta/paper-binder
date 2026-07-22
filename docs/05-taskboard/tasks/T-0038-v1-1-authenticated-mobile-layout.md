# T-0038: V1.1 Authenticated Mobile Layout

## Status
queued

## Type
feature

## Priority
P1

## Owner
agent

## Created
2026-07-22

## Updated
2026-07-22

## Checkpoint
Cross-checkpoint

## Phase
V1.1 close-out

## Summary
Make the authenticated tenant-host app responsive enough for mobile use across dashboard, binders, binder detail, document detail, users, and tenant error routes.

## Context
- Current public pages have received responsive polish, but the authenticated shell and route content still need a deliberate mobile layout pass.
- Responsive QA, accessibility QA, final screenshots, and final review all depend on this implementation work landing first.

## Acceptance Criteria
- [ ] Tenant shell navigation, account controls, lease messaging, and main content work at mobile widths.
- [ ] Authenticated tables/lists/forms remain readable and operable at mobile widths.
- [ ] Dashboard, binders, binder detail, document detail, users, and tenant not-found routes are covered.
- [ ] Tests or browser checks are updated where practical.
- [ ] Any follow-on visual defects are tracked explicitly rather than left as ambient notes.

## Dependencies
- [T-0037](./T-0037-v1-1-final-validation-and-close-out.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Authenticated responsive layout only. Do not fold in docs pruning, accessibility audit, or final release review.
- Pre-PR Critique: Verify mobile behavior on real route content, not empty states only.
- Escalation Notes: Browser verification may require the local Docker stack.

## Current State
- Queued. This is the next branch after the current PR merges.

## Touch Points
- `src/PaperBinder.Web/src/app/tenant-shell.tsx`
- `src/PaperBinder.Web/src/app/tenant-*-route.tsx`
- `src/PaperBinder.Web/src/styles.css`
- relevant frontend tests and browser evidence

## Implementation Plan
- Inventory authenticated layout failures at app breakpoints.
- Patch shell/navigation/content layout.
- Patch route-specific tables, forms, and action groups.
- Run focused tests and browser verification.

## Next Action
- Create `feature/t-0038-authenticated-mobile-layout` from `main` after the current PR merges.

## Validation Evidence
- Not started.

## Decision Notes
- (none)

## Validation Plan
- Focused frontend tests.
- Browser verification against seeded authenticated tenant routes at mobile/tablet/desktop widths.

## Outcome (Fill when done)
- Not started.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
