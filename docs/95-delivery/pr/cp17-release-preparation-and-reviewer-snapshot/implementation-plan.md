# CP17 Implementation Plan: Release Preparation And Reviewer Snapshot
Status: Draft

## Goal

Implement CP17 so PaperBinder ends `V1` as a reviewer-ready release cut: scope is frozen, the `V1` prose label and recommended `v1.0.0` tag spelling are locked, the changelog and release artifact set are complete, deployment and rollback docs align with the actual single-host Docker Compose runtime, reviewer docs and walkthrough materials match the shipped system, AI materials no longer read as shipped `V1` behavior, and a final clean-checkout validation proves the documented commands reproduce the local and reviewer experience. CP17 must not widen into feature work, architectural changes, or non-blocking cleanup that does not affect `V1` release readiness.

## Scope

Included:
- freeze CP17 to release-preparation and reviewer-snapshot work for the already-shipped `V1` system, including lock of the release identifier, changelog cut shape, release-doc filenames, compatibility-shim posture, and release-readiness signal
- finalize `CHANGELOG.md`, the CP17 delivery artifact, `docs/95-delivery/release-workflow.md`, and `docs/95-delivery/release-checklist.md` so the `V1` cut has one reviewer-facing narrative, one canonical release workflow, and one canonical closeout checklist
- reconcile `README.md`, `REVIEWERS.md`, `review/`, operations runbooks, and delivery or versioning docs so they describe the current runtime, validation surface, and reviewer walkthrough without stale checkpoint language
- reconcile `docs/60-ai/` and reviewer AI references so no committed doc claims that an AI feature ships in `V1`
- finalize deployment, verification, and rollback docs against the current single-host Docker Compose, migrations, app-host, and worker topology
- run final clean-checkout validation from a fresh local checkout or worktree of the candidate revision and resolve only release-blocking packaging, script, or documentation drift found by that run
- synchronize taskboard, checkpoint, delivery, and navigation metadata that directly track CP17 or the final release artifact, including the CP17 task file and release-readiness cross-references
- remove any committed private sibling-repo path references found during the release-prep sweep

Not included:
- new product features, UX expansion, or backlog cleanup beyond the minimum release-blocking fixes discovered during final validation
- architecture or stack changes, new third-party dependencies, new deployment topology, CI/CD redesign, or public-demo infrastructure expansion
- operating, proving, or depending on a live public-demo host as a release-blocking gate
- any AI feature implementation; CP17 may only reclassify AI docs so they match shipped `V1` scope
- performance or load testing, browser-matrix expansion, SEO or marketing content, screenshots or video capture, or a generated reviewer microsite
- broad rewrites of historical CP1-CP16 artifacts; only minimal path or wording fixes needed to preserve docs integrity or release-checklist correctness are allowed
- final merge or git tag creation; CP17 prepares `main` to be taggable and records the recommended release identifier, but owner-controlled release actions remain outside executor scope

## Locked Design Decisions

