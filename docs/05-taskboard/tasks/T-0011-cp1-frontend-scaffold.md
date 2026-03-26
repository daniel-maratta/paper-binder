# T-0011: CP1 Frontend Scaffold

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
Create the Vite React frontend scaffold aligned to the locked PaperBinder stack and ready for later route and UI work.

## Context
- CP1 requires a real frontend workspace, not a placeholder.
- The scaffold must follow the locked frontend stack and avoid BFF, SSR, or speculative state-management additions.
- This task covers the client workspace only; root scripts and CI wiring are separate tasks.

## Acceptance Criteria
- [x] Frontend app scaffold exists with React, TypeScript, and Vite
- [x] Package manager and engine metadata are pinned per repo policy
- [x] Frontend build succeeds
- [x] Baseline structure aligns with current frontend standards
- [x] Frontend workspace can be run from VS Code tasks/launch settings without adding a separate command surface
- [x] Docs are updated if scaffold decisions affect canonical expectations

## Dependencies
- [T-0002](./T-0002-agent-operating-model.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Locked to a Vite/React/TypeScript scaffold with Tailwind and a minimal Radix primitive usage only; no SSR, BFF, realtime, or extra form/state libraries were introduced.
- Pre-PR Critique: Passed with no open blocker findings after the frontend build, workspace launch wiring, and docs updates validated successfully.
- Escalation Notes: (none)

## Current State
- Completed. `src/PaperBinder.Web` now contains the pinned React/Vite/TypeScript scaffold, route placeholders, Tailwind wiring, and the committed `package-lock.json`.

## Touch Points
- frontend application directory
- package metadata
- frontend-related docs or scripts

## Next Action
- Keep this queued until the CP1 backend skeleton is underway, then implement the Vite React scaffold against the locked frontend stack.

## Validation Evidence
- `npm.cmd install --prefix src/PaperBinder.Web` completed successfully and generated `src/PaperBinder.Web/package-lock.json`.
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release` completed successfully, including the Vite production build.
- The VS Code frontend launch configuration now starts `npm.cmd run dev` from `src/PaperBinder.Web`.

## Decision Notes
- Keep dependencies conservative and aligned with the locked stack.
- Keep workspace conventions friendly to VS Code integrated terminal and task execution.

## Validation Plan
- Run frontend install/restore command and frontend build.
- Verify the frontend command surface can be invoked cleanly from VS Code task wiring.
- Verify scaffold choices match stack and frontend standards docs.
- Verify any changed docs remain synchronized.

## Outcome (Fill when done)
- Added the Vite React frontend scaffold under `src/PaperBinder.Web`.
- Pinned Node/npm expectations in the frontend package manifest to match the repo root policy.
- Added a minimal route shell and styling baseline that stay inside the documented frontend constraints and leave feature behavior to later checkpoints.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
