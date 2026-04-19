# CP17 Critic Review: Release Preparation And Reviewer Snapshot
Status: Scope-Lock Review (Pre-Implementation)

Reviewer: PaperBinder Critic
Date: 2026-04-19

Inputs reviewed:
- [docs/55-execution/execution-plan.md](../../../55-execution/execution-plan.md) (CP17 checkpoint definition)
- [docs/55-execution/phases/phase-5-hardening-release.md](../../../55-execution/phases/phase-5-hardening-release.md)
- [docs/95-delivery/pr/cp17-release-preparation-and-reviewer-snapshot/implementation-plan.md](./implementation-plan.md)
- [docs/55-execution/checkpoint-status.md](../../../55-execution/checkpoint-status.md) (CP16 done, CP17 queued, no open blockers)
- [docs/95-delivery/staging-and-versioning.md](../../staging-and-versioning.md) (release/versioning baseline)
- [docs/95-delivery/README.md](../../README.md) (delivery lane index)
- [docs/95-delivery/pr/release-pr-description-template.md](../release-pr-description-template.md) (release artifact shape)
- [CHANGELOG.md](../../../../CHANGELOG.md) (currently a perpetual `Unreleased` accumulator)
- [README.md](../../../../README.md), [REVIEWERS.md](../../../../REVIEWERS.md), and [review/README.md](../../../../review/README.md) (current reviewer surface)
- [review/architecture-overview.md](../../../../review/architecture-overview.md), [review/security-model-summary.md](../../../../review/security-model-summary.md), [review/multi-tenancy-diagram.md](../../../../review/multi-tenancy-diagram.md), [review/request-lifecycle.md](../../../../review/request-lifecycle.md), [review/user-flows.md](../../../../review/user-flows.md), [review/system-architecture-diagram.md](../../../../review/system-architecture-diagram.md), [review/domain-model-diagram.md](../../../../review/domain-model-diagram.md), [review/ai-surface-map.md](../../../../review/ai-surface-map.md), [review/future-evolution.md](../../../../review/future-evolution.md), [review/scaling-considerations.md](../../../../review/scaling-considerations.md)
- [docs/70-operations/runbook-local.md](../../../70-operations/runbook-local.md), [docs/70-operations/runbook-prod.md](../../../70-operations/runbook-prod.md), [docs/70-operations/deployment.md](../../../70-operations/deployment.md)
- [docs/80-testing/test-strategy.md](../../../80-testing/test-strategy.md), [docs/80-testing/testing-standards.md](../../../80-testing/testing-standards.md), [docs/80-testing/e2e-tests.md](../../../80-testing/e2e-tests.md)
- [docs/00-intent/success-criteria.md](../../../00-intent/success-criteria.md)
- [docs/95-delivery/pr/cp16-hardening-and-consistency-pass/critic-review.md](../cp16-hardening-and-consistency-pass/critic-review.md) (carry-forward residuals: shim longevity, observability ADR hygiene, coverage-parity evidence)
- Repo surface spot checks: [scripts/](../../../../scripts/) (10 canonical PowerShell entrypoints plus `run-root-host-e2e.ps1` shim and `common.ps1`/`migrate.ps1`), [docs/60-ai/](../../../60-ai/) (AI lane present in docs but no AI implementation in `src/`), `lab.danielmaratta.com` references in `docs/70-operations/`, [docs/05-taskboard/work-queue.md](../../../05-taskboard/work-queue.md) (no CP17 task file yet)

---

## Verdict

**The plan is not yet scope-locked. Blocking findings below must be resolved in the plan (and folded into the canonical-doc reconciliation pass called out as Planned Work step 1) before broad CP17 implementation begins.**

The plan's shape is correct: it correctly frames CP17 as a release-prep checkpoint over the already-shipped V1 system, front-loads canonical-doc reconciliation as the first blocking step, locks the validation command surface to the existing scripts, requires clean-checkout validation against the candidate revision, and explicitly excludes feature work, architecture changes, browser-matrix expansion, and reviewer microsite ambitions. The Open Decisions list is honest, the touch points are mostly complete, and the TDD plan correctly distinguishes docs-only work from script-touching work.

However, three of the plan's Open Decisions are real scope-lock decisions rather than implementation details — each one materially changes which files get edited and which acceptance-criteria language is correct. The plan also leaves the V1 deployment scope undefined (is the public demo at the deployed domain part of the release cut or explicitly deferred?), does not bring the `docs/60-ai/` AI lane or the reviewer's `ai-surface-map.md` pointer into the reconciliation set even though they currently describe a v1 surface that did not ship (the exact "aspirational future-state" risk the plan itself locks against), does not name the new release-workflow / release-checklist filenames the AC promises to add, and does not specify the artifact that records "main is documented as taggable for V1." Resolving these items is a one-pass plan edit; the rest of the plan is in good shape.

---

## Blocking Findings

### B1: Open Decision #1 (V1 identifier format) must be locked at scope-lock, not at Review Ready handoff

The plan defers the V1 identifier format and recommended tag spelling to "before the CP17 release artifact goes `Review Ready`." That is too late. The release identifier appears in:

- [CHANGELOG.md](../../../../CHANGELOG.md) section header (current `Unreleased` becomes a dated/named cut)
- the CP17 release artifact in this folder
- the new release workflow and release checklist docs the plan promises to add under [docs/95-delivery/](../../) (see B6 for the missing filename lock)
- [docs/95-delivery/staging-and-versioning.md](../../staging-and-versioning.md) (which currently says "Release tagging uses the documented release workflow")
- [README.md](../../../../README.md) `Status` section (currently "This repository is under active development.")
- [REVIEWERS.md](../../../../REVIEWERS.md) intro and walkthrough framing
- [docs/55-execution/checkpoint-status.md](../../../55-execution/checkpoint-status.md) once CP17 closes (the "main is taggable as V1" signal)
- the CP17 task file under [docs/05-taskboard/tasks/](../../../05-taskboard/tasks/) (not yet created)

If the label is locked late, every one of those files takes two passes during implementation. Slice 1 of the TDD plan (`Should_FailReleaseChecklistValidation_When_A_RequiredArtifact_Or_Gate_Is_Missing`) cannot have a deterministic GREEN state until the label is committed.

Required resolution before scope-lock:
- Lock the exact release identifier text. Recommended: `V1` for prose and `v1.0.0` for any tag spelling, since [docs/95-delivery/staging-and-versioning.md](../../staging-and-versioning.md) already names V1 as the final reviewer-ready cut and SemVer is the conventional tag form. If a different convention is preferred, lock it explicitly.
- Add a Locked Design Decision naming the prose label and the recommended tag spelling, and require both to appear identically in `CHANGELOG.md`, the CP17 release artifact, the release workflow doc, the release checklist doc, and `README.md` Status.
- Move Open Decision #1 into Locked Design Decisions and update AC, TDD slices 1 and 5, and Touch Points accordingly.