- CP17 packages the `V1` system that exists after CP16; release readiness comes from reproducibility, validation completeness, and reviewer clarity, not from landing more behavior.
- The locked release identifier is prose `V1` plus recommended tag spelling `v1.0.0`. Release-facing docs must use those exact forms consistently.
- `CHANGELOG.md` cuts the release as `## [V1] - YYYY-MM-DD` with a fresh empty `## Unreleased` above it. Existing checkpoint-by-checkpoint material is summarized into release-oriented sections rather than duplicated verbatim alongside a second release narrative.
- The runtime and deployment baseline remains the current single-host Docker Compose topology with Caddy, PostgreSQL, migrations, app host, and worker. CP17 does not introduce alternate environments, Kubernetes, multi-host routing, or new secret-manager contracts.
- The supported production topology may remain documented, but a live public-demo host is not part of the release-blocking validation surface for `V1`. `docs/70-operations/runbook-prod.md` and `docs/70-operations/deployment.md` must read as supported-topology guidance rather than proof that a public host is actively running.
- The reviewer snapshot remains doc-first. `REVIEWERS.md` and the `review/` directory stay as the reviewer-facing orientation layer, while canonical behavior continues to live in `docs/`. CP17 does not add a second documentation site or generated reviewer portal.
- No AI feature ships in `V1`. CP17 only reclassifies `docs/60-ai/` and reviewer AI references so they are explicitly post-`V1` or deferred; implementing AI behavior is rejected as out of scope.
- The final release artifact stays under `docs/95-delivery/pr/cp17-release-preparation-and-reviewer-snapshot/` and uses the release-artifact shape from `docs/95-delivery/pr/release-pr-description-template.md`. The implementation plan and critic review remain companion delivery docs with distinct purposes.
- The canonical release-prep docs are exactly `docs/95-delivery/release-workflow.md` and `docs/95-delivery/release-checklist.md`. The workflow doc owns release sequence and responsibility; the checklist owns the gate list and release-readiness signal.
- `docs/95-delivery/release-checklist.md` `Release Readiness` section is the canonical "main is taggable" signal. The CP17 release artifact mirrors that signal under `Validation Evidence`, and `docs/55-execution/checkpoint-status.md` CP17 row notes cross-reference both.
- The canonical validation command surface remains the checked-in repo scripts: `preflight.ps1`, `restore.ps1`, `build.ps1`, `test.ps1`, `run-browser-e2e.ps1`, `validate-docs.ps1`, `validate-launch-profiles.ps1`, `validate-checkpoint.ps1`, `start-local.ps1`, and `reviewer-full-stack.ps1`. CP17 may add at most a thin release checklist or workflow layer, not a parallel shadow command surface.
- `scripts/run-root-host-e2e.ps1` stays as a frozen historical compatibility shim through `V1`. Any removal or retirement is post-`V1` work, not CP17 scope.
- Final clean-checkout validation must run from a fresh local checkout or worktree of the exact candidate revision rather than the long-lived working directory, so the result proves repo reproducibility instead of session-local state.
- Historical checkpoint artifacts remain historical records. Do not rewrite CP1-CP16 narratives for polish; only fix broken paths, stale command names, or release-blocking inconsistencies that would otherwise break docs validation or mislead reviewers.
- If final validation exposes a defect, only the smallest fix needed to preserve already-documented `V1` behavior is in scope for CP17. Feature requests, opportunistic refactors, and non-blocking cleanup become separate follow-ups.
- Manual VS Code and Visual Studio launch verification remain mandatory release evidence. CP17 may summarize or consolidate that evidence, but it cannot replace it with script-only claims.
- `docs/05-taskboard/tasks/T-0032-cp17-release-preparation-and-reviewer-snapshot.md` is the CP17 task file, and `docs/05-taskboard/work-queue.md` remains the active-board surface that must stay in sync with CP17 status.
- Release notes, changelog entries, reviewer docs, and other committed artifacts must describe shipped behavior only. No private-path references, aspirational future-state language, or unstaged roadmap claims belong in the release cut.

## Critic Findings Disposition

- `B1` Accepted. The plan now locks prose `V1` and recommended tag `v1.0.0` at scope-lock time and requires consistent propagation across release-facing docs.
- `B2` Accepted. The plan now locks `CHANGELOG.md` to a dated `## [V1] - YYYY-MM-DD` cut with a fresh empty `## Unreleased`, and it commits to a release-summary rewrite instead of leaving dual changelog patterns half-applied.
- `B3` Accepted. The plan now retains `scripts/run-root-host-e2e.ps1` through `V1` as a frozen historical compatibility shim and treats any retirement as post-`V1` follow-up work.
- `B4` Accepted. The plan now adds the AI lane and reviewer AI references to the step 1 reconciliation pass, explicitly labels AI material as post-`V1` or deferred, and rejects any CP17 AI implementation.
- `B5` Accepted. The plan now defers live public-demo operation as a release gate and narrows deployment/runbook work to supported-topology accuracy, clean-checkout reproducibility, and rollback clarity.
- `B6` Accepted. The plan now locks `docs/95-delivery/release-workflow.md` and `docs/95-delivery/release-checklist.md` as distinct canonical release artifacts.
- `B7` Accepted. The plan now makes `docs/95-delivery/release-checklist.md` `Release Readiness` the canonical taggable signal, mirrored in the CP17 release artifact and checkpoint ledger.
- `NB-1` Accepted. The reviewer walkthrough acceptance and validation steps are tightened to cover impersonation downgrade, stop-without-root-host-round-trip, authenticated `429` plus `Retry-After`, and spoofed-host rejection.
- `NB-2` Accepted. The release checklist is now treated as a public seam; if CP17 changes validator behavior, the work starts from a failing checklist-structure assertion in `validate-docs.ps1`.
- `NB-3` Accepted. The validation plan now includes an early `validate-docs.ps1` pass immediately after the step 1 reconciliation pass, in addition to the final pass.
- `NB-4` Accepted. The plan now locks the CP17 taskboard artifact to `docs/05-taskboard/tasks/T-0032-cp17-release-preparation-and-reviewer-snapshot.md` and includes `docs/05-taskboard/work-queue.md` in the tracked touch points.
- `NB-5` Accepted. `docs/00-intent/canonical-decisions.md` is now in the step 1 reconciliation set instead of being conditionally touched later.
- `NB-6` Accepted. The validation plan now includes a programmatic private-path leakage guard over reviewer-facing release artifacts while keeping committed docs generic about local-only sources.
- `NB-7` Accepted. `review/scaling-considerations.md` and `review/future-evolution.md` are now explicit members of the reviewer-doc reconciliation pass.
- `NB-8` Accepted. The validation plan now states that `Launch Frontend Dev Server` remains VS Code-only and its absence from the Visual Studio list is intentional.

