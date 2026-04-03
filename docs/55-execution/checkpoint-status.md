# Checkpoint Status Ledger
Status: Current

## Purpose

Provide a checkpoint-level progress view for the execution plan without replacing the taskboard.

Use this document to answer:
- which checkpoints are done
- which checkpoint is currently active
- which checkpoints are next
- which follow-ups, risks, or incidental items still need attention

## Operating Rules

- This ledger is the canonical checkpoint-level status view for `docs/55-execution/execution-plan.md`.
- The taskboard under `docs/05-taskboard/` remains the canonical task-level state system.
- Update this file when:
  - a checkpoint starts
  - a checkpoint is blocked
  - the final PR for a checkpoint merges
  - a checkpoint produces durable follow-up work, risks, or deferred items
- Keep entries short and durable. Link to task files or PR artifacts for detail.
- Do not track day-to-day implementation notes here; keep those in the taskboard and task logs.

## Current Snapshot

- Current checkpoint: `CP5`
- Last completed checkpoint: `CP4`
- Next checkpoint: `CP6`
- Open checkpoint blockers: none.
- Open incidental follow-ups: investigate opaque `dotnet restore` exit-1 behavior on the current Windows/.NET 10 SDK stack.

## Checkpoint Status

| Checkpoint | Status | Notes |
| --- | --- | --- |
| `CP1` | done | Workspace bootstrap and CI shipped on branch `checkpoint-1-workspace-bootstrap-and-ci`; tasks `T-0010` through `T-0013` are complete. |
| `CP2` | done | Runtime configuration and local deployment scaffold shipped via task [T-0014](../05-taskboard/tasks/T-0014-cp2-runtime-configuration-and-local-deployment-scaffold.md) and PR artifact [description.md](../95-delivery/pr/cp2-runtime-configuration-and-local-deployment-scaffold/description.md). |
| `CP3` | done | Persistence baseline and migration pipeline shipped via task [T-0015](../05-taskboard/tasks/T-0015-cp3-persistence-baseline-and-migration-pipeline.md), with follow-up hardening in [T-0016](../05-taskboard/tasks/T-0016-repo-validation-tooling-hardening.md). Docker-backed migration and integration validation now pass. PR artifact: [description.md](../95-delivery/pr/cp3-persistence-baseline-and-migration-pipeline/description.md). |
| `CP4` | done | HTTP contract baseline shipped via task [T-0017](../05-taskboard/tasks/T-0017-cp4-http-contract-baseline.md). PR artifact: [description.md](../95-delivery/pr/cp4-http-contract-baseline/description.md). |
| `CP5` | active | Tenancy resolution and immutable tenant context are implemented and validated on the current branch via task [T-0018](../05-taskboard/tasks/T-0018-cp5-tenancy-resolution-and-immutable-tenant-context.md). PR artifact: [description.md](../95-delivery/pr/cp5-tenancy-resolution-and-immutable-tenant-context/description.md). |
| `CP6` | queued | Identity, authentication, and membership validation not started. |
| `CP7` | queued | Pre-auth abuse controls and provisioning surface not started. |
| `CP8` | queued | Authorization policies and tenant user administration not started. |
| `CP9` | queued | Binder domain and policy model not started. |
| `CP10` | queued | Document domain and immutable document rules not started. |
| `CP11` | queued | Worker runtime and lease lifecycle not started. |
| `CP12` | queued | Frontend foundation and shared UI system not started. |
| `CP13` | queued | Root-host frontend flows not started. |
| `CP14` | queued | Tenant-host frontend flows not started. |
| `CP15` | queued | Tenant-local impersonation and audit safety not started. |
| `CP16` | queued | Hardening and consistency pass not started. |
| `CP17` | queued | Release preparation and reviewer snapshot not started. |

## Open Incidentals And Follow-Ups

- `dotnet restore` still exits with no surfaced error body in the current Windows/.NET 10 SDK environment. Build, test, and docs validation passed, but clean-checkout restore behavior should be investigated as follow-up taskboard work.

When incidental work is discovered:
- put raw intake items in [docs/05-taskboard/taskboard-intake.md](../05-taskboard/taskboard-intake.md)
- create `T-####` tasks for any work that must be tracked durably
- add a short note here only when the item affects checkpoint sequencing, readiness, or closure

## Update Procedure

### When Starting A Checkpoint

- Set `Current checkpoint` to the checkpoint ID.
- Change that checkpoint row from `next` or `queued` to `active`.
- Link any newly created `T-####` tasks in the Notes column.

### When A Checkpoint Blocks

- Change the checkpoint row to `blocked`.
- Add the blocker summary to the Notes column.
- Ensure the underlying task and queue blocker are recorded in `docs/05-taskboard/work-queue.md`.

### When A Checkpoint Completes

- Change the checkpoint row to `done`.
- Set `Last completed checkpoint` to that checkpoint ID.
- Set `Current checkpoint` to `none active` unless the next checkpoint has already started.
- Update `Next checkpoint` to the next planned checkpoint or active checkpoint as applicable.
- Link the PR artifact in `docs/95-delivery/pr/` if one exists.

### When Follow-Up Work Appears

- Keep the full detail in the taskboard.
- Add a short note under `Open Incidentals And Follow-Ups` only if it changes checkpoint readiness, merge timing, or sequencing.
