# Taskboard Intake

This is the long-lived intake and constraints file for the PaperBinder agent task board.
Use it to persist incoming work, owner constraints, and triage state between checkpoints and sessions.

## Authority Model

- Owner controls Objectives and Constraints.
- Agents control Inbox triage, task creation, queue ordering, and task-state progression.
- When uncertain, capture first in Inbox and triage later.

## Objectives (Owner-Managed)

- Ship PaperBinder v1 as a hiring-grade, production-oriented artifact.
- Keep scope narrow and intentional; prefer vertical slices.
- Preserve tenant isolation and security boundaries as non-negotiable.
- Keep docs and decision trail reviewer-friendly.

## Constraints (Owner-Managed)

- Minimize churn and unnecessary refactors.
- One primary task per PR or cohesive change set.
- Prefer additive change over broad restructure.
- If scope expands, split into a new task.

## Inbox (Agent-Triaged, Append-Only)

Capture raw work items here before they become tasks.

Entry format:
- `[ ] <short title> | type:<feature|bug|docs|risk|debt> | source:<where it came from>`

Examples:
- [ ] Improve lease-expiry messaging for demo tenant | type:feature | source:review feedback
- [ ] Tighten correlation ID docs around API failures | type:docs | source:architecture pass
- [ ] Verify tenant purge edge case around expired-but-not-purged state | type:risk | source:test findings

- [x] Investigate opaque `dotnet restore` exit-1 behavior on the current Windows/.NET 10 SDK stack -> T-0021 | type:risk | source:T-0016 validation

## Triage Rules

- Agents periodically convert Inbox entries into `T-####` task files.
- Converted entries are either removed from Inbox or marked with `-> T-####`.
- Keep Inbox short; stale items should be either promoted or explicitly deferred.
