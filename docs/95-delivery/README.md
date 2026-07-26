# Delivery Lane Guide

## AI Summary

- This lane contains release/versioning guidance, pipeline ownership, and PR artifact standards.
- Use this lane to keep commits/PRs clear, cohesive, and reviewer-friendly.
- PR templates stay at `docs/95-delivery/pr/`; concrete PR artifacts live in per-PR subfolders under that directory.

## Read First

- `docs/95-delivery/staging-and-versioning.md`
- `docs/95-delivery/release-workflow.md`
- `docs/95-delivery/release-checklist.md`

## Automation

- Pull-request and `main` validation: `.github/workflows/ci.yml`.
- Stable SemVer tag validation, GHCR image publishing, and draft GitHub Release creation with GitHub-generated notes per tag: `.github/workflows/release.yml`.
- Owner-invoked production rollout: `.github/workflows/deploy-prod.yml`.
- Version metadata guard: `scripts/validate-version.ps1`.
- Pipeline-setup review artifact: `docs/70-operations/pipeline-setup/critic-review.md`.

## PR Artifacts

- `docs/95-delivery/pr/`

Organization:
- Keep reusable templates at the `pr/` root.
- Keep concrete PR artifacts in one folder per PR/checkpoint so companion files such as `description.md` and `critic-review.md` stay together.
- Only keep extra companion docs when they carry distinct value. Do not mirror `description.md` into a second prose artifact such as `implementation-plan.md`.
- Example: `docs/95-delivery/pr/cp5-tenancy-resolution-and-immutable-tenant-context/`

Status: every folder currently under `docs/95-delivery/pr/` (`cp1-...` through `cp17-...`) is a historical `V1` checkpoint PR artifact, retained for auditability and provenance. They are not current `v1.1.0` guidance. Current `v1.1.0` delivery evidence lives in `docs/95-delivery/v1.1.0-baseline.md`, `docs/95-delivery/release-checklist.md`, and the `T-0033` through `T-0045` task files under `docs/05-taskboard/tasks/`; the `v1.1.0` release does not use a per-PR folder under `pr/` the way the `V1` checkpoints did.

Checkpoint PR artifacts must include critic-review summary, validation evidence, and unresolved-risk disclosure when implementation work is proposed for merge.
Use `Draft` for in-progress artifacts, `Review Ready` for the current artifact once handoff is appropriate, and avoid retroactive status churn on older merged artifacts unless you are already doing a broader delivery-doc cleanup.