## Planned Work

1. Reconcile the CP17 release boundary before broad edits. This blocking pass must align `docs/55-execution/execution-plan.md`, `docs/55-execution/phases/phase-5-hardening-release.md`, `docs/55-execution/checkpoint-status.md`, `docs/95-delivery/staging-and-versioning.md`, `docs/95-delivery/release-workflow.md`, `docs/95-delivery/release-checklist.md`, `docs/95-delivery/README.md`, `README.md`, `REVIEWERS.md`, `CHANGELOG.md`, `docs/00-intent/success-criteria.md`, `docs/00-intent/canonical-decisions.md`, `docs/70-operations/runbook-local.md`, `docs/70-operations/runbook-prod.md`, `docs/70-operations/deployment.md`, `docs/80-testing/test-strategy.md`, `docs/80-testing/testing-standards.md`, `docs/80-testing/e2e-tests.md`, `docs/60-ai/README.md`, `docs/60-ai/ai-features-v1.md`, `docs/60-ai/ai-subsystem-overview.md`, `docs/60-ai/ai-architecture.md`, `review/README.md`, `review/architecture-overview.md`, `review/multi-tenancy-diagram.md`, `review/request-lifecycle.md`, `review/security-model-summary.md`, `review/user-flows.md`, `review/system-architecture-diagram.md`, `review/domain-model-diagram.md`, `review/scaling-considerations.md`, `review/future-evolution.md`, `review/ai-surface-map.md`, `docs/05-taskboard/tasks/T-0032-cp17-release-preparation-and-reviewer-snapshot.md`, `docs/05-taskboard/work-queue.md`, `docs/ai-index.md`, and `docs/repo-map.json` on:
   - what `taggable as V1` means for PaperBinder
   - the locked `V1` / `v1.0.0` identifier pair and the `CHANGELOG.md` cut shape that uses it
   - which artifacts are required for the final release cut
   - the exact clean-checkout validation bundle and how it differs from routine checkpoint validation
   - the final reviewer walkthrough flow and recommended review order
   - deployment, verification, and rollback notes that the public repo can credibly support without making a live public-demo host part of the release gate
   - the explicit `V1` posture for the AI lane and reviewer AI references
   - stale checkpoint language that should be removed now that CP16 is done and CP17 is the release cut
2. Finalize the release artifact set:
   - update `CHANGELOG.md` into the locked `## [V1] - YYYY-MM-DD` release cut with a fresh empty `## Unreleased`
   - add or refresh the CP17 delivery artifact in the CP17 delivery folder under `docs/95-delivery/pr/cp17-release-preparation-and-reviewer-snapshot/`
   - add or refresh `docs/95-delivery/release-workflow.md` and `docs/95-delivery/release-checklist.md`
   - record shipped scope, explicit deferrals, release validation evidence, rollout and rollback notes, the recommended reviewer walkthrough, and the executor-attested `Release Readiness` signal in the canonical release artifacts
3. Finalize the deployment and validation story against the actual repo surface:
   - reconcile `README.md`, `docs/70-operations/runbook-local.md`, `docs/70-operations/runbook-prod.md`, and `docs/70-operations/deployment.md` with the current script, Compose, launch-profile, browser-gate, and rollback model
   - remove or rewrite wording that implies a live public-demo host is required evidence for the `V1` cut
   - tighten any thin script or docs gaps uncovered while proving the canonical command set from a fresh checkout
   - keep rollback guidance aligned to the current migrations-first Docker Compose model rather than introducing speculative release automation