### B2: Open Decision #2 (CHANGELOG cut shape) must be locked at scope-lock

The plan offers two patterns for `CHANGELOG.md`:
- cut a dated `V1` section and reset `Unreleased`, or
- keep the full release narrative in the CP17 artifact and narrow the changelog to a concise release summary.

Both are defensible, but they have very different file footprints and AC language:

- The dated-cut option implies a Keep-a-Changelog style structure where `## Unreleased` becomes `## [V1] - 2026-MM-DD` and a fresh `## Unreleased` is reseeded. Acceptance criteria need to name the date format, the section ordering, and whether `Unreleased` is recreated empty or omitted until post-V1 work begins.
- The narrowed-summary option implies the changelog drops most of the per-checkpoint narrative and points at the CP17 release artifact for detail. Acceptance criteria need to name the maximum length, the structural sections, and the linkage rules to the release artifact.

The plan currently warns "Do not leave both patterns half-applied" but does not commit. Slice 1's RED test cannot be written and the AC line "`CHANGELOG.md` is cut into a coherent V1 release view instead of remaining an unbounded checkpoint accumulator" is undecidable.

Required resolution before scope-lock:
- Lock to the dated-cut pattern (Keep-a-Changelog conventions are the lower-risk choice for a hiring-artifact repo because they are recognizable to reviewers without having to read the linked release artifact). If the alternative is preferred, lock that.
- Add a Locked Design Decision specifying: section header text, date format (ISO `YYYY-MM-DD`), whether `Unreleased` is recreated empty, and whether existing per-checkpoint bullets are kept verbatim, summarized, or replaced.
- Move Open Decision #2 into Locked Design Decisions and update AC and TDD slice 1 accordingly.

### B3: Open Decision #3 (`scripts/run-root-host-e2e.ps1` shim) must be locked at scope-lock

The CP16 critic review's residual risks already flagged this shim's longevity. The CP17 plan defers the keep-or-retire decision to "Resolve in CP17," but Touch Points mark the script "only if CP17 resolves the historical compatibility-shim decision," and the validation plan includes a static review that "any historical compatibility decision around `scripts/run-root-host-e2e.ps1` is explicit and does not leave broken references in archived delivery docs." That static review cannot pass deterministically without the decision being locked first.

The decision matters because:
- if the shim stays, the release checklist must explicitly call it out as a frozen historical compatibility surface (otherwise a future post-V1 cleanup pass will delete it and break archived CP13-CP15 PR artifacts that reference the old name)
- if the shim is retired, archived CP13-CP15 delivery artifacts that reference the old script name need either path updates or an explicit "historical names retained verbatim" exemption in `validate-docs.ps1` rules

Required resolution before scope-lock:
- Recommend keeping the shim through V1: the cost is a single pass-through script, and removing it during release-prep risks breaking historical doc validation right at the moment the executor needs `validate-docs.ps1` green for clean-checkout proof.
- Add a Locked Design Decision stating the shim is retained verbatim through V1, that the new release checklist names it as a frozen historical compatibility surface, and that any post-V1 removal is explicitly out of scope for CP17.
- Move Open Decision #3 into Locked Design Decisions and update Touch Points and Validation Plan accordingly.

### B4: AI documentation lane and the reviewer `ai-surface-map.md` pointer are aspirational and not in the reconciliation set

The plan's Locked Design Decisions include: "Release notes, changelog entries, and reviewer docs must describe shipped behavior only. No private-path references, aspirational future-state language, or unstaged roadmap claims belong in the release cut." The reconciliation pass in Planned Work step 1 enumerates the docs to align — but does not include the AI lane.

Current state:
- [docs/60-ai/ai-features-v1.md](../../../60-ai/ai-features-v1.md) describes a v1 AI feature catalog (document summary, metadata tag suggestions, cross-document synthesis, document insight alerts) with "Acceptance Baseline" and "Shared Rules" written as if shipped.
- [docs/60-ai/ai-architecture.md](../../../60-ai/ai-architecture.md), [docs/60-ai/ai-subsystem-overview.md](../../../60-ai/ai-subsystem-overview.md), and [docs/60-ai/README.md](../../../60-ai/README.md) extend that framing.
- [review/ai-surface-map.md](../../../../review/ai-surface-map.md) carries the same "v1 AI Surface" table into the reviewer-facing summary.
- [REVIEWERS.md](../../../../REVIEWERS.md) at line 17-19 lists `review/ai-surface-map.md` under "Optional AI context."
- [review/README.md](../../../../review/README.md) lists `ai-surface-map.md` under "Optional Deep Dives."
- The execution plan (CP1-CP17) never schedules AI work, the CP15 / CP16 critic reviews never reference AI behavior, and a spot grep against `src/` returns zero `IAiProvider`, `Ai*` class, or AI feature wiring.

This is exactly the "stale or aspirational behavior claim" CP17 exists to close, and it is at the reviewer's optional-read entry point — a hiring reviewer who follows the link reads a feature catalog that does not exist in the running system.

Required resolution before scope-lock:
- Lock the v1 AI posture explicitly. Two defensible options:
  - **Recategorize as post-V1 / deferred:** rewrite [docs/60-ai/ai-features-v1.md](../../../60-ai/ai-features-v1.md) as a post-V1 product specification (or rename it), update [docs/60-ai/README.md](../../../60-ai/README.md) and [docs/60-ai/ai-subsystem-overview.md](../../../60-ai/ai-subsystem-overview.md) to state explicitly that no AI feature ships in V1, drop the `review/ai-surface-map.md` pointer from `REVIEWERS.md` and `review/README.md`, and either delete `review/ai-surface-map.md` or rewrite its header to say it documents post-V1 candidate scope. This is the recommended option because it matches the actual shipped behavior.
  - **Implement a minimum AI surface in CP17:** out of scope per the plan's own non-included list. Reject this option.
- Add the AI lane reconciliation set to Planned Work step 1: [docs/60-ai/README.md](../../../60-ai/README.md), [docs/60-ai/ai-features-v1.md](../../../60-ai/ai-features-v1.md), [docs/60-ai/ai-subsystem-overview.md](../../../60-ai/ai-subsystem-overview.md), [docs/60-ai/ai-architecture.md](../../../60-ai/ai-architecture.md), [review/ai-surface-map.md](../../../../review/ai-surface-map.md), [review/README.md](../../../../review/README.md), [REVIEWERS.md](../../../../REVIEWERS.md).
- Add an AC line: "No reviewer-facing or canonical doc claims that an AI feature ships in V1; any AI material is explicitly labeled as post-V1 or deferred."

