# T-0036: V1.1 Docs And Public-Copy Reconciliation

## Status
queued

## Type
docs

## Priority
P1

## Owner
agent

## Created
2026-07-15

## Updated
2026-07-15

## Checkpoint
Cross-checkpoint

## Phase
Post-Phase 4.1

## Summary
Reconcile the remaining `v1.1` planning and copy surfaces so active work no longer depends on temp UI docs, unauthenticated/public copy reads in a cleaner product voice, and canonical docs reflect the current branch truth.

## Context
- The temp UI docs were useful as an exploratory execution override, but they should not remain the only place where active to-dos live.
- The owner explicitly wants the unauthenticated side’s site copy reviewed for "AI smell" and the older pre-`v1.1` wording overwritten where needed.
- `T-0033` now closes as the completed presentation tranche, so its successor docs should become the durable active source again.

## Acceptance Criteria
- [ ] No active `v1.1` to-do lives only in `docs/temp-ui-ux-design-docs/`.
- [ ] The temp UI backlog file is preserved as historical input but clearly marked as non-canonical active tracking.
- [ ] Canonical docs that still describe stale pre-`v1.1` planning or wording are updated to reflect current branch truth.
- [ ] The unauthenticated/public-side copy pass removes obvious AI-smelling, over-mechanical, or over-specific wording while staying truthful to the shipped product.
- [ ] Taskboard, planning, and navigation docs point readers at the canonical backlog/tasks rather than the temp override path.
- [ ] Any deferred-after-`v1.1` items that should remain visible are preserved in a canonical taskboard location.

## Dependencies
- [T-0033](./T-0033-phase-4-1-v1-1-presentation-realignment.md)
- [T-0035](./T-0035-tenant-host-failure-externalization-and-trusted-expiry-recovery.md) when public failure wording depends on the finalized trust split
- `docs/10-product/presentation-adoption-plan-v1-1.md`

## Blocked By
- (none)

## Review Gates
- Scope Lock: Stay inside documentation reconciliation and user-facing copy cleanup. Do not widen into new product features or backend behavior.
- Pre-PR Critique: Review at least one root-host/public copy seam, one planning doc seam, and one navigation/index seam for truthfulness, tone, and stale-reference leakage.
- Escalation Notes: If any copy change depends on unresolved backend behavior, defer that exact line until the owning task lands rather than guessing.

## Current State
- Queued. The active backlog is now canonicalized in `docs/05-taskboard/v1-1-backlog.md`, but the broader doc and copy reconciliation still remains.

## Touch Points
- `docs/temp-ui-ux-design-docs/`
- `docs/10-product/`
- `docs/20-architecture/`
- `docs/05-taskboard/`
- `src/PaperBinder.Web/src/app/root-host.tsx`
- `src/PaperBinder.Web/src/app/root-host-errors.ts`
- `src/PaperBinder.Web/src/app/tenant-host-errors.ts`
- related frontend copy-bearing tests

## Implementation Plan
- Reconcile one truth seam at a time:
  1. mark temp UI docs historical/non-canonical
  2. update canonical planning docs
  3. run the unauthenticated/public copy pass
  4. reconcile tests and navigation metadata

## Next Action
- Start with the docs seams, then move to the public-copy pass once the canonical planning text is stable again.

## Validation Plan
- Focused frontend tests for any copy-coupled assertions touched
- `scripts/validate-docs.ps1`
- Manual review of the public root-host paths for tone and truthfulness

## Outcome (Fill when done)
- Not started.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