4. Refresh the reviewer snapshot:
   - update `REVIEWERS.md` and the reviewer summaries under `review/` so the 10-15 minute path matches the shipped root-host, tenant-host, impersonation, lease, rate-limit, host-validation, and logout behavior
   - remove reviewer-path AI references that imply shipped `V1` AI behavior, or relabel them explicitly as post-`V1` context
   - refresh diagrams and walkthrough copy only where the current docs drift from the actual runtime or over-explain superseded checkpoint staging, including `review/scaling-considerations.md` and `review/future-evolution.md`
   - keep reviewer docs concise and source-backed instead of duplicating canonical docs
5. Run final clean-checkout validation and resolve release-blocking drift only:
   - execute the full scripted bundle from a fresh local checkout or worktree
   - complete the final manual reviewer walkthrough plus manual VS Code and Visual Studio launch verification
   - fix only packaging, docs, or minimal runtime issues that block V1 release readiness
6. Reconcile navigation and execution metadata in the same change set:
   - update `docs/ai-index.md` and `docs/repo-map.json`
   - update CP17 delivery docs, `docs/55-execution/checkpoint-status.md`, `docs/05-taskboard/tasks/T-0032-cp17-release-preparation-and-reviewer-snapshot.md`, and `docs/05-taskboard/work-queue.md` once the release artifact and validation evidence exist

## Open Decisions

None at scope-lock. The critic-review findings are resolved in this plan. Any uncertainty discovered during execution must be recorded as either a release-blocking issue, an explicit post-`V1` deferral, or an owner-controlled decision outside executor scope.

## Vertical-Slice TDD Plan

CP17 is documentation-heavy, but any behavior-changing script, validator, or workflow change must still follow `RED -> GREEN -> REFACTOR`. Docs-only reconciliation does not require synthetic tests; script or command-surface changes do.

Public seams under test:
- the release workflow, release checklist, and release artifact surfaces under `docs/95-delivery/`
- the locked `V1` / `v1.0.0` release identifier and release-readiness signal propagated across release-facing docs
- the repo-native validation command surface (`scripts/*.ps1`) as documented by operations and delivery docs
- the reviewer startup and walkthrough path documented in `README.md`, `REVIEWERS.md`, and `review/`
- the reviewer-facing and canonical-document claim surface that must not present AI behavior as shipped `V1` functionality
- clean-checkout reproducibility of the candidate release revision

Planned `RED -> GREEN -> REFACTOR` slices:

1. `RED`: `Should_FailReleaseChecklistValidation_When_ReleaseChecklist_Is_Missing_Required_Sections_Script_Links_Or_ReleaseReadiness_Signal`
   `GREEN`: add the smallest release checklist and workflow artifact set that names every required release gate, output artifact, manual verification dependency, required script link, and the canonical `Release Readiness` signal.
   `REFACTOR`: centralize repeated command and evidence wording so the checklist, release artifact, and runbooks do not drift.
2. `RED`: `Should_ReproduceCanonicalValidationBundle_From_FreshCheckout_Using_Only_DocumentedCommands`
   `GREEN`: tighten the minimal docs or script surface needed so a fresh local checkout or worktree can run the canonical restore, build, test, browser, docs, launch-profile, and checkpoint bundle successfully.
   `REFACTOR`: remove duplicate command lists and point the release docs at one canonical command source where possible.
3. `RED`: `Should_ReproduceReviewerWalkthrough_From_ReviewerFullStack_And_CurrentReviewDocs`
   `GREEN`: refresh `REVIEWERS.md` plus the core `review/` summaries so the documented walkthrough matches the shipped browser and code-review path, including impersonation downgrade, stop behavior, rate-limit observation, and spoofed-host rejection.
   `REFACTOR`: trim duplicate reviewer explanations and keep one owner per claim.
4. `RED`: `Should_KeepDeploymentVerificationAndRollbackNotes_Aligned_With_CurrentComposeAndMigrationWorkflow`
   `GREEN`: update deployment and runbook docs, and only the smallest supporting script or docs adjustments, so deploy, verify, and rollback instructions match the actual repo without making a live public-demo host a release blocker.
   `REFACTOR`: consolidate duplicated deployment or rollback references behind the canonical operations docs.
