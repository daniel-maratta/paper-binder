# Release Checklist
Status: Current (`V1`)

## Purpose

Own the canonical release gate list for the published stable `V1` release and the handoff shape for the active V1.1 release candidate.

## Required Artifacts

- [x] `CHANGELOG.md` contains the current `## [1.0.5] - 2026-07-03` published stable entry above the historical `## [V1] - 2026-04-19` first-cut release summary, with active V1.1 release-candidate notes under `## Unreleased`.
- [x] `docs/95-delivery/release-workflow.md` and `docs/95-delivery/release-checklist.md` agree on the `V1` release line, the published stable tag, the active branch metadata distinction, the command surface, and ownership.
- [x] Repository version metadata matched the current published stable `V1` release tag `v1.0.5` / `1.0.5` on `main` for that release cut; the active V1.1 branch now stages `1.1.0` metadata for final close-out.
- [x] `.github/workflows/ci.yml` validates version metadata on pull requests and pushes to `main`.
- [x] `.github/workflows/release.yml` defines the tag-driven release validation pipeline for stable SemVer tags.
- [x] `docs/archive/v1/checkpoints/pr/cp17-release-preparation-and-reviewer-snapshot/description.md` records shipped scope, validation evidence, reviewer walkthrough, and author notes for the critic.
- [x] `README.md`, `REVIEWERS.md`, `review/`, `docs/60-ai/`, operations docs, testing docs, taskboard state, and checkpoint ledger describe the shipped `V1` system only.

## Scripted Validation

