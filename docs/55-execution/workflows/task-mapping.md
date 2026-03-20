# Task Mapping Workflow

How execution plan checkpoints integrate with the task board.

## Overview

The execution plan defines *what* to build and in what order. The task board under `docs/05-taskboard/` tracks *progress* and *state*. This workflow bridges the two systems so agents can execute checkpoints while maintaining a durable progress record.

## Mapping Rules

### Checkpoint to Task Relationship

- Each checkpoint produces one or more `T-####` tasks.
- Small checkpoints (2-3 commits, single concern) may map to a single task.
- Larger checkpoints should be split into multiple tasks, one per logical unit of work.
- Never inflate a single task to cover an entire phase. Split by checkpoint at minimum.

### Task Creation

When starting a checkpoint:

1. Create task file(s) under `docs/05-taskboard/tasks/` using the template at `T-0000-task-template.md`.
2. Set `Status: queued` initially.
3. In the `Context` section, reference the checkpoint: e.g., "Part of CP5 - Tenancy Resolution And Immutable Tenant Context."
4. In the `Acceptance Criteria` section, derive criteria from the checkpoint's merge gate conditions.
5. In the `Touch Points` section, list the likely files/modules from the checkpoint's commit descriptions.

### Task Naming Convention

Use the format: `T-####-<checkpoint-slug>[-<detail>].md`

Examples:
- `T-0010-cp1-solution-skeleton.md`
- `T-0011-cp1-ci-pipeline.md`
- `T-0020-cp5-tenant-resolution.md`
- `T-0021-cp5-tenant-context-tests.md`

### Queue Management

- Add new tasks to `Next` in `docs/05-taskboard/work-queue.md`.
- Pull into `Now` when starting work (respect WIP limit of 3).
- Move to `Recently Done` when the task's acceptance criteria are met and `Status: done`.
- If blocked, move to `Blocked` with an explicit unblock condition.

### Scope Discovery

During execution, agents will discover work not anticipated by the checkpoint plan:
- Bugs: create a new task with `type:bug` context.
- Scope expansion: add to the `Inbox` in `docs/05-taskboard/taskboard-intake.md` for triage.
- Technical debt: create a task if it blocks the current checkpoint; otherwise add to `Inbox`.

Do not expand an existing task to absorb discovered work. Split into a new task.

## Agent Operating Notes

- Agents may maintain a local to-do list (e.g., via TodoWrite) for in-session tracking, but durable progress must be recorded in the task files and work queue.
- Update `Status`, `Updated`, and `Outcome` in the task file in the same change set that completes the work.
- Keep task files stable and concise. Put iterative discoveries in `docs/05-taskboard/task-log/`.

## Key References

- [docs/05-taskboard/task-tracking-policy.md](../../05-taskboard/task-tracking-policy.md) - Task lifecycle and queue rules
- [docs/05-taskboard/taskboard-intake.md](../../05-taskboard/taskboard-intake.md) - Intake, objectives, and constraints
- [docs/05-taskboard/work-queue.md](../../05-taskboard/work-queue.md) - Active task board
- [execution-plan.md](../execution-plan.md) - Checkpoint definitions and merge gates
