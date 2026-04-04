# Checkpoint Lifecycle Workflow

How an agent works through a single checkpoint from the execution plan.

## Overview

Each checkpoint in `execution-plan.md` is a mergeable increment that leaves `main` green. This workflow defines the steps an agent follows to execute a checkpoint from start to merge.

This workflow is a checkpoint-specific companion to [agent-operating-model.md](./agent-operating-model.md). Use the operating model for roles, review gates, and durable-state rules.

## Lifecycle

### 1. Plan

- Read the checkpoint definition in [execution-plan.md](../execution-plan.md).
- Read the relevant phase file in [phases/](../phases/) for entry conditions and context.
- Read [checkpoint-status.md](../checkpoint-status.md) for current checkpoint sequencing, prior completion state, and open checkpoint-level follow-ups.
- Identify the commits listed for the checkpoint.
- Check `docs/05-taskboard/work-queue.md` for related active or blocked tasks.
- Record intended validation and review-gate expectations in the task file before broad implementation starts.

### 2. Create Tasks

- Create one or more `T-####` task files under `docs/05-taskboard/tasks/` for the checkpoint's work.
- Reference the checkpoint ID (e.g., `CP3`) in the task's Context section.
- Add tasks to `docs/05-taskboard/work-queue.md` in the appropriate lane.
- Update `docs/55-execution/checkpoint-status.md` to mark the checkpoint `active` when execution starts.
- Respect WIP limits: max 3 tasks in `Now`.
- Use the task file's `Review Gates` section to capture scope lock, pre-PR critique, and escalation outcomes.

### 3. Execute

- Work through the checkpoint's commits in order.
- Each commit should be cohesive and buildable.
- Ship contract updates and tests in the same change set as the behavior they cover.
- Update task status to `active` when work begins.
- Keep unrelated discoveries out of the current checkpoint by creating a new task or Inbox entry.

### 4. Validate Merge Gate

- Verify every condition listed in the checkpoint's merge gate.
- Run the build, test suite, and any docs validation scripts.
- Run `scripts/validate-launch-profiles.ps1`.
- Record manual VS Code and Visual Studio launch verification in the checkpoint PR artifact before treating the checkpoint as done.
- Confirm no tenant isolation, auth, or lease invariants are violated.
- Complete pre-PR critique before considering the checkpoint work ready to merge.

### 5. Merge And Close

- Merge the checkpoint's PR(s) to `main`.
- Confirm `main` is green after merge.
- Update task status to `done` and record outcomes.
- Move completed tasks to `Recently Done` in `work-queue.md`.
- Update `docs/55-execution/checkpoint-status.md` to mark the checkpoint `done`, advance the snapshot, and record any checkpoint-level follow-ups.

## Rules

- A checkpoint is not done until its merge gate passes completely.
- If a merge gate condition fails, fix the issue before merging. Do not defer.
- If work reveals new scope, capture it in the `Inbox` of `docs/05-taskboard/taskboard-intake.md` and create a separate task. Do not expand the current checkpoint.
- If work reveals a follow-up that affects checkpoint readiness, sequencing, or closure, record the detailed item in the taskboard and add a short checkpoint-level note to `docs/55-execution/checkpoint-status.md`.
- Keep PRs small and reviewable. A checkpoint may be 1-5 PRs, not one giant PR.
- When work spans sessions or multiple checkpoints, persist state in the task board rather than relying on chat history alone.
