# Agent Operating Model

How PaperBinder execution is organized across owner decisions, agent execution, taskboard state, and review gates.

## Purpose

This workflow binds the execution plan, taskboard, and PR artifacts into one repo-native operating model.

Use this document when starting checkpoint work, defining tasks, reviewing changes, or checking whether a checkpoint is ready to merge.

## Core Model

- The taskboard under `docs/05-taskboard/` is the durable source of truth for in-flight execution state.
- `docs/55-execution/checkpoint-status.md` is the canonical checkpoint-level progress ledger.
- A checkpoint is the delivery unit. Checkpoints define outcome and merge gate.
- A PR is the merge unit. A checkpoint may span 1-5 cohesive PRs.
- The workflow is role-based and model-agnostic:
  - `Owner`: objectives, approvals, merge/release control
  - `Executor`: scoped implementation, tests, docs propagation, validation evidence
  - `Critic`: findings-first review against scope, invariants, tests, and documentation integrity

## Role Responsibilities

### Owner

- Sets objectives and constraints in `docs/05-taskboard/taskboard-intake.md`.
- Approves scope changes, stack changes, and expensive-to-reverse decisions.
- Owns branch management, PR lifecycle, merge decisions, and release/tag decisions.

### Executor

- Works from a checkpoint-defined outcome and task-defined scope.
- Keeps changes cohesive and reviewable.
- Updates tests and required docs in the same change set as behavior changes.
- Records validation plans, validation evidence, and durable outcomes in the taskboard.

### Critic

- Reviews findings before work expands or merges.
- Prioritizes correctness, scope discipline, invariants, tests, and documentation integrity.
- Records only durable conclusions, blocking findings, or accepted gaps in repo artifacts.
- Keeps detailed review dialogue out of committed task files and PR templates.

## Operating Flow

### 1. Select Checkpoint

- Read the checkpoint in `../execution-plan.md` and the relevant phase file in `../phases/`.
- Read `../checkpoint-status.md` to confirm current checkpoint state, sequencing, and any open checkpoint-level follow-ups.
- Confirm dependencies, entry conditions, and merge gate.
- Check the taskboard for active, blocked, or related queued tasks.

### 2. Map Work Into Durable Tasks

- Create one or more `T-####` tasks under `docs/05-taskboard/tasks/`.
- Keep one primary task per cohesive change set.
- Add tasks to `docs/05-taskboard/work-queue.md` and respect the `Now` WIP limit.
- Default to one active task in `Now` for clearer handoff unless low-conflict parallel work is intentional.
- Put newly discovered unrelated work into `docs/05-taskboard/taskboard-intake.md` or a new task; do not silently expand the current task.

### 3. Lock Scope

- The `Executor` records intended outcome, validation plan, and likely touch points in the task file.
- The `Critic` performs scope-lock review before broad implementation begins.
- If the review finds scope drift, missing acceptance criteria, or an ADR trigger, fix that before continuing.

### 4. Execute

- Implement the smallest coherent change that advances the checkpoint outcome.
- Keep contract updates, tests, and documentation propagation in the same change set.
- Preserve tenant isolation, authorization boundaries, and other checkpoint invariants.

### 5. Validate

- Run targeted validation for the changed behavior.
- Verify the checkpoint merge gate conditions addressed by the change.
- Record concrete commands, checks, and manual verification in the task file.
- Use the terms `implemented`, `validated`, and `done` precisely:
  - `implemented`: scoped changes are in place
  - `validated`: required evidence is recorded from the current environment
  - `done`: only after both implementation and validation are complete

### 6. Critique Before PR Or Merge

- The `Critic` performs a findings-first pre-PR review.
- Record durable findings, accepted gaps, or explicit "no findings" results in the task file and PR artifact.
- Do not merge while unresolved blocker findings remain.

### 7. Merge And Close

- Merge only when the relevant build, test, and docs-validation expectations pass.
- Update task status, validation evidence, review-gate outcomes, and task outcome in the same change set.
- Move completed tasks to `Recently Done` in `docs/05-taskboard/work-queue.md`.
- Update `../checkpoint-status.md` when checkpoint state changes, especially on checkpoint start, block, or completion.

## Review Gates

### Scope Lock

Use before substantial implementation starts.

Checks:
- task scope matches checkpoint intent
- acceptance criteria are concrete
- validation plan exists
- ADR triggers are identified

### Pre-PR Critique

Use after implementation and validation, before PR handoff or merge.

Checks:
- diff remains cohesive
- tests and documentation propagation are present
- boundary and contract behavior remain correct
- residual risks are explicit

### Ambiguity Or Escalation

Use when the `Executor` encounters a blocker, ambiguous requirement, or expensive-to-reverse choice.

Checks:
- clarify whether the issue is scope, architecture, or implementation detail
- determine whether owner approval is required
- record the durable outcome in the task file

## Durable Artifacts

Minimum committed state for implementation work:

- task file with scope, acceptance criteria, review gates, validation plan, validation evidence, and outcome
- task file with a durable current-state note and next-action handoff
- queue entry in `docs/05-taskboard/work-queue.md`
- checkpoint entry in `docs/55-execution/checkpoint-status.md` when checkpoint status changes
- PR description using the checkpoint template when implementation work is opened for review

Detailed critic transcripts, prompt strategies, and model-specific orchestration remain outside PaperBinder.

## Hosting Decision Rule

- Do not force a concrete hosting target during operating-model setup.
- By `CP2`, the active task set must include selection and recording of the concrete deployment target.
- If the selected target departs from the locked stack or materially changes deployment posture, request approval and add an ADR in the same change set.

## Related Workflows

- [checkpoint-lifecycle.md](./checkpoint-lifecycle.md)
- [task-mapping.md](./task-mapping.md)
- [pr-workflow.md](./pr-workflow.md)