### B5: Public-demo deployment scope for the V1 release cut is undefined

[docs/70-operations/deployment.md](../../../70-operations/deployment.md) and [docs/70-operations/runbook-prod.md](../../../70-operations/runbook-prod.md) describe a single-host Docker Compose deployment at `lab.danielmaratta.com` with Cloudflare DNS, Tailscale SSH, and a real PostgreSQL container. Success criterion 4.1 says "Application deploys successfully in production configuration." The CP17 plan's Acceptance Criteria require the runbook docs to "align with the current single-host Docker Compose runtime, migrations workflow, validation commands, and rollback expectations, with no stale or aspirational release automation claims" — but it never says whether the public demo at the deployed domain is required to be live for CP17 closeout, or whether public-demo deployment is explicitly deferred and the runbook docs document the contract reviewers can run themselves.

Both interpretations are consistent with the existing plan text, and they have very different validation surfaces:

- If the public demo is required live, CP17 must add deployment evidence to the release artifact (deploy/verify/rollback walkthrough run against the actual host), the validation plan must include public-demo smoke checks (currently [docs/80-testing/e2e-tests.md](../../../80-testing/e2e-tests.md) treats them as optional and "do not depend on public demo for routine E2E coverage"), and rollout/rollback notes must describe the actual operator workflow.
- If the public demo is explicitly deferred, the runbook-prod and deployment docs must say so prominently (the current text reads as production-active), the release artifact's "Risks And Rollout Notes" must lock the boundary, and the validation plan stays clean-checkout-local only.

Required resolution before scope-lock:
- Lock which of the two interpretations applies for V1. The recommended path is deferred (the existing plan already excludes "public-demo infrastructure expansion" and the locked single-host topology is reproducible by any reviewer; making live demo a release blocker pulls operational scope into a hiring-artifact release).
- Add a Locked Design Decision stating the chosen interpretation. If deferred: state explicitly that V1 release readiness is proven by clean-checkout reproducibility plus the documented deployment runbook, that the public-demo host is not part of the release-blocking validation surface, and that runbook-prod / deployment.md remain accurate descriptions of the supported topology rather than active-host evidence.
- Update AC and Validation Plan accordingly. If deferred, also add an AC line that runbook-prod and deployment docs are reviewed for any wording that implies the public demo is currently live and operated.

### B6: New release workflow and release checklist filenames are not locked

Acceptance Criteria say "[docs/95-delivery/](../../) contains a canonical release workflow and release checklist that agree with [docs/95-delivery/staging-and-versioning.md](../../staging-and-versioning.md), the actual script surface, and the CP17 delivery artifact." Touch Points refer to "planned new canonical release docs under `docs/95-delivery/` for the release workflow and release checklist." Neither names the filenames or whether these are one document or two.

This invites three known regressions:
- the executor lands `release-process.md` while the AC and CP17 artifact reference `release-workflow.md` (or vice versa), causing a docs-validation false positive
- one document collapses both concerns and the AC line "release workflow and release checklist" appears half-met
- the implementation-plan's TDD slice 1 RED test (`Should_FailReleaseChecklistValidation_When_A_RequiredArtifact_Or_Gate_Is_Missing`) cannot fail deterministically without knowing which artifact is the missing one

Required resolution before scope-lock:
- Lock the filenames explicitly. Recommended: two files, [docs/95-delivery/release-workflow.md](../../release-workflow.md) (the procedural sequence — what runs, in what order, who owns what) and [docs/95-delivery/release-checklist.md](../../release-checklist.md) (the closeout gate list — every artifact, command output, and manual evidence required before `main` is taggable). Two files is the lower-risk choice because it lets the checklist stay short and copyable while the workflow doc carries narrative.
- Add a Locked Design Decision naming the two filenames, the relationship between them, and how each links to the CP17 release artifact, [docs/95-delivery/staging-and-versioning.md](../../staging-and-versioning.md), and [docs/55-execution/execution-plan.md](../../../55-execution/execution-plan.md).
- Add the two filenames to Touch Points, AC, Planned Work step 1 reconciliation set, and the [docs/ai-index.md](../../../ai-index.md) / [docs/repo-map.json](../../../repo-map.json) update list.

### B7: "main is documented as taggable for V1" closeout artifact is not specified

Acceptance Criteria say "`main` is documented as taggable for V1 by the end of CP17, while the actual merge or tag action remains outside executor scope." That is the CP17 closeout signal — but the plan does not name which file records it. Reasonable candidates:

- a status line in [docs/55-execution/checkpoint-status.md](../../../55-execution/checkpoint-status.md) (the current ledger pattern; CP16 row already uses `done` plus a notes column)
- a dedicated section in the CP17 release artifact under this folder
- a status line in the CP17 task file under [docs/05-taskboard/tasks/](../../../05-taskboard/tasks/)
- the new [docs/95-delivery/release-checklist.md](../../release-checklist.md) (per B6)

If the artifact is unspecified, the executor and the reviewer disagree on what closure looks like, and the CP17 PR reviewer has to hunt for the signal.

Required resolution before scope-lock:
- Lock one canonical "taggable" artifact. Recommended: a `Release Readiness` section at the bottom of the new [docs/95-delivery/release-checklist.md](../../release-checklist.md) (per B6), copied verbatim into the CP17 release artifact's `Validation Evidence` section, and reflected in the [docs/55-execution/checkpoint-status.md](../../../55-execution/checkpoint-status.md) CP17 row notes column. One owner doc, two copies (release artifact and checkpoint ledger) for cross-referencing.
- Add a Locked Design Decision naming the canonical file and the cross-reference rule.
- Add an AC line: "[docs/95-delivery/release-checklist.md](../../release-checklist.md) records the executor-attested release-readiness signal, the CP17 release artifact mirrors it under `Validation Evidence`, and [docs/55-execution/checkpoint-status.md](../../../55-execution/checkpoint-status.md) CP17 row notes link to both."

---

## Non-Blocking Findings

### NB-1: Recommended reviewer walkthrough copy is too generic for the post-CP15/CP16 system

The Acceptance Criteria walkthrough enumerates "impersonation banner and start or stop behavior" and "lease visibility or extension behavior." The CP15/CP16 implementations support more reviewer-visible behavior worth naming explicitly:

- start-impersonation produces a downgraded effective experience the reviewer can observe (an admin-only route 403s while view-as is active)
- stop-impersonation recovers without a root-host login round-trip (this was an explicit CP15 design property)
- the authenticated tenant-host mutation rate limiter returns `429` with `Retry-After` and is partitioned by `(tenant_id, effective_user_id)` (CP16 locked behavior; reviewer-visible if exercised)
- spoofed-host requests are rejected at the host-validation boundary before reaching auth (CP16 regression-tested; can be demoed via a request with a tampered `Host` header)

