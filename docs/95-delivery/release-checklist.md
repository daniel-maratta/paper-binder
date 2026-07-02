# Release Checklist
Status: Current (`V1`)

## Purpose

Own the canonical release gate list for the current stable `V1` release.

## Required Artifacts

- [x] `CHANGELOG.md` contains the current `## [1.0.3] - 2026-07-02` entry above the historical `## [V1] - 2026-04-19` first-cut release summary, with a fresh empty `## Unreleased`.
- [x] `docs/95-delivery/release-workflow.md` and `docs/95-delivery/release-checklist.md` agree on the `V1` release line, the current stable tag, the command surface, and ownership.
- [x] Repository version metadata now matches the current stable `V1` release tag `v1.0.3` / `1.0.3` on `main`.
- [x] `.github/workflows/ci.yml` validates version metadata on pull requests and pushes to `main`.
- [x] `.github/workflows/release.yml` defines the tag-driven release validation pipeline for stable SemVer tags.
- [x] `docs/95-delivery/pr/cp17-release-preparation-and-reviewer-snapshot/description.md` records shipped scope, validation evidence, reviewer walkthrough, and author notes for the critic.
- [x] `README.md`, `REVIEWERS.md`, `review/`, `docs/60-ai/`, operations docs, testing docs, taskboard state, and checkpoint ledger describe the shipped `V1` system only.

## Scripted Validation

- [x] Fresh candidate clone bootstrapped `.env` from `.env.example` before Docker-backed commands on `2026-04-19`.
- [x] Current stable-tag candidate validation reran from the active workspace on `2026-06-26`.
- [x] Current stable-tag candidate validation reran from the active workspace on `2026-07-02`.
- [x] [preflight.ps1](../../scripts/preflight.ps1) `-Profile Full` passed on `2026-04-19`.
- [x] [restore.ps1](../../scripts/restore.ps1) passed on `2026-04-19`.
- [x] [validate-version.ps1](../../scripts/validate-version.ps1) is part of CI and release validation and passed for `1.0.1` on `2026-06-26`.
- [x] [validate-version.ps1](../../scripts/validate-version.ps1) passed for `1.0.2` on `2026-07-02`.
- [x] [validate-version.ps1](../../scripts/validate-version.ps1) passed for `1.0.3` on `2026-07-02`.
- [x] [build.ps1](../../scripts/build.ps1) `-Configuration Release` passed on `2026-04-19`.
- [x] [build.ps1](../../scripts/build.ps1) passed again on `2026-06-26` after the `1.0.1` metadata and release-doc alignment pass.
- [x] `dotnet build PaperBinder.sln -c Release --no-restore -p:SkipFrontendBuild=true -v minimal` passed on `2026-07-02` after the `1.0.2` release-bump alignment pass.
- [x] `dotnet build PaperBinder.sln -c Release --no-restore -p:SkipFrontendBuild=true -v minimal` passed on `2026-07-02` after the `1.0.3` release-bump alignment pass.
- [x] [test.ps1](../../scripts/test.ps1) `-Configuration Release -DockerIntegrationMode Require` passed on `2026-04-19`.
- [x] [test.ps1](../../scripts/test.ps1) passed again on `2026-06-26`; Docker-backed integration coverage remained skipped locally because Docker was unavailable.
- [x] [run-browser-e2e.ps1](../../scripts/run-browser-e2e.ps1) passed on `2026-04-19`.
- [x] [validate-docs.ps1](../../scripts/validate-docs.ps1) passed on `2026-04-19`.
- [x] [validate-docs.ps1](../../scripts/validate-docs.ps1) passed again on `2026-04-20` after the post-implementation CP17 closeout updates.
- [x] [validate-docs.ps1](../../scripts/validate-docs.ps1) passed again on `2026-06-26` after the `1.0.1` version and delivery-doc refresh.
- [x] [validate-docs.ps1](../../scripts/validate-docs.ps1) passed again on `2026-07-02` after the `1.0.2` version and delivery-doc refresh.
- [x] [validate-docs.ps1](../../scripts/validate-docs.ps1) passed again on `2026-07-02` after the `1.0.3` version and delivery-doc refresh.
- [x] [validate-launch-profiles.ps1](../../scripts/validate-launch-profiles.ps1) passed on `2026-04-19`.
- [x] [validate-checkpoint.ps1](../../scripts/validate-checkpoint.ps1) `-Configuration Release -DockerIntegrationMode Require` passed on `2026-04-19`.
- [x] [reviewer-full-stack.ps1](../../scripts/reviewer-full-stack.ps1) `-NoBrowser` release smoke passed on `2026-04-19`.
- [x] `.github/workflows/release.yml` succeeded for `v1.0.1` from commit `63025570f3c259e5116a0e1064cb70cdc11721d3` on `2026-06-28`.
- [x] `.github/workflows/deploy-test.yml` succeeded for `1.0.1` from commit `63025570f3c259e5116a0e1064cb70cdc11721d3` on `2026-06-29`.
- [x] `.github/workflows/deploy-prod.yml` succeeded for `1.0.1` from commit `63025570f3c259e5116a0e1064cb70cdc11721d3` on `2026-06-29`.
- [x] `.github/workflows/release.yml` succeeded for `v1.0.2` from commit `fc7cc9878d3d84c2196e3dcdf4b61e33e48cfb1b` on `2026-07-02`.
- [x] `.github/workflows/deploy-test.yml` succeeded for `1.0.2` from commit `fc7cc9878d3d84c2196e3dcdf4b61e33e48cfb1b` on `2026-07-02`.
- [x] `.github/workflows/deploy-prod.yml` succeeded for `1.0.2` from commit `fc7cc9878d3d84c2196e3dcdf4b61e33e48cfb1b` on `2026-07-02`.

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

## Release Readiness

- Release line: `V1`
- Historical first stable tag: `v1.0.0`
- Current stable tag: `v1.0.3`
- SemVer version: `1.0.3`
- Status: `main` is aligned and taggable for `v1.0.3` as of `2026-07-02`; `v1.0.2` is the last known-good public deployed state after the successful release and deploy workflows on `2026-07-02`.
- Executor attestation: `main`, `CHANGELOG.md`, repo version metadata, and current-state delivery docs are aligned for `v1.0.3`; the `v1.0.2` release and both public environment rollouts have completed successfully, while `v1.0.3` publication and rollout remain pending tag-time automation and owner-invoked deploy workflows.
- Deferred follow-up note: `npm ci` still reports one high-severity audit advisory during restore; it is disclosed in the CP17 release artifact and remains outside CP17 scope because it does not block the documented `V1` validation bundle.
- Owner-controlled action pending: verify the `v1.0.3` release workflow, publish the workflow-created GitHub Release draft when ready, and run the shared-test plus production deploy workflows for `1.0.3`.
- Mirrors:
  - `docs/95-delivery/pr/cp17-release-preparation-and-reviewer-snapshot/description.md`
  - `docs/55-execution/checkpoint-status.md`