5. `RED`: `Should_RecordReleaseReadiness_Only_When_V1_Identifier_Closeout_Evidence_And_ManualLaunchResults_Are_Present`
   `GREEN`: finalize the CP17 release artifact, changelog, release checklist `Release Readiness` section, checkpoint status, and taskboard state using the actual validation outcomes from the candidate release run.
   `REFACTOR`: keep closeout evidence concise by linking to canonical commands and reviewer docs instead of repeating them verbatim.

CP17 should land in small release-prep slices rather than one large documentation dump. If a slice uncovers real runtime drift, fix only the smallest blocker before returning to the release artifact.

## Acceptance Criteria

- CP17 stays locked to release preparation and reviewer snapshot work for the already-shipped `V1` system; no new end-user features, architecture changes, or non-goal expansion land under the release checkpoint.
- Release-facing docs use the locked prose label `V1` and recommended tag spelling `v1.0.0` consistently across `CHANGELOG.md`, the CP17 release artifact, `docs/95-delivery/release-workflow.md`, `docs/95-delivery/release-checklist.md`, `README.md`, `REVIEWERS.md`, `docs/55-execution/checkpoint-status.md`, and `docs/05-taskboard/tasks/T-0032-cp17-release-preparation-and-reviewer-snapshot.md`.
- `CHANGELOG.md` is cut as `## [V1] - YYYY-MM-DD` with a fresh empty `## Unreleased` above it, and the release view uses one consistent summary pattern instead of mixing checkpoint-accumulator and release-summary structures.
- `docs/95-delivery/release-workflow.md` and `docs/95-delivery/release-checklist.md` exist as distinct canonical release docs, link to each other, and agree with `docs/95-delivery/staging-and-versioning.md`, the actual script surface, and the CP17 delivery artifact.
- `docs/95-delivery/release-checklist.md` `Release Readiness` section records the executor-attested release-readiness signal, the CP17 release artifact mirrors it under `Validation Evidence`, and `docs/55-execution/checkpoint-status.md` CP17 row notes link to both.
- The CP17 release artifact exists in `docs/95-delivery/pr/cp17-release-preparation-and-reviewer-snapshot/` and provides:
  - shipped scope summary
  - explicit out-of-scope or deferred items
  - rollout and rollback notes
  - validation evidence
  - the recommended reviewer walkthrough
  - why the release is reviewer-ready
- `scripts/run-root-host-e2e.ps1` remains present as a frozen historical compatibility shim through `V1`, and the release docs make that posture explicit.
- `README.md`, `REVIEWERS.md`, `review/README.md`, and the reviewer core docs no longer contain stale checkpoint staging or pre-CP16 caveats that would misdescribe the shipped system.
- No reviewer-facing or canonical doc claims that an AI feature ships in `V1`; AI material is explicitly labeled post-`V1` or deferred, and reviewer optional-read paths do not present AI as shipped functionality.
- The recommended reviewer walkthrough is reproducible from documented steps and covers:
  - root-host provisioning or login
  - tenant-host dashboard, binder, and document flow
  - policy or user-management behavior
  - impersonation start with a visibly downgraded effective experience
  - impersonation stop without a root-host login round-trip
  - lease visibility or extension behavior
  - authenticated mutation rate-limit observation with `429` plus `Retry-After`
  - spoofed-host rejection at the host-validation boundary
  - logout return to the root host
  - the fastest code and doc review order for architectural discussion
- `docs/70-operations/runbook-local.md`, `docs/70-operations/runbook-prod.md`, and `docs/70-operations/deployment.md` align with the current single-host Docker Compose runtime, migrations workflow, validation commands, and rollback expectations, with no stale or aspirational release automation claims and no wording that implies a live public-demo host is part of the release-blocking evidence set.
- Final clean-checkout validation runs from a fresh local checkout or worktree of the candidate revision and records successful results for:
  - `preflight.ps1`
  - `restore.ps1`
  - `build.ps1`
  - `test.ps1 -Configuration Release -DockerIntegrationMode Require`
  - `run-browser-e2e.ps1`
  - `validate-docs.ps1`
  - `validate-launch-profiles.ps1`
  - `validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require`
