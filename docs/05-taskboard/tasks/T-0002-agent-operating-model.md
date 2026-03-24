# T-0002: Establish Agent Operating Model

## Status
done

## Type
docs

## Priority
P0

## Owner
agent

## Created
2026-03-24

## Updated
2026-03-24

## Checkpoint
CP1

## Phase
Phase 1

## Summary
Define the repo-native operating model for checkpoint execution, durable task state, review gates, and PR discipline, then seed CP1 work as queued tasks.

## Context
- PaperBinder already has an execution plan and taskboard, but it needs a single canonical workflow tying checkpoints, tasks, review gates, and PR artifacts together.
- Public docs must stay model-agnostic and reviewer-friendly.
- Detailed prompt or orchestration content must stay outside the public repository.

## Acceptance Criteria
- [x] Canonical operating-model workflow doc exists under `docs/55-execution/workflows/`
- [x] Execution workflow docs reference the operating model instead of duplicating it
- [x] Task template captures durable review-gate state
- [x] Checkpoint PR template captures critic review and unresolved-risk status
- [x] CP1 work is seeded as separate queued tasks
- [x] Navigation metadata is updated for the new workflow doc

## Dependencies
- [T-0001](./T-0001-bootstrap-task-tracking.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Locked around public execution workflow, durable review gates, and CP1 task seeding only.
- Pre-PR Critique: Passed with no open blocker findings; public docs remain model-agnostic and private orchestration stays out of PaperBinder.

## Touch Points
- docs/55-execution/*
- docs/05-taskboard/*
- docs/95-delivery/*
- docs/ai-index.md
- docs/repo-map.json

## Validation Evidence
- Verified workflow links and lane-guide links resolve after adding the operating-model doc.
- Verified `docs/repo-map.json` remains valid JSON after adding workflow nodes and edges.
- Dry-ran the new task template against seeded CP1 tasks to confirm review-gate and validation-plan fields are sufficient.

## Decision Notes
- Public repo artifacts use `Owner`, `Executor`, and `Critic` role names only.
- Hosting target selection is required by CP2, not during operating-model setup.

## Validation Plan
- Read execution lane docs from README to operating model to sub-workflows.
- Validate taskboard template and queued CP1 tasks for review-gate coverage.
- Validate `docs/repo-map.json` as JSON.

## Outcome (Fill when done)
- Added a canonical execution operating-model workflow and aligned the execution lane around it.
- Added durable review-gate fields to task artifacts and visible critic-review fields to checkpoint PR artifacts.
- Seeded CP1 as four separate queued tasks for immediate execution.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
