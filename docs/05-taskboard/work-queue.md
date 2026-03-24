# Work Queue

This is the active PaperBinder task board for agent execution.

## Board Limits

- `Now` WIP limit: 1-3 tasks.
- Default `Now` target: 1 task unless deliberate low-conflict parallelism is justified.
- `Next` should stay focused (generally <= 10 tasks).
- `Blocked` must include explicit unblock condition.

## Now (WIP 1-3)

- (empty)

## Next

- [T-0010: CP1 Solution Skeleton](./tasks/T-0010-cp1-solution-skeleton.md)
- [T-0011: CP1 Frontend Scaffold](./tasks/T-0011-cp1-frontend-scaffold.md)
- [T-0012: CP1 Root Scripts And Docs Validation](./tasks/T-0012-cp1-root-scripts-and-docs-validation.md)
- [T-0013: CP1 CI Pipeline](./tasks/T-0013-cp1-ci-pipeline.md)

## Later

- (empty)

## Blocked

- (empty)

## Recently Done

- [T-0003: Polish Operator Guidance](./tasks/T-0003-operator-guidance-polish.md)
- [T-0002: Establish Agent Operating Model](./tasks/T-0002-agent-operating-model.md)
- [T-0001: Bootstrap Repo-Native Task Tracking](./tasks/T-0001-bootstrap-task-tracking.md)

## Queue Maintenance Rules

- Every queue entry must link to a `T-####` task file.
- Queue ordering is value/risk/dependency driven.
- A task is moved to `Recently Done` only after `Status: done` and Outcome are recorded.
