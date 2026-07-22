# T-0040: V1.1 Documentation Truth And Pruning

## Status
queued

## Type
docs

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
Clean up documentation so it describes the code and release state truthfully, and prune transient, stale, or obsolete docs that no longer serve reviewer understanding.

## Context
- Some docs still mix stable `V1`/`v1.0.5` release state with in-progress `v1.1.0` close-out language.
- Temp UI/design notes and historical review artifacts need explicit pruning or preservation decisions.

## Acceptance Criteria
- [ ] Release status docs agree on current stable version and `v1.1.0` in-progress state.
- [ ] Stale future-tense docs are updated or removed.
- [ ] Temporary docs are pruned, archived, or explicitly marked historical.
- [ ] `docs/ai-index.md` and `docs/repo-map.json` are updated if paths are removed or reorganized.
- [ ] Documentation validation passes.

## Dependencies
- [T-0039](./T-0039-v1-1-responsive-qa.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Documentation truth/pruning only; no product behavior changes.
- Pre-PR Critique: Check for broken links, stale release claims, and accidental private/local references.
- Escalation Notes: Use repo docs validation.

## Current State
- Queued.

## Touch Points
- `README.md`
- `docs/05-taskboard/`
- `docs/95-delivery/`
- `docs/temp-ui-ux-design-docs/`
- `docs/ai-index.md`
- `docs/repo-map.json`

## Implementation Plan
- Inventory stale docs and release claims.
- Decide prune vs preserve-as-history for each transient artifact.
- Apply docs updates and path/reference propagation.
- Run docs validation.

## Next Action
- Start after responsive QA findings are known.

## Validation Evidence
- Not started.

## Decision Notes
- (none)

## Validation Plan
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`

## Outcome (Fill when done)
- Not started.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
