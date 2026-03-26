# Execution Lane

This lane contains PaperBinder execution artifacts for product delivery.

## Canonical Plan

- [execution-plan.md](./execution-plan.md) - The V1 execution plan (17 checkpoints, 5 phases)
- [checkpoint-status.md](./checkpoint-status.md) - Canonical checkpoint-level progress ledger

## Phases

Phase files provide entry/exit conditions, checkpoint summaries, and task integration guidance for each phase of the execution plan.

- [phases/phase-1-platform-baseline.md](./phases/phase-1-platform-baseline.md) - CP1-CP4: Workspace, deployment, persistence, HTTP contract
- [phases/phase-2-security-boundary.md](./phases/phase-2-security-boundary.md) - CP5-CP8: Tenancy, auth, abuse controls, RBAC
- [phases/phase-3-product-domain.md](./phases/phase-3-product-domain.md) - CP9-CP11: Binders, documents, lease lifecycle
- [phases/phase-4-frontend-experience.md](./phases/phase-4-frontend-experience.md) - CP12-CP15: UI foundation, root-host, tenant-host, impersonation
- [phases/phase-5-hardening-release.md](./phases/phase-5-hardening-release.md) - CP16-CP17: Hardening and release prep

## Workflows

Workflow files define agent operating procedures for executing the plan.

- [workflows/agent-operating-model.md](./workflows/agent-operating-model.md) - Canonical owner/executor/critic workflow and review-gate model
- [workflows/checkpoint-lifecycle.md](./workflows/checkpoint-lifecycle.md) - How to work through a single checkpoint from plan to merge
- [workflows/task-mapping.md](./workflows/task-mapping.md) - How checkpoints map to the task board under `docs/05-taskboard/`
- [workflows/pr-workflow.md](./workflows/pr-workflow.md) - PR scope, validation, and merge discipline

## Alignment

Execution artifacts in this lane must align with:
- [docs/00-intent/project-scope.md](../00-intent/project-scope.md)
- [docs/00-intent/non-goals.md](../00-intent/non-goals.md)
- [docs/30-security/tenant-isolation.md](../30-security/tenant-isolation.md)
- [docs/80-testing/test-strategy.md](../80-testing/test-strategy.md)

## Task Tracking Integration

Agents executing this plan track progress via:
- [docs/05-taskboard/work-queue.md](../05-taskboard/work-queue.md) - Active task board
- [docs/05-taskboard/taskboard-intake.md](../05-taskboard/taskboard-intake.md) - Objectives, constraints, and intake inbox
- [docs/05-taskboard/tasks/](../05-taskboard/tasks/) - Durable task specs
- [docs/05-taskboard/task-tracking-policy.md](../05-taskboard/task-tracking-policy.md) - Lifecycle and queue rules
- [checkpoint-status.md](./checkpoint-status.md) - Checkpoint-level done/active/next/blocked view

Use the task board when execution state needs to persist across checkpoints, PRs, or sessions.
Use the checkpoint ledger when reviewers or agents need a concise plan-level view without inspecting individual task files.