- [x] Fresh candidate clone bootstrapped `.env` from `.env.example` before Docker-backed commands on `2026-04-19`.
- [x] Current stable-tag candidate validation reran from the active workspace on `2026-06-26`.
- [x] Current stable-tag candidate validation reran from the active workspace on `2026-07-02`.
- [x] Current stable-tag candidate validation reran from the active workspace on `2026-07-03`.
- [x] [preflight.ps1](../../scripts/preflight.ps1) `-Profile Full` passed on `2026-04-19`.
- [x] [restore.ps1](../../scripts/restore.ps1) passed on `2026-04-19`.
- [x] [validate-version.ps1](../../scripts/validate-version.ps1) is part of CI and release validation and passed for `1.0.1` on `2026-06-26`.
- [x] [validate-version.ps1](../../scripts/validate-version.ps1) passed for `1.0.2` on `2026-07-02`.
- [x] [validate-version.ps1](../../scripts/validate-version.ps1) passed for `1.0.3` on `2026-07-02`.
- [x] [validate-version.ps1](../../scripts/validate-version.ps1) passed for `1.0.4` on `2026-07-02`.
- [x] [validate-version.ps1](../../scripts/validate-version.ps1) passed for `1.0.5` on `2026-07-03`.
- [x] [build.ps1](../../scripts/build.ps1) `-Configuration Release` passed on `2026-04-19`.
- [x] [build.ps1](../../scripts/build.ps1) passed again on `2026-06-26` after the `1.0.1` metadata and release-doc alignment pass.
- [x] `dotnet build PaperBinder.sln -c Release --no-restore -p:SkipFrontendBuild=true -v minimal` passed on `2026-07-02` after the `1.0.2` release-bump alignment pass.
- [x] `dotnet build PaperBinder.sln -c Release --no-restore -p:SkipFrontendBuild=true -v minimal` passed on `2026-07-02` after the `1.0.3` release-bump alignment pass.
- [x] `dotnet build PaperBinder.sln -c Release --no-restore -p:SkipFrontendBuild=true -v minimal` passed on `2026-07-02` after the `1.0.4` release-bump alignment pass.
- [x] `dotnet build PaperBinder.sln -c Release --no-restore -p:SkipFrontendBuild=true -v minimal` passed on `2026-07-03` after the `1.0.5` release-bump alignment pass.
- [x] [test.ps1](../../scripts/test.ps1) `-Configuration Release -DockerIntegrationMode Require` passed on `2026-04-19`.
- [x] [test.ps1](../../scripts/test.ps1) passed again on `2026-06-26`; Docker-backed integration coverage remained skipped locally because Docker was unavailable.
- [x] [run-browser-e2e.ps1](../../scripts/run-browser-e2e.ps1) passed on `2026-04-19`.
- [x] [validate-docs.ps1](../../scripts/validate-docs.ps1) passed on `2026-04-19`.
- [x] [validate-docs.ps1](../../scripts/validate-docs.ps1) passed again on `2026-04-20` after the post-implementation CP17 closeout updates.
- [x] [validate-docs.ps1](../../scripts/validate-docs.ps1) passed again on `2026-06-26` after the `1.0.1` version and delivery-doc refresh.
- [x] [validate-docs.ps1](../../scripts/validate-docs.ps1) passed again on `2026-07-02` after the `1.0.2` version and delivery-doc refresh.
- [x] [validate-docs.ps1](../../scripts/validate-docs.ps1) passed again on `2026-07-02` after the `1.0.3` version and delivery-doc refresh.
- [x] [validate-docs.ps1](../../scripts/validate-docs.ps1) passed again on `2026-07-02` after the `1.0.4` version and delivery-doc refresh.
- [x] [validate-docs.ps1](../../scripts/validate-docs.ps1) passed again on `2026-07-03` after the `1.0.5` version and delivery-doc refresh.
- [x] [validate-launch-profiles.ps1](../../scripts/validate-launch-profiles.ps1) passed on `2026-04-19`.
- [x] [validate-checkpoint.ps1](../../scripts/validate-checkpoint.ps1) `-Configuration Release -DockerIntegrationMode Require` passed on `2026-04-19`.
- [x] [reviewer-full-stack.ps1](../../scripts/reviewer-full-stack.ps1) `-NoBrowser` release smoke passed on `2026-04-19`.
- [x] [validate-docs.ps1](../../scripts/validate-docs.ps1) passed on `2026-07-26` for the `T-0043` `v1.1.0` final close-out pass on branch review/v1.1.0-final (commit `58f6172`).
- [x] [build.ps1](../../scripts/build.ps1) `-Configuration Release` passed on `2026-07-26` for the `T-0043` `v1.1.0` final close-out pass — `0 Warning(s), 0 Error(s)`.
- [x] [validate-version.ps1](../../scripts/validate-version.ps1) passed for `1.1.0` on `2026-07-26` as part of the `T-0043` close-out pass.
- [x] [test.ps1](../../scripts/test.ps1) `-Configuration Release -DockerIntegrationMode Require` passed on `2026-07-26` for the `T-0043` close-out pass: `64/64` frontend, `142/142` unit, `32/32` non-Docker integration, `102/102` Docker-backed integration — all green.
- [x] [run-browser-e2e.ps1](../../scripts/run-browser-e2e.ps1) passed on `2026-07-26` for the `T-0043` close-out pass: `e2e/root-host.spec.ts` `3/3`, `e2e/tenant-host.spec.ts` `3/3`.
- [x] [reviewer-full-stack.ps1](../../scripts/reviewer-full-stack.ps1) `-NoBrowser` passed on `2026-07-26` for the `T-0043` close-out pass: `app`/`db`/`proxy`/`worker` came up healthy, health endpoints reachable, worker completed a clean lease-cleanup cycle; stack torn down afterward.
- [x] [validate-no-tracked-secrets.ps1](../../scripts/validate-no-tracked-secrets.ps1) added and passed on `2026-07-27` on branch review/v1.1.0-rc2-remediation, confirming the removed local Data Protection key material stays untracked.
- [x] [build.ps1](../../scripts/build.ps1) `-Configuration Release` passed on `2026-07-27` for the hiring-review remediation pass — `0 Warning(s), 0 Error(s)`.
- [x] [test.ps1](../../scripts/test.ps1) `-Configuration Release -DockerIntegrationMode Require` passed on `2026-07-27` for the hiring-review remediation pass: `64/64` frontend, `142/142` unit, `33/33` non-Docker integration (new security-response-headers test added), `102/102` Docker-backed integration — all green.
- [x] `dotnet list PaperBinder.sln package --vulnerable --include-transitive` and `npm audit --audit-level=moderate` re-run fresh on `2026-07-27` — see Dependency / Vulnerability Disposition below.
- [x] [validate-docs.ps1](../../scripts/validate-docs.ps1) passed on `2026-07-27` after the hiring-review remediation pass (key-material removal, security headers, archive/unarchive reviewer note, dependency-audit refresh).
- [x] `.github/workflows/release.yml` succeeded for `v1.0.1` from commit `63025570f3c259e5116a0e1064cb70cdc11721d3` on `2026-06-28`.
- [x] `.github/workflows/deploy-test.yml` succeeded for `1.0.1` from commit `63025570f3c259e5116a0e1064cb70cdc11721d3` on `2026-06-29`.
- [x] `.github/workflows/deploy-prod.yml` succeeded for `1.0.1` from commit `63025570f3c259e5116a0e1064cb70cdc11721d3` on `2026-06-29`.
- [x] `.github/workflows/release.yml` succeeded for `v1.0.2` from commit `fc7cc9878d3d84c2196e3dcdf4b61e33e48cfb1b` on `2026-07-02`.
- [x] `.github/workflows/deploy-test.yml` succeeded for `1.0.2` from commit `fc7cc9878d3d84c2196e3dcdf4b61e33e48cfb1b` on `2026-07-02`.
- [x] `.github/workflows/deploy-prod.yml` succeeded for `1.0.2` from commit `fc7cc9878d3d84c2196e3dcdf4b61e33e48cfb1b` on `2026-07-02`.
- [x] `.github/workflows/release.yml` succeeded for `v1.0.3` from commit `781bc9ce11bb60b1d89e72b0f53cf1f158241bdb` on `2026-07-02`.
- [x] `.github/workflows/release.yml` failed for `v1.0.4` from commit `39a7bcc83613d1565c60a5d44f683dbb09358f43` on `2026-07-02` in `validate-release` before image publishing because the Docker-backed trace-correlation gate asserted before the expected request activity was visible to the listener.