Recommendation: tighten the walkthrough AC bullets to name these properties, so the new release checklist and the refreshed `REVIEWERS.md` walkthrough produce a measurably stronger reviewer experience than a generic "click around the impersonation banner" pass. Non-blocking because the AC framework is correct; the tightening is additive copy.

### NB-2: TDD slice 1 lacks a programmatic public-seam check

The plan correctly says docs-only reconciliation does not require synthetic tests. Slice 1's seam, however, is the new release-checklist artifact (per B6) — that is a docs artifact whose value is precisely that a reviewer can run down the checklist deterministically. A natural programmatic gate exists already: [scripts/validate-docs.ps1](../../../../scripts/validate-docs.ps1) can verify the checklist file exists, contains every required section header, and links to every named validation script. Recommend adding a thin docs-validation rule (or naming the manual review checklist that exercises this) so the slice 1 RED state is actually mechanical rather than aspirational. Non-blocking because the manual review path is acceptable for a docs artifact.

### NB-3: Validation Plan only names a final `validate-docs.ps1` pass

The Validation Plan currently calls for "final `validate-docs.ps1` pass after all CP17 artifact updates." For a release-prep checkpoint that adds two new docs (per B6) plus reconciles ~15 existing docs, a single final pass is too coarse. Recommend an explicit early pass after Planned Work step 1 (canonical-doc reconciliation lands) and the existing final pass after step 6, so docs-validation regressions surface at the boundary that introduced them rather than at the end. Non-blocking because the final pass catches the regression eventually; intermediate passes shorten the diagnosis loop.

### NB-4: Touch Points omit the CP17 task file and the work queue

Touch Points mention "the CP17 taskboard entry under [docs/05-taskboard/tasks/](../../../05-taskboard/tasks/) when created" and Planned Work step 6 mentions taskboard state, but [docs/05-taskboard/work-queue.md](../../../05-taskboard/work-queue.md) (the active board) is not enumerated and the task file naming is left implicit. The CP1-CP16 sequence consistently uses `T-####-cpNN-<slug>.md`. Recommend locking the task filename (next free slot is `T-0032`) and adding [docs/05-taskboard/work-queue.md](../../../05-taskboard/work-queue.md) to Touch Points so the executor does not skip the active-board update. Non-blocking because the executor will likely follow the precedent; the lock prevents drift.

### NB-5: `docs/00-intent/canonical-decisions.md` is conditionally included

Touch Points list "[docs/00-intent/canonical-decisions.md](../../../00-intent/canonical-decisions.md) if release-readiness wording needs alignment." The CP16 critic flagged this exact "falsely conditional" pattern as a scope-drift risk. Either the file is in the reconciliation set (because the V1 identifier lock per B1 changes the canonical-decisions wording about the release checkpoint) or it is not. Recommend resolving: read the file once at scope-lock time and either commit to including it in step 1 reconciliation or drop the conditional. Non-blocking because the file is small and the executor will catch the need; explicit is better.

### NB-6: Private-path leakage guard is static-review only

The plan's Validation Plan includes "static review that release docs and reviewer artifacts reference only public repo paths and do not mention local-only or private sources." Static review is the right minimum bar, but the failure mode (a future contributor pasting a path or repo name from a non-public source into reviewer copy) is exactly the kind of regression that benefits from an automated gate. Recommend the Validation Plan add a `rg`-based scan over the changed reviewer-facing files (`README.md`, `REVIEWERS.md`, `review/`, the new release docs, the CP17 release artifact, `CHANGELOG.md`) for path patterns that match local-only sibling-directory references (`../<sibling>/`, `..\\<sibling>\\`) or other markers of non-public path leakage, and hard-fail on any hit. Non-blocking because static review with the existing scope is defensible; the automated guard is additive insurance for a release cut.

### NB-7: Reviewer "Optional Deep Dives" set should be reviewed for stale claims

[review/README.md](../../../../review/README.md) lists `domain-model-diagram.md`, `system-architecture-diagram.md`, `ai-surface-map.md` (per B4), `scaling-considerations.md`, and `future-evolution.md` as optional deep dives. Of these, `scaling-considerations.md` and `future-evolution.md` are written as forward-looking surfaces — that is acceptable for a hiring artifact, but Planned Work step 4 should explicitly include them in the "refresh diagrams and walkthrough copy only where the current docs drift from the actual runtime or over-explain superseded checkpoint staging" pass. Currently neither is named in the reconciliation set. Non-blocking; a single grep pass covers them.

### NB-8: Visual Studio launch verification list omits `Launch Frontend Dev Server`

The Validation Plan correctly mirrors [docs/70-operations/runbook-local.md](../../../70-operations/runbook-local.md): VS Code includes `Launch Frontend Dev Server`, Visual Studio does not. Recommend the plan note the asymmetry explicitly so a reviewer comparing the two manual-verification lists does not flag it as a missed entry. One sentence in Validation Plan suffices. Non-blocking; the plan is internally consistent with the runbook.

---

## Locked Decisions

Treat these as binding for CP17 implementation. They already appear in the plan or are implied by [AGENTS.md](../../../../AGENTS.md), [docs/55-execution/execution-plan.md](../../../55-execution/execution-plan.md), [docs/95-delivery/staging-and-versioning.md](../../staging-and-versioning.md), and prior-checkpoint critic reviews; they are restated here so the executor does not re-open them.

