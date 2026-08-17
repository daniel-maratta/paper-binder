# Delivery Lane Guide

## AI Summary

- This lane contains release/versioning guidance, pipeline ownership, and PR artifact standards.
- Use this lane to keep commits/PRs clear, cohesive, and reviewer-friendly.
- PR templates stay at `docs/95-delivery/pr/`; historical concrete PR artifacts live under `docs/archive/v1/checkpoints/pr/`.

## Read First

- `docs/95-delivery/staging-and-versioning.md`
- `docs/95-delivery/release-workflow.md`
- `docs/95-delivery/release-checklist.md`
- `docs/95-delivery/v1-1-1-implementation-plan.md`

## Automation

- Pull-request and `main` validation: `.github/workflows/ci.yml`.
- Stable SemVer tag validation, GHCR image publishing, and draft GitHub Release creation with GitHub-generated notes per tag: `.github/workflows/release.yml`.
- Owner-invoked production rollout: `.github/workflows/deploy-prod.yml`.
- Version metadata guard: `scripts/validate-version.ps1`.
- Pipeline-setup review artifact: `docs/archive/v1/release-evidence/pipeline-setup/critic-review.md`.

## Historical PR Artifacts

- `docs/archive/v1/checkpoints/pr/`

Organization:
- Keep reusable templates in the active `docs/95-delivery/pr/` root.
- Keep historical concrete PR artifacts in one archive folder per PR/checkpoint so companion files such as `description.md` and `critic-review.md` stay together.
- Only keep extra companion docs when they carry distinct value. Do not mirror `description.md` into a second prose artifact such as `implementation-plan.md`.
- Example: `docs/archive/v1/checkpoints/pr/cp5-tenancy-resolution-and-immutable-tenant-context/`

Status: every folder currently under `docs/archive/v1/checkpoints/pr/` (`cp1-...` through `cp17-...`) is a historical `V1` checkpoint PR artifact, retained for auditability and provenance. They are not current `v1.1.x` guidance. Current `v1.1.1` delivery evidence lives in `docs/95-delivery/release-checklist.md`, `docs/95-delivery/v1-1-1-implementation-plan.md`, `docs/95-delivery/v1-1-1-legal-readiness-plan.md`, `docs/95-delivery/v1-1-1-legal-retention-inventory.md`, and the `T-0046` through `T-0055` task files under `docs/05-taskboard/tasks/`; the `v1.1.x` releases do not use per-PR folders under `pr/` the way the `V1` checkpoints did.

Checkpoint PR artifacts must include critic-review summary, validation evidence, and unresolved-risk disclosure when implementation work is proposed for merge.
Use `Draft` for in-progress artifacts, `Review Ready` for the current artifact once handoff is appropriate, and avoid retroactive status churn on older merged artifacts unless you are already doing a broader delivery-doc cleanup.