- Final manual verification evidence is recorded for the canonical reviewer flow and every checked-in VS Code and Visual Studio launch surface required by `docs/70-operations/runbook-local.md`, with `Launch Frontend Dev Server` explicitly documented as VS Code-only.
- Any release-blocking issues discovered during the clean-checkout run are fixed in the smallest possible way, and any non-blocking discoveries are explicitly deferred rather than silently absorbed into CP17.
- No committed artifact in the CP17 release-prep diff contains private-path leakage or other local-only sibling-repo references.
- Historical delivery artifacts remain path-valid and documentation integrity remains green; CP17 does not break archived checkpoint references while preparing the release cut.
- `docs/ai-index.md` and `docs/repo-map.json` are updated for any new CP17 or release-checklist artifacts added in this checkpoint.
- `docs/55-execution/checkpoint-status.md`, `docs/05-taskboard/tasks/T-0032-cp17-release-preparation-and-reviewer-snapshot.md`, and `docs/05-taskboard/work-queue.md` reflect the true release readiness state once validation evidence is recorded.
- `main` is documented as taggable for `V1` by the end of CP17 via the locked `Release Readiness` signal, while the actual merge or tag action remains outside executor scope.

## Validation Plan

- pre-implementation scope-lock review that `docs/55-execution/execution-plan.md`, `docs/55-execution/phases/phase-5-hardening-release.md`, `docs/55-execution/checkpoint-status.md`, `docs/95-delivery/staging-and-versioning.md`, `docs/95-delivery/release-workflow.md`, `docs/95-delivery/release-checklist.md`, `README.md`, `REVIEWERS.md`, `CHANGELOG.md`, `docs/00-intent/success-criteria.md`, `docs/00-intent/canonical-decisions.md`, `docs/70-operations/runbook-local.md`, `docs/70-operations/runbook-prod.md`, `docs/70-operations/deployment.md`, `docs/80-testing/test-strategy.md`, `docs/80-testing/testing-standards.md`, `docs/80-testing/e2e-tests.md`, `docs/60-ai/README.md`, `docs/60-ai/ai-features-v1.md`, `docs/60-ai/ai-subsystem-overview.md`, `docs/60-ai/ai-architecture.md`, `review/README.md`, the core `review/` docs, `review/scaling-considerations.md`, `review/future-evolution.md`, `docs/05-taskboard/tasks/T-0032-cp17-release-preparation-and-reviewer-snapshot.md`, `docs/05-taskboard/work-queue.md`, `docs/ai-index.md`, and `docs/repo-map.json` agree on the CP17 release story before broad edits begin
- targeted static review or grep for stale checkpoint or future-state language in release or reviewer docs, including terms like `later-checkpoint`, `placeholder`, obsolete CP-stage references, stale hardening caveats, or claims that AI behavior ships in `V1`
- if CP17 adds or changes any script or validator behavior, start with a failing script-level or integration-style check from the affected public seam before implementing the change; for the release-checklist seam, prefer a failing `validate-docs.ps1` assertion that the checklist file exists, contains the required section headers, and links to the canonical validation scripts
- early `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` pass immediately after the step 1 reconciliation set lands
- clean-checkout validation from a fresh local checkout or worktree of the candidate revision using the documented command bundle:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\preflight.ps1 -Profile Full`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\restore.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\run-browser-e2e.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require`
- manual reviewer walkthrough from the canonical local stack covering root-host onboarding or login, tenant-host binder or document flow, a role- or policy-sensitive path, impersonation start with downgraded effective experience, impersonation stop without a root-host login round-trip, lease visibility or extension, authenticated `429` plus `Retry-After`, spoofed-host rejection, and logout back to the root host
- manual VS Code verification for:
  - `Reviewer Full Stack`
  - `App + Worker (Process)`
  - `API Only`
  - `UI Only`
  - `Worker Only`
  - `Launch Frontend Dev Server`
- manual Visual Studio verification for:
  - `Reviewer Full Stack`
  - `App + Worker (Process)`
  - `API Only`
  - `UI Only`
  - `Worker Only`
  - or the documented project-profile fallback when shared solution launch profiles are unavailable
- note explicitly in the validation evidence that `Launch Frontend Dev Server` is intentionally VS Code-only and therefore absent from the Visual Studio verification list
- programmatic private-path leakage guard over `README.md`, `REVIEWERS.md`, `review/`, `CHANGELOG.md`, `docs/95-delivery/release-workflow.md`, `docs/95-delivery/release-checklist.md`, the CP17 release artifact, and the CP17 task file so reviewer-facing release artifacts cannot carry local-only sibling-repo references
- static review that any historical compatibility decision around `scripts/run-root-host-e2e.ps1` is explicit and does not leave broken references in archived delivery docs
- acceptance-criteria traceability review that every CP17 acceptance criterion maps to at least one automated check, docs-validation check, or explicit manual verification step
- final `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` pass after all CP17 artifact, AI-lane, reviewer-doc, and taskboard updates
- final diff review that CP17 changed only release-prep, reviewer-snapshot, or minimum release-blocking material and did not absorb unrelated backlog work

