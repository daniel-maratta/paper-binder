# T-0036: V1.1 Docs And Public-Copy Reconciliation

## Status
done

## Type
docs

## Priority
P1

## Owner
agent

## Created
2026-07-15

## Updated
2026-07-17

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
- [x] No active `v1.1` to-do lives only in temporary planning notes.
- [x] The temporary backlog was reconciled into canonical taskboard tracking before later pruning.
- [x] Canonical docs that still describe stale pre-`v1.1` planning or wording are updated to reflect current branch truth.
- [x] The unauthenticated/public-side copy pass removes obvious AI-smelling, over-mechanical, or over-specific wording while staying truthful to the shipped product.
- [x] Taskboard, planning, and navigation docs point readers at the canonical backlog/tasks rather than the temp override path.
- [x] Any deferred-after-`v1.1` items that should remain visible are preserved in a canonical taskboard location.

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
- Historical slice outcome: the `v1.1` doc and public-copy reconciliation landed and canonical docs now reflect the current branch truth.
- The temporary redesign docs no longer act as the canonical active backlog.
- Remaining close-out work now lives under `T-0037`, including the final controlled copy pass and broader warning/audit follow-through.

## Touch Points
- temporary redesign planning notes
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
- Closed. Use `T-0037` for the remaining final validation, final copy audit, and close-out work.

## Validation Plan
- Focused frontend tests for any copy-coupled assertions touched
- `scripts/validate-docs.ps1`
- Manual review of the public root-host paths for tone and truthfulness

## Outcome (Fill when done)
- Complete. Canonical planning, product, architecture, security/config, contracts, and taskboard docs were reconciled to current repo truth, including the `v1.1` route model, lease-cleanup retention behavior, server-issued credential flow, and current tenant-host behavior.
- Complete. The unauthenticated/public copy surface was rewritten into the shipped product voice, and stale or over-mechanical wording from older pre-`v1.1` surfaces was removed where it no longer matched the product.
- Complete. Active `v1.1` tracking was moved fully back onto the canonical taskboard; T-0040 later pruned the superseded temporary docs after their useful decisions were preserved elsewhere.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
