# T-0042: V1.1 Product Screenshot Refresh

## Status
cancelled

## Type
docs

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
Refresh product screenshots after responsive and accessibility changes are stable so public proof images match the release candidate.

## Context
- Current branch refreshed landing proof imagery before the authenticated mobile layout work.
- Any future layout/accessibility changes may require another screenshot pass before deployment.
- Owner direction on 2026-07-23 bundled this scope into `T-0040` so documentation cleanup and product proof screenshots can land together before responsive QA.

## Acceptance Criteria
- [ ] Public landing proof images reflect the final `v1.1.0` UI.
- [ ] Authenticated screenshots use representative seeded tenant content.
- [ ] Obsolete screenshot assets are removed.
- [ ] Component tests or references are updated for any renamed/replaced assets.

## Dependencies
- Superseded by [T-0040](./T-0040-v1-1-documentation-truth-pruning.md).

## Blocked By
- Superseded by [T-0040](./T-0040-v1-1-documentation-truth-pruning.md).

## Review Gates
- Scope Lock: Screenshot asset refresh only; no new UI behavior except defects found while capturing.
- Pre-PR Critique: Confirm screenshots show inspectable product state rather than decorative or stale views.
- Escalation Notes: Screenshot capture may require local browser/runtime access.

## Current State
- Cancelled as a standalone task; product screenshot refresh is now owned by `T-0040`.

## Touch Points
- `src/PaperBinder.Web/public/presentation/`
- `src/PaperBinder.Web/src/app/root-host.tsx`
- `src/PaperBinder.Web/src/app/root-host.test.tsx`

## Implementation Plan
- Capture final public and authenticated proof screenshots.
- Replace only assets used by the product surface.
- Update references/tests.

## Next Action
- No standalone action. Execute screenshot refresh under `T-0040`.

## Validation Evidence
- Not started.

## Decision Notes
- (none)

## Validation Plan
- Focused frontend tests.
- Visual review of final proof assets.

## Outcome (Fill when done)
- Cancelled. Scope bundled into `T-0040` by owner direction on 2026-07-23.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
