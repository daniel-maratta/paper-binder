# T-0013: CP1 CI Pipeline

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
Add CI for backend build/test, frontend build, and docs/reference validation so CP1 leaves the repo with an enforceable merge gate.

## Context
- CP1 requires CI, not just local scripts.
- The pipeline should reuse the same commands documented for local execution where practical.
- This task should stay focused on build and validation enforcement, not deployment automation.
- VS Code support should consume the same command surface that CI enforces.

## Acceptance Criteria
- [ ] CI runs backend restore/build/test
- [ ] CI runs frontend build
- [ ] CI runs docs/reference validation
- [ ] CI status is documented where checkpoint delivery artifacts expect it
- [ ] CI matches the repo's actual command surface rather than bespoke duplicated logic

## Dependencies
- [T-0002](./T-0002-agent-operating-model.md)

## Blocked By
- [T-0010](./T-0010-cp1-solution-skeleton.md) for backend build/test targets
- [T-0011](./T-0011-cp1-frontend-scaffold.md) for frontend build target
- [T-0012](./T-0012-cp1-root-scripts-and-docs-validation.md) for shared validation commands

## Review Gates
- Scope Lock: Pending until task becomes active.
- Pre-PR Critique: Pending until implementation and validation are complete.
- Escalation Notes: (none)

## Current State
- Queued for CP1 and blocked on the command surface defined by earlier CP1 tasks.

## Touch Points
- CI configuration files
- root scripts
- delivery or runbook docs as needed

## Next Action
- Keep queued until solution, frontend, and script tasks define the real validation commands, then wire CI to those commands.

## Validation Evidence
- Pending implementation.

## Decision Notes
- Prefer CI steps that reuse the repo's documented local commands.
- Editor convenience must not diverge from the commands CI validates.

## Validation Plan
- Run the CI workflow or equivalent local commands.
- Verify docs/reference validation is enforced, not advisory.
- Verify CI scope stays within CP1 requirements.

## Outcome (Fill when done)
- Pending implementation.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