- CP17 packages the V1 system that exists after CP16. Release readiness comes from reproducibility, validation completeness, and reviewer clarity — not from landing more behavior.
- The runtime baseline remains the single-host Docker Compose topology with Caddy, PostgreSQL, migrations, app host, and worker. No alternate environments, Kubernetes, multi-host routing, or new secret-manager contracts.
- The reviewer snapshot remains doc-first. `REVIEWERS.md` and the `review/` directory stay as the reviewer-facing orientation layer; canonical behavior continues to live in `docs/`. No second documentation site, no generated reviewer portal.
- The CP17 release artifact lives in this folder and uses the shape from [docs/95-delivery/pr/release-pr-description-template.md](../release-pr-description-template.md). The implementation plan and this critic review remain companion delivery docs with distinct purposes.
- The canonical validation command surface is the existing repo scripts: `preflight.ps1`, `restore.ps1`, `build.ps1`, `test.ps1`, `run-browser-e2e.ps1`, `validate-docs.ps1`, `validate-launch-profiles.ps1`, `validate-checkpoint.ps1`, `start-local.ps1`, `reviewer-full-stack.ps1`. CP17 may add at most a thin release checklist or workflow layer, not a parallel shadow command surface.
- Final clean-checkout validation runs from a fresh local checkout or worktree of the candidate revision, not from the long-lived working directory.
- Manual VS Code and Visual Studio launch verification remain mandatory release evidence and cannot be replaced by script-only claims.
- Historical CP1-CP16 PR artifacts remain historical records. Only path/wording fixes that preserve docs validation or release-checklist correctness are allowed.
- Release-blocking discoveries during clean-checkout get the smallest possible fix in CP17. Non-blocking discoveries are explicitly deferred.
- CP17 prepares `main` to be taggable. Owner-controlled merge and tag actions stay out of executor scope.
- ADR-0002, ADR-0003, ADR-0005, ADR-0007, ADR-0008, ADR-0010, ADR-0011 are not reopened. Any CP17 wording change that would modify locked behavior requires an amendment or companion ADR in the same change set.
- Reviewer docs do not duplicate canonical docs. Each reviewer summary keeps the narrow purpose declared in [review/README.md](../../../../review/README.md) "Drift Control" section.
- No private-path references in any committed artifact, in any case or formatting variant.

---

## Required Plan Edits

Apply these edits to [docs/95-delivery/pr/cp17-release-preparation-and-reviewer-snapshot/implementation-plan.md](./implementation-plan.md) before scope-lock is declared. All edits flow into the step 1 canonical-doc reconciliation pass already planned.

1. **Resolve Open Decision #1** (B1) — lock the V1 identifier text (recommended: prose `V1`, tag `v1.0.0`) and propagate the lock through `CHANGELOG.md`, the CP17 release artifact, the new release-workflow doc, the new release-checklist doc, [README.md](../../../../README.md) Status, and [REVIEWERS.md](../../../../REVIEWERS.md). Move resolution into Locked Design Decisions; update AC, TDD slices 1 and 5, and Touch Points.
2. **Resolve Open Decision #2** (B2) — lock the `CHANGELOG.md` cut shape (recommended: dated `## [V1] - YYYY-MM-DD` cut with reseeded empty `## Unreleased`). Lock section ordering, date format, and the rule for existing per-checkpoint bullets. Move into Locked Design Decisions; update AC and TDD slice 1.
3. **Resolve Open Decision #3** (B3) — lock retention of the `scripts/run-root-host-e2e.ps1` shim through V1, with the new release checklist naming it as a frozen historical compatibility surface and post-V1 removal explicitly out of scope. Move into Locked Design Decisions; update Touch Points and Validation Plan.
4. **Add the AI lane to Planned Work step 1 reconciliation and lock the v1 AI posture** (B4) — recommended: recategorize [docs/60-ai/ai-features-v1.md](../../../60-ai/ai-features-v1.md) and the related lane docs as post-V1 / deferred, drop the `review/ai-surface-map.md` pointer from `REVIEWERS.md` "Optional AI context" and `review/README.md` "Optional Deep Dives," and either delete `review/ai-surface-map.md` or rewrite its header to label it post-V1 candidate scope. Add an AC line forbidding any reviewer-facing or canonical claim that an AI feature ships in V1.
5. **Lock public-demo deployment scope for the V1 release cut** (B5) — recommended: explicitly defer live public-demo operation. Add a Locked Design Decision stating release readiness is proven by clean-checkout reproducibility plus the documented deployment runbook; the public-demo host is not part of the release-blocking validation surface. Reconcile [docs/70-operations/runbook-prod.md](../../../70-operations/runbook-prod.md) and [docs/70-operations/deployment.md](../../../70-operations/deployment.md) wording in the same step 1 pass so they read as the supported topology rather than active-host operational evidence.
6. **Lock the new release docs filenames** (B6) — add [docs/95-delivery/release-workflow.md](../../release-workflow.md) and [docs/95-delivery/release-checklist.md](../../release-checklist.md) to Locked Design Decisions, Touch Points, AC, Planned Work step 1 reconciliation set, and the [docs/ai-index.md](../../../ai-index.md) / [docs/repo-map.json](../../../repo-map.json) update list.
7. **Lock the "main is taggable" closeout artifact** (B7) — name [docs/95-delivery/release-checklist.md](../../release-checklist.md) `Release Readiness` section as the canonical signal, the CP17 release artifact `Validation Evidence` section as the mirror, and [docs/55-execution/checkpoint-status.md](../../../55-execution/checkpoint-status.md) CP17 row notes as the cross-reference. Add the AC line.
8. **Tighten the recommended reviewer walkthrough AC** (NB-1) — name the downgraded effective experience under impersonation, the no-root-host-round-trip stop behavior, the authenticated `429` + `Retry-After` rate-limit observation point, and the spoofed-host rejection demonstration. The new release checklist and `REVIEWERS.md` refresh both inherit this list.
9. **Add a programmatic seam check for slice 1** (NB-2) — extend [scripts/validate-docs.ps1](../../../../scripts/validate-docs.ps1) (or name the manual review checklist) so the new release-checklist artifact's required sections and validation-script links are mechanically asserted, giving the RED test a real failure mode.
10. **Add an early `validate-docs.ps1` pass after step 1 reconciliation** (NB-3) — keep the existing final pass; add the early one to Validation Plan.
11. **Lock the CP17 task file naming and add the work queue to Touch Points** (NB-4) — name `T-0032-cp17-release-preparation-and-reviewer-snapshot.md` (or the next free slot at scope-lock time) and add [docs/05-taskboard/work-queue.md](../../../05-taskboard/work-queue.md) to Touch Points.
12. **Resolve the conditional inclusion of `docs/00-intent/canonical-decisions.md`** (NB-5) — read the file at scope-lock and either include it in step 1 reconciliation or remove the conditional from Touch Points.
13. **Add a private-path leakage `rg` guard to Validation Plan** (NB-6) — pattern set covering local-only sibling-directory references and other markers of non-public path leakage, run against `README.md`, `REVIEWERS.md`, `review/`, the new release docs, the CP17 release artifact, and `CHANGELOG.md`.
14. **Add `scaling-considerations.md` and `future-evolution.md` to the reviewer-doc reconciliation set** (NB-7) — explicit grep pass for stale claims rather than implicit "refresh where drifted."
15. **Note the VS Code / Visual Studio launch-verification list asymmetry in Validation Plan** (NB-8) — one sentence acknowledging the absence of `Launch Frontend Dev Server` from the Visual Studio list is intentional and matches the runbook.
16. **Cross-link the reconciliation set** — ensure step 1 explicitly includes the two new release docs (per B6), the AI lane (per B4), the runbook-prod / deployment.md narrowing (per B5), [docs/00-intent/canonical-decisions.md](../../../00-intent/canonical-decisions.md) if NB-5 includes it, the CP17 task file (per NB-4), and the [docs/ai-index.md](../../../ai-index.md) / [docs/repo-map.json](../../../repo-map.json) updates for every new file.

