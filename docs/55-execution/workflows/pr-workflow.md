# PR Workflow

How pull requests are structured and merged during execution plan delivery.

## Overview

Every checkpoint ends in a merge to `main`. This workflow defines how PRs are created, scoped, and validated to maintain the execution plan's invariants.

## PR Scope Rules

- A PR must be cohesive: one logical concern per PR.
- A checkpoint may produce 1-5 PRs. Prefer fewer, well-scoped PRs over many tiny ones.
- Every PR must leave `main` buildable, testable, and documentation-consistent.
- No speculative abstractions. Build only what the checkpoint requires.

## PR Contents Checklist

Before opening a PR, verify:

- [ ] Code changes implement the checkpoint's commit description.
- [ ] Tests are included for new behavior in the same PR.
- [ ] Canonical docs are updated in the same PR if behavior, contracts, or terms changed.
- [ ] Tenant scoping is not weakened for implementation convenience.
- [ ] No non-goals are introduced without explicit ADR and scope approval.

## PR Validation

Before merging, the PR must satisfy:

- [ ] Backend build passes.
- [ ] Frontend build passes.
- [ ] All relevant test suites pass (unit, integration, E2E as applicable).
- [ ] Docs validation passes (if docs validation scripts exist).
- [ ] The checkpoint's merge gate conditions that this PR addresses are met.

## Merge Discipline

- Merge to `main` only when validation passes.
- No long-lived feature branches. Checkpoint work should merge within the checkpoint's natural scope.
- If a PR is blocked, record the blocker in the associated task file and move the task to `Blocked` in `docs/05-taskboard/work-queue.md`.
- After merge, verify `main` is green. If not, fix forward immediately.

## Relationship To Checkpoints And Tasks

- Each PR should reference its associated task ID(s) in the commit message or PR description (e.g., "Refs T-0020").
- When the final PR for a checkpoint merges, update all associated tasks to `Status: done` and record outcomes.
- Move completed tasks to `Recently Done` in `docs/05-taskboard/work-queue.md`.
