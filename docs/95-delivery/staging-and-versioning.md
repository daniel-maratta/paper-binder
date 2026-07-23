# Delivery Versioning And PR Artifacts
Status: Current (`V1`)

## Purpose

Define the delivery terminology and PR artifact expectations used by PaperBinder.

## Terminology

- `Phase`: one of the five major execution groupings in `docs/55-execution/`.
- `Checkpoint`: the mergeable execution unit inside a phase (`CP1` through `CP17`).
- `Release`: a stable shipped cut on the `V1` line. The initial reviewer-ready cut used prose `V1` with tag `v1.0.0`; the current published stable tag is `v1.0.5`.

Do not use legacy `stage` terminology for current execution planning or PR artifacts.

## PR Artifact Rules

- Checkpoint work may ship across 1-5 PRs.
- PR descriptions should reference the checkpoint ID and related `T-####` task IDs.
- Use checkpoint templates for implementation PRs.
- If a checkpoint keeps a separate implementation-plan artifact, relevant behavior-changing work must describe its vertical-slice TDD flow there: public interfaces, planned `RED -> GREEN -> REFACTOR` slices, and the intended failing tests that start each slice.
- Use the phase summary template only when a PR intentionally summarizes a completed phase or consolidates phase-level outcomes.
- Use the release template for the final reviewer-facing release PR or equivalent delivery artifact.
- For live PR artifacts, use `Status: Draft` while validation or review prep is still in progress.
- For the current checkpoint or release artifact, use `Status: Review Ready` once the artifact is ready for reviewer handoff.
- Use `Status: Merged` only when a currently relevant artifact is intentionally updated after merge to record its merged state.
- Do not mass-update historical merged PR artifacts just to remove `Draft`; treat them as historical snapshots unless a broader delivery-doc consistency pass is underway.
- Checkpoint PR artifacts must include launch-profile validation evidence and the manual VS Code plus Visual Studio verification outcome before the checkpoint can be called done.

## Versioning Rules

- `V1` is locked as the first stable release line.
- Stable release tags must use SemVer core spelling with a leading `v`: `vMAJOR.MINOR.PATCH`.
- The initial stable release identity remains historical `V1` / `v1.0.0` / `1.0.0`.
- The current published stable release identity is `V1` / `v1.0.5` / `1.0.5`.
- The active V1.1 branch may stage version metadata at `1.1.0` before release; do not describe `v1.1.0` as stable until the final release close-out task records the taggable state.
- Repository version metadata must agree before release validation passes:
  - `Directory.Build.props` `VersionPrefix`
  - `src/PaperBinder.Web/package.json` `version`
  - `src/PaperBinder.Web/package-lock.json` root `version`
- `scripts/validate-version.ps1` is the canonical local and CI guard for version metadata.
- Release tagging uses `docs/95-delivery/release-workflow.md`, `docs/95-delivery/release-checklist.md`, and the tag-driven GitHub Actions release workflow.
- `CHANGELOG.md` preserves the historical first stable cut as `## [V1] - 2026-04-19` and records subsequent stable releases on the same line as `## [MAJOR.MINOR.PATCH] - YYYY-MM-DD`, each with a fresh empty `## Unreleased` above the latest entry.
- `docs/95-delivery/release-checklist.md` `Release Readiness` is the canonical "main is taggable" signal, mirrored into the CP17 release artifact and checkpoint ledger.
- Version identifiers in delivery docs must match the actual shipped cut; do not predeclare future versions.

## SemVer Policy

- `MAJOR`: increment only for intentional breaking changes to documented user workflows, API contracts, deployment contracts, or tenant/security behavior.
- `MINOR`: increment for backward-compatible shipped capability that stays inside approved PaperBinder scope.
- `PATCH`: increment for backward-compatible fixes, documentation corrections, dependency maintenance, and operational hardening.
- Pre-release tags are not part of the `V1` public release contract. If they become necessary later, define the rule here before publishing them.
- Tenant isolation regressions, API contract breaks, or deployment contract breaks cannot be hidden in a patch release; either avoid the break or make the release decision explicit before tagging.

## Automated Pipelines

- `.github/workflows/ci.yml` runs on pull requests and pushes to `main`.
- `.github/workflows/release.yml` runs on stable SemVer tags matching `vMAJOR.MINOR.PATCH` and can also be started manually with a version input.
- `.github/workflows/deploy-prod.yml` is the owner-invoked production deployment workflow.
- CI intentionally stays lighter than the tag workflow: it validates version metadata, restores dependencies, builds, runs repo tests with Docker-backed integration required, validates docs, and validates launch-profile drift.
- The release workflow adds the slower release-only gates: browser E2E and the checkpoint validation bundle, then publishes versioned GHCR images for the release tag.
- On a pushed tag, the release workflow creates a draft GitHub Release with GitHub-generated notes for that tag after validation passes. Publishing the draft remains owner-controlled.

## Non-Goals

- No automatic production deployment on tag push or release publication for `V1`.
- No alternate naming system that competes with phase/checkpoint terminology.
