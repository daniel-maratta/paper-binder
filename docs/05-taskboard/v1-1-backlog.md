# V1.1 Backlog

Status: Active
Authority: This file is the single source of truth for the remaining `v1.1.0` backlog on the current branch.

## Purpose

This file reconciles the current `v1.1` backlog across:

- `docs/05-taskboard/tasks/T-0033-phase-4-1-v1-1-presentation-realignment.md`
- `docs/temp-ui-ux-design-docs/things-found-that-need-to-be-addressed-2026-07-12-230235.txt`
- `docs/90-adr/ADR-0014-tenant-host-failure-externalization-and-trusted-expiry-disclosure.md`

After this reconciliation:

- no active `v1.1` to-do should live only in `docs/temp-ui-ux-design-docs/`
- `T-0033` should be treated as the completed presentation/UI tranche unless it explicitly says otherwise
- remaining implementation work should be tracked through the active successor task listed below

## Reconciled Execution Order

1. [T-0034: V1.1 API And Backend Carry-Forwards](./tasks/T-0034-v1-1-api-and-backend-carry-forwards.md) - done
2. [T-0035: Tenant-Host Failure Externalization And Trusted Expiry Recovery](./tasks/T-0035-tenant-host-failure-externalization-and-trusted-expiry-recovery.md) - done
3. [T-0036: V1.1 Docs And Public-Copy Reconciliation](./tasks/T-0036-v1-1-docs-and-public-copy-reconciliation.md) - done
4. [T-0037: V1.1 Final Validation And Close-Out](./tasks/T-0037-v1-1-final-validation-and-close-out.md) - active

Current active execution target: `T-0037`.

## Active Backlog Map

| Backlog item | Canonical owner | Source | Notes |
| --- | --- | --- | --- |
| Insert the planned poison-pill implementation item before the final major review if it still applies | [T-0037](./tasks/T-0037-v1-1-final-validation-and-close-out.md) | temp UI backlog | Keep close-out sequencing explicit |
| Run responsive QA | [T-0037](./tasks/T-0037-v1-1-final-validation-and-close-out.md) | `T-0033`, temp UI backlog | Representative desktop plus mobile/tablet |
| Run the accessibility audit and remediation pass | [T-0037](./tasks/T-0037-v1-1-final-validation-and-close-out.md) | `T-0033`, temp UI backlog | Record findings and remediation |
| Run the final staff-level code-quality audit | [T-0037](./tasks/T-0037-v1-1-final-validation-and-close-out.md) | `T-0033`, temp UI backlog | Changed-surface hotspot review |
| Run the final controlled copy pass against the forbidden-implication rules | [T-0037](./tasks/T-0037-v1-1-final-validation-and-close-out.md) | `T-0033`, temp UI backlog | Final cross-surface wording pass |
| Revisit the unrelated tenant-host users-route browser-form drift | [T-0037](./tasks/T-0037-v1-1-final-validation-and-close-out.md) | `2026-W10` task log note | Handle it with the broader close-out warning/issues pass rather than reopening `T-0035` |
| Revisit remaining build warnings, browser-suite warnings, and dependency or vulnerability advisories | [T-0037](./tasks/T-0037-v1-1-final-validation-and-close-out.md) | `2026-W10` task log note | Either remediate or leave durable follow-up tracking before `v1.1` close-out |
| Record final validation evidence and complete `v1.1.0` close-out planning | [T-0037](./tasks/T-0037-v1-1-final-validation-and-close-out.md) | `T-0033` | Merge/tag/deploy follow-through planning |

## Deferred Until After V1.1

These items remain intentionally out of the current execution lane:

- Add a Light / Dark / System theme preference.
- Add a fun `404` game treatment.

They are preserved in `taskboard-intake.md` so they do not depend on the temp UI docs for future discovery.

## Historical Inputs

These documents still matter as inputs and evidence, but they are no longer the live backlog source:

- `docs/temp-ui-ux-design-docs/things-found-that-need-to-be-addressed-2026-07-12-230235.txt`
- historical `docs/50-engineering/` batch summaries and acceptance reviews

The historical `docs/50-engineering/` review records should remain in PaperBinder as branch and repo evidence.
They should not be treated as the active taskboard for `v1.1` execution.
