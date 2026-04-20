# Release Workflow
Status: Current (`V1`)

## Purpose

Define the canonical `V1` release-preparation sequence, ownership boundaries, and the artifact set that must agree before `main` is documented as taggable.

## Locked Release Identity

- Prose release label: `V1`
- Recommended tag spelling: `v1.0.0`
- Changelog cut shape: `## [V1] - YYYY-MM-DD` with a fresh empty `## Unreleased`

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
   - Cut `CHANGELOG.md` for `V1`.
   - Refresh the CP17 release artifact and the release checklist.
   - Keep `docs/95-delivery/staging-and-versioning.md` aligned with the locked release identity.
4. Run the clean-checkout validation bundle from a fresh checkout, clone, or worktree of the candidate revision.
   - Bootstrap the repo-root `.env` from `.env.example` before Docker-backed commands, exactly as documented in `docs/70-operations/runbook-local.md`.
   - Use the exact scripted bundle owned by the release checklist.
   - Treat `docs/95-delivery/release-checklist.md` as the gate list and this workflow as the sequence owner.
5. Record manual evidence and release readiness.
   - Record the reviewer walkthrough baseline plus VS Code and Visual Studio launch-verification evidence.
   - Note explicitly that `Launch Frontend Dev Server` is VS Code-only.
   - Mirror the final `Release Readiness` signal into the CP17 release artifact and checkpoint ledger.
6. Hand off owner-controlled release actions.
   - `main` being documented as taggable for `V1` is the executor closeout.
   - The actual merge and `v1.0.0` tag creation remain owner-controlled actions.

## Deployment And Rollback Posture

- The supported deployment topology remains the current single-host Docker Compose stack with Caddy, PostgreSQL, migrations, app host, and worker.
- `docs/70-operations/runbook-prod.md` and `docs/70-operations/deployment.md` document that supported topology and rollback model.
- A live public host is not part of the `V1` release-blocking evidence set.

## Validation Command Surface

The canonical command surface remains the checked-in scripts:

- [preflight.ps1](../../scripts/preflight.ps1)
- [restore.ps1](../../scripts/restore.ps1)
- [build.ps1](../../scripts/build.ps1)
- [test.ps1](../../scripts/test.ps1)
- [run-browser-e2e.ps1](../../scripts/run-browser-e2e.ps1)
- [validate-docs.ps1](../../scripts/validate-docs.ps1)
- [validate-launch-profiles.ps1](../../scripts/validate-launch-profiles.ps1)
- [validate-checkpoint.ps1](../../scripts/validate-checkpoint.ps1)
- [start-local.ps1](../../scripts/start-local.ps1)
- [reviewer-full-stack.ps1](../../scripts/reviewer-full-stack.ps1)

The release workflow must not introduce a parallel shadow command surface.

## Related Documents

- `docs/95-delivery/release-checklist.md`
- `docs/95-delivery/staging-and-versioning.md`
- `docs/70-operations/runbook-local.md`
- `docs/70-operations/runbook-prod.md`
- `docs/70-operations/deployment.md`
