# Release Checklist
Status: Current (`V1`)

## Purpose

Own the canonical release gate list for the shipped `V1` cut.

## Required Artifacts

- [x] `CHANGELOG.md` is cut as `## [V1] - 2026-04-19` with a fresh empty `## Unreleased`.
- [x] `docs/95-delivery/release-workflow.md` and `docs/95-delivery/release-checklist.md` agree on release identity, command surface, and ownership.
- [x] `docs/95-delivery/pr/cp17-release-preparation-and-reviewer-snapshot/description.md` records shipped scope, validation evidence, reviewer walkthrough, and author notes for the critic.
- [x] `README.md`, `REVIEWERS.md`, `review/`, `docs/60-ai/`, operations docs, testing docs, taskboard state, and checkpoint ledger describe the shipped `V1` system only.

## Scripted Validation

- [x] Fresh candidate clone bootstrapped `.env` from `.env.example` before Docker-backed commands on `2026-04-19`.
- [x] [preflight.ps1](../../scripts/preflight.ps1) `-Profile Full` passed on `2026-04-19`.
- [x] [restore.ps1](../../scripts/restore.ps1) passed on `2026-04-19`.
- [x] [build.ps1](../../scripts/build.ps1) `-Configuration Release` passed on `2026-04-19`.
- [x] [test.ps1](../../scripts/test.ps1) `-Configuration Release -DockerIntegrationMode Require` passed on `2026-04-19`.
- [x] [run-browser-e2e.ps1](../../scripts/run-browser-e2e.ps1) passed on `2026-04-19`.
- [x] [validate-docs.ps1](../../scripts/validate-docs.ps1) passed on `2026-04-19`.
- [x] [validate-docs.ps1](../../scripts/validate-docs.ps1) passed again on `2026-04-20` after the post-implementation CP17 closeout updates.
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

- Release label: `V1`
- Recommended tag: `v1.0.0`
- Status: scripted validation bundle complete on `2026-04-19`; post-implementation docs-closeout validation re-passed on `2026-04-20`; manual VS Code and Visual Studio launch verification also completed and passed on `2026-04-20`.
- Executor attestation: `main` is documented as taggable for `V1`.
- Deferred follow-up note: `npm ci` still reports one high-severity audit advisory during restore; it is disclosed in the CP17 release artifact and remains outside CP17 scope because it does not block the documented `V1` validation bundle.
- Owner-controlled action pending: merge and create tag `v1.0.0`.
- Mirrors:
  - `docs/95-delivery/pr/cp17-release-preparation-and-reviewer-snapshot/description.md`
  - `docs/55-execution/checkpoint-status.md`