## Manual Verification

- [x] Reviewer walkthrough coverage is represented by the `2026-04-19` candidate-release browser suite plus the refreshed manual IDE launch verification recorded on `2026-04-20`.
- [x] VS Code manual launch verification completed and passed on `2026-04-20`.
- [x] Visual Studio manual launch verification completed and passed on `2026-04-20`.
- [x] `Launch Frontend Dev Server` is recorded explicitly as VS Code-only.
- [x] Shared-test runtime parity now reflects the deployed `1.0.2` app, worker, proxy, and database after the successful `2026-07-02` rollout.
- [x] Production runtime parity now reflects the deployed `1.0.2` app, worker, proxy, and database after the successful `2026-07-02` rollout.
- [x] GitHub Releases `v1.0.0`, `v1.0.1`, and `v1.0.2` were published by `2026-07-02`.

## Documentation Integrity

- [x] `scripts/run-root-host-e2e.ps1` remains documented as a historical compatibility shim through `V1`.
- [x] Reviewer-facing and release-facing local links resolve inside this repository only.
- [x] `docs/ai-index.md` and `docs/repo-map.json` include the CP17 release docs, task file, and release artifact.

## V1.1.0 Final Release Evidence (T-0043)

This section is the `T-0043` final staff review / release close-out evidence record. It extends the
gate list above with the v1.1.0-specific evidence `T-0043`'s acceptance criteria require; it does
not replace the historical `V1` sections above.

