# T-0045: Engineering, Security, And Architecture Closeout Review

## Status
done

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
- [x] Tenant isolation, auth, authorization, CSRF, routing, and data-access boundaries are rechecked against `docs/30-security/`. Rechecked in the persisted review's Security section; no findings.
- [x] View-as (impersonation) boundaries are rechecked, including whether `TenantImpersonationBanner` (was `tenant-impersonation-banner.tsx`) should be wired up, replaced, or removed — it was defined but never imported/rendered; the only live "view as" feedback is the header account-label swap to "Viewing as". **Resolved 2026-07-24 (F9): removed, per owner sign-off.**
- [x] Demo-tenant lifecycle and cleanup behavior is rechecked against `docs/70-operations/cleanup-jobs-runbook.md` and `docs/20-architecture/worker-jobs.md`. `DapperTenantLeaseCleanupService.RunCleanupCycleAsync`'s per-tenant, FK-safe purge order was read and confirmed to match the runbook; no findings.
- [x] Architecture and maintainability review covers hotspot seams per `docs/50-engineering/coding-standards.md` and `docs/archive/v1-1/remediation/engineering-quality/code-quality-review.md`. Covered by F2, F6, F7, F14, F15, F16; F2 and F7 remediated this pass.
- [x] Error handling is reviewed for consistency across API and frontend error-mapping paths. Confirmed centralized and consistent on both sides; no findings.
- [x] Dead/orphaned code is identified and either removed or explicitly tracked (starting from the `TenantImpersonationBanner` finding above). F9 removed; F6 tracked (no canonical doc requires UI exposure, no action needed).
- [x] Test gaps are identified and tracked or closed. F13 (stale coverage-count doc) tracked as a historical-record note; no live gap found.
- [x] Automated tests are reviewed for correctness: stale assumptions are removed, and tests validate current intended product behavior rather than historical implementation details — starting from the known `e2e/tenant-host.spec.ts` case (expects a "Tenant admin" binder-policy checkbox that `tenant-binder-detail-route.tsx` intentionally never renders; see `docs/archive/v1-1/baseline-and-review-infra/v1.1.0-baseline.md`). **Resolved 2026-07-24 (F4): fixed.**
- [x] Every failing automated test is classified as exactly one of: product defect, test defect, environment/configuration issue, intentional behavior mismatch, or flaky/intermittent — and each has an explicit disposition (fixed, corrected, or durably deferred with rationale) before this task closes. Do not blindly fix tests to match a broken implementation, and do not blindly change product behavior to satisfy an outdated test. The one known failure (`e2e/tenant-host.spec.ts`, F4) was classified as a test defect and fixed; full suite re-run green (see Validation Evidence).
- [x] Build and runtime warnings are triaged; the outstanding `npm audit` advisories noted in `docs/05-taskboard/task-log/2026-W10.md` (7 advisories: 4 high, 1 moderate, 2 low, as of 2026-07-17) are re-checked and remediated or durably deferred. 0 build warnings. 7 npm advisories re-confirmed 2026-07-24, split as F5 (1, production-relevant, durably deferred with a manual CVE-applicability check performed) and F18 (6, dev-tooling-only, durably deferred).
- [x] The previously-deferred "tenant-host users-route browser-form drift" note (`task-log/2026-W10.md`, 2026-07-16) is resolved or explicitly re-deferred with rationale. **Resolved (F19): already fixed by `T-0037`'s copy pass; no further action.**
- [x] Documentation claims that conflict with current implementation are corrected or flagged. F1, F2, F3, F12, F13, F19 all addressed this pass.
- [x] Findings are recorded with severity and either fixed (small, low-risk) or tracked as follow-up. F1, F2, F4, F7, F9 fixed; F3, F5 deferred with recorded owner decisions; F6, F8, F10–F20 tracked (no action needed, or F20 recommended as a cheap standalone follow-up, not executed this pass — see Outcome).

## Dependencies
- (none)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Engineering/security/architecture discovery and low-risk fixes only. Do not perform product/responsive/accessibility QA (that is `T-0041`) or final release/versioning/deployment work (that is `T-0043`).
- Pre-PR Critique: Findings-first review, ordered by severity, with file/line references.
- Escalation Notes: Full review likely requires elevated build/test/Docker workflows; security-sensitive findings should not be silently patched without a recorded rationale.

## Current State
- **Discovery and remediation both complete.** The full review is persisted in
  [`docs/archive/v1-1/engineering-security-architecture/t-0045-engineering-security-architecture-review.md`](../../archive/v1-1/engineering-security-architecture/t-0045-engineering-security-architecture-review.md).
  Bundle A (F1, F2, F4, F7, F9) is implemented and validated; F3 and F5 are durably deferred with
  recorded owner decisions; F19/F12/F13/F18 housekeeping is recorded.
