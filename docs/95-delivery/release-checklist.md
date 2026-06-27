# Release Checklist
Status: Current (`V1`)

## Purpose

Own the canonical release gate list for the current stable `V1` release.

## Required Artifacts

- [x] `CHANGELOG.md` contains the current `## [1.0.1] - 2026-06-26` entry above the historical `## [V1] - 2026-04-19` first-cut release summary, with a fresh empty `## Unreleased`.
- [x] `docs/95-delivery/release-workflow.md` and `docs/95-delivery/release-checklist.md` agree on the `V1` release line, the current stable tag, the command surface, and ownership.
- [x] Repository version metadata is locked to `1.0.1` for the current `V1` / `v1.0.1` release identity.
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

## Manual Verification

- [x] Reviewer walkthrough coverage is represented by the `2026-04-19` candidate-release browser suite plus the refreshed manual IDE launch verification recorded on `2026-04-20`.
- [x] VS Code manual launch verification completed and passed on `2026-04-20`.
- [x] Visual Studio manual launch verification completed and passed on `2026-04-20`.
- [x] `Launch Frontend Dev Server` is recorded explicitly as VS Code-only.

## Documentation Integrity

- [x] `scripts/run-root-host-e2e.ps1` remains documented as a historical compatibility shim through `V1`.
- [x] Reviewer-facing and release-facing local links resolve inside this repository only.
- [x] `docs/ai-index.md` and `docs/repo-map.json` include the CP17 release docs, task file, and release artifact.

## Release Readiness

- Release line: `V1`
- Historical first stable tag: `v1.0.0`
- Current stable tag: `v1.0.1`
- SemVer version: `1.0.1`
- Status: the original `V1` release evidence remains recorded from `2026-04-19` and `2026-04-20`; current version metadata, build, repo tests, and docs validation reran successfully on `2026-06-26`.
- Executor attestation: `main` is ready for the owner to recreate or push `v1.0.1` and rerun the tag workflow from a repo state whose metadata now matches `1.0.1`.
- Deferred follow-up note: `npm ci` still reports one high-severity audit advisory during restore; it is disclosed in the CP17 release artifact and remains outside CP17 scope because it does not block the documented `V1` validation bundle.
- Owner-controlled action pending: recreate or push tag `v1.0.1`, rerun `.github/workflows/release.yml`, and only then rerun `.github/workflows/deploy-test.yml`.
- Mirrors:
  - `docs/95-delivery/pr/cp17-release-preparation-and-reviewer-snapshot/description.md`
  - `docs/55-execution/checkpoint-status.md`
