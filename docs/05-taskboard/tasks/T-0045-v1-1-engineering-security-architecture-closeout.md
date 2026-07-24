# T-0045: Engineering, Security, And Architecture Closeout Review

## Status
queued

## Type
risk

## Priority
P1

## Owner
agent

## Created
2026-07-23

## Updated
2026-07-23

## Checkpoint
Cross-checkpoint

## Phase
V1.1 close-out

## Summary
Run the first comprehensive staff-level engineering, security, and architecture review of the `v1.1.0` branch: tenant isolation, auth/authz, CSRF and session behavior, view-as boundaries, routing and data-access boundaries, demo-tenant lifecycle/cleanup, architecture and maintainability, error handling, dead/orphaned code, test gaps and test *correctness*, build/runtime warnings, dependency advisories, and documentation-vs-implementation drift. This is the PR-2 equivalent: first-line engineering discovery, ahead of `T-0041` and ahead of `T-0043`'s final acceptance pass.

## Context
- Split out of `T-0043` so that task can stay a final acceptance/validation pass rather than also being the first place engineering findings surface.
- Findings-first review posture: record what's wrong before fixing, fix what's clearly in-scope and low-risk, track the rest.
- Two items are already known to route through this task (see Acceptance Criteria).

## Acceptance Criteria
- [ ] Tenant isolation, auth, authorization, CSRF, routing, and data-access boundaries are rechecked against `docs/30-security/`.
- [ ] View-as (impersonation) boundaries are rechecked, including whether `TenantImpersonationBanner` (`src/PaperBinder.Web/src/app/tenant-impersonation-banner.tsx`) should be wired up, replaced, or removed — it is currently defined but never imported/rendered; the only live "view as" feedback is the header account-label swap to "Viewing as".
- [ ] Demo-tenant lifecycle and cleanup behavior is rechecked against `docs/70-operations/cleanup-jobs-runbook.md` and `docs/20-architecture/worker-jobs.md`.
- [ ] Architecture and maintainability review covers hotspot seams per `docs/50-engineering/coding-standards.md` and `docs/50-engineering/code-quality-review.md`.
- [ ] Error handling is reviewed for consistency across API and frontend error-mapping paths.
- [ ] Dead/orphaned code is identified and either removed or explicitly tracked (starting from the `TenantImpersonationBanner` finding above).
- [ ] Test gaps are identified and tracked or closed.
- [ ] Automated tests are reviewed for correctness: stale assumptions are removed, and tests validate current intended product behavior rather than historical implementation details — starting from the known `e2e/tenant-host.spec.ts` case (expects a "Tenant admin" binder-policy checkbox that `tenant-binder-detail-route.tsx` intentionally never renders; see `docs/95-delivery/v1.1.0-baseline.md`).
- [ ] Every failing automated test is classified as exactly one of: product defect, test defect, environment/configuration issue, intentional behavior mismatch, or flaky/intermittent — and each has an explicit disposition (fixed, corrected, or durably deferred with rationale) before this task closes. Do not blindly fix tests to match a broken implementation, and do not blindly change product behavior to satisfy an outdated test.
- [ ] Build and runtime warnings are triaged; the outstanding `npm audit` advisories noted in `docs/05-taskboard/task-log/2026-W10.md` (7 advisories: 4 high, 1 moderate, 2 low, as of 2026-07-17) are re-checked and remediated or durably deferred.
- [ ] The previously-deferred "tenant-host users-route browser-form drift" note (`task-log/2026-W10.md`, 2026-07-16) is resolved or explicitly re-deferred with rationale.
- [ ] Documentation claims that conflict with current implementation are corrected or flagged.
- [ ] Findings are recorded with severity and either fixed (small, low-risk) or tracked as follow-up.

## Dependencies
- (none)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Engineering/security/architecture discovery and low-risk fixes only. Do not perform product/responsive/accessibility QA (that is `T-0041`) or final release/versioning/deployment work (that is `T-0043`).
- Pre-PR Critique: Findings-first review, ordered by severity, with file/line references.
- Escalation Notes: Full review likely requires elevated build/test/Docker workflows; security-sensitive findings should not be silently patched without a recorded rationale.

## Current State
- Queued. Not started. Runs after `T-0044` and before `T-0041`.

## Touch Points
- `src/`
- `tests/`
- `docs/30-security/`
- `docs/50-engineering/`
- `docs/70-operations/`
- `docs/05-taskboard/`

## Implementation Plan
- Inventory current TODO/task items and known warnings/advisories.
- Review authentication, authorization, tenant isolation, and view-as boundaries against security docs and implementation.
- Review architecture/maintainability hotspots and dead code.
- Triage dependency advisories and build/runtime warnings.
- Fix or track findings, ordered by severity.
- Record validation evidence.

## Next Action
- Start after `T-0044` lands.

## Validation Evidence
- Not started.

## Decision Notes
- (none)

## Validation Plan
- Full build/test/docs validation bundle.
- Focused security/authorization test coverage as needed.
- `npm audit` / `dotnet list package --vulnerable` re-run.

## Outcome (Fill when done)
- Not started.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