## Likely Touch Points

- `CHANGELOG.md`
- `README.md`
- `REVIEWERS.md`
- `review/README.md`
- `review/architecture-overview.md`
- `review/ai-surface-map.md`
- `review/multi-tenancy-diagram.md`
- `review/request-lifecycle.md`
- `review/security-model-summary.md`
- `review/user-flows.md`
- `review/scaling-considerations.md`
- `review/future-evolution.md`
- `review/system-architecture-diagram.md` and `review/domain-model-diagram.md` if the shipped topology or domain snapshot needs a final refresh
- `docs/55-execution/checkpoint-status.md`
- `docs/55-execution/phases/phase-5-hardening-release.md`
- `docs/95-delivery/README.md`
- `docs/95-delivery/staging-and-versioning.md`
- `docs/95-delivery/release-workflow.md`
- `docs/95-delivery/release-checklist.md`
- the CP17 delivery folder under `docs/95-delivery/pr/cp17-release-preparation-and-reviewer-snapshot/`
- `docs/95-delivery/pr/cp17-release-preparation-and-reviewer-snapshot/implementation-plan.md`
- `docs/60-ai/README.md`
- `docs/60-ai/ai-subsystem-overview.md`
- `docs/60-ai/ai-architecture.md`
- `docs/60-ai/ai-features-v1.md`
- `docs/70-operations/runbook-local.md`
- `docs/70-operations/runbook-prod.md`
- `docs/70-operations/deployment.md`
- `docs/80-testing/test-strategy.md`
- `docs/80-testing/testing-standards.md`
- `docs/80-testing/e2e-tests.md`
- `docs/00-intent/success-criteria.md`
- `docs/00-intent/canonical-decisions.md`
- `scripts/preflight.ps1`
- `scripts/restore.ps1`
- `scripts/build.ps1`
- `scripts/test.ps1`
- `scripts/run-browser-e2e.ps1`
- `scripts/run-root-host-e2e.ps1`
- `scripts/validate-docs.ps1`
- `scripts/validate-launch-profiles.ps1`
- `scripts/validate-checkpoint.ps1`
- `scripts/reviewer-full-stack.ps1`
- `docs/05-taskboard/tasks/T-0032-cp17-release-preparation-and-reviewer-snapshot.md`
- `docs/05-taskboard/work-queue.md`
- `docs/ai-index.md`
- `docs/repo-map.json`

## ADR Triggers And Boundary Risks

- ADR trigger: changing the single-host Docker Compose deployment model, the release or distribution format, or the reviewer-delivery medium in a way that becomes a new long-lived public contract.
- ADR trigger: adding a new third-party dependency, release automation service, or generated reviewer site just to package CP17.
- Boundary risk: CP17 can become a backlog drain if every minor polish item discovered during final validation is treated as release scope instead of triaged into release-blocking versus follow-up work.
- Boundary risk: clean-checkout validation can conflate repo defects with local environment restrictions. Record restricted-environment failures precisely and fix only genuine repository or documentation issues.
- Boundary risk: reviewer docs can drift into duplicated canonical-doc content or marketing copy. Keep them concise, reviewer-oriented, and anchored to the canonical docs.
- Boundary risk: the AI lane currently reads more shipped than the implementation warrants. Reclassify it as post-`V1` or deferred only; any attempt to add real AI behavior in CP17 is scope bleed.
- Boundary risk: deployment docs can accidentally imply that a live public-demo host is required release evidence. Keep the `V1` release gate anchored to clean-checkout reproducibility and documented topology, not live-host operation.
- Boundary risk: changing validation commands or introducing wrapper scripts can create a second undocumented command surface unless every reference is updated in the same change set.
- Boundary risk: historical artifact cleanup, especially around old browser-gate references, can silently break docs validation or archived delivery evidence if done as a broad sweep.
- Boundary risk: release notes, rollback docs, reviewer walkthrough material, and release-prep artifacts must not mention local-only or private paths or leak non-public reasoning.
- Boundary risk: the owner/executor boundary matters at release time; CP17 should prepare a taggable release cut, not silently take merge or tag actions on its own.