---

## Post-Implementation Checks

Record these as the CP17 post-implementation check table. Each must pass before the PR artifact is marked ship-ready.

1. **V1 identifier consistent everywhere.** The locked prose label (recommended `V1`) and tag spelling (recommended `v1.0.0`) appear identically in `CHANGELOG.md`, the CP17 release artifact, [docs/95-delivery/release-workflow.md](../../release-workflow.md), [docs/95-delivery/release-checklist.md](../../release-checklist.md), [README.md](../../../../README.md) Status, [REVIEWERS.md](../../../../REVIEWERS.md), and the CP17 task file. `rg` for the prose label and tag spelling returns matching hit counts in each file with no orphaned variants.
2. **`CHANGELOG.md` is cut into the locked shape.** A dated `## [V1] - YYYY-MM-DD` section exists, an empty `## Unreleased` is reseeded (or the alternative locked shape is fully applied), and prior per-checkpoint bullets are handled per the lock. No half-applied state.
3. **`scripts/run-root-host-e2e.ps1` shim posture matches the lock.** The shim file is present, [docs/95-delivery/release-checklist.md](../../release-checklist.md) names it as a frozen historical compatibility surface, and `validate-docs.ps1` continues to pass against archived CP13-CP15 PR artifacts that reference the old name.
4. **No reviewer-facing or canonical doc claims an AI feature ships in V1.** [docs/60-ai/](../../../60-ai/) docs explicitly label their content as post-V1 / deferred, [REVIEWERS.md](../../../../REVIEWERS.md) and [review/README.md](../../../../review/README.md) no longer surface `ai-surface-map.md` as v1 reviewer context, and either `review/ai-surface-map.md` is removed or its header explicitly labels the content post-V1. `rg` against `review/`, `REVIEWERS.md`, and `README.md` for "v1 AI" / "AI Surface" surfaces zero shipped-behavior claims.
5. **Public-demo deployment scope matches the lock.** [docs/70-operations/runbook-prod.md](../../../70-operations/runbook-prod.md) and [docs/70-operations/deployment.md](../../../70-operations/deployment.md) read as the supported topology rather than active-host evidence; the CP17 release artifact's `Risks And Rollout Notes` reflects the locked deferral (or, if live deployment was locked instead, includes the deployment evidence the locked scope requires).
6. **New release docs exist and agree with each other.** [docs/95-delivery/release-workflow.md](../../release-workflow.md) and [docs/95-delivery/release-checklist.md](../../release-checklist.md) are present, name every required release gate, output artifact, and manual verification dependency, link to the canonical scripts and to each other, and are referenced from [docs/95-delivery/README.md](../../README.md), the CP17 release artifact, [docs/95-delivery/staging-and-versioning.md](../../staging-and-versioning.md), [docs/ai-index.md](../../../ai-index.md), and [docs/repo-map.json](../../../repo-map.json).
7. **`Release Readiness` signal recorded in the locked artifact.** [docs/95-delivery/release-checklist.md](../../release-checklist.md) `Release Readiness` section records the executor-attested signal, the CP17 release artifact `Validation Evidence` section mirrors it, and [docs/55-execution/checkpoint-status.md](../../../55-execution/checkpoint-status.md) CP17 row notes link to both.
8. **Reviewer walkthrough is reproducible from documented steps and covers the tightened evidence list.** Root-host provisioning or login; tenant-host dashboard, binder, and document flow; policy or user-management behavior; impersonation start, downgraded effective experience, and stop-without-root-host-round-trip; lease visibility and extension behavior; logout return to root host; observable `429` + `Retry-After` on an authenticated tenant-host mutation when budget is exhausted; spoofed-host rejection at the host-validation boundary.
9. **Reviewer docs no longer carry pre-CP16 caveats or stale checkpoint staging.** [README.md](../../../../README.md), [REVIEWERS.md](../../../../REVIEWERS.md), [review/README.md](../../../../review/README.md), [review/architecture-overview.md](../../../../review/architecture-overview.md), [review/security-model-summary.md](../../../../review/security-model-summary.md), [review/multi-tenancy-diagram.md](../../../../review/multi-tenancy-diagram.md), [review/request-lifecycle.md](../../../../review/request-lifecycle.md), [review/user-flows.md](../../../../review/user-flows.md), [review/system-architecture-diagram.md](../../../../review/system-architecture-diagram.md), [review/domain-model-diagram.md](../../../../review/domain-model-diagram.md), [review/scaling-considerations.md](../../../../review/scaling-considerations.md), and [review/future-evolution.md](../../../../review/future-evolution.md) reflect the shipped V1 system; `rg` for "later-checkpoint" / "later checkpoint" / "broader hardening" / "placeholder" returns zero hits in this set.
10. **Operations runbooks align with the current Compose, migrations, validation, and rollback model.** [docs/70-operations/runbook-local.md](../../../70-operations/runbook-local.md), [docs/70-operations/runbook-prod.md](../../../70-operations/runbook-prod.md), and [docs/70-operations/deployment.md](../../../70-operations/deployment.md) describe the actual repo surface, with the "later-checkpoint" caveat in `runbook-local.md` line 183 (impersonation hardening) reconciled or removed.
11. **Clean-checkout validation passes from a fresh checkout or worktree of the candidate revision.** `preflight.ps1`, `restore.ps1`, `build.ps1`, `test.ps1 -Configuration Release -DockerIntegrationMode Require`, `run-browser-e2e.ps1`, `validate-docs.ps1` (early pass after reconciliation and final pass after artifact updates), `validate-launch-profiles.ps1`, and `validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require` all complete successfully with results captured in the CP17 release artifact.
12. **Manual VS Code launch verification recorded.** `Reviewer Full Stack`, `App + Worker (Process)`, `API Only`, `UI Only`, `Worker Only`, `Launch Frontend Dev Server` all verified and recorded in the CP17 release artifact.
13. **Manual Visual Studio launch verification recorded.** `Reviewer Full Stack`, `App + Worker (Process)`, `API Only`, `UI Only`, `Worker Only` all verified (or the project-profile fallback recorded explicitly per the runbook contract).
14. **No private-path leakage in any committed artifact.** Automated `rg` guard (per Required Plan Edit 13) returns zero hits across `README.md`, `REVIEWERS.md`, `review/`, the new release docs, the CP17 release artifact, and `CHANGELOG.md`. The plan author and the reviewer both confirm that no path or repo-name variant referencing a non-public source appears in the diff in any case or formatting variant.
15. **No CP17 scope bleed.** Diff contains no new product features, architecture changes, browser-matrix expansion, generated reviewer microsite, public-demo infrastructure expansion, performance or load testing, screenshots or video capture, broad rewrites of historical CP1-CP16 artifacts, or merge / tag actions.
16. **Discovered defects are triaged correctly.** Any release-blocking issue uncovered during clean-checkout was fixed with the smallest possible change in CP17 and noted in the release artifact. Any non-blocking discovery is explicitly deferred to a `T-####` follow-up rather than silently absorbed into CP17.
17. **CP17 navigation metadata updated.** [docs/ai-index.md](../../../ai-index.md) and [docs/repo-map.json](../../../repo-map.json) include the two new release docs, the CP17 release artifact, the CP17 task file, and any reclassified AI lane file.
18. **Taskboard and ledger reflect closure.** [docs/05-taskboard/work-queue.md](../../../05-taskboard/work-queue.md) moves the CP17 task to `Recently Done` only after `Status: done` and Outcome are recorded; [docs/55-execution/checkpoint-status.md](../../../55-execution/checkpoint-status.md) CP17 row reads `done`, `Last completed checkpoint` is set to `CP17`, `Current checkpoint` is `none active`, and `Next checkpoint` reflects the post-V1 state (or is explicitly empty).
19. **Owner action handoff is explicit.** The CP17 release artifact closes by stating that `main` is documented as taggable for V1 and that the actual merge and tag actions remain owner-controlled.