### PRs Merged Into `release/v1.1.0`

- [x] PR 1 baseline/review infrastructure — merged (`T-0044`, PR #45).
- [x] PR 2 engineering/security/architecture review — merged (`T-0045`, PR #46).
- [x] PR 3 product/responsive/accessibility review — merged (`T-0041`/`T-0039`, PR #47).
- [x] PR 4 RC1 independent acceptance and residual remediation — merged (PR #48).
- [x] PR 4.5 documentation canonicality / engineering-truth alignment — merged (PR #49).
- [ ] PR 5 (this `T-0043` close-out pass, branch review/v1.1.0-final) — **not yet opened/merged; owner-controlled.**

### Findings Disposition (`T-0044` / `T-0045` / `T-0041`)

- [x] `T-0044` (release baseline): recording-only task, no remediation scope; done.
- [x] `T-0045` (engineering/security/architecture): done. Zero Critical/High findings. F1, F2, F4, F7,
  F9 fixed; F3 (archive/unarchive UI) and F5 (React Router 7→8 migration) durably deferred with
  recorded owner decisions in `docs/05-taskboard/v1-1-backlog.md`; remaining Low/Informational
  findings (F6, F8, F10–F20) tracked with no action required in this task's scope, except F20 (cheap
  follow-up, not urgent).
- [x] `T-0041` (accessibility/responsive QA): done. 11 findings (3 release-blocking, 4 medium, 4 low)
  found via live browser verification against the isolated Docker E2E stack, all fixed (none
  deferred), each independently re-verified live after landing.
- [x] Two residuals surfaced during independent RC1 verification (2026-07-25) — markdown H4–H6
  heading compression and the dashboard summary-grid `1024px`/`1023px` breakpoint overlap — were
  both resolved during Phase 4 RC remediation (commits `47fc383`, `2367507`) and confirmed resolved
  in `d33fcfc`.
- [x] No unresolved High/Critical finding remains from `T-0044`, `T-0045`, or `T-0041`.

### Dependency / Vulnerability Disposition

- [x] `dotnet list package --vulnerable --include-transitive` — re-run fresh on `2026-07-26` against
  review/v1.1.0-final: zero vulnerable packages across all 8 projects.
- [x] `dotnet list PaperBinder.sln package --vulnerable --include-transitive` — re-run fresh again on
  `2026-07-27` on branch review/v1.1.0-rc2-remediation as part of a hiring-review remediation
  pass: zero vulnerable packages across all 8 projects, unchanged.
- [x] `npm audit --audit-level=moderate` — successfully re-run fresh on `2026-07-27` from
  `src/PaperBinder.Web` (Node 24.13.1 / npm 11.8.0, matching `.nvmrc`/`package.json`), resolving the
  prior session's local gzip-decoding/network limitation recorded below. Result: **7 vulnerabilities
  (2 low, 5 high)**, unchanged from the `T-0045` disposition (`2026-07-24`). Advisory status:
  - `react-router` / `react-router-dom` (production dependency, installed `7.13.2`): the one
    release-relevant advisory. Fix is a major-version migration (7 to 8), not a patch. Durably
    deferred to its own future task per the owner decision recorded in
    `docs/05-taskboard/v1-1-backlog.md`. Manual validation performed: every `<Link to>`/`navigate()`
    call in `src/PaperBinder.Web/src` uses a static route literal or a server-returned tenant-scoped
    resource id (never raw client/URL-param input), and the app's cross-origin redirects (login,
    provisioning, logout) go through `window.location.assign()` outside react-router's navigation
    stack entirely — so the open-redirect/RSC/SSR-hydration/`__manifest`-DoS advisories in this
    range do not apply to this app's plain client-rendered-SPA usage. Future remediation: migrate to
    React Router 8.x in a dedicated task with its own validation pass.
  - `@babel/core`, `esbuild`, `postcss`, `vite`, `undici` (6 of the 7 advisories, `undici` transitive
    via the dev/build toolchain): dev-tooling-only — none are shipped in the built `dist/` output.
    Legitimate to durably defer; no production exposure.
  - Historical note (previous session, `2026-07-26`, branch review/v1.1.0-final): `npm audit` failed
    twice with `npm error audit endpoint returned an error` (local gzip decoding of the registry's
    advisories-bulk response failed) — an environment/network-layer limitation in that execution
    session, not a registry outage or a new advisory. This `2026-07-27` re-run confirms the carried-
    forward disposition was accurate.

### Version Consistency

- [x] `Directory.Build.props` (`VersionPrefix`/`AssemblyVersion`/`FileVersion`), `package.json`, and
  `package-lock.json` all agree on `1.1.0`; `validate-version.ps1` passed on `2026-07-26`.
- [x] `README.md` and `REVIEWERS.md` correctly distinguish the current published stable tag
  (`v1.0.5`) from the pending `v1.1.0` release, which remains untagged and undeployed.
- [x] No active doc claims `v1.1.0` is already tagged or deployed.

### Documentation Synchronization

- [x] PR 4.5's docs-canonicality pass already reconciled engineering-doc claims with implementation;
  this close-out pass found no further drift during validation.

### Remaining Owner-Controlled Steps

- [ ] Merge PR 5 (review/v1.1.0-final) into release/v1.1.0, then merge release/v1.1.0 into
  `main` per repo convention.
- [ ] Create and push the `v1.1.0` SemVer tag (or use the `release.yml` `workflow_dispatch` input),
  which starts `.github/workflows/release.yml`.
- [ ] After tagged-image publishing succeeds, run `.github/workflows/deploy-test.yml`, then
  `.github/workflows/deploy-prod.yml` per `docs/70-operations/deployment.md`.
- [ ] Complete production smoke validation per the Deploy Procedure verification checklist in
  `docs/70-operations/deployment.md`.
- [ ] Publish the tag-driven draft GitHub Release.
- [ ] Record the resulting tag, deploy, and smoke-validation evidence back into this checklist and
  into `T-0043`.

## Release Readiness

- Release line: `V1`
- Historical first stable tag: `v1.0.0`
- Current published stable tag: `v1.0.5`
- Published stable SemVer version: `1.0.5`
- Active branch SemVer metadata: `1.1.0`
- Status: `main` was aligned and taggable for `v1.0.5` as of `2026-07-03`. `release/v1.1.0`
  (commit `58f6172`) has completed `T-0043` final-review validation as of `2026-07-26` — findings
  resolved, full scripted and browser validation green, version metadata consistent, no unresolved
  High/Critical findings — but is **not yet taggable-complete**: PR 5 merge, tag creation, production
  deployment, and production smoke validation remain owner-controlled and have not occurred.
- Executor attestation: `main`, `CHANGELOG.md`, repo version metadata, and current-state delivery
  docs were aligned for `v1.0.5` at that release cut; `release/v1.1.0` now carries validated `1.1.0`
  metadata and this `T-0043` pass records the final pre-tag release attestation. Tag creation and
  deployment remain outstanding and are explicitly not claimed here.
- Deferred follow-up note: `npm ci` still reports one high-severity audit advisory during restore;
  it is disclosed above (`react-router-dom`, `T-0045` finding F5) and durably deferred to its own
  future task; it does not block this validation bundle.
- Owner-controlled actions pending: merge PR 5 into `release/v1.1.0`, merge to `main`, create tag
  `v1.1.0`, run the deploy workflows, complete production smoke validation, and publish the GitHub
  Release. See "Remaining Owner-Controlled Steps" above.
- Mirrors:
  - `docs/archive/v1/checkpoints/pr/cp17-release-preparation-and-reviewer-snapshot/description.md`
  - `docs/archive/v1/checkpoints/checkpoint-status.md`
