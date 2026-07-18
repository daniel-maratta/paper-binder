# T-0037: V1.1 Final Validation And Close-Out

## Status
active

## Type
feature

## Priority
P1

## Owner
agent

## Created
2026-07-15

## Updated
2026-07-18

## Checkpoint
Cross-checkpoint

## Phase
Close-out

## Summary
Run the final `v1.1.0` validation and close-out tranche: responsive QA, accessibility audit/remediation, final code-quality and copy review, validation evidence recording, and merge-ready release follow-through planning.

## Context
- `T-0033` originally carried these close-out expectations, but they are cleaner as their own final task after the remaining backend, security, and docs/copy work lands.
- The temp UI backlog still calls out responsive QA, accessibility, code quality, and the final controlled copy pass as separate close-out work.
- This task should run only after the preceding `v1.1` carry-forward tasks are complete enough for a credible final review.

## Acceptance Criteria
- [ ] The planned poison-pill implementation item is inserted near the end of the implementation sequence, right before the final major review, if it still applies.
- [ ] Responsive verification is completed and recorded for representative desktop and mobile/tablet public and authenticated surfaces.
- [ ] The accessibility audit/remediation pass is completed and recorded.
- [ ] The final staff-level code-quality audit across the changed surface area is completed and recorded.
- [ ] The final controlled copy pass against the forbidden-implication rules is completed and recorded.
- [ ] Remaining non-blocking browser-suite drift, build warnings, and dependency or vulnerability advisories are either remediated or explicitly triaged with durable follow-up tracking.
- [ ] Final validation evidence is recorded in the owning taskboard docs and ready to be mirrored into the release-facing artifact set.
- [ ] The `v1.1.0` close-out strategy is documented clearly enough that merge-to-`main`, tagging, and deployment can proceed without ad hoc reconstruction.

## Dependencies
- [T-0034](./T-0034-v1-1-api-and-backend-carry-forwards.md)
- [T-0035](./T-0035-tenant-host-failure-externalization-and-trusted-expiry-recovery.md)
- [T-0036](./T-0036-v1-1-docs-and-public-copy-reconciliation.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Keep this task to validation, audit, and close-out preparation. Do not absorb unrelated feature work discovered during final review unless it is truly release-blocking.
- Pre-PR Critique: Findings-first review posture. If issues are found, split the smallest corrective task possible instead of bloating the close-out slice.
- Escalation Notes: Any newly discovered non-blocking work should be promoted into explicit follow-up tracking rather than silently folded into close-out.

## Current State
- Active. `T-0034`, `T-0035`, and `T-0036` are complete enough that the remaining `v1.1` work is now the final validation and close-out lane.
- Known carry-in items for this task already include the unrelated tenant-host users-route browser-form drift plus the broader build/browser/dependency warning review noted during the earlier slices.
- Controlled-copy working artifacts now exist under `docs/95-delivery/` (`t-0037-controlled-copy-pass-inventory.md` and `t-0037-copy-strategy.md`), and the current public plus authenticated frontend copy pass has landed with matching component/E2E expectation updates.
- Validation refreshed on `2026-07-18`: `validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require` passed, `run-browser-e2e.ps1` passed both root-host and tenant-host suites, release build remains clean (`0` warnings), and NuGet vulnerability checks remain clean. The unresolved advisory surface is still the frontend `npm audit` cluster (`7` findings total: `4` high, `1` moderate, `2` low).
- Local reviewer-path defaults are now aligned with the checkpoint contract again: the challenge bypass stays off by default, and `scripts/set-local-challenge-bypass.ps1` provides the supported local-only opt-in toggle.

## Touch Points
- `docs/05-taskboard/tasks/T-0033-phase-4-1-v1-1-presentation-realignment.md`
- `docs/95-delivery/`
- `docs/10-product/accessibility.md`
- `docs/80-testing/`
- changed frontend/backend/test seams under review

## Implementation Plan
- Run the close-out in this order:
  1. responsive QA
  2. accessibility audit/remediation
  3. final code-quality audit
  4. final controlled copy pass
  5. validation evidence consolidation
  6. release/merge/tag/deploy close-out preparation

## Next Action
- Confirm whether the poison-pill item still applies, then run the remaining responsive, accessibility, and final code-quality passes and decide whether the unresolved `npm audit` advisory cluster and users-route browser-form drift are remediated inside `T-0037` or promoted into explicit follow-up tracking before close-out.

## Validation Plan
- Canonical build/test/browser/docs validation bundle
- Manual responsive review notes
- Accessibility findings and remediation evidence
- Audit findings and any follow-up links

## Outcome (Fill when done)
- Not started.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