---

## Summary

The plan is close to scope-lock but not yet there. Its structure, locked decisions, scope discipline, validation surface lock, and TDD framing are substantively correct. The blockers are concentrated in three Open Decisions that are real scope locks rather than implementation details (V1 identifier, changelog cut shape, run-root-host-e2e shim), one missing reconciliation lane that violates the plan's own anti-aspirational rule (the `docs/60-ai/` AI lane and the reviewer's `ai-surface-map.md` pointer), one undefined release-scope question (public-demo deployment status), and two missing artifact locks (the new release-workflow / release-checklist filenames and the `main is taggable` closeout signal). Apply the Required Plan Edits above and the plan will be scope-locked.

---

## Re-Review (Post-Revision)

Reviewer: PaperBinder Critic
Date: 2026-04-19

Inputs re-reviewed:
- [docs/95-delivery/pr/cp17-release-preparation-and-reviewer-snapshot/implementation-plan.md](./implementation-plan.md) (revised after initial critic pass)
- Original critic review above (B1-B7, NB-1 through NB-8, Required Plan Edits 1-16)
- [docs/55-execution/execution-plan.md](../../../55-execution/execution-plan.md) and [docs/55-execution/checkpoint-status.md](../../../55-execution/checkpoint-status.md) (unchanged since initial review; no new CP17 row state to reconcile against)
- [docs/95-delivery/staging-and-versioning.md](../../staging-and-versioning.md) (unchanged; locked V1 identifier per B1 is consistent with this baseline)

### Verdict

**The plan is scope-locked. No blocking findings remain.**

The revised plan adds a `Critic Findings Disposition` section that explicitly accepts every B1-B7 and NB-1 through NB-8 finding, removes the three Open Decisions into Locked Design Decisions (V1 identifier, CHANGELOG cut shape, shim retention), names the two new release docs by filename, locks the `Release Readiness` closeout signal across one owner doc and two cross-references, expands Planned Work step 1 to include the AI lane plus reviewer optional deep dives, deferred public-demo as a release gate while keeping the runbook docs as supported-topology reference, locks the `T-0032-cp17-release-preparation-and-reviewer-snapshot.md` task filename, tightens the recommended walkthrough AC to enumerate the impersonation-downgrade, stop-without-root-host-round-trip, `429` + `Retry-After`, and spoofed-host-rejection observations, adds an early `validate-docs.ps1` pass after the reconciliation set lands, and adds a programmatic private-path leakage guard over reviewer-facing release artifacts. `Open Decisions: None at scope-lock` is now a defensible statement rather than a deferred risk.

### Blocker Resolution Verification

| ID | Original Blocker | Revised Plan Disposition | Status |
| --- | --- | --- | --- |
| B1 | V1 identifier format deferred to Review Ready handoff | Locked Design Decisions name prose `V1` and recommended tag `v1.0.0`; AC line propagates the lock through `CHANGELOG.md`, the CP17 release artifact, both new release docs, `README.md`, `REVIEWERS.md`, `docs/55-execution/checkpoint-status.md`, and `T-0032-cp17-...md` | Pass |
| B2 | CHANGELOG cut shape was an Open Decision | Locked Design Decisions specify `## [V1] - YYYY-MM-DD` with reseeded empty `## Unreleased` and a release-summary rewrite; AC reflects the same shape; TDD slice 1 RED state is now deterministic | Pass |
| B3 | `scripts/run-root-host-e2e.ps1` shim posture deferred to CP17 | Locked Design Decisions retain the shim through V1 as a frozen historical compatibility surface; release docs make the posture explicit; post-V1 removal explicitly out of scope | Pass |
| B4 | AI lane and `review/ai-surface-map.md` pointer not in reconciliation set | Step 1 reconciliation set includes [docs/60-ai/README.md](../../../60-ai/README.md), [docs/60-ai/ai-features-v1.md](../../../60-ai/ai-features-v1.md), [docs/60-ai/ai-subsystem-overview.md](../../../60-ai/ai-subsystem-overview.md), [docs/60-ai/ai-architecture.md](../../../60-ai/ai-architecture.md), and [review/ai-surface-map.md](../../../../review/ai-surface-map.md); Locked Design Decisions reject any AI implementation in CP17 and require explicit post-V1 / deferred labeling; AC adds the no-shipped-AI claim | Pass |
| B5 | Public-demo deployment scope undefined | Locked Design Decisions defer live public-demo as a release gate; runbook-prod and deployment.md must read as supported-topology reference rather than active-host evidence; AC propagates the deferral and requires runbook wording reconciliation | Pass |
| B6 | New release docs filenames not locked | Locked Design Decisions name [docs/95-delivery/release-workflow.md](../../release-workflow.md) and [docs/95-delivery/release-checklist.md](../../release-checklist.md) as two distinct files with declared roles; both appear in step 1 reconciliation, AC, Touch Points, and the navigation-metadata update list | Pass |
| B7 | "Main is taggable" closeout artifact unspecified | Locked Design Decisions name [docs/95-delivery/release-checklist.md](../../release-checklist.md) `Release Readiness` section as the canonical signal, with the CP17 release artifact `Validation Evidence` mirror and the `docs/55-execution/checkpoint-status.md` CP17 row notes as cross-reference; AC line locks the same triplet | Pass |

