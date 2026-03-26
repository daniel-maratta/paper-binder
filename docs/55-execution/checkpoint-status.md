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

- Current checkpoint: none active
- Last completed checkpoint: `CP1`
- Next checkpoint: `CP2`
- Open checkpoint blockers: none
- Open incidental follow-ups: none recorded

## Checkpoint Status

| Checkpoint | Status | Notes |
| --- | --- | --- |
| `CP1` | done | Workspace bootstrap and CI shipped on branch `checkpoint-1-workspace-bootstrap-and-ci`; tasks `T-0010` through `T-0013` are complete. |
| `CP2` | next | Runtime configuration and local deployment scaffold not started. |
| `CP3` | queued | Persistence baseline and migration pipeline not started. |
| `CP4` | queued | HTTP contract baseline not started. |
| `CP5` | queued | Tenancy resolution and immutable tenant context not started. |
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

No open incidental items are currently recorded.

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
