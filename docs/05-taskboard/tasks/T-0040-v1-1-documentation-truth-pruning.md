# T-0040: V1.1 Documentation Truth, Pruning, And Product Screenshot Refresh

## Status
done

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
Clean up documentation so it describes the code and release state truthfully, prune transient or obsolete docs that no longer serve reviewer understanding, and refresh product screenshots in the same pass.

## Context
- Some docs still mix stable `V1`/`v1.0.5` release state with in-progress `v1.1.0` close-out language.
- Temp UI/design notes and historical review artifacts need explicit pruning or preservation decisions.
- Owner direction on 2026-07-23 moved this task ahead of responsive QA and bundled the product screenshot refresh into this documentation cleanup pass.

## Acceptance Criteria
- [x] Release status docs agree on current published stable version and `v1.1.0` in-progress state.
- [x] Stale future-tense docs are updated or removed.
- [x] Temporary docs are pruned, archived, or explicitly marked historical.
- [x] Public product screenshots and related references reflect the current release-candidate UI.
- [x] Obsolete screenshot assets are removed or explicitly preserved as historical evidence.
- [x] `docs/ai-index.md` and `docs/repo-map.json` are updated if paths are removed or reorganized.
- [x] Documentation validation passes.

## Dependencies
- [T-0038](./T-0038-v1-1-authenticated-mobile-layout.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Documentation truth/pruning and screenshot asset refresh only; no product behavior changes.
- Pre-PR Critique: Check for broken links, stale release claims, and accidental private/local references.
- Escalation Notes: Use repo docs validation.

## Current State
- Completed. Documentation truth/pruning and product screenshot refresh are implemented and validated on branch.

## Touch Points
- `README.md`
- `docs/05-taskboard/`
- `docs/95-delivery/`
- superseded temporary redesign planning notes
- `docs/ai-index.md`
- `docs/repo-map.json`
- `src/PaperBinder.Web/public/presentation/`
- `src/PaperBinder.Web/src/app/root-host.tsx`
- `src/PaperBinder.Web/src/app/root-host.test.tsx`

## Implementation Plan
- Inventory stale docs and release claims.
- Decide prune vs preserve-as-history for each transient artifact.
- Capture and replace product screenshots used by the public proof surface.
- Apply docs updates and path/reference propagation.
- Run docs validation.

## Next Action
- Proceed to `T-0039` comprehensive responsive QA.

## Validation Evidence
- `powershell -ExecutionPolicy Bypass -File .\scripts\capture-product-screenshots.ps1` passed on 2026-07-23.
- `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/root-host.test.tsx` passed on 2026-07-23 with 15 tests passing.
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` passed on 2026-07-23.
- Refreshed public proof screenshots:
  - `src/PaperBinder.Web/public/presentation/dashboard-proof.png`
  - `src/PaperBinder.Web/public/presentation/binders-proof.png`
  - `src/PaperBinder.Web/public/presentation/users-proof.png`
- Refreshed authenticated mobile screenshots:
  - `artifacts/authenticated-mobile-screenshots/01-dashboard-admin.png`
  - `artifacts/authenticated-mobile-screenshots/02-mobile-menu-open.png`
  - `artifacts/authenticated-mobile-screenshots/03-binders-admin.png`
  - `artifacts/authenticated-mobile-screenshots/04-binder-detail-admin.png`
  - `artifacts/authenticated-mobile-screenshots/05-document-detail-admin.png`
  - `artifacts/authenticated-mobile-screenshots/06-users-admin.png`
  - `artifacts/authenticated-mobile-screenshots/07-users-denied-reader.png`

## Decision Notes
- `T-0042` remains cancelled/superseded; product screenshot refresh is bundled into `T-0040`.
- The superseded temporary redesign packet was pruned. Durable decision history remains in `review/product-design-audit-2026-07-03.md`, `ADR-0013`, `presentation-contract-v1-1.md`, `presentation-adoption-plan-v1-1.md`, and the taskboard records.

## Validation Plan
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- Focused frontend tests if screenshot references or public proof components change.
- Visual review of refreshed public product proof assets.

## Outcome (Fill when done)
- Completed. Release docs now distinguish published stable `v1.0.5` from active V1.1 `1.1.0` branch metadata, stale future/planning language was reconciled, the superseded temporary redesign packet was pruned, the public product proof screenshots and authenticated mobile shell screenshots were refreshed, and `T-0042` remains cancelled/superseded by this task.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
