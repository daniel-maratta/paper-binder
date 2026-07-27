# Critic Review: GHCR Rollout And Release Pipeline (Unpushed `main`)

Status: Review notes for code author
Reviewer role: Senior/staff engineer, code review critic
Scope: Three unpushed commits on `main` ahead of `origin/main`:

- `c95bb9d` Lock v1 semver and add release validation pipeline
- `f670b95` Deployment decisions & documentation updates
- `e64ed92` Add GHCR-backed production rollout and public-host docs

Aggregate diff: 34 files, ~1,176 insertions / ~68 deletions.

## Summary

The three commits land a coherent change set: lock SemVer at `1.0.0`, define
an automated release-validation pipeline, document the indexable-prod vs.
non-indexable-test split, and wire a GHCR-backed production rollout
workflow. The scope is justified by [ADR-0012](../../../../90-adr/ADR-0012-ghcr-production-deployment-and-public-indexing.md),
the doc fan-out across `00-intent`, `10-product`, `20-architecture`,
`30-security`, `70-operations`, `90-adr`, and `95-delivery` keeps path,
hostname, and policy references in sync, and the prod/test split is
enforced at the contract level rather than via configuration drift.

I would ship this set after addressing the items under **Must-fix**. The
**High-value nits** are quality issues a reviewer would flag and most of
them are one-line changes. The **Smaller observations** are
informational.

## Must-fix before push

### 1. `deploy-prod.yml` smoke check has no warm-up

Reference: [.github/workflows/deploy-prod.yml:154-158](../../../../../.github/workflows/deploy-prod.yml)

The final step curls `/health/live` and `/health/ready` immediately after
`docker compose up -d` returns. Two failure modes:

- On any cold deployment the app process may not have finished startup by
  the time `up -d` returns.
- On the first-ever rollout to a new droplet, Caddy has not yet issued
  the wildcard certificate via Namecheap DNS-01. Propagation and ACME
  validation are not instantaneous.

As written, the workflow will redden on legitimate successful deploys
and on every cold start. Add a bounded retry loop (for example, up to
~60 seconds for `/health/live` and a longer ceiling for `/health/ready`
to absorb TLS issuance), or gate on `docker compose ps` health state
before the curl.

### 2. GHCR username case sensitivity is inconsistent

Reference: [.github/workflows/deploy-prod.yml:141](../../../../../.github/workflows/deploy-prod.yml)
and [.github/workflows/deploy-prod.yml:41](../../../../../.github/workflows/deploy-prod.yml)

The image registry path is force-lowercased
(`$env:GITHUB_REPOSITORY_OWNER.ToLowerInvariant()`), but the `docker
login` step uses the raw `${{ github.repository_owner }}` value. GHCR is
forgiving today, but a contributor with uppercase characters in their
handle would hit a mismatch that is hard to debug from a remote shell.
Lowercase the username in the login step too.

### 3. TOFU host key acceptance on every deploy

Reference: [.github/workflows/deploy-prod.yml:117-124](../../../../../.github/workflows/deploy-prod.yml)

`ssh-keyscan -H "${{ secrets.PROD_SSH_HOST }}"` is appended to
`known_hosts` from scratch on every run. That means a hijacked DNS or
IP at the moment of deploy silently passes verification - exactly the
window where you most want a pinned host key.

Suggestion: store the expected `known_hosts` line in a
`PROD_SSH_HOST_KEY` secret, write it during the SSH setup step, and only
fall back to `ssh-keyscan` if the secret is absent and the operator has
explicitly opted in.

### 4. Backup policy reversal is buried and overreaches

Reference: [docs/70-operations/deployment.md:140-143](../../../../70-operations/deployment.md)

The previous baseline ("Daily `pg_dump` backup with retention (>= 7
days)") is replaced by "Recurring backups are optional because the
product data model is intentionally ephemeral."

That is defensible for tenant business data, since demo tenants
hard-delete on lease expiry. It is not defensible for the platform-level
state that survives tenant purge:

- Audit history retained under `RetainTenantPurgedSummary`.
- The data-protection key ring at `/data/keys` (shared between `app` and
  `worker` via the `paperbinder_keys` volume).
- The `paperbinder_postgres` volume itself.

Either narrow the wording ("recurring backups of *tenant business data*
are optional") or call out which artifacts still warrant snapshots. As
currently written, an operator following the runbook would conclude
that audit history can be lost on disk failure.

## High-value nits

### 5. `PROD_TURNSTILE_SITE_KEY` is baked into the image, not the env

Reference: [.github/workflows/release.yml:122](../../../../../.github/workflows/release.yml)
and [.github/workflows/deploy-prod.yml:96](../../../../../.github/workflows/deploy-prod.yml)

The release workflow passes the site key as a Vite build arg, so the
visible Turnstile widget key is frozen at image build time. The deploy
workflow writes `PAPERBINDER_CHALLENGE_SITE_KEY` into `.env` as if it
were a deploy-time value. The runtime env value is only used by the
backend verifier; the SPA already carries its build-time copy.

Net effect: rotating the visible site key requires a new image build,
not a redeploy. Document this in `docs/70-operations/deployment.md` so
an operator does not think they rotated the visible key when they only
rotated the verifier-side configuration.

### 6. Release notes file is a hard-coded per-PR path

Reference: [.github/workflows/release.yml:217](../../../../../.github/workflows/release.yml)

`--notes-file
docs/archive/v1/checkpoints/pr/cp17-release-preparation-and-reviewer-snapshot/description.md`
will become incorrect on the first non-`v1.0.0` tag - either failing
the create-draft-release step or, worse, attaching the v1.0.0 PR's
notes to a later release.

Options:

- Parametrize per tag (resolve a per-release notes path from the tag).
- Switch to `gh release create --generate-notes`.
- Maintain a single canonical `CHANGELOG.md` extract.

### 7. `validate-version.ps1` shells out to Node to parse JSON

Reference: [scripts/validate-version.ps1:13, 56](../../../../../scripts/validate-version.ps1)

`Read-JsonValue` invokes `node -e ...` to read `package.json` and
`package-lock.json`. PowerShell has `ConvertFrom-Json` built in. The
current implementation adds an implicit Node dependency to a
PowerShell-only validation script and the stderr from `node -e` is not
captured. It works in CI because the release workflow already sets up
Node, but the script is also documented as a canonical local command.

Either rewrite using `Get-Content $path -Raw | ConvertFrom-Json`, or
document the reason for the Node dependency in a comment.

### 8. Wildcard apex via DNS-01 is wasteful

Reference: [deploy/prod/Caddyfile:20-28](../../../../../deploy/prod/Caddyfile)

The `paperbinder-prod-tls` snippet (Namecheap DNS-01) is imported for
both apex and wildcard hosts. The apex could use HTTP-01 with no
Namecheap rate-limit pressure and no client-IP whitelist dependency.

Not blocking. If DNS-01 for the apex is intentional (for example, to
let the apex come up before any HTTP routing is in place), a one-line
comment in the Caddyfile would prevent a future contributor from
"fixing" it.

### 9. Production hostname is hard-coded in three places

References:

- [.github/workflows/deploy-prod.yml:93-94, 157-158](../../../../../.github/workflows/deploy-prod.yml)
- [docs/90-adr/ADR-0012-ghcr-production-deployment-and-public-indexing.md](../../../../90-adr/ADR-0012-ghcr-production-deployment-and-public-indexing.md)
- [docs/70-operations/runbook-prod.md](../../../../70-operations/runbook-prod.md)
- [deploy/prod/Caddyfile:20, 25](../../../../../deploy/prod/Caddyfile)

the configured production root host is repeated literally in the workflow
env file generator, in the smoke checks, in the Caddyfile, and across
several docs. Renaming the production host becomes a multi-file edit
with a high chance of a partial update.

Suggestion: promote the prod root host and prod cookie domain to
repository variables (or environment variables on the `production`
GitHub Environment) and read them from the workflow. The Caddyfile and
docs can stay literal because they are operational reference points,
but the deploy workflow should not embed them.

### 10. CI workflow validates a smaller gate set than release

Reference: [.github/workflows/ci.yml](../../../../../.github/workflows/ci.yml)
vs. [.github/workflows/release.yml:80-106](../../../../../.github/workflows/release.yml)

CI runs `validate-version`, `restore`, `build`, repo tests, and
`validate-docs`. Release additionally runs browser E2E, launch-profile
validation, and the checkpoint validation bundle. That is a deliberate
tradeoff to keep CI fast, but a contributor who sees "CI green" will
expect "release pipeline green" and will be surprised when the tag
pipeline fails on launch-profile or checkpoint validation.

Suggestion: either run the same bundle on push-to-`main` (not on PRs),
or add a short note in `docs/95-delivery/release-workflow.md` listing
the gates that only run at tag time.

## Smaller observations

- [docker-compose.prod.yml:84-85](../../../../../docker-compose.prod.yml)
  binds Postgres to `127.0.0.1:5432`. Good. A one-line comment that this
  is intentional for Tailscale-only diagnostic access would help future
  reviewers.
- [docs/70-operations/runbook-test.md](../../../../70-operations/runbook-test.md)
  is 366 net new lines and duplicates a lot of structure from
  `runbook-prod.md`. Acceptable for a single-environment write-up;
  consider extracting a shared "Caddy + Namecheap proxy operational
  shape" section only if both runbooks continue to diverge.
- The Caddy Dockerfile rename `Caddy.Dockerfile` -> `Caddy.Namecheap.Dockerfile`
  is pure rename (no content change) and is referenced correctly from
  the release workflow's matrix
  ([release.yml:132](../../../../../.github/workflows/release.yml)) and
  from `docker-compose.test.yml`. The new name correctly signals the
  DNS provider coupling.
- Production smoke check only hits `/health/*`. The prod runbook
  ([runbook-prod.md:46-49](../../../../70-operations/runbook-prod.md))
  lists "production root and tenant hosts do not emit blanket
  `X-Robots-Tag: noindex`" as a triage check. Worth one extra
  `curl -I` assertion in the workflow so the indexing policy cannot
  regress silently to the shared-test behavior.
- The release workflow tag glob
  `v[0-9]*.[0-9]*.[0-9]*` ([release.yml:6](../../../../../.github/workflows/release.yml))
  would also match pre-release spellings such as `v1.0.0-rc1`. The
  in-job SemVer-core regex would then throw, so the failure mode is
  loud rather than silent, but the SemVer policy in
  [staging-and-versioning.md](../../../../95-delivery/staging-and-versioning.md) states
  pre-release tags are not part of the contract. Tighten the trigger
  glob if you want the rejection to happen before any job starts.
- The deploy-prod workflow has `concurrency.cancel-in-progress: false`
  on `production-deploy`. Correct. Worth keeping that comment alive if
  the workflow is ever refactored, because "do not cancel in-flight
  deploys" is the kind of property that gets lost in a rewrite.
- The `production` GitHub Environment is the intended approval gate,
  but neither the workflow nor the docs assert that environment
  protection rules (required reviewers, deployment branches) are
  actually configured. The repository-side configuration is
  out-of-band; consider adding a short "expected Environment protection
  rules" subsection to `docs/70-operations/deployment.md` so the
  contract is reviewable.

## Overall

Scope discipline is good. Doc, code, and ADR co-evolution is clean. The
prod/test split is enforced at the contract level rather than through
implicit configuration drift, which is the right call for a hiring
artifact. The pipeline pieces compose correctly. The failure modes that
worry me are operational rather than logical: the cold-start health
probe, the per-run TOFU host key acceptance, the opaque GHCR auth case
mismatch, and the over-broad backup-policy reversal. Items 1-4 should
be resolved before push. The rest are quality improvements that can
land as a follow-up PR.
