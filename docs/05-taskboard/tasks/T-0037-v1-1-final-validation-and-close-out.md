# T-0037: V1.1 Controlled Copy And Public Proof Refresh

## Status
done

## Type
feature

## Priority
P1

## Owner
agent

## Created
2026-07-15

## Updated
2026-07-22

## Checkpoint
Cross-checkpoint

## Phase
V1.1 close-out

## Summary
Complete the controlled copy pass and refresh the unauthenticated landing-page proof imagery so the public site describes the current product without implying unsupported enterprise, compliance, or production guarantees.

## Context
- `T-0033` originally carried both presentation polish and final close-out expectations.
- Follow-on review showed that final close-out had expanded into several distinct release-blocking workstreams.
- This task now records the completed branch scope: public/authenticated copy cleanup on the changed surface, start-demo credential spacing, and landing-page product proof screenshot refresh.
- Remaining `v1.1.0` work is split into successor tasks so the taskboard is truthful and each PR can stay cohesive.

## Acceptance Criteria
- [x] Public and authenticated copy touched by the current branch avoids forbidden implication patterns.
- [x] The `/start-demo` generated email copy action has appropriate spacing.
- [x] Landing-page proof assets reflect current authenticated dashboard, binders, and users surfaces.
- [x] The landing-page phone preview uses the mobile binders proof and crops inside the existing phone frame height.
- [x] Component expectations are updated for the changed proof image.
- [x] Remaining `v1.1.0` release-blocking work is split into successor taskboard items.

## Dependencies
- [T-0034](./T-0034-v1-1-api-and-backend-carry-forwards.md)
- [T-0035](./T-0035-tenant-host-failure-externalization-and-trusted-expiry-recovery.md)
- [T-0036](./T-0036-v1-1-docs-and-public-copy-reconciliation.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Keep this branch to public copy/proof polish and taskboard reconciliation. Authenticated mobile layout, full responsive QA, accessibility QA, docs pruning, final screenshot refresh, and staff-level code review move to successor tasks.
- Pre-PR Critique: Verify the public proof assets and text do not overstate product scope.
- Escalation Notes: Follow-on work should start from `main` after this PR merges.

## Current State
- Done. The branch has implementation commits for `/start-demo` email copy spacing and landing proof refresh, plus this taskboard reconciliation.

## Touch Points
- `src/PaperBinder.Web/src/app/credential-display-field.tsx`
- `src/PaperBinder.Web/src/app/root-host.tsx`
- `src/PaperBinder.Web/src/app/root-host.test.tsx`
- `src/PaperBinder.Web/src/styles.css`
- `src/PaperBinder.Web/public/presentation/`
- `docs/05-taskboard/`
- `README.md`

## Implementation Plan
- Completed in focused commits:
  1. Add a class hook to `CredentialDisplayField` and space the public email copy action.
  2. Replace landing proof screenshots and point the phone preview at the mobile binders proof.
  3. Reconcile the taskboard around the remaining `v1.1.0` close-out work.

## Next Action
- Open the PR for this branch, merge it, then create the authenticated mobile layout branch from `main`.

## Validation Evidence
- `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/root-host.test.tsx`: passed, `15` tests.
- Chromium rendered check confirmed the landing phone screen and image render at `216 x 420`.

## Decision Notes
- The comprehensive screenshot capture artifacts were intentionally not committed; they were temporary QA artifacts and were removed before this branch was finalized.
- The obsolete `start-demo-proof.png` was removed after the phone preview switched to `binders-proof.png`.

## Validation Plan
- Focused frontend component test for `root-host.test.tsx`.
- PR review of the refreshed public proof assets.

## Outcome
- Public proof imagery now reflects the current app surfaces.
- The landing phone preview keeps the existing frame height and crops the mobile binders screenshot inside the frame.
- Remaining `v1.1.0` work is no longer hidden inside this task.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
