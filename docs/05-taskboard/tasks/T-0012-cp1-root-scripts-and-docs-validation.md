# T-0012: CP1 Root Scripts And Docs Validation

## Status
done

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
- [x] Root scripts exist for restore, build, test, docs validation, and local startup
- [x] Scripts invoke the actual backend/frontend commands used by the repo
- [x] VS Code tasks and launch settings call the canonical root scripts or startup targets rather than duplicating logic
- [x] Docs validation checks links/references appropriate to the repo state
- [x] README/runbook references are updated to match the scripts
- [x] Script behavior is documented clearly enough for CI reuse

## Dependencies
- [T-0002](./T-0002-agent-operating-model.md)

## Blocked By
- [T-0010](./T-0010-cp1-solution-skeleton.md) for backend command targets
- [T-0011](./T-0011-cp1-frontend-scaffold.md) for frontend command targets

## Review Gates
- Scope Lock: Locked to the canonical CP1 command surface only: restore, build, test, docs validation, local startup, and VS Code wrappers over those commands.
- Pre-PR Critique: Passed with no open blocker findings after script execution and docs validation completed successfully.
- Escalation Notes: (none)

## Current State
- Completed. The repo now has shared PowerShell scripts under `scripts/` plus `.vscode/tasks.json` and `.vscode/launch.json` that reuse the same command surface.

## Touch Points
- root scripts
- `.vscode/`
- `.editorconfig`
- docs validation utilities
- README and runbook references

## Next Action
- Leave queued until T-0010 and T-0011 establish the actual command surface, then add root scripts, VS Code wrappers, and docs validation around those commands.

## Validation Evidence
- `powershell -ExecutionPolicy Bypass -File .\scripts\restore.ps1` completed successfully after redirecting npm/NuGet caches into the workspace.
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release` completed successfully.
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release` completed successfully.
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` completed successfully.
- README and `docs/70-operations/runbook-local.md` now reference the shipped command surface instead of future-state bootstrap steps.

## Decision Notes
- Script names should stay simple and reviewer-friendly.
- VS Code convenience must remain a thin wrapper over the repo's canonical scripts.

## Validation Plan
- Run each root script from a clean state.
- Verify VS Code task wiring invokes the same commands without drift.
- Verify docs-validation checks target real files and current canonical docs.
- Verify referenced commands align with backend and frontend work.

## Outcome (Fill when done)
- Added canonical restore/build/test/docs-validation/local-start scripts under `scripts/`.
- Added a repo-native docs validator that checks `docs/repo-map.json`, canonical entry points, markdown links, and local heading anchors.
- Added VS Code tasks/launch support that layers on top of the same scripts instead of introducing a parallel command surface.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
