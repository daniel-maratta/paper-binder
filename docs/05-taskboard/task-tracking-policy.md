# Task Tracking Policy

## Purpose

Define the agent-operated, long-lived task board model for PaperBinder.
Use this task board whenever work needs durable state across checkpoints, PRs, or sessions.

## Artifacts

- Intake + constraints: `docs/05-taskboard/taskboard-intake.md`
- Active board: `docs/05-taskboard/work-queue.md`
- Durable task specs: `docs/05-taskboard/tasks/T-####-*.md`
- Exploration logs: `docs/05-taskboard/task-log/`

## Task Lifecycle

Allowed `Status` values:
- `queued`
- `active`
- `blocked`
- `done`
- `cancelled`

Transition expectations:
- `queued -> active`: task is pulled into `Now` lane.
- `active -> blocked`: blocker is explicit in task file and queue.
- `blocked -> active`: blocker cleared and re-prioritized.
- `active -> done`: acceptance criteria met and outcome recorded.
- `queued|active|blocked -> cancelled`: no longer needed; rationale recorded.

## Validation State Terms

Use these terms precisely in task files, PR artifacts, and checkpoint notes:
- `implemented`: scoped code/docs/tests are in place, but required validation is still incomplete or blocked
- `validated`: the required commands/checks for the scoped change passed in the current environment and evidence is recorded
- `done`: the task status only after the work is both implemented and validated, with no unresolved blocker finding remaining

`blocked` may still contain implemented work when environment or dependency constraints prevent required validation from finishing.

## Queue Rules

- `work-queue.md` is the current execution board.
- WIP in `Now`: max 3 active tasks.
- Default target in `Now`: 1 active task for clearer human/agent handoff.
- Use 2-3 active tasks only when parallel work is deliberate, low-conflict, and still reviewable.
- `Next` stays curated and ordered by risk/value/dependency.
- `Blocked` items must include blocker and unblock condition.

## Agent Operating Rules

- Triage Inbox into tasks with stable IDs `T-####`.
- Do not renumber task IDs.
- Prefer splitting tasks over inflating a single task.
- Keep one primary task ID per cohesive change set.
- Update task `Status`, `Updated`, and `Outcome` in the same change set that changes execution state.
- Record review-gate outcomes in the task file when scope is locked, critique is complete, or escalation decisions are made.
- Persist multi-checkpoint and cross-session execution state in the task board, not only in transient chat context.

## Logging Rules

- Keep task files stable and concise.
- Put iterative findings and dead-ends into `task-log/`.
- Summarize only durable outcomes in task files.
- Keep detailed critique dialogue and prompt-specific notes outside committed taskboard artifacts.
