# V1.1 Backlog

Status: Historical
Authority: This file records the completed `v1.1.0` backlog. The active `v1.1.1` patch backlog is `docs/05-taskboard/v1-1-1-backlog.md`.

## Purpose

This file reconciles the current `v1.1` backlog across:

- `docs/05-taskboard/tasks/T-0033-phase-4-1-v1-1-presentation-realignment.md`
- the superseded temporary redesign backlog reconciled during T-0036 and pruned during T-0040
- `docs/90-adr/ADR-0014-tenant-host-failure-externalization-and-trusted-expiry-disclosure.md`

After this reconciliation:

- no active `v1.1` to-do should live only in superseded temporary planning notes
- `T-0033` should be treated as the completed presentation/UI tranche unless it explicitly says otherwise
- remaining implementation work should be tracked through the successor tasks listed below

`v1.1.0` has shipped. Post-`v1.1.0` items selected for the `v1.1.1` patch were promoted into `docs/05-taskboard/v1-1-1-backlog.md` and tasks `T-0046` through `T-0052`.

## Reconciled Execution Order

1. [T-0034: V1.1 API And Backend Carry-Forwards](./tasks/T-0034-v1-1-api-and-backend-carry-forwards.md) - done
2. [T-0035: Tenant-Host Failure Externalization And Trusted Expiry Recovery](./tasks/T-0035-tenant-host-failure-externalization-and-trusted-expiry-recovery.md) - done
3. [T-0036: V1.1 Docs And Public-Copy Reconciliation](./tasks/T-0036-v1-1-docs-and-public-copy-reconciliation.md) - done
4. [T-0037: V1.1 Controlled Copy And Public Proof Refresh](./tasks/T-0037-v1-1-final-validation-and-close-out.md) - done
5. [T-0038: V1.1 Authenticated Mobile Layout](./tasks/T-0038-v1-1-authenticated-mobile-layout.md) - done
6. [T-0040: V1.1 Documentation Truth, Pruning, And Product Screenshot Refresh](./tasks/T-0040-v1-1-documentation-truth-pruning.md) - done
7. [T-0044: Establish V1.1.0 Release Baseline](./tasks/T-0044-v1-1-establish-release-baseline.md) - done
8. [T-0039: V1.1 Comprehensive Responsive QA](./tasks/T-0039-v1-1-responsive-qa.md) - done
9. [T-0045: Engineering, Security, And Architecture Closeout Review](./tasks/T-0045-v1-1-engineering-security-architecture-closeout.md) - done (discovery and remediation both complete; F3/F5 durably deferred with recorded decisions — see task file and `docs/archive/v1-1/engineering-security-architecture/t-0045-engineering-security-architecture-review.md`)
10. [T-0041: V1.1 Accessibility QA And Documentation](./tasks/T-0041-v1-1-accessibility-qa.md) - done (independently verified 2026-07-25: 11 findings across 3 release-blocking/4 medium/4 low tiers, all fixed and live-verified against the running app; ACCEPT WITH NON-BLOCKING RESIDUALS at the time of RC1 — the two Phase 4 follow-ups below were both identified during RC1 verification and resolved during Phase 4 RC remediation)
11. [T-0043: V1.1 Final Staff Review And Release Close-Out](./tasks/T-0043-v1-1-final-staff-review-and-release-closeout.md) - done (agent-performable work complete 2026-07-26; PR 5 merged into `release/v1.1.0` via PR #50; owner declared the task done on 2026-07-28; merge-to-`main`, tag, Test deployment, Prod deployment, smoke validation, and release publication are recorded complete in the release checklist)

Cancelled/superseded:

- [T-0042: V1.1 Product Screenshot Refresh](./tasks/T-0042-v1-1-product-screenshot-refresh.md) - cancelled; scope bundled into `T-0040`

`T-0044`, `T-0039`, `T-0045`, `T-0041`, and `T-0043` are all complete. PR 5 merged into
`release/v1.1.0` via PR #50. Owner-controlled merge-to-`main`, tag creation, Test deployment, Prod
deployment, smoke validation, and release publication are recorded complete in the release checklist.

## Active Backlog Map

| Backlog item | Canonical owner | Source | Notes |
| --- | --- | --- | --- |
| Make the authenticated app responsive on mobile | [T-0038](./tasks/T-0038-v1-1-authenticated-mobile-layout.md) | owner direction 2026-07-22 | Must precede final responsive and accessibility QA |
| Clean up truthful/stale documentation and update final product screenshots | [T-0040](./tasks/T-0040-v1-1-documentation-truth-pruning.md) | owner direction 2026-07-22 and 2026-07-23 | Runs before responsive QA; includes release-state truth, transient docs, stale/obsolete docs, and final product screenshot refresh |
| Establish a reproducible v1.1.0 baseline record | [T-0044](./tasks/T-0044-v1-1-establish-release-baseline.md) | owner direction 2026-07-23 | Baseline/reproducibility recording only; no remediation |
| Run responsive QA | [T-0039](./tasks/T-0039-v1-1-responsive-qa.md) | `T-0033`, reconciled temporary backlog, owner direction 2026-07-22 and 2026-07-23 | Public plus authenticated routes at app breakpoints and common sizes after docs/screenshot cleanup |
| First-line engineering, security, and architecture review | [T-0045](./tasks/T-0045-v1-1-engineering-security-architecture-closeout.md) | owner direction 2026-07-23 | Split out of `T-0043`; preceded `T-0041`. Discovery and remediation are complete; findings and dispositions are persisted in `docs/archive/v1-1/engineering-security-architecture/t-0045-engineering-security-architecture-review.md`, with F3/F5 durably deferred by owner decision. |
| Run the accessibility audit and remediation pass | [T-0041](./tasks/T-0041-v1-1-accessibility-qa.md) | `T-0033`, reconciled temporary backlog, owner direction 2026-07-22 | Done; also closed the Binders-table ID-chip mobile-card fix deferred from `T-0039`. Independently verified 2026-07-25 (live browser re-check, not source-reading alone); residual, non-blocking observations from that verification are tracked separately as Phase 4 backlog items. |
| Update final product screenshots after UI changes | [T-0040](./tasks/T-0040-v1-1-documentation-truth-pruning.md) | owner direction 2026-07-22 and 2026-07-23 | Bundled into documentation cleanup rather than tracked as a separate task |
| Resolve the planned provenance/attribution verification item before the final major review if it still applies | [T-0043](./tasks/T-0043-v1-1-final-staff-review-and-release-closeout.md) | reconciled temporary backlog | Use owner-approved provenance wording; no product behavior or implementation scope is implied. |
| Wire up, replace, or remove the orphaned `TenantImpersonationBanner` component | [T-0045](./tasks/T-0045-v1-1-engineering-security-architecture-closeout.md) | owner direction 2026-07-23, `T-0039` responsive QA | Defined but never rendered; found incidentally during `T-0039`. **Resolved 2026-07-24** (finding F9): owner sign-off received to remove; component and its duplicated `formatRole` helper deleted. |
| Validate that `T-0044`/`T-0045` findings were actually resolved and reconcile all repo tasks and TODOs | [T-0043](./tasks/T-0043-v1-1-final-staff-review-and-release-closeout.md) | owner direction 2026-07-22 and 2026-07-23 | Independent acceptance pass, not first-line discovery |
| Revisit the unrelated tenant-host users-route browser-form drift | [T-0045](./tasks/T-0045-v1-1-engineering-security-architecture-closeout.md) | `2026-W10` task log note | Moved from `T-0043` since it is first-line engineering discovery. **Resolved 2026-07-24** (finding F19): already fixed by `T-0037`'s copy pass; the tracked "Temporary password" label now consistently reads "Workspace password" in code and tests. No further action. |
| Revisit remaining build warnings, browser-suite warnings, and dependency or vulnerability advisories | [T-0045](./tasks/T-0045-v1-1-engineering-security-architecture-closeout.md) | `2026-W10` task log note | Moved from `T-0043` since it is first-line engineering discovery. Re-checked 2026-07-24: 0 build warnings; NuGet clean; npm has 7 advisories, of which only `react-router-dom` (finding F5) is production-relevant and needs an owner decision on deferring its major-version fix. |
| Mirror the recorded validation evidence into the release-facing artifact set and complete `v1.1.0` close-out planning | [T-0043](./tasks/T-0043-v1-1-final-staff-review-and-release-closeout.md) | `T-0033` | Merge/tag/deploy follow-through planning |
| Build a frontend archive/unarchive control for documents | Not yet assigned a task; deferred past `v1.1.0` | `T-0045` finding F3, owner decision 2026-07-24 | `FD-0001` documents archive/unarchive as required, user-visible, write-access behavior; the API (`POST /api/documents/{documentId}/archive`/`/unarchive`), domain rules, and tests are complete, but no frontend UI triggers it. Owner decision: defer the UI build past `v1.1.0` rather than fold a product-feature addition into `T-0045`'s low-risk-fix scope; `FD-0001` amended to record the gap and this deferral. |
| React Router 7 -> current major-version migration | [T-0053](./tasks/T-0053-react-router-major-version-upgrade.md); deferred past `v1.1.0` and `v1.1.1` | `T-0045` finding F5, owner decision 2026-07-24; `T-0052` finding F3; owner clarification 2026-07-29 | Installed `react-router-dom@7.13.2` originally sat in a vulnerable version range (see `npm audit`), but the fix was a major-version migration, not a patch, and most listed CVEs were framework-mode (SSR/Remix) specific, which this app does not use as a plain client-rendered SPA. Manual check (2026-07-24) of the one non-framework-mode CVE (open redirect via `<Link>`/`useNavigate`): every `<Link to>`/`navigate()` call in `src/PaperBinder.Web/src` uses either a static route literal or a hardcoded route prefix interpolated with a server-returned tenant-scoped resource id (never raw client/URL-param input), so no attacker-controlled value reaches react-router's own path resolution; the app's actual cross-origin redirects (login, provisioning, logout) go through `window.location.assign()` outside react-router's navigation stack entirely — root-host login/provisioning additionally validate the server-issued URL with an `isAbsoluteRedirectUrl()` well-formedness check, while tenant-host logout relies on its `redirectUrl` being server-constructed from trusted config rather than client input (different mechanism, same result: no attacker-controlled redirect target). `v1.1.1` applied same-major remediation but did not remove the need for a router major-version upgrade; `T-0053` tracks that future minor-version work. |
| Restore semantic distinction between markdown H4/H5/H6 headings in document content | Resolved during Phase 4 RC remediation | `T-0041` independent verification, 2026-07-25; identified during RC1 verification and resolved during Phase 4 RC remediation | `T-0041`'s heading-nesting fix originally offset markdown heading levels by 3 (capped at `h6`) so documents nest correctly under page chrome — correct and confirmed live (no more out-of-order `h1`), but the offset meant markdown `####`/`#####`/`######` (levels 4-6) all rendered as a literal `<h6>`, so a screen-reader user navigating by heading level could no longer distinguish a document's own H4 from its H6. Resolved by reducing the offset to 2 (`markdownHeadingLevelOffset` in `tenant-document-detail-route.tsx`), giving `# -> h3`, `## -> h4`, `### -> h5`, `#### -> h6`, `##### -> h6`, `###### -> h6` — one more level of semantic distinction while keeping document markdown out of `h1`/`h2`. Covered by a new frontend test asserting the full heading mapping. |
| Align the dashboard summary-grid breakpoint with the documented 1023/1024px shell-threshold pairing | Resolved during Phase 4 RC remediation | `T-0041` independent verification, 2026-07-25; `docs/90-adr/ADR-0015-responsive-breakpoint-policy.md`; identified during RC1 verification and resolved during Phase 4 RC remediation | Independent breakpoint audit confirmed the app's actual `@media` viewport breakpoints exactly match ADR-0015's canonical set (420/768/1023/1024/1180px) with zero new/undocumented values introduced by `T-0041`. One pre-existing exception survived: `.pb-auth-summary-grid`'s 2-column collapse (`styles.css`) used `1024px` rather than the `1023px` CSS half of the documented shell-threshold pairing, a 1px overlap with the JS `min-width: 1024px` desktop-shell check — the same anti-pattern class ADR-0015 was written to eliminate, just not the same defect (no sidebar/nav stacking risk here, only a column-count nuance at exactly 1024px). Resolved by moving `.pb-auth-summary-grid`/`--2`/`--3` into the existing `@media (max-width: 1023px)` shell-threshold block; unrelated rules still sharing the `1024px` block (public-site decor, feature strips, footer nav) were left untouched since they are not part of the shell-threshold pairing. |
| API Surface and Ceremony Review | `T-0049` completed patch-scope discovery; [T-0054](./tasks/T-0054-minor-version-api-shape-and-ceremony-review.md) tracks minor-version remediation | post-RC2 hireability review, 2026-07-27; owner clarification 2026-07-29 | Review repeated endpoint/service/result-mapping patterns across the API surface (the same ceremony class already partly addressed by `T-0045` finding F7's problem-contract consolidation). Preserve tenant isolation, authorization, CSRF, validation, and problem-response consistency as non-negotiable; simplify only where an abstraction adds indirection without improving correctness, security, maintainability, or reviewer clarity. Non-blocking for `v1.1.0`; no application code changed by the initial review pass. `T-0049` recorded the discovery during `v1.1.1`, and `T-0054` now tracks the broader PaperBinder API shape and over-ceremony cleanup as future minor-version work. |
| Post-v1.1.0 Maintainability Review | Not yet assigned a task; deferred past `v1.1.0` | post-RC2 hireability review, 2026-07-27 | Identify oversized route/service/test files (large Dapper services, transcript-style integration tests) and recommend targeted splits only where they measurably improve change velocity — the same hotspot class already tracked in `docs/archive/v1-1/remediation/engineering-quality/code-quality-review.md` Batches 1B-4 (see also `T-0045` finding F14). This item folds that existing plan into an explicit post-`v1.1.0` task rather than leaving it open-ended. |
| Release Validation Generalization | Not yet assigned a task; deferred past `v1.1.0` | post-RC2 hireability review, 2026-07-27 | `scripts/validate-docs.ps1`'s `Assert-ReleaseChecklistStructure` hard-codes the archived `docs/archive/v1/checkpoints/pr/cp17-release-preparation-and-reviewer-snapshot/description.md` path and heading structure as the release-artifact gate. Generalize the check so future release cycles do not require a permanently pinned reference to a single archived `V1` checkpoint artifact. Non-blocking; `validate-docs.ps1` passes as-is for `v1.1.0`. |
| Compose Configuration Noise Cleanup | Not yet assigned a task; deferred past `v1.1.0` | post-RC2 hireability review, 2026-07-27 | `docker-compose.yml`/`docker-compose.test.yml` reference `PAPERBINDER_LEASE_EXTENSION_WINDOW_MINUTES`/`PAPERBINDER_LEASE_EXTENSION_MINUTES` with no compose-level default (unlike `docker-compose.prod.yml`/`docker-compose.test-deploy.yml`, which now both default to the canonical `10`/`15`), which can surface as an optional-variable warning in some Docker Compose CLI versions when the var is unset outside a populated `.env`. Quiet this operational noise (for example, an explicit default matching `.env.example`) only if doing so does not weaken configuration clarity or silently mask a genuinely required value. |

## Deferred Until After V1.1

These items remain intentionally out of the current execution lane:

- Add a Light / Dark / System theme preference.
- Add a fun `404` game treatment.

They are preserved in `taskboard-intake.md` so they do not depend on pruned temporary docs for future discovery.

## Historical Inputs

These documents still matter as inputs and evidence, but they are no longer the live backlog source:

- superseded temporary redesign backlog, reconciled into this taskboard before pruning
- historical `docs/archive/v1-1/remediation/engineering-quality/` batch summaries and acceptance reviews

The historical engineering review records should remain in PaperBinder as branch and repo evidence under `docs/archive/`.
They should not be treated as the active taskboard for `v1.1` execution.
