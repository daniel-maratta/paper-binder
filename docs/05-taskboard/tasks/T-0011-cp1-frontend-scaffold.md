# T-0011: CP1 Frontend Scaffold

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
Create the Vite React frontend scaffold aligned to the locked PaperBinder stack and ready for later route and UI work.

## Context
- CP1 requires a real frontend workspace, not a placeholder.
- The scaffold must follow the locked frontend stack and avoid BFF, SSR, or speculative state-management additions.
- This task covers the client workspace only; root scripts and CI wiring are separate tasks.

## Acceptance Criteria
- [ ] Frontend app scaffold exists with React, TypeScript, and Vite
- [ ] Package manager and engine metadata are pinned per repo policy
- [ ] Frontend build succeeds
- [ ] Baseline structure aligns with current frontend standards
- [ ] Frontend workspace can be run from VS Code tasks/launch settings without adding a separate command surface
- [ ] Docs are updated if scaffold decisions affect canonical expectations

## Dependencies
- [T-0002](./T-0002-agent-operating-model.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Pending until task becomes active.
- Pre-PR Critique: Pending until implementation and validation are complete.
- Escalation Notes: (none)

## Current State
- Queued for CP1. Waiting on execution after solution-skeleton work begins or completes.

## Touch Points
- frontend application directory
- package metadata
- frontend-related docs or scripts

## Next Action
- Keep this queued until the CP1 backend skeleton is underway, then implement the Vite React scaffold against the locked frontend stack.

## Validation Evidence
- Pending implementation.

## Decision Notes
- Keep dependencies conservative and aligned with the locked stack.
- Keep workspace conventions friendly to VS Code integrated terminal and task execution.

## Validation Plan
- Run frontend install/restore command and frontend build.
- Verify the frontend command surface can be invoked cleanly from VS Code task wiring.
- Verify scaffold choices match stack and frontend standards docs.
- Verify any changed docs remain synchronized.

## Outcome (Fill when done)
- Pending implementation.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
