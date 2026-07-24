# T-0041: V1.1 Accessibility QA And Documentation

## Status
queued

## Type
risk

## Priority
P1

## Owner
agent

## Created
2026-07-22

## Updated
2026-07-23

## Checkpoint
Cross-checkpoint

## Phase
V1.1 close-out

## Summary
Run the comprehensive accessibility QA pass after documentation cleanup/product screenshot refresh and responsive QA, remediate release-blocking findings, and update docs with the resulting evidence.

## Context
- Accessibility should be audited after the layout is stable so findings reflect the actual release candidate.
- Documentation must record what was checked, what changed, and any residual limitations.
- Owner direction on 2026-07-23 keeps accessibility QA after responsive QA.

## Acceptance Criteria
- [ ] Public and authenticated routes receive accessibility QA.
- [ ] Keyboard, focus, labels, landmarks, contrast, and screen-reader-relevant states are checked.
- [ ] The Binders-table binder-ID `CopyValueChip` (`tenant-binders-route.tsx`, via `copy-value-chip.tsx`) is given a mobile-friendly treatment at narrow widths (<420px), where it currently wraps character-by-character in the plain `DataTable`; align with the Users-page mobile-card pattern rather than a CSS-only truncation (two CSS-only attempts during `T-0039` regressed the authenticated shell layout and were reverted).
- [ ] Release-blocking findings are fixed.
- [ ] Residual non-blocking findings are explicitly deferred or tracked.
- [ ] Accessibility docs reflect the audit and remediation outcome.

## Dependencies
- [T-0039](./T-0039-v1-1-responsive-qa.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Accessibility QA/remediation only.
- Pre-PR Critique: Findings-first review posture with file/route references.
- Escalation Notes: Browser and accessibility tooling may require local runtime access.

## Current State
- Queued.

## Touch Points
- `src/PaperBinder.Web/src/`
- `docs/10-product/accessibility.md`
- `docs/80-testing/`
- `docs/05-taskboard/`

## Implementation Plan
- Define route and interaction matrix.
- Run manual and automated checks.
- Remediate release-blocking findings.
- Record evidence and residual risks.

## Next Action
- Start after responsive QA lands.

## Validation Evidence
- Not started.

## Decision Notes
- (none)

## Validation Plan
- Focused frontend tests.
- Browser accessibility/keyboard pass.
- Docs validation.

## Outcome (Fill when done)
- Not started.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
