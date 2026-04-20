# Release Snapshot: `V1`
Status: Review Ready

## Release
- Version: `V1`
- Recommended tag: `v1.0.0`
- Related checkpoint: `CP17`
- Task IDs: `T-0032`

## Summary
- Freezes PaperBinder as the shipped `V1` cut, locks the recommended release tag to `v1.0.0`, and packages the reviewer-ready release docs, changelog, checklist, and checkpoint closeout artifacts without widening into post-`V1` feature work.
- Refreshes README, reviewer summaries, operations docs, testing docs, taskboard state, and AI-lane posture so the repo describes the actual single-host Docker Compose runtime, reviewer walkthrough, and deferred AI boundary with no stale checkpoint language.
- Adds validator and navigation support for the new release-checklist seam so release-facing docs, local links, and the CP17 artifact set stay synchronized.

## Scope Boundaries
- Included in this release:
  - shipped `V1` functionality only
  - release workflow and release checklist artifacts
  - reviewer snapshot refresh, AI-lane reclassification, and release-doc reconciliation
- Explicitly deferred or out of scope:
  - new product features or architecture changes
  - public-demo host operation as a release gate
  - AI implementation
  - merge and tag actions

## Risks And Rollout Notes
- Deployment notes: supported topology remains the single-host Docker Compose stack documented in `docs/70-operations/`.
- Operational caveats:
  - a live public host is not required release evidence for `V1`
  - `scripts/run-root-host-e2e.ps1` stays as a historical compatibility shim through `V1`
  - `npm ci` reports one high-severity audit advisory during restore; it does not block the documented `V1` validation bundle and remains a post-`V1` dependency follow-up outside CP17 scope
  - the clean-checkout validation bundle bootstraps `.env` from `.env.example` before Docker-backed commands
- Rollback notes: use the existing migrations-first rollback model documented in `docs/70-operations/deployment.md`.

## Validation Evidence
- Release checklist completed: yes; see `docs/95-delivery/release-checklist.md`.
- Post-implementation critic re-review on `2026-04-20`: no blocking findings remain; this closeout patch only refreshes status accuracy and records the non-blocking audit-follow-up note.
- Post-implementation docs-closeout validation: `validate-docs.ps1` passed again on `2026-04-20` after the CP17 task file and release artifact updates.
- Clean-checkout scripted validation bundle:
  - `preflight.ps1 -Profile Full`: passed on `2026-04-19`
  - `restore.ps1`: passed on `2026-04-19`
  - `build.ps1 -Configuration Release`: passed on `2026-04-19`
  - `test.ps1 -Configuration Release -DockerIntegrationMode Require`: passed on `2026-04-19`
    - frontend tests: 9 files, 32 tests, 0 failures
    - unit tests: 111 passed, 0 failed
    - non-Docker integration tests: 27 passed, 0 failed
    - Docker-backed integration tests: 88 passed, 0 failed
  - `run-browser-e2e.ps1`: passed on `2026-04-19`
    - root-host Playwright suite: 3 passed
    - tenant-host Playwright suite: 3 passed
  - `validate-docs.ps1`: passed on `2026-04-19`
  - `validate-launch-profiles.ps1`: passed on `2026-04-19`
  - `validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require`: passed on `2026-04-19`
  - `reviewer-full-stack.ps1 -NoBrowser`: passed on `2026-04-19`
- Manual verification evidence:
  - VS Code launch verification: passed on `2026-04-20`
  - Visual Studio launch verification: passed on `2026-04-20`
  - reviewer walkthrough coverage remains re-attested by the candidate-release browser suite plus the refreshed manual IDE launch verification

## Reviewer Notes
- Recommended walkthrough flow:
  - use `Reviewer Full Stack` from `docs/70-operations/runbook-local.md`
  - provision or log in on the root host
  - create a binder, create a document, and open the document detail
  - exercise tenant-admin user-management or binder-policy behavior
  - start impersonation, observe the downgraded effective experience, then stop without returning to the root host
  - observe lease visibility or extension behavior
  - verify authenticated `429` plus `Retry-After` and spoofed-host rejection through the documented test or API seams
  - log out back to the root host
- Primary docs to review:
  - `REVIEWERS.md`
  - `review/architecture-overview.md`
  - `review/multi-tenancy-diagram.md`
  - `review/request-lifecycle.md`
  - `review/security-model-summary.md`
  - `docs/95-delivery/release-checklist.md`
  - `docs/95-delivery/release-workflow.md`

## Author Notes For Critic
- Changed files:
  - release artifacts and taskboard state: `CHANGELOG.md`, `docs/95-delivery/release-workflow.md`, `docs/95-delivery/release-checklist.md`, `docs/95-delivery/pr/cp17-release-preparation-and-reviewer-snapshot/description.md`, `docs/05-taskboard/tasks/T-0032-cp17-release-preparation-and-reviewer-snapshot.md`, `docs/05-taskboard/work-queue.md`, `docs/55-execution/checkpoint-status.md`
  - reviewer and release-facing docs: `README.md`, `REVIEWERS.md`, the refreshed `review/` summaries, `docs/70-operations/`, `docs/80-testing/`, and the AI-lane docs under `docs/60-ai/`
  - validation and navigation support: `scripts/validate-docs.ps1`, `docs/ai-index.md`, and `docs/repo-map.json`
- Validation results:
  - early `validate-docs.ps1` pass in the working tree succeeded on `2026-04-19`
  - the full scripted release bundle succeeded from a fresh candidate clone on `2026-04-19`
  - `reviewer-full-stack.ps1 -NoBrowser` succeeded as the Docker-backed reviewer-startup smoke on `2026-04-19`
  - manual VS Code and Visual Studio launch verification completed and passed on `2026-04-20`
- Intentional deviations:
  - the candidate-release browser suite plus unchanged runtime surface are used as the reviewer-walkthrough re-attestation instead of a brand-new manual browser walkthrough in this CLI session
- Residual risks:
  - `npm ci` still reports one high-severity audit advisory during restore; it is now disclosed in `Risks And Rollout Notes`, does not block the shipped `V1` validation bundle, and remains an audit follow-up outside CP17 scope
