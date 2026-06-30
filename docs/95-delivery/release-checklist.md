# Release Checklist
Status: Current (`V1`)

## Purpose

Own the canonical release gate list for the current stable `V1` release.

## Required Artifacts

- [x] `CHANGELOG.md` contains the current `## [1.0.1] - 2026-06-26` entry above the historical `## [V1] - 2026-04-19` first-cut release summary, with a fresh empty `## Unreleased`.
- [x] `docs/95-delivery/release-workflow.md` and `docs/95-delivery/release-checklist.md` agree on the `V1` release line, the current stable tag, the command surface, and ownership.
- [x] Repository version metadata matched the current stable `V1` release tag `v1.0.1` / `1.0.1` during the latest release workflow run.
- [x] `.github/workflows/ci.yml` validates version metadata on pull requests and pushes to `main`.
- [x] `.github/workflows/release.yml` defines the tag-driven release validation pipeline for stable SemVer tags.
- [x] `docs/95-delivery/pr/cp17-release-preparation-and-reviewer-snapshot/description.md` records shipped scope, validation evidence, reviewer walkthrough, and author notes for the critic.
- [x] `README.md`, `REVIEWERS.md`, `review/`, `docs/60-ai/`, operations docs, testing docs, taskboard state, and checkpoint ledger describe the shipped `V1` system only.

## Scripted Validation

- [x] Fresh candidate clone bootstrapped `.env` from `.env.example` before Docker-backed commands on `2026-04-19`.
- [x] Current stable-tag candidate validation reran from the active workspace on `2026-06-26`.
- [x] [preflight.ps1](../../scripts/preflight.ps1) `-Profile Full` passed on `2026-04-19`.
- [x] [restore.ps1](../../scripts/restore.ps1) passed on `2026-04-19`.
- [x] [validate-version.ps1](../../scripts/validate-version.ps1) is part of CI and release validation and passed for `1.0.1` on `2026-06-26`.
- [x] [build.ps1](../../scripts/build.ps1) `-Configuration Release` passed on `2026-04-19`.
- [x] [build.ps1](../../scripts/build.ps1) passed again on `2026-06-26` after the `1.0.1` metadata and release-doc alignment pass.
- [x] [test.ps1](../../scripts/test.ps1) `-Configuration Release -DockerIntegrationMode Require` passed on `2026-04-19`.
- [x] [test.ps1](../../scripts/test.ps1) passed again on `2026-06-26`; Docker-backed integration coverage remained skipped locally because Docker was unavailable.
- [x] [run-browser-e2e.ps1](../../scripts/run-browser-e2e.ps1) passed on `2026-04-19`.
- [x] [validate-docs.ps1](../../scripts/validate-docs.ps1) passed on `2026-04-19`.
- [x] [validate-docs.ps1](../../scripts/validate-docs.ps1) passed again on `2026-04-20` after the post-implementation CP17 closeout updates.
- [x] [validate-docs.ps1](../../scripts/validate-docs.ps1) passed again on `2026-06-26` after the `1.0.1` version and delivery-doc refresh.
- [x] [validate-launch-profiles.ps1](../../scripts/validate-launch-profiles.ps1) passed on `2026-04-19`.
- [x] [validate-checkpoint.ps1](../../scripts/validate-checkpoint.ps1) `-Configuration Release -DockerIntegrationMode Require` passed on `2026-04-19`.
- [x] [reviewer-full-stack.ps1](../../scripts/reviewer-full-stack.ps1) `-NoBrowser` release smoke passed on `2026-04-19`.
- [x] `.github/workflows/release.yml` succeeded for `v1.0.1` from commit `63025570f3c259e5116a0e1064cb70cdc11721d3` on `2026-06-28`.
- [x] `.github/workflows/deploy-test.yml` succeeded for `1.0.1` from commit `63025570f3c259e5116a0e1064cb70cdc11721d3` on `2026-06-29`.
- [x] `.github/workflows/deploy-prod.yml` succeeded for `1.0.1` from commit `63025570f3c259e5116a0e1064cb70cdc11721d3` on `2026-06-29`.

## Manual Verification

- [x] Reviewer walkthrough coverage is represented by the `2026-04-19` candidate-release browser suite plus the refreshed manual IDE launch verification recorded on `2026-04-20`.
- [x] VS Code manual launch verification completed and passed on `2026-04-20`.
- [x] Visual Studio manual launch verification completed and passed on `2026-04-20`.
- [x] `Launch Frontend Dev Server` is recorded explicitly as VS Code-only.
- [x] Shared-test runtime parity was rechecked on `2026-06-30`; the deployed `1.0.1` app, worker, proxy, and database were healthy, and the persisted Data Protection key XML was verified encrypted at rest.
- [x] Production runtime parity was rechecked on `2026-06-30`; the deployed `1.0.1` app, worker, proxy, and database were healthy, the key-ring rotation completed, and the new persisted Data Protection key XML was verified encrypted at rest.
- [x] GitHub Releases `v1.0.0` and `v1.0.1` were published from their workflow-created draft objects on `2026-06-30`.

## Documentation Integrity

- [x] `scripts/run-root-host-e2e.ps1` remains documented as a historical compatibility shim through `V1`.
- [x] Reviewer-facing and release-facing local links resolve inside this repository only.
- [x] `docs/ai-index.md` and `docs/repo-map.json` include the CP17 release docs, task file, and release artifact.

## Release Readiness

- Release line: `V1`
- Historical first stable tag: `v1.0.0`
- Current stable tag: `v1.0.1`
- SemVer version: `1.0.1`
- Status: `v1.0.1` is in a known-good public state as of `2026-06-30`; the release workflow plus both public deploy workflows succeeded from commit `63025570f3c259e5116a0e1064cb70cdc11721d3`, shared test and production are both running the tagged GHCR images, and encrypted Data Protection key rings were verified on both hosts.
- Executor attestation: `main`, tag `v1.0.1`, the published GitHub Release, GHCR images, shared-test deployment, and production deployment are aligned for the current stable release.
- Deferred follow-up note: `npm ci` still reports one high-severity audit advisory during restore; it is disclosed in the CP17 release artifact and remains outside CP17 scope because it does not block the documented `V1` validation bundle.
- Owner-controlled action pending: none for the current stable tag beyond ordinary future release hygiene.
- Mirrors:
  - `docs/95-delivery/pr/cp17-release-preparation-and-reviewer-snapshot/description.md`
  - `docs/55-execution/checkpoint-status.md`
