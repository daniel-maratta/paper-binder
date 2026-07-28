# Pipeline Setup Critic Review
Status: Review Ready

Reviewer: PaperBinder Critic
Date: 2026-06-05

## Scope

Reviewed the current non-pushed delta against `origin/main`, with focus on:

- [`.github/workflows/ci.yml`](../../../../../.github/workflows/ci.yml)
- [`.github/workflows/release.yml`](../../../../../.github/workflows/release.yml)
- [`.github/workflows/deploy-prod.yml`](../../../../../.github/workflows/deploy-prod.yml)
- [`docker-compose.prod.yml`](../../../../../docker-compose.prod.yml)
- [`deploy/prod/Caddyfile`](../../../../../deploy/prod/Caddyfile)
- [`deploy/Caddy.Namecheap.Dockerfile`](../../../../../deploy/Caddy.Namecheap.Dockerfile)
- [`docs/70-operations/deployment.md`](../../../../../docs/70-operations/deployment.md)
- [`docs/70-operations/runbook-prod.md`](../../../../../docs/70-operations/runbook-prod.md)
- [`docs/70-operations/runbook-test.md`](../../../../../docs/70-operations/runbook-test.md)
- [`docs/95-delivery/release-workflow.md`](../../../../../docs/95-delivery/release-workflow.md)
- [`docs/95-delivery/staging-and-versioning.md`](../../../../../docs/95-delivery/staging-and-versioning.md)
- [`scripts/validate-version.ps1`](../../../../../scripts/validate-version.ps1)
- [`Directory.Build.props`](../../../../../Directory.Build.props)
- [`src/PaperBinder.Web/package.json`](../../../../../src/PaperBinder.Web/package.json)
- [`src/PaperBinder.Web/package-lock.json`](../../../../../src/PaperBinder.Web/package-lock.json)

This review is static. It does not claim that the GitHub workflows or remote deployment path were executed end to end.

## Verdict

Not ready to push as-is.

The branch makes real progress on release validation, version locking, GHCR publishing, and production rollout, but two deployment/workflow issues are serious enough to block confidence in rollback safety and secret-handling integrity. Two documentation issues should be closed in the same change set.

## Findings

### 1. High: production deploy workflow is not reproducible by version

[`deploy-prod.yml`](../../../../../.github/workflows/deploy-prod.yml) accepts a version input, but the workflow checkout step at the top of the job does not switch to the requested tag before it packages and uploads [`docker-compose.prod.yml`](../../../../../docker-compose.prod.yml) and [`deploy/prod/Caddyfile`](../../../../../deploy/prod/Caddyfile). The bundle creation and upload path later in the workflow therefore come from whatever revision the workflow file was run from, while only `PAPERBINDER_IMAGE_TAG` varies by input.

Impact:

- rerunning deployment for `1.0.0` after later infra changes can deploy old images with newer Compose/Caddy definitions
- rollback by tag is no longer a true rollback of the deployment contract
- the docs now describe a tag-driven immutable release flow, but the actual deploy path still mixes mutable repo state with immutable images

Recommendation:

- check out `refs/tags/v${version}` before preparing the deployment bundle, or
- publish the deployment bundle as a release artifact from the tag-driven release workflow and have deploy consume that immutable artifact instead of the current branch contents

### 2. High: SSH host trust is established with runtime `ssh-keyscan`, not a pinned host key

[`deploy-prod.yml`](../../../../../.github/workflows/deploy-prod.yml) currently builds `known_hosts` by running `ssh-keyscan` against the target host immediately before `scp`, `ssh`, and remote `docker login`.

Impact:

- host authenticity is not actually verified
- a machine-in-the-middle can impersonate the host and receive the uploaded `.env`
- the same path also exposes the GHCR pull token used in the remote `docker login`

Recommendation:

- pin the expected SSH host key out of band and inject it as a secret or checked-in trusted value
- fail the workflow if the presented host key does not match that pinned value

### 3. Medium: release workflow is generic SemVer on paper but still hard-wired to the CP17 `V1` release notes artifact

[`release.yml`](../../../../../.github/workflows/release.yml) is documented as the canonical stable-tag release workflow in [`staging-and-versioning.md`](../../../../../docs/95-delivery/staging-and-versioning.md), but the draft release body is always created from [`docs/archive/v1/checkpoints/pr/cp17-release-preparation-and-reviewer-snapshot/description.md`](../../../../../docs/archive/v1/checkpoints/pr/cp17-release-preparation-and-reviewer-snapshot/description.md).

Impact:

- a future `v1.0.1` or `v1.1.0` tag will generate a release whose title matches the tag but whose notes still describe `V1` / `v1.0.0`
- the pipeline contract reads reusable, but the release content path is still single-release-specific

Recommendation:

- either parameterize the release-notes source for future tags, or
- explicitly scope the current automation and docs to the `V1` / `v1.0.0` release only until a reusable release-notes mechanism exists

### 4. Low: shared-test runbook was added, but the operations lane guide does not surface it

[`docs/70-operations/runbook-test.md`](../../../../../docs/70-operations/runbook-test.md) is now a substantial operator document, but [`docs/70-operations/README.md`](../../../../../docs/70-operations/README.md) still points readers only to local, prod, and deployment docs.

Impact:

- the new shared-test contract is easy to miss
- the lane guide is stale immediately after adding a new top-level runbook

Recommendation:

- add `runbook-test.md` to the operations lane guide in the same change set

## Assumptions

- The intended review target is the current ahead-of-`origin/main` branch state, not only uncommitted filesystem changes.
- The deployment workflow is meant to support both first deployment and later tagged rollback/redeploy, because the new docs describe rollback by previous known-good tag.

## Recommended Closeout

Minimum closeout before push:

1. Make the deploy workflow version-reproducible.
2. Replace runtime `ssh-keyscan` trust with a pinned host-key check.
3. Decide whether the release workflow is `V1`-specific or genuinely reusable, and align the notes path and docs.
4. Patch the remaining navigation drift in the operations lane guide.