- No Critical or High-severity finding was identified: no cross-tenant data access, no auth/authz
  bypass, no CSRF gap, no exploitable XSS/injection, and NuGet has zero known-vulnerable packages.
- All three owner decisions are resolved: **F9** (remove `TenantImpersonationBanner`) — done;
  **F3** (archive/unarchive UI) — defer past `v1.1.0`, `FD-0001` amended; **F5** (React Router
  7→8) — durably defer, open-redirect CVE applicability check performed and found not applicable
  to this app's `<Link>`/`useNavigate` usage.
- Full validation bundle re-run after all code changes: build (0 warnings), docs validation, full
  test suite (142/142 unit, 32/32 non-Docker integration, 102/102 Docker integration, 63/63
  frontend), and browser E2E (root-host 3/3, tenant-host 3/3, including the previously-failing
  spec). See Validation Evidence below.
- Runs after `T-0044` (done) and before `T-0041`.

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
- None for this task — closed. Follow-up work lives in `docs/05-taskboard/v1-1-backlog.md`:
  the archive/unarchive UI (F3) and React Router 7→8 migration (F5) each need their own task when
  picked up; F8 (add ESLint + dead-export detection) is a small standalone tooling task; F20 (a
  two-minute manual browser check of the "Add user" form's password-manager heuristic) was flagged
  by the review but was not in this remediation pass's accepted scope — recommended as a cheap
  follow-up, not urgent. `T-0041` and `T-0043` continue as previously sequenced.

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
- **Remediation-phase validation (2026-07-24):**
  - `build.ps1 -Configuration Release` — 0 warnings, 0 errors, after each of the F1/F7/F9 code
    changes.
  - `validate-docs.ps1` — passed after each doc change (several stale inline `src/` path
    references to the F1/F9-deleted files, in both canonical and historical docs, were caught by
    this gate and fixed as part of the same change set per the documentation-integrity-contract).
  - `test.ps1 -Configuration Release -DockerIntegrationMode Require` — 63/63 frontend, 142/142
    backend unit, 32/32 non-Docker integration, 102/102 Docker-backed integration, all passing;
    identical counts to the `T-0044` baseline, confirming no regressions from F1/F7/F9.
  - `run-browser-e2e.ps1` — root-host 3/3 and tenant-host 3/3 passing, including
    `Should_ExerciseAdminNormalForbiddenAndLogoutTenantFlows_InBrowser` (the spec touched by the
    F4 fix) and `Should_StartViewAsFromUsersRoute_AndReturnToAdminSession_InBrowser` (exercises
    the view-as UX that replaced the removed F9 banner).
  - F5's manual open-redirect CVE-applicability check: every `<Link to>`/`navigate()` call in
    `src/PaperBinder.Web/src` was read; none pass attacker-controlled input to react-router's path
    resolution. Detail recorded in the persisted review document's F5 section.

## Decision Notes
- **F3 (archive/unarchive UI) — decided 2026-07-24: defer.** `FD-0001` documented archive/unarchive
  as required, user-visible, write-access behavior; the backend and tests are complete, but the
  frontend has no UI to trigger it. Owner decision: do not build the UI in this task (it is a
  product-feature addition, not a low-risk fix); instead `FD-0001` was amended to state the gap and
  the deferral explicitly, and a follow-up row was added to `v1-1-backlog.md`. No task number
  assigned yet.
- **F5 (React Router 7→8 migration) — decided 2026-07-24: durably defer.** `react-router-dom` (a
  production dependency) sits in a vulnerable version range, but the fix is a major-version
  migration, not a patch, and most listed CVEs are framework-mode-only, which this app doesn't use.
  Owner decision: durably defer the migration to its own task. Before deferring, the recommended
  manual check of the open-redirect CVE's applicability was performed: no `<Link>`/`useNavigate`
  call in this app passes attacker-controlled input to react-router's path resolution (all targets
  are static literals or hardcoded-prefix + server-returned tenant-scoped resource ids); the app's
  actual cross-origin redirects (root-host login/provisioning, tenant-host logout) go through
  `window.location.assign()` outside react-router's navigation stack entirely, via two different
  but equally sufficient mechanisms: root-host validates the server-issued URL with
  `isAbsoluteRedirectUrl()` before navigating, while tenant-host logout relies on its `redirectUrl`
  being server-constructed from trusted config rather than client input. Recorded in
  `v1-1-backlog.md` and the persisted review document.
