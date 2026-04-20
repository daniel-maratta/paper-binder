# Delivery Versioning And PR Artifacts
Status: Current (v1)

## Purpose

Define the delivery terminology and PR artifact expectations used by PaperBinder.

## Terminology

- `Phase`: one of the five major execution groupings in `docs/55-execution/`.
- `Checkpoint`: the mergeable execution unit inside a phase (`CP1` through `CP17`).
- `Release`: the final reviewer-ready cut of `V1`, using prose `V1` and the recommended tag spelling `v1.0.0`.

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

- V1 execution remains checkpoint-driven until the release checkpoint is complete.
- Release tagging uses `docs/95-delivery/release-workflow.md` and `docs/95-delivery/release-checklist.md`.
- `CHANGELOG.md` cuts the shipped release as `## [V1] - YYYY-MM-DD` with a fresh empty `## Unreleased` above it.
- `docs/95-delivery/release-checklist.md` `Release Readiness` is the canonical "main is taggable" signal, mirrored into the CP17 release artifact and checkpoint ledger.
- Version identifiers in delivery docs must match the actual shipped cut; do not predeclare future versions.

## Non-Goals

- No CI/CD implementation detail beyond what is required to understand release artifacts.
- No alternate naming system that competes with phase/checkpoint terminology.
