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
- remaining implementation work should be tracked through the successor tasks listed below

## Reconciled Execution Order

1. [T-0034: V1.1 API And Backend Carry-Forwards](./tasks/T-0034-v1-1-api-and-backend-carry-forwards.md) - done
2. [T-0035: Tenant-Host Failure Externalization And Trusted Expiry Recovery](./tasks/T-0035-tenant-host-failure-externalization-and-trusted-expiry-recovery.md) - done
3. [T-0036: V1.1 Docs And Public-Copy Reconciliation](./tasks/T-0036-v1-1-docs-and-public-copy-reconciliation.md) - done
4. [T-0037: V1.1 Controlled Copy And Public Proof Refresh](./tasks/T-0037-v1-1-final-validation-and-close-out.md) - done
5. [T-0038: V1.1 Authenticated Mobile Layout](./tasks/T-0038-v1-1-authenticated-mobile-layout.md) - queued
6. [T-0039: V1.1 Comprehensive Responsive QA](./tasks/T-0039-v1-1-responsive-qa.md) - queued
7. [T-0040: V1.1 Documentation Truth And Pruning](./tasks/T-0040-v1-1-documentation-truth-pruning.md) - queued
8. [T-0041: V1.1 Accessibility QA And Documentation](./tasks/T-0041-v1-1-accessibility-qa.md) - queued
9. [T-0042: V1.1 Product Screenshot Refresh](./tasks/T-0042-v1-1-product-screenshot-refresh.md) - queued
10. [T-0043: V1.1 Final Staff Review And Release Close-Out](./tasks/T-0043-v1-1-final-staff-review-and-release-closeout.md) - queued

Current active execution target: none on this branch after `T-0037` merges. The next branch should start with `T-0038` from `main`.

## Active Backlog Map

| Backlog item | Canonical owner | Source | Notes |
| --- | --- | --- | --- |
| Make the authenticated app responsive on mobile | [T-0038](./tasks/T-0038-v1-1-authenticated-mobile-layout.md) | owner direction 2026-07-22 | Must precede final responsive and accessibility QA |
| Run responsive QA | [T-0039](./tasks/T-0039-v1-1-responsive-qa.md) | `T-0033`, temp UI backlog, owner direction 2026-07-22 | Public plus authenticated routes at app breakpoints and common sizes |
| Clean up truthful/stale documentation | [T-0040](./tasks/T-0040-v1-1-documentation-truth-pruning.md) | owner direction 2026-07-22 | Includes release-state truth, transient docs, and stale/obsolete docs |
| Run the accessibility audit and remediation pass | [T-0041](./tasks/T-0041-v1-1-accessibility-qa.md) | `T-0033`, temp UI backlog, owner direction 2026-07-22 | Record findings, fixes, and residual limitations |
| Update final product screenshots after UI changes | [T-0042](./tasks/T-0042-v1-1-product-screenshot-refresh.md) | owner direction 2026-07-22 | Run after responsive/accessibility changes settle |
| Insert the planned poison-pill implementation item before the final major review if it still applies | [T-0043](./tasks/T-0043-v1-1-final-staff-review-and-release-closeout.md) | temp UI backlog | Decide near final review |
| Run the final staff-level code-quality audit | [T-0043](./tasks/T-0043-v1-1-final-staff-review-and-release-closeout.md) | `T-0033`, temp UI backlog, owner direction 2026-07-22 | Full frontend/backend cohesion, security, correctness, and consistency review |
| Reconcile all repo tasks and TODOs | [T-0043](./tasks/T-0043-v1-1-final-staff-review-and-release-closeout.md) | owner direction 2026-07-22 | Address, update, defer, cancel, or track each item |
| Revisit the unrelated tenant-host users-route browser-form drift | [T-0043](./tasks/T-0043-v1-1-final-staff-review-and-release-closeout.md) | `2026-W10` task log note | Handle with final review unless found release-blocking earlier |
| Revisit remaining build warnings, browser-suite warnings, and dependency or vulnerability advisories | [T-0043](./tasks/T-0043-v1-1-final-staff-review-and-release-closeout.md) | `2026-W10` task log note | Either remediate or leave durable follow-up tracking before `v1.1` close-out |
| Mirror the recorded validation evidence into the release-facing artifact set and complete `v1.1.0` close-out planning | [T-0043](./tasks/T-0043-v1-1-final-staff-review-and-release-closeout.md) | `T-0033` | Merge/tag/deploy follow-through planning |

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
