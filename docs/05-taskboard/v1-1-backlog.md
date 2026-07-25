# V1.1 Backlog

Status: Active
Authority: This file is the single source of truth for the remaining `v1.1.0` backlog on the current branch.

## Purpose

This file reconciles the current `v1.1` backlog across:

- `docs/05-taskboard/tasks/T-0033-phase-4-1-v1-1-presentation-realignment.md`
- the superseded temporary redesign backlog reconciled during T-0036 and pruned during T-0040
- `docs/90-adr/ADR-0014-tenant-host-failure-externalization-and-trusted-expiry-disclosure.md`

After this reconciliation:

- no active `v1.1` to-do should live only in superseded temporary planning notes
- `T-0033` should be treated as the completed presentation/UI tranche unless it explicitly says otherwise
- remaining implementation work should be tracked through the successor tasks listed below

## Reconciled Execution Order

1. [T-0034: V1.1 API And Backend Carry-Forwards](./tasks/T-0034-v1-1-api-and-backend-carry-forwards.md) - done
2. [T-0035: Tenant-Host Failure Externalization And Trusted Expiry Recovery](./tasks/T-0035-tenant-host-failure-externalization-and-trusted-expiry-recovery.md) - done
3. [T-0036: V1.1 Docs And Public-Copy Reconciliation](./tasks/T-0036-v1-1-docs-and-public-copy-reconciliation.md) - done
4. [T-0037: V1.1 Controlled Copy And Public Proof Refresh](./tasks/T-0037-v1-1-final-validation-and-close-out.md) - done
5. [T-0038: V1.1 Authenticated Mobile Layout](./tasks/T-0038-v1-1-authenticated-mobile-layout.md) - done
6. [T-0040: V1.1 Documentation Truth, Pruning, And Product Screenshot Refresh](./tasks/T-0040-v1-1-documentation-truth-pruning.md) - done
7. [T-0044: Establish V1.1.0 Release Baseline](./tasks/T-0044-v1-1-establish-release-baseline.md) - done
8. [T-0039: V1.1 Comprehensive Responsive QA](./tasks/T-0039-v1-1-responsive-qa.md) - done
9. [T-0045: Engineering, Security, And Architecture Closeout Review](./tasks/T-0045-v1-1-engineering-security-architecture-closeout.md) - done (discovery and remediation both complete; F3/F5 durably deferred with recorded decisions — see task file and `docs/50-engineering/t-0045-engineering-security-architecture-review.md`)
10. [T-0041: V1.1 Accessibility QA And Documentation](./tasks/T-0041-v1-1-accessibility-qa.md) - queued
11. [T-0043: V1.1 Final Staff Review And Release Close-Out](./tasks/T-0043-v1-1-final-staff-review-and-release-closeout.md) - queued

Cancelled/superseded:

- [T-0042: V1.1 Product Screenshot Refresh](./tasks/T-0042-v1-1-product-screenshot-refresh.md) - cancelled; scope bundled into `T-0040`

`T-0044`, `T-0039`, and `T-0045` are all complete. Current active execution target: `T-0041`, then
`T-0043`.

## Active Backlog Map

