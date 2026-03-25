# T-0012: CP1 Root Scripts And Docs Validation

## Status
queued

## Type
feature

## Priority
P0

## Owner
agent

## Created
2026-03-24

## Updated
2026-03-25

## Checkpoint
CP1

## Phase
Phase 1

## Summary
Add root-level restore, build, test, docs-validation, and local-startup scripts so the repo can be operated consistently from a clean checkout, including through VS Code tasks.

## Context
- CP1 explicitly requires agents to create the bootstrap and validation scripts instead of assuming they already exist.
- The scripts are the handoff layer between the repo's docs and actual execution.
- This task also establishes how documentation/reference validation is run locally and in CI.
- VS Code support must layer on top of these scripts rather than inventing a parallel editor-only command surface.

## Acceptance Criteria
- [ ] Root scripts exist for restore, build, test, docs validation, and local startup
- [ ] Scripts invoke the actual backend/frontend commands used by the repo
- [ ] VS Code tasks and launch settings call the canonical root scripts or startup targets rather than duplicating logic
- [ ] Docs validation checks links/references appropriate to the repo state
- [ ] README/runbook references are updated to match the scripts
- [ ] Script behavior is documented clearly enough for CI reuse

## Dependencies
- [T-0002](./T-0002-agent-operating-model.md)

## Blocked By
- [T-0010](./T-0010-cp1-solution-skeleton.md) for backend command targets
- [T-0011](./T-0011-cp1-frontend-scaffold.md) for frontend command targets

## Review Gates
- Scope Lock: Pending until task becomes active.
- Pre-PR Critique: Pending until implementation and validation are complete.
- Escalation Notes: (none)

## Current State
- Queued for CP1 and waiting on concrete backend/frontend command targets.

## Touch Points
- root scripts
- `.vscode/`
- `.editorconfig`
- docs validation utilities
- README and runbook references

## Next Action
- Leave queued until T-0010 and T-0011 establish the actual command surface, then add root scripts, VS Code wrappers, and docs validation around those commands.

## Validation Evidence
- Pending implementation.

## Decision Notes
- Script names should stay simple and reviewer-friendly.
- VS Code convenience must remain a thin wrapper over the repo's canonical scripts.

## Validation Plan
- Run each root script from a clean state.
- Verify VS Code task wiring invokes the same commands without drift.
- Verify docs-validation checks target real files and current canonical docs.
- Verify referenced commands align with backend and frontend work.

## Outcome (Fill when done)
- Pending implementation.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
