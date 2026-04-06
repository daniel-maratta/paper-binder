# Delivery Lane Guide

## AI Summary

- This lane contains release/versioning guidance and PR artifact standards.
- Use this lane to keep commits/PRs clear, cohesive, and reviewer-friendly.
- PR templates stay at `docs/95-delivery/pr/`; concrete PR artifacts live in per-PR subfolders under that directory.

## Read First

- `docs/95-delivery/staging-and-versioning.md`

## PR Artifacts

- `docs/95-delivery/pr/`

Organization:
- Keep reusable templates at the `pr/` root.
- Keep concrete PR artifacts in one folder per PR/checkpoint so companion files such as `description.md` and `critic-review.md` stay together.
- Only keep extra companion docs when they carry distinct value. Do not mirror `description.md` into a second prose artifact such as `implementation-plan.md`.
- Example: `docs/95-delivery/pr/cp5-tenancy-resolution-and-immutable-tenant-context/`

Checkpoint PR artifacts must include critic-review summary, validation evidence, and unresolved-risk disclosure when implementation work is proposed for merge.
Use `Draft` for in-progress artifacts, `Review Ready` for the current artifact once handoff is appropriate, and avoid retroactive status churn on older merged artifacts unless you are already doing a broader delivery-doc cleanup.
