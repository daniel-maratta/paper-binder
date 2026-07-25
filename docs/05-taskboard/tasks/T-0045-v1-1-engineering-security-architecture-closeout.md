# T-0045: Engineering, Security, And Architecture Closeout Review

## Status
active

## Type
risk

## Priority
P1

## Owner
agent

## Created
2026-07-23

## Updated
2026-07-24

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
- [x] View-as (impersonation) boundaries are rechecked, including whether `TenantImpersonationBanner` (was `tenant-impersonation-banner.tsx`) should be wired up, replaced, or removed — it was defined but never imported/rendered; the only live "view as" feedback is the header account-label swap to "Viewing as". **Resolved 2026-07-24 (F9): removed, per owner sign-off.**
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
- **Discovery complete. Remediation not started.** The full review has been performed and persisted
  in [`docs/50-engineering/t-0045-engineering-security-architecture-review.md`](../../50-engineering/t-0045-engineering-security-architecture-review.md),
  which is the authoritative findings record for this task going forward — do not re-derive
  findings from scratch; start from that document.
- No Critical or High-severity finding was identified: no cross-tenant data access, no auth/authz
  bypass, no CSRF gap, no exploitable XSS/injection, and NuGet has zero known-vulnerable packages.
- Five Medium-severity findings (F1–F5 in the persisted review) remain open, three of which require
  an explicit owner/product decision before remediation can proceed (see Decision Notes below and
  the review document's "Deferred Items / Owner Decisions Required" section).
- No application code, test code, or dependency version was changed while producing the review.
  This task's own low-risk fixes (Bundle A in the review document) have not yet been applied.
- Runs after `T-0044` (done) and before `T-0041`. The persisted review is the handoff artifact for
  whichever session executes remediation next.

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
- Remediation pass (fresh session): execute Bundle A from the persisted review document (small,
  low-risk fixes — stale E2E assertion, dead `TenantImpersonationBanner` removal pending the F9
  decision below, XSS-boundary doc/dead-code correction, `code-quality-review.md` reconciliation,
  duplicate problem-contract consolidation, dependency-triage recording) once the three owner
  decisions below are made. Bundle B items (archive/unarchive UI, React Router migration, ESLint
  tooling) get their own follow-up tasks, not this one.
- This task's `Status` should move to `done` only after Bundle A is implemented, validated, and the
  outstanding acceptance-criteria items (build/runtime warnings, browser-form-drift note, findings
  fixed-or-tracked) are re-confirmed against the applied changes — not before.

## Validation Evidence
- Discovery-phase validation: this review was performed by direct code reading against commit
  `a29305c7d570bd83da2989e64ca93a4e2041cb8e` on `release/v1.1.0`, independently re-verifying (not
  assuming) both the `T-0044` baseline's findings and the pre-existing `code-quality-review.md`
  audit. Full methodology and evidence are in the persisted review document.
- Dependency scans re-run fresh on 2026-07-24 against this commit: `dotnet list package
  --vulnerable --include-transitive` — zero vulnerable packages across all 8 projects. `npm audit`
  — 7 advisories (2 low, 5 high), of which only `react-router-dom` (production dependency) is
  release-relevant; the remaining 6 are dev-tooling-only. Full detail in the persisted review
  document's Dependencies section.
- No build, test, or browser-suite commands were re-executed in this review — it relies on
  `T-0044`'s freshly-recorded results, since no application or test code was changed. A remediation
  pass must re-run the full validation bundle after applying any Bundle A change.

## Decision Notes
- **Owner decision required — F3 (archive/unarchive UI):** `docs/15-feature-definition/FD-0001-binder-document-detail-and-archive-semantics.md`
  documents archive/unarchive as required, user-visible, write-access behavior. The backend and
  tests are complete; the frontend has no UI to trigger it. Needs a decision: build the UI before
  `v1.1.0` ships, or formally amend FD-0001 to defer it. Not decided here.
- **Owner decision required — F5 (React Router 7→8 migration):** `react-router-dom` (a production
  dependency) sits in a vulnerable version range, but the fix is a major-version migration, not a
  patch. Recommendation is to durably defer the full migration to a dedicated task and do a
  targeted manual check of the open-redirect CVE's applicability before shipping `v1.1.0`. Not
  decided here.
- **Owner decision required — F9 (`TenantImpersonationBanner` disposition):** the task's own
  acceptance criteria ask whether this dead component should be wired up, replaced, or removed.
  Recommendation is removal (the live "view as" header/stop-control UX already covers the need).
  Not executed here — this is a decision-and-then-fix, not yet either.
- All other findings (F1, F2, F4, F6–F8, F10–F20) have a recommended disposition recorded in the
  persisted review document and do not require an owner decision before a fresh session executes
  them as Bundle A/rollup items.

## Validation Plan
- Full build/test/docs validation bundle.
- Focused security/authorization test coverage as needed.
- `npm audit` / `dotnet list package --vulnerable` re-run.

## Outcome (Fill when done)
- **Not done. Discovery phase complete; remediation phase not started.**
- Discovery outcome: a full staff-level engineering/security/architecture review was performed and
  persisted in [`docs/50-engineering/t-0045-engineering-security-architecture-review.md`](../../50-engineering/t-0045-engineering-security-architecture-review.md).
  Zero Critical/High findings. Five Medium findings (F1–F5) recorded, three needing an explicit
  owner decision (see Decision Notes). Fifteen Low/Informational findings recorded, mostly already
  tracked by the existing `code-quality-review.md` remediation plan or requiring no action.
  Confirmed the one known `T-0044`-baseline test failure is a genuine stale-test defect with a
  concrete fix identified (not yet applied).
- Remediation outcome: none yet. This section should be updated again, and `Status` moved to
  `done`, only once a remediation pass has implemented and validated Bundle A from the persisted
  review and the three owner decisions above have been made.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