| Backlog item | Canonical owner | Source | Notes |
| --- | --- | --- | --- |
| Make the authenticated app responsive on mobile | [T-0038](./tasks/T-0038-v1-1-authenticated-mobile-layout.md) | owner direction 2026-07-22 | Must precede final responsive and accessibility QA |
| Clean up truthful/stale documentation and update final product screenshots | [T-0040](./tasks/T-0040-v1-1-documentation-truth-pruning.md) | owner direction 2026-07-22 and 2026-07-23 | Runs before responsive QA; includes release-state truth, transient docs, stale/obsolete docs, and final product screenshot refresh |
| Establish a reproducible v1.1.0 baseline record | [T-0044](./tasks/T-0044-v1-1-establish-release-baseline.md) | owner direction 2026-07-23 | Baseline/reproducibility recording only; no remediation |
| Run responsive QA | [T-0039](./tasks/T-0039-v1-1-responsive-qa.md) | `T-0033`, reconciled temporary backlog, owner direction 2026-07-22 and 2026-07-23 | Public plus authenticated routes at app breakpoints and common sizes after docs/screenshot cleanup |
| First-line engineering, security, and architecture review | [T-0045](./tasks/T-0045-v1-1-engineering-security-architecture-closeout.md) | owner direction 2026-07-23 | Split out of `T-0043`; precedes `T-0041`. Discovery complete; findings persisted in `docs/50-engineering/t-0045-engineering-security-architecture-review.md`. Remediation not started. |
| Run the accessibility audit and remediation pass | [T-0041](./tasks/T-0041-v1-1-accessibility-qa.md) | `T-0033`, reconciled temporary backlog, owner direction 2026-07-22 | Record findings, fixes, and residual limitations; also owns the Binders-table ID-chip mobile-card fix deferred from `T-0039` |
| Update final product screenshots after UI changes | [T-0040](./tasks/T-0040-v1-1-documentation-truth-pruning.md) | owner direction 2026-07-22 and 2026-07-23 | Bundled into documentation cleanup rather than tracked as a separate task |
| Insert the planned poison-pill implementation item before the final major review if it still applies | [T-0043](./tasks/T-0043-v1-1-final-staff-review-and-release-closeout.md) | reconciled temporary backlog | Decide near final review |
| Wire up, replace, or remove the orphaned `TenantImpersonationBanner` component | [T-0045](./tasks/T-0045-v1-1-engineering-security-architecture-closeout.md) | owner direction 2026-07-23, `T-0039` responsive QA | Defined but never rendered; found incidentally during `T-0039`. **Resolved 2026-07-24** (finding F9): owner sign-off received to remove; component and its duplicated `formatRole` helper deleted. |
| Validate that `T-0044`/`T-0045` findings were actually resolved and reconcile all repo tasks and TODOs | [T-0043](./tasks/T-0043-v1-1-final-staff-review-and-release-closeout.md) | owner direction 2026-07-22 and 2026-07-23 | Independent acceptance pass, not first-line discovery |
| Revisit the unrelated tenant-host users-route browser-form drift | [T-0045](./tasks/T-0045-v1-1-engineering-security-architecture-closeout.md) | `2026-W10` task log note | Moved from `T-0043` since it is first-line engineering discovery. **Resolved 2026-07-24** (finding F19): already fixed by `T-0037`'s copy pass; the tracked "Temporary password" label now consistently reads "Workspace password" in code and tests. No further action. |
| Revisit remaining build warnings, browser-suite warnings, and dependency or vulnerability advisories | [T-0045](./tasks/T-0045-v1-1-engineering-security-architecture-closeout.md) | `2026-W10` task log note | Moved from `T-0043` since it is first-line engineering discovery. Re-checked 2026-07-24: 0 build warnings; NuGet clean; npm has 7 advisories, of which only `react-router-dom` (finding F5) is production-relevant and needs an owner decision on deferring its major-version fix. |
| Mirror the recorded validation evidence into the release-facing artifact set and complete `v1.1.0` close-out planning | [T-0043](./tasks/T-0043-v1-1-final-staff-review-and-release-closeout.md) | `T-0033` | Merge/tag/deploy follow-through planning |
| Build a frontend archive/unarchive control for documents | Not yet assigned a task; deferred past `v1.1.0` | `T-0045` finding F3, owner decision 2026-07-24 | `FD-0001` documents archive/unarchive as required, user-visible, write-access behavior; the API (`POST /api/documents/{documentId}/archive`/`/unarchive`), domain rules, and tests are complete, but no frontend UI triggers it. Owner decision: defer the UI build past `v1.1.0` rather than fold a product-feature addition into `T-0045`'s low-risk-fix scope; `FD-0001` amended to record the gap and this deferral. |
| React Router 7 -> 8 major-version migration | Not yet assigned a task; deferred past `v1.1.0` | `T-0045` finding F5, owner decision 2026-07-24 | Installed `react-router-dom@7.13.2` sits in a vulnerable version range (see `npm audit`), but the fix is a major-version migration, not a patch, and most listed CVEs are framework-mode (SSR/Remix) specific, which this app does not use as a plain client-rendered SPA. Manual check (2026-07-24) of the one non-framework-mode CVE (open redirect via `<Link>`/`useNavigate`): every `<Link to>`/`navigate()` call in `src/PaperBinder.Web/src` uses either a static route literal or a hardcoded route prefix interpolated with a server-returned tenant-scoped resource id (never raw client/URL-param input), so no attacker-controlled value reaches react-router's own path resolution; the app's actual cross-origin redirects (login/logout/provisioning) go through `window.location.assign()` with a separate `isAbsoluteRedirectUrl` guard, outside this CVE's surface. Owner decision: durably defer the migration to its own task. |

## Deferred Until After V1.1

These items remain intentionally out of the current execution lane:

- Add a Light / Dark / System theme preference.
- Add a fun `404` game treatment.

They are preserved in `taskboard-intake.md` so they do not depend on pruned temporary docs for future discovery.

## Historical Inputs

These documents still matter as inputs and evidence, but they are no longer the live backlog source:

- superseded temporary redesign backlog, reconciled into this taskboard before pruning
- historical `docs/50-engineering/` batch summaries and acceptance reviews

The historical `docs/50-engineering/` review records should remain in PaperBinder as branch and repo evidence.
They should not be treated as the active taskboard for `v1.1` execution.
