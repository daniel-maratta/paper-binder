# Release Workflow
Status: Current (`V1`)

## Purpose

Define the canonical stable-release sequence for the `V1` line, its ownership boundaries, and the artifact set that must agree before `main` is documented as taggable for the current SemVer tag.

## Locked Release Identity

- Stable release line label: `V1`
- Stable tag spelling: `vMAJOR.MINOR.PATCH`
- Historical first stable tag: `v1.0.0`
- Current stable tag: `v1.0.1`
- Current version metadata: `1.0.1`
- Changelog cut shape:
  - historical first stable cut: `## [V1] - 2026-04-19`
  - subsequent stable releases on the same line: `## [MAJOR.MINOR.PATCH] - YYYY-MM-DD` with a fresh empty `## Unreleased`

## Canonical Release Artifacts

- `CHANGELOG.md`
- `docs/95-delivery/release-workflow.md`
- `docs/95-delivery/release-checklist.md`
- `docs/95-delivery/pr/cp17-release-preparation-and-reviewer-snapshot/description.md`
- `docs/05-taskboard/tasks/T-0032-cp17-release-preparation-and-reviewer-snapshot.md`
- `docs/55-execution/checkpoint-status.md`

## Sequence

1. Freeze release scope to shipped `V1` behavior only.
   - Do not add new product features, architecture changes, deployment models, or speculative cleanup.
   - Keep `scripts/run-root-host-e2e.ps1` as a historical compatibility shim through `V1`.
2. Reconcile release-facing docs.
   - Refresh `README.md`, `REVIEWERS.md`, `review/`, operations docs, testing docs, and taskboard or ledger artifacts so they describe the shipped system only.
   - Reclassify `docs/60-ai/` and reviewer AI references as post-`V1` or deferred context only.
3. Update release artifacts.
   - Cut `CHANGELOG.md` for the current stable tag while preserving the historical `V1` first-cut entry.
   - Refresh the active release checklist and other current-state docs.
   - Keep `docs/95-delivery/staging-and-versioning.md` aligned with the current stable release identity.
4. Run the clean-checkout validation bundle from a fresh checkout, clone, or worktree of the candidate revision.
   - Bootstrap the repo-root `.env` from `.env.example` before Docker-backed commands, exactly as documented in `docs/70-operations/runbook-local.md`.
   - Use the exact scripted bundle owned by the release checklist.
   - Treat `docs/95-delivery/release-checklist.md` as the gate list and this workflow as the sequence owner.
5. Record manual evidence and release readiness.
   - Record the reviewer walkthrough baseline plus VS Code and Visual Studio launch-verification evidence.
   - Note explicitly that `Launch Frontend Dev Server` is VS Code-only.
   - Mirror the final `Release Readiness` signal into the CP17 release artifact and checkpoint ledger.
6. Hand off owner-controlled release actions.
   - `main` being documented as taggable for the current stable tag is the executor closeout.
   - The actual merge and SemVer tag creation or retagging remain owner-controlled actions.
   - Pushing the stable tag starts `.github/workflows/release.yml`; the workflow now generates draft GitHub Release notes per tag instead of reusing the CP17 release artifact as the release-body source.
   - After tagged-image publishing and deploy verification succeed, the owner publishes the matching GitHub Release draft in place rather than recreating release notes manually.
   - Production rollout uses the separate owner-invoked `.github/workflows/deploy-prod.yml` workflow after the tagged images exist in GHCR.

The CP17 release artifact set remains the canonical reviewer-facing `V1` release-prep evidence. It is historical documentation for the first release cut, not the release-body source for later tags.

## Deployment And Rollback Posture

- The supported deployment topology remains the current single-host Docker Compose stack with Caddy, PostgreSQL, migrations, app host, and worker.
- `docs/70-operations/runbook-prod.md` and `docs/70-operations/deployment.md` document that supported topology and rollback model.
- The current public test and production hosts now use the GHCR-backed deploy-by-tag contract from `/opt/paperbinder/app`, with `.github/workflows/deploy-test.yml` and `.github/workflows/deploy-prod.yml` as the owner-invoked rollout entrypoints.
- Tagged GHCR publishing now includes the shared worker, migrations, and proxy images plus environment-specific frontend-bearing API images for production and shared-test deploy validation.
- A live public host is not part of the `V1` release-blocking evidence set.

## Validation Command Surface

The canonical command surface remains the checked-in scripts:

- [preflight.ps1](../../scripts/preflight.ps1)
- [restore.ps1](../../scripts/restore.ps1)
- [validate-version.ps1](../../scripts/validate-version.ps1)
- [build.ps1](../../scripts/build.ps1)
- [test.ps1](../../scripts/test.ps1)
- [run-browser-e2e.ps1](../../scripts/run-browser-e2e.ps1)
- [validate-docs.ps1](../../scripts/validate-docs.ps1)
- [validate-launch-profiles.ps1](../../scripts/validate-launch-profiles.ps1)
- [validate-checkpoint.ps1](../../scripts/validate-checkpoint.ps1)
- [start-local.ps1](../../scripts/start-local.ps1)
- [reviewer-full-stack.ps1](../../scripts/reviewer-full-stack.ps1)

The release workflow must not introduce a parallel shadow command surface.

## Automated Pipeline Contract

- Pull requests and pushes to `main` run `.github/workflows/ci.yml`.
- Stable release tags use `.github/workflows/release.yml`.
- Owner-approved shared-test GHCR validation uses `.github/workflows/deploy-test.yml`.
- Owner-approved production rollout uses `.github/workflows/deploy-prod.yml`.
- Release tags must match `vMAJOR.MINOR.PATCH`; `v1.0.0` is the historical first valid `V1` tag and `v1.0.1` is the current stable tag.
- CI intentionally stays lighter than the release workflow: it validates version metadata, restore, build, repo tests, docs, and launch-profile drift on pull requests and pushes to `main`.
- The release workflow adds the slower gates that remain tag-time only: browser E2E and the full checkpoint validation bundle.
- The release workflow validates that repo version metadata matches the tag before it runs the release validation bundle and publishes tagged GHCR images.
- GitHub Actions may create a draft GitHub Release with GitHub-generated notes from the tag, but it must not publish a public release or deploy the app without owner action.

## Related Documents

- `docs/95-delivery/release-checklist.md`
- `docs/95-delivery/staging-and-versioning.md`
- `docs/70-operations/runbook-local.md`
- `docs/70-operations/runbook-prod.md`
- `docs/70-operations/deployment.md`
