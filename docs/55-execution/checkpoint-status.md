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

- Current checkpoint: `none active`
- Last completed checkpoint: `CP17`
- Next checkpoint: `none planned (post-V1 owner-directed work only)`
- Open checkpoint blockers: none.
- Open incidental follow-ups: none.

## Checkpoint Status

| Checkpoint | Status | Notes |
| --- | --- | --- |
| `CP1` | done | Workspace bootstrap and CI shipped on branch `checkpoint-1-workspace-bootstrap-and-ci`; tasks `T-0010` through `T-0013` are complete. |
| `CP2` | done | Runtime configuration and local deployment scaffold shipped via task [T-0014](../05-taskboard/tasks/T-0014-cp2-runtime-configuration-and-local-deployment-scaffold.md) and PR artifact [description.md](../95-delivery/pr/cp2-runtime-configuration-and-local-deployment-scaffold/description.md). |
| `CP3` | done | Persistence baseline and migration pipeline shipped via task [T-0015](../05-taskboard/tasks/T-0015-cp3-persistence-baseline-and-migration-pipeline.md), with follow-up hardening in [T-0016](../05-taskboard/tasks/T-0016-repo-validation-tooling-hardening.md). Docker-backed migration and integration validation now pass. PR artifact: [description.md](../95-delivery/pr/cp3-persistence-baseline-and-migration-pipeline/description.md). |
| `CP4` | done | HTTP contract baseline shipped via task [T-0017](../05-taskboard/tasks/T-0017-cp4-http-contract-baseline.md). PR artifact: [description.md](../95-delivery/pr/cp4-http-contract-baseline/description.md). |
| `CP5` | done | Tenancy resolution and immutable tenant context shipped on the current branch via task [T-0018](../05-taskboard/tasks/T-0018-cp5-tenancy-resolution-and-immutable-tenant-context.md). PR artifact: [description.md](../95-delivery/pr/cp5-tenancy-resolution-and-immutable-tenant-context/description.md). |
| `CP6` | done | Identity, cookie auth, CSRF, and tenant membership validation shipped via task [T-0019](../05-taskboard/tasks/T-0019-cp6-identity-cookie-auth-and-tenant-membership-validation.md). PR artifact: [description.md](../95-delivery/pr/cp6-identity-cookie-auth-and-tenant-membership-validation/description.md). |
| `CP7` | done | Pre-auth abuse controls and root-host provisioning shipped via task [T-0020](../05-taskboard/tasks/T-0020-cp7-pre-auth-abuse-controls-and-provisioning-surface.md). PR artifact: [description.md](../95-delivery/pr/cp7-pre-auth-abuse-controls-and-provisioning-surface/description.md). |
| `CP8` | done | Authorization policies, request-scoped membership context, tenant-host/system-host route gating, and tenant user administration shipped on the current branch via task [T-0022](../05-taskboard/tasks/T-0022-cp8-authorization-policies-and-tenant-user-administration.md). PR artifact: [description.md](../95-delivery/pr/cp8-authorization-policies-and-tenant-user-administration/description.md). Launch-profile validation, manual VS Code and Visual Studio verification, and the canonical restore/build path are all recorded as passing. |
| `CP9` | done | Binder domain and policy model shipped via task [T-0023](../05-taskboard/tasks/T-0023-cp9-binder-domain-and-policy-model.md) and PR artifact [description.md](../95-delivery/pr/cp9-binder-domain-and-policy-model/description.md). Automated validation, post-implementation critic review, launch-profile validation, and manual VS Code plus Visual Studio verification are all recorded as passing. |
| `CP10` | done | Document domain and immutable document rules shipped via task [T-0025](../05-taskboard/tasks/T-0025-cp10-document-domain-and-immutable-document-rules.md) and PR artifact [description.md](../95-delivery/pr/cp10-document-domain-and-immutable-document-rules/description.md). Automated validation, post-implementation critic review, launch-profile validation, and manual VS Code plus Visual Studio verification are all recorded as passing. |
| `CP11` | done | Worker runtime and lease lifecycle shipped via task [T-0026](../05-taskboard/tasks/T-0026-cp11-worker-runtime-and-lease-lifecycle.md) and PR artifact [description.md](../95-delivery/pr/cp11-worker-runtime-and-lease-lifecycle/description.md). Automated validation, post-implementation critic review, launch-profile validation, and manual VS Code plus Visual Studio verification are all recorded as passing. |
| `CP12` | done | Frontend foundation and shared UI system shipped via task [T-0027](../05-taskboard/tasks/T-0027-cp12-frontend-foundation-and-shared-ui-system.md) and PR artifact [description.md](../95-delivery/pr/cp12-frontend-foundation-and-shared-ui-system/description.md). Automated validation, post-implementation critic review, launch-profile validation, and manual VS Code plus Visual Studio verification are all recorded as passing. |
| `CP13` | done | Root-host frontend flows shipped via task [T-0028](../05-taskboard/tasks/T-0028-cp13-root-host-frontend-flows.md) and PR artifact [description.md](../95-delivery/pr/cp13-root-host-frontend-flows/description.md). Automated validation, post-implementation critic review, launch-profile validation, and manual VS Code plus Visual Studio verification are all recorded as passing. |
| `CP14` | done | Tenant-host frontend flows shipped via task [T-0029](../05-taskboard/tasks/T-0029-cp14-tenant-host-frontend-flows.md) and PR artifact [description.md](../95-delivery/pr/cp14-tenant-host-frontend-flows/description.md). Automated validation, post-implementation critic review, launch-profile validation, and manual VS Code plus Visual Studio verification are all recorded as passing. |
| `CP15` | done | Tenant-local impersonation and audit safety shipped via task [T-0030](../05-taskboard/tasks/T-0030-cp15-tenant-local-impersonation-and-audit-safety.md) and PR artifact [description.md](../95-delivery/pr/cp15-tenant-local-impersonation-and-audit-safety/description.md). Automated validation, post-implementation critic review, launch-profile validation, and manual VS Code plus Visual Studio verification are all recorded as passing; the manual verification scope is explicitly limited to startup and the initial public pages because the challenge flow is not yet implemented. |
| `CP16` | done | Hardening and consistency pass shipped via task [T-0031](../05-taskboard/tasks/T-0031-cp16-hardening-and-consistency-pass.md) and PR artifact [description.md](../95-delivery/pr/cp16-hardening-and-consistency-pass/description.md). Automated validation, the separate browser gate, post-implementation critic review, launch-profile validation, and manual VS Code plus Visual Studio verification are all recorded as passing; the manual verification completed on `2026-04-19`. |
| `CP17` | done | Release preparation and reviewer snapshot shipped via task [T-0032](../05-taskboard/tasks/T-0032-cp17-release-preparation-and-reviewer-snapshot.md) and release artifact [description.md](../95-delivery/pr/cp17-release-preparation-and-reviewer-snapshot/description.md). `V1` release readiness is recorded in [release-checklist.md](../95-delivery/release-checklist.md); the scripted clean-checkout bundle passed on `2026-04-19`, and manual VS Code plus Visual Studio launch verification completed and passed on `2026-04-20`. |

## Open Incidentals And Follow-Ups

- (none)

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
- Do not mark the checkpoint `done` until launch-profile validation and manual VS Code plus Visual Studio verification are recorded in the checkpoint PR artifact.

### When Follow-Up Work Appears

- Keep the full detail in the taskboard.
- Add a short note under `Open Incidentals And Follow-Ups` only if it changes checkpoint readiness, merge timing, or sequencing.
