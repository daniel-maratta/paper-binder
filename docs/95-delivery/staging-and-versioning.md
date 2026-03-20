# Delivery Versioning And PR Artifacts
Status: Current (v1)

## Purpose

Define the delivery terminology and PR artifact expectations used by PaperBinder.

## Terminology

- `Phase`: one of the five major execution groupings in `docs/55-execution/`.
- `Checkpoint`: the mergeable execution unit inside a phase (`CP1` through `CP17`).
- `Release`: the final reviewer-ready cut of V1.

Do not use legacy `stage` terminology for current execution planning or PR artifacts.

## PR Artifact Rules

- Checkpoint work may ship across 1-5 PRs.
- PR descriptions should reference the checkpoint ID and related `T-####` task IDs.
- Use checkpoint templates for implementation PRs.
- Use the phase summary template only when a PR intentionally summarizes a completed phase or consolidates phase-level outcomes.
- Use the release template for the final reviewer-facing release PR or equivalent delivery artifact.

## Versioning Rules

- V1 execution remains checkpoint-driven until the release checkpoint is complete.
- Release tagging uses the documented release workflow and validation checklist.
- Version identifiers in delivery docs must match the actual shipped cut; do not predeclare future versions.

## Non-Goals

- No CI/CD implementation detail beyond what is required to understand release artifacts.
- No alternate naming system that competes with phase/checkpoint terminology.
