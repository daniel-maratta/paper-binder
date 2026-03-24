# T-0003: Polish Operator Guidance

## Status
done

## Type
docs

## Priority
P1

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
Tighten the operator workflow with clearer handoff cues, a default single-item `Now` posture, and private cheat-sheet docs for repeatable executor and critic invocations.

## Context
- The initial operating model is in place, but daily use benefits from shorter, more repeatable operator commands.
- Natural-language commands become more reliable when the queue has one obvious active task and task files expose the next handoff step.
- Private guidance should contain copy-paste operator commands and shorthand phrase mapping rather than relying on memory.

## Acceptance Criteria
- [x] Taskboard policy prefers a single active `Now` item unless deliberate parallelism is justified
- [x] Task template includes a durable `Next Action` handoff field
- [x] Seeded CP1 tasks expose the next action explicitly
- [x] Private operator cheat sheet exists in the sibling repo
- [x] Private command lexicon exists in the sibling repo
- [x] Navigation metadata is updated for added private docs

## Dependencies
- [T-0002](./T-0002-agent-operating-model.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Limited to operator workflow clarity, not broader process redesign.
- Pre-PR Critique: Passed with no blocker findings; public docs remain model-agnostic and private guidance stays private.
- Escalation Notes: (none)

## Touch Points
- docs/05-taskboard/*
- docs/55-execution/*
- sibling private operator docs

## Validation Evidence
- Verified updated taskboard docs and task template read coherently around a default single-item `Now`.
- Verified private cheat-sheet and lexicon docs are indexed in the sibling repo metadata.
- Verified both repo maps remain valid JSON after navigation updates.

## Decision Notes
- Keep shorthand commands private and repo-specific rather than adding command syntax to public PaperBinder docs.

## Validation Plan
- Read the taskboard lane guide, task-tracking policy, and work queue together.
- Read the private cheat sheet and command lexicon together with the executor and critic overlays.
- Validate both repo-map files as JSON.

## Outcome (Fill when done)
- Added clearer queue discipline and handoff fields in PaperBinder.
- Added private operator docs for repeatable Codex and Claude invocation patterns.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
