# T-0013: CP1 CI Pipeline

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
Add CI for backend build/test, frontend build, and docs/reference validation so CP1 leaves the repo with an enforceable merge gate.

## Context
- CP1 requires CI, not just local scripts.
- The pipeline should reuse the same commands documented for local execution where practical.
- This task should stay focused on build and validation enforcement, not deployment automation.
- VS Code support should consume the same command surface that CI enforces.

## Acceptance Criteria
- [x] CI runs backend restore/build/test
- [x] CI runs frontend build
- [x] CI runs docs/reference validation
- [x] CI status is documented where checkpoint delivery artifacts expect it
- [x] CI matches the repo's actual command surface rather than bespoke duplicated logic

## Dependencies
- [T-0002](./T-0002-agent-operating-model.md)

## Blocked By
- [T-0010](./T-0010-cp1-solution-skeleton.md) for backend build/test targets
- [T-0011](./T-0011-cp1-frontend-scaffold.md) for frontend build target
- [T-0012](./T-0012-cp1-root-scripts-and-docs-validation.md) for shared validation commands

## Review Gates
- Scope Lock: Locked to one CP1 CI workflow only, reusing the shipped restore/build/test/docs-validation scripts and removing placeholder workflow files.
- Pre-PR Critique: Passed with no open blocker findings after the workflow matched the validated local command surface.
- Escalation Notes: (none)

## Current State
- Completed. `.github/workflows/ci.yml` now restores dependencies, builds the frontend and .NET solution, runs tests, and validates docs using the same scripts documented for local use.

## Touch Points
- CI configuration files
- root scripts
- delivery or runbook docs as needed

## Next Action
- Keep queued until solution, frontend, and script tasks define the real validation commands, then wire CI to those commands.

## Validation Evidence
- Local equivalent of the CI workflow completed successfully:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\restore.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- The committed CI workflow now uses `actions/setup-dotnet`, `actions/setup-node`, and the repo scripts instead of bespoke inline command logic.

## Decision Notes
- Prefer CI steps that reuse the repo's documented local commands.
- Editor convenience must not diverge from the commands CI validates.

## Validation Plan
- Run the CI workflow or equivalent local commands.
- Verify docs/reference validation is enforced, not advisory.
- Verify CI scope stays within CP1 requirements.

## Outcome (Fill when done)
- Replaced the placeholder CI setup with a real `ci.yml` workflow.
- Removed the obsolete placeholder workflows so CI scope is clear and non-duplicated.
- Aligned CI with the shipped root scripts and the documented local command surface.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