- **F9 (`TenantImpersonationBanner` disposition) — decided 2026-07-24: remove.** Per the task's own
  acceptance criteria wording ("wired up, replaced, or removed"), owner sign-off was given to follow
  the review's recommendation: the live "view as" header/stop-control UX already covers the
  functional need. Removed, along with the doc-integrity fallout (stale path references) it left
  behind.
- All other findings (F1, F2, F4, F6–F8, F10–F20) had a recommended disposition recorded in the
  persisted review document; F1, F2, F4, F7 were fixed this pass, F12/F13/F18/F19 were confirmed/
  recorded, and F6/F8/F10/F11/F14–F17/F20 remain tracked with no action required in this task's
  scope (F20 is a cheap, low-priority follow-up check, not executed here — see Next Action).

## Validation Plan
- Full build/test/docs validation bundle.
- Focused security/authorization test coverage as needed.
- `npm audit` / `dotnet list package --vulnerable` re-run.

## Outcome (Fill when done)
- **Done.** Discovery and remediation both complete.
- Discovery outcome: a full staff-level engineering/security/architecture review was performed and
  persisted in [`docs/archive/v1-1/engineering-security-architecture/t-0045-engineering-security-architecture-review.md`](../../archive/v1-1/engineering-security-architecture/t-0045-engineering-security-architecture-review.md).
  Zero Critical/High findings. Five Medium findings (F1–F5) recorded, three needing an explicit
  owner decision. Fifteen Low/Informational findings recorded, mostly already tracked by the
  existing `code-quality-review.md` remediation plan or requiring no action.
- Remediation outcome (2026-07-24), one commit per item on the review/v1.1.0-engineering branch:
  - **F4** — fixed: stale `e2e/tenant-host.spec.ts` "Tenant admin" checkbox assertion replaced with
    an assertion on the panel copy that already communicates the invariant.
  - **F1** — fixed: removed the unused `HtmlEncodingMarkdownDocumentRenderer`/
    `IMarkdownDocumentRenderer`/DI registration (zero call sites); corrected
    `threat-model-lite.md` and `code-quality-review.md` to describe the real (frontend) XSS
    boundary.
  - **F9** — fixed: removed the dead `TenantImpersonationBanner` component (zero importers) and its
    duplicated `formatRole` helper, per owner sign-off.
  - **F2** — fixed: `code-quality-review.md`'s Top-10 items 1–2 and part of item 3, already
    resolved by `batch-1a`, struck/annotated so the doc matches current code.
  - **F7** — fixed: `TenantLeaseProblemContract` and `TenantImpersonationProblemContract`
    consolidated onto the already-shared `PaperBinderApiProblem` (verified: neither is ever
    serialized directly, no API-contract impact).
  - **F3** — durably deferred: `FD-0001` amended to document the API-only capability and the
    UI deferral; follow-up recorded in `v1-1-backlog.md`, no task number assigned yet.
  - **F5** — durably deferred: React Router 7→8 migration deferred to its own future task; the
    recommended open-redirect CVE-applicability check was performed first and found not
    applicable to this app's `<Link>`/`useNavigate` usage.
  - **F18** — recorded: the 6 dev-tooling-only npm advisories are explicitly distinguished from
    F5's 1 production-relevant advisory in `v1-1-backlog.md`, rather than left as an
    undifferentiated count.
  - **F19, F12, F13** — confirmed/recorded: F19 (browser-form-drift note) was already resolved by
    `T-0037`; F12 (baseline doc's stale "not yet merged" note) and F13 (stale `T-0024` coverage
    counts) are both frozen point-in-time snapshots by design and were left unedited, per the
    review document's own precedent, but are noted here as confirmed non-issues.
  - **F20** — not executed: out of this remediation pass's accepted scope. Still an open, cheap
    (~2 minute) manual browser check recommended as a low-priority follow-up.
  - Doc-integrity fallout from F1/F9's deletions (stale inline `src/` path references caught by
    `validate-docs.ps1` across both canonical and historical docs) was fixed in the same change set.
  - Full validation bundle re-run and green: build (0 warnings), docs validation, full test suite
    (142/142 unit, 32/32 non-Docker integration, 102/102 Docker integration, 63/63 frontend,
    matching the `T-0044` baseline exactly), and browser E2E (root-host 3/3, tenant-host 3/3).
- Not in this task's scope, tracked separately: Bundle B (F3's UI build, F5's actual migration, F8's
  ESLint tooling) — each needs its own follow-up task when picked up.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
