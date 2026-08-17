# T-0046: V1.1.1 Patch Planning And Taskboard Alignment

## Status
done

## Type
docs

## Priority
P1

## Owner
agent

## Created
2026-07-28

## Updated
2026-07-28

## Checkpoint
CP1

## Phase
V1.1.1 patch

## Summary
Create the checkpointed `v1.1.1` implementation plan and align the taskboard so each checkpoint maps to a cohesive commit.

## Context
- `v1.1.0` has shipped.
- The owner requested a narrow `v1.1.1` patch covering release validation generalization, Compose noise cleanup, small review-driven cleanup, README provenance polish, the real flagship article link, final validation, and a final hiring assessment review.
- Plan and taskboard agreement is required before implementation starts.

## Acceptance Criteria
- [x] `docs/95-delivery/v1-1-1-implementation-plan.md` defines the checkpoint and commit plan.
- [x] `docs/05-taskboard/v1-1-1-backlog.md` lists the same tasks, order, checkpoints, and carry-forwards.
- [x] `docs/05-taskboard/work-queue.md` queues the `v1.1.1` task sequence.
- [x] Task files exist for each planned `v1.1.1` checkpoint task.
- [x] `docs/ai-index.md` and `docs/repo-map.json` include the new planning/taskboard artifacts.
- [x] Documentation validation passes.

## Dependencies
- (none)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Planning and taskboard alignment only.
- Pre-PR Critique: Confirm plan/taskboard agreement before commit.
- Escalation Notes: Git writes require approval if this checkpoint is committed from the agent session.

## Current State
- Done. Planning docs, task files, queue state, and navigation artifacts agree on the `v1.1.1` checkpoint sequence.

## Touch Points
- `docs/95-delivery/v1-1-1-implementation-plan.md`
- `docs/05-taskboard/v1-1-1-backlog.md`
- `docs/05-taskboard/work-queue.md`
- `docs/05-taskboard/tasks/`
- `docs/ai-index.md`
- `docs/repo-map.json`

## Implementation Plan
- Create the `v1.1.1` implementation plan.
- Create and queue the matching taskboard tasks.
- Update navigation and map artifacts.
- Run docs validation.

## Next Action
- Pull `T-0047` and `T-0048` for CP2.

## Validation Evidence
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` - passed on 2026-07-28.

## Decision Notes
- CP3 and CP4 are explicitly discovery-first. Cleanup is allowed only when small, safe, and beneficial.
- CP6 includes final validation before the hiring assessment review; findings from that review are remediated afterward unless explicitly carried forward.

## Validation Plan
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`

## Outcome (Fill when done)
- Done on 2026-07-28. Created the `v1.1.1` implementation plan, created the active `v1.1.1` backlog, queued `T-0047` through `T-0052`, recorded explicit carry-forwards, and updated navigation artifacts so the plan and taskboard agree.
