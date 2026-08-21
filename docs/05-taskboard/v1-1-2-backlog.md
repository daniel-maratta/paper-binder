# V1.1.2 Backlog

Status: Active
Authority: This file is the taskboard source for the `v1.1.2` positioning patch and must agree with `docs/95-delivery/v1-1-2-implementation-plan.md`.

## Purpose

Track the narrow `v1.1.2` presentation and positioning patch requested after the published `v1.1.1` release.

This patch improves first-time visitor comprehension, flagship-article discoverability, demo orientation, footer attribution, and related GoatCounter coverage. It is not a product-feature expansion, visual redesign, architecture change, or tenant-behavior change.

## Reconciled Execution Order

1. [T-0056: V1.1.2 Presentation Positioning Release](./tasks/T-0056-v1-1-2-presentation-positioning-release.md) - active

## Checkpoint Agreement

| Checkpoint | Task | Required outcome |
| --- | --- | --- |
| CP1 | `T-0056` | Scope-lock the `v1.1.2` positioning patch, execute behavior-first frontend and analytics slices, update version/release docs, validate the candidate, and record release-readiness evidence. |

## Explicit Out Of Scope

These items are not part of `v1.1.2` unless the owner explicitly changes scope.

| Out-of-scope item | Reason |
| --- | --- |
| Homepage or public-site redesign | The patch is explanatory scaffolding inside the existing v1.1 presentation system. |
| New document-management features | The feedback concerns comprehension and discoverability, not missing product capability. |
| Modal tours, walkthrough frameworks, coach marks, or persisted onboarding state | Demo orientation should be lightweight copy integrated into existing screens. |
| Authentication, authorization, tenancy, lease, or lifecycle semantics changes | No user-flow clarification requires changing security or tenant behavior. |
| React Router major-version upgrade | Already tracked as `T-0053` for future minor-version maintenance. |
| Broad API or frontend composition cleanup | Already tracked as `T-0054` for future minor-version work. |

## Planning Invariant

Any change to `v1.1.2` task ownership, release scope, or execution order must update all of:

- this file
- `docs/95-delivery/v1-1-2-implementation-plan.md`
- `docs/05-taskboard/work-queue.md`
- `docs/05-taskboard/tasks/T-0056-v1-1-2-presentation-positioning-release.md`