### Non-Blocking Resolution Verification

| ID | Original Non-Blocker | Revised Plan Disposition | Status |
| --- | --- | --- | --- |
| NB-1 | Walkthrough AC too generic | AC and Validation Plan now enumerate impersonation downgrade, stop without root-host round-trip, authenticated `429` + `Retry-After`, and spoofed-host rejection | Pass |
| NB-2 | Slice 1 lacked a programmatic seam check | Validation Plan now requires a failing `validate-docs.ps1` assertion that the release-checklist file exists, has the required headers, and links to canonical scripts before any validator change is implemented | Pass |
| NB-3 | Only a final `validate-docs.ps1` pass | Validation Plan now includes an explicit early `validate-docs.ps1` pass immediately after step 1 reconciliation, in addition to the final pass | Pass |
| NB-4 | Touch Points omit task file and work queue | Locked Design Decisions name `T-0032-cp17-release-preparation-and-reviewer-snapshot.md`; Touch Points include both the task file and [docs/05-taskboard/work-queue.md](../../../05-taskboard/work-queue.md) | Pass |
| NB-5 | `canonical-decisions.md` conditionally included | Step 1 reconciliation set now includes [docs/00-intent/canonical-decisions.md](../../../00-intent/canonical-decisions.md) unconditionally | Pass |
| NB-6 | Private-path leakage guard was static-review only | Validation Plan adds a programmatic private-path leakage guard over `README.md`, `REVIEWERS.md`, `review/`, `CHANGELOG.md`, both release docs, the CP17 release artifact, and the CP17 task file | Pass |
| NB-7 | `scaling-considerations.md` and `future-evolution.md` not in the reviewer reconciliation set | Step 1 reconciliation, Planned Work step 4, and Touch Points all explicitly include [review/scaling-considerations.md](../../../../review/scaling-considerations.md) and [review/future-evolution.md](../../../../review/future-evolution.md) | Pass |
| NB-8 | VS / VS Code launch-verification asymmetry not noted | Validation Plan now states `Launch Frontend Dev Server` is intentionally VS Code-only and is therefore absent from the Visual Studio list | Pass |

### Residual Risks (Carry Into Post-Implementation Review)

These are not blockers but are worth tracking through the CP17 PR critique pass so they cannot silently regress:

1. **CHANGELOG release-section taxonomy is not granular-locked.** The plan locks the section header (`## [V1] - YYYY-MM-DD`) and the reseeded `## Unreleased`, but does not commit to a specific `Added` / `Changed` / `Fixed` / `Security` / `Docs` substructure. That is acceptable as an implementation detail; flag in the post-implementation review if the chosen substructure differs from the prevailing Keep-a-Changelog convention so reviewers are not surprised.
2. **"Post-V1 or deferred" framing has slight semantic ambiguity.** The plan uses both "post-V1" and "deferred" as acceptable labels for AI material. The post-implementation review should verify that each AI-lane document picks one consistent term per claim rather than mixing them, since "post-V1" implies planned future work and "deferred" implies indeterminate scheduling.
3. **TDD slice 5 RED test name is procedural rather than mechanical.** `Should_RecordReleaseReadiness_Only_When_V1_Identifier_Closeout_Evidence_And_ManualLaunchResults_Are_Present` describes a multi-condition assertion that is straightforward to express as a checklist gate but easy to overengineer into a synthetic test that doubles `validate-docs.ps1`. The post-implementation review should confirm the executor implemented this as a checklist or `validate-docs.ps1` extension rather than as a parallel new validator.
4. **Step 1 reconciliation set is large (~35 files).** This is the largest single docs-reconciliation pass in the project's checkpoint history. Landing it as one push is feasible but raises the noise floor for the CP17 PR review. See the executor follow-up below.
5. **Private-path leakage guard pattern is unspecified.** The Validation Plan correctly requires the guard but leaves the regex / heuristic unspecified — appropriate for an implementation detail, but the guard implementation must itself be generic about local-only sources (the patterns it scans for cannot themselves leak the local-only path names being scanned for). Verify the guard implementation reads from a generic exclusion source rather than embedding sibling-repo names directly.
6. **`docs/95-delivery/README.md` "Read First" pointers may need to expand.** The new [docs/95-delivery/release-workflow.md](../../release-workflow.md) and [docs/95-delivery/release-checklist.md](../../release-checklist.md) are added to step 1 reconciliation, but currently only [docs/95-delivery/staging-and-versioning.md](../../staging-and-versioning.md) is in the delivery README's "Read First" block. Verify the delivery README's read-first list is updated in the same change set so the new release docs are surfaced to a fresh reviewer.
7. **Release-checklist `Release Readiness` schema is unspecified.** The plan locks the section name and its location but not the field set the section must contain (e.g., `Validation Bundle Status`, `Manual Verification Status`, `Owner Action Pending`, `Recommended Tag`). The CP17 release artifact must mirror whatever shape lands in the checklist; if the shape ships ad-hoc, drift between the artifact and the checklist becomes the next post-V1 cleanup target. Implementation detail, but worth checking at PR time.

### Follow-ups For Executor Before Broad Implementation

1. **Land step 1 reconciliation as a separate first sub-PR matching the CP15 / CP16 precedent.** The reconciliation set spans roughly 35 files across delivery, execution, intent, operations, testing, AI lane, reviewer surface, taskboard, and navigation metadata. Bundling it into the main CP17 PR would mix mechanical doc reconciliation with the new release-workflow / release-checklist artifact creation, the CHANGELOG cut, and the reviewer walkthrough refresh — three distinct review surfaces. A separate first sub-PR keeps each subsequent CP17 sub-PR diffable. (Non-binding recommendation; the plan correctly identifies step 1 as blocking before broad edits regardless of PR shape.)
2. **Confirm the `T-0032` slot is still free at task-file creation time.** The plan locks the filename based on the next free slot at scope-lock time. If a parallel task lands first, `T-0032` becomes a wrong-number lock. A one-line check against [docs/05-taskboard/work-queue.md](../../../05-taskboard/work-queue.md) at task-file creation is sufficient.
3. **Decide the Release Readiness schema before slice 1 GREEN.** Per residual risk 7 above; lock the field set in the release-checklist artifact before mirroring it into the CP17 release artifact, to avoid two passes.

### Disposition

The plan is scope-locked. The executor may proceed with broad CP17 implementation starting from the step 1 canonical-doc reconciliation pass. The Required Plan Edits in the original critic review have been satisfied; the Post-Implementation Checks in the original critic review remain authoritative for the CP17 PR critique pass and should be exercised against the actual diff once CP17 reaches `Review Ready`.
