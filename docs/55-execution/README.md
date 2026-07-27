# Execution Lane

This lane points to archived PaperBinder `V1` execution artifacts.

Status: the 17-checkpoint plan is completed historical `V1` execution evidence (`CP1`-`CP17`, all done). It is retained under `docs/archive/` for provenance and is not where current work is tracked. Current `v1.1.0` execution state lives in `docs/05-taskboard/v1-1-backlog.md` and `docs/05-taskboard/work-queue.md`.

## Canonical Plan

- [docs/archive/v1/checkpoints/execution-plan.md](../archive/v1/checkpoints/execution-plan.md) - Historical V1 execution plan (17 checkpoints, 5 phases)
- [docs/archive/v1/checkpoints/checkpoint-status.md](../archive/v1/checkpoints/checkpoint-status.md) - Historical checkpoint-level progress ledger

## Phases

Phase files provide entry/exit conditions, checkpoint summaries, and task integration guidance for each phase of the execution plan.

- [docs/archive/v1/checkpoints/phases/phase-1-platform-baseline.md](../archive/v1/checkpoints/phases/phase-1-platform-baseline.md) - CP1-CP4: Workspace, deployment, persistence, HTTP contract
- [docs/archive/v1/checkpoints/phases/phase-2-security-boundary.md](../archive/v1/checkpoints/phases/phase-2-security-boundary.md) - CP5-CP8: Tenancy, auth, abuse controls, RBAC
- [docs/archive/v1/checkpoints/phases/phase-3-product-domain.md](../archive/v1/checkpoints/phases/phase-3-product-domain.md) - CP9-CP11: Binders, documents, lease lifecycle
- [docs/archive/v1/checkpoints/phases/phase-4-frontend-experience.md](../archive/v1/checkpoints/phases/phase-4-frontend-experience.md) - CP12-CP15: UI foundation, root-host, tenant-host, impersonation
- [docs/archive/v1/checkpoints/phases/phase-5-hardening-release.md](../archive/v1/checkpoints/phases/phase-5-hardening-release.md) - CP16-CP17: Hardening and release prep

## Workflows

Workflow files define agent operating procedures for executing the plan.

- [docs/archive/v1/checkpoints/workflows/agent-operating-model.md](../archive/v1/checkpoints/workflows/agent-operating-model.md) - Historical owner/executor/critic workflow and review-gate model
- [docs/archive/v1/checkpoints/workflows/checkpoint-lifecycle.md](../archive/v1/checkpoints/workflows/checkpoint-lifecycle.md) - Historical checkpoint lifecycle
- [docs/archive/v1/checkpoints/workflows/task-mapping.md](../archive/v1/checkpoints/workflows/task-mapping.md) - Historical checkpoint-to-taskboard mapping
- [docs/archive/v1/checkpoints/workflows/pr-workflow.md](../archive/v1/checkpoints/workflows/pr-workflow.md) - Historical PR scope, validation, and merge discipline

For command execution discipline inside those workflows, also load [docs/50-engineering/agent-execution-hygiene.md](../50-engineering/agent-execution-hygiene.md).

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
- [docs/archive/v1/checkpoints/checkpoint-status.md](../archive/v1/checkpoints/checkpoint-status.md) - Historical checkpoint-level done/active/next/blocked view

Use the task board when execution state needs to persist across checkpoints, PRs, or sessions.
Use the checkpoint ledger when reviewers or agents need a concise plan-level view without inspecting individual task files.
