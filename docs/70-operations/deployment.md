# Deployment
Status: V1 (Supported Topology)

This document describes deployment and rollback for the supported single-host `V1` topology.
It documents the repo-supported deployment model and rollback path; it does not claim that a live public host is part of the release-blocking evidence set.
ADR-0012 locks production image distribution to GHCR and locks the prod-vs-test indexing split.

## Scope

In scope:
- Single-host Docker Compose deployment.
- Environment and secrets configuration.
- Deploy, verify, rollback, and backup minimums.

Out of scope:
- Multi-region/high-availability architecture.
- Kubernetes and multi-environment release orchestration.

## Deployment Model

Host baseline:
- Dedicated production DigitalOcean droplet (or equivalent VM).
- Separate shared-test DigitalOcean droplet (or equivalent VM).
- Docker Engine + Compose plugin.
- Tailscale for administrative SSH access.
- UFW enabled.

Services:
- Caddy reverse proxy (TLS + host routing).
- Dedicated migrations executable/container for schema updates.
- ASP.NET app container (SPA + API).
- ASP.NET worker container.
- PostgreSQL container.

Repository deployment baseline:
- `docker-compose.prod.yml`
- `docker-compose.yml`
- `docker-compose.test.yml`
- `docker-compose.test-deploy.yml`
- `src/PaperBinder.Api/Dockerfile`
- `src/PaperBinder.Worker/Dockerfile`
- `src/PaperBinder.Migrations/Dockerfile`
- `deploy/Caddy.Namecheap.Dockerfile`
- `deploy/local/Caddyfile`
- `deploy/prod/Caddyfile`
- `deploy/test/Caddyfile`
- repo-root `.env` copied from `.env.example`

Current runtime note:
- The current public test and production environments are both manually deployed from checked-out source with locally built Docker images. This is the pre-pipeline operational state.
- Shared test intentionally remains a source-build Compose flow based on `docker-compose.test.yml`.
- A separate GHCR-backed shared-test validation path now exists through `docker-compose.test-deploy.yml` plus `.github/workflows/deploy-test.yml`. It is intended to validate the immutable deploy-by-tag model before production adoption, not to rewrite the observed current test steady state.
- The GHCR-backed production path in this repo is the intended deployment contract being built toward. It is not yet the observed live runtime state on the public production host.
- The canonical live app working directory on both public servers is `/opt/paperbinder/app`; `/opt/paperbinder` is the default base install directory used to hold that app subtree.
- `/opt/paperbinder/app` is owned by the deploy user in both environments. The parent `/opt/paperbinder` directory is a base install path only and its ownership should not be treated as a cross-environment contract.

DNS:
- Namecheap-managed DNS with API access enabled for ACME DNS-01 challenges.
- The production root host and its wildcard tenant host resolve to the production server.
- The shared-test root host and its wildcard tenant host resolve to the shared-test server.
- The Namecheap API must whitelist each deployment server IPv4 before wildcard certificate issuance or renewal will work.

## Required Configuration (Illustrative)

- `PAPERBINDER_DB_CONNECTION=...`
- `PAPERBINDER_PUBLIC_ROOT_URL=https://<production-root-host>`
- `PAPERBINDER_AUTH_COOKIE_DOMAIN=.<production-base-domain>`
- `PAPERBINDER_AUTH_COOKIE_NAME=paperbinder.auth`
- `PAPERBINDER_AUTH_KEY_RING_PATH=...`
- `PAPERBINDER_CHALLENGE_SITE_KEY=...`
- `PAPERBINDER_CHALLENGE_SECRET_KEY=...`
- `PAPERBINDER_LEASE_DEFAULT_MINUTES=60`
- `PAPERBINDER_LEASE_EXTENSION_MINUTES=10`
- `PAPERBINDER_LEASE_MAX_EXTENSIONS=3`
- `PAPERBINDER_LEASE_CLEANUP_INTERVAL_SECONDS=60`
- `PAPERBINDER_RATE_LIMIT_PREAUTH_PER_MINUTE=30`
- `PAPERBINDER_RATE_LIMIT_AUTHENTICATED_PER_MINUTE=120`
- `PAPERBINDER_RATE_LIMIT_LEASE_EXTEND_PER_MINUTE=10`
- `PAPERBINDER_AUDIT_RETENTION_MODE=RetainTenantPurgedSummary`
- `PAPERBINDER_OTEL_OTLP_ENDPOINT=https://otel.example.com:4317` (optional)
- `VITE_PAPERBINDER_ROOT_URL=https://<production-root-host>`
- `VITE_PAPERBINDER_API_BASE_URL=https://<production-root-host>`
- `VITE_PAPERBINDER_TENANT_BASE_DOMAIN=<production-base-domain>`
- `NAMECHEAP_API_USER=<namecheap-username>` (required for wildcard TLS when using the repo-owned Caddy path)
- `NAMECHEAP_API_KEY=<secret>` (required for wildcard TLS when using the repo-owned Caddy path)
- `NAMECHEAP_CLIENT_IP=<whitelisted-ipv4>` (required for wildcard TLS when using the repo-owned Caddy path)
- `NAMECHEAP_API_ENDPOINT=https://api.namecheap.com/xml.response` (optional)

Keep secrets out of git. Use server-side `.env` or secret injection.
Keep `.env.example` aligned to the canonical runtime and frontend build-time keys using fake values only.
.env for public deployments lives under `/opt/paperbinder/app/.env`, remains untracked, and should be mode `600`.
Do not enable `PAPERBINDER_CHALLENGE_LOCAL_BYPASS_ENABLED` or `VITE_PAPERBINDER_CHALLENGE_LOCAL_BYPASS_ENABLED` in deployed/public environments. The app and frontend build now reject that configuration unless the root host is loopback or `.localhost`.
The shared test deployment uses `docker compose -f docker-compose.test.yml ...` so the stock local-only proxy contract stays intact.
Shared test uses the equivalent `<shared-test-root-host>` and `<shared-test-base-domain>` host values and remains intentionally non-indexable.
The visible Turnstile site key is baked into the frontend image at build time through `VITE_PAPERBINDER_CHALLENGE_SITE_KEY`. Rotating only `PAPERBINDER_CHALLENGE_SECRET_KEY` changes backend verification behavior but does not rotate the browser-visible site key. Rotating the site key requires rebuilding and redeploying the frontend image.

## GitHub Automation Inputs

Release image publishing expects:
- Repository or environment variable `PROD_TURNSTILE_SITE_KEY`
- Repository or environment variable `TEST_PUBLIC_ROOT_URL`
- Repository or environment variable `TEST_TENANT_BASE_DOMAIN`
- Repository or environment variable `TEST_TURNSTILE_SITE_KEY`

Manual shared-test rollout validation via `.github/workflows/deploy-test.yml` expects:
- Secrets: `TEST_TAILSCALE_OAUTH_CLIENT_ID`, `TEST_TAILSCALE_OAUTH_SECRET`
- Repository or environment variable: `TEST_TAILSCALE_TAGS`
- Secret: `TEST_SSH_HOST`
- Repository or environment variable: `TEST_SSH_USER`
- Secret: `TEST_SSH_PRIVATE_KEY`
- Secret: `TEST_SSH_KNOWN_HOSTS`
- Secret: `TEST_GHCR_PULL_TOKEN`
- Secret: `TEST_POSTGRES_PASSWORD`
- Repository or environment variables: `TEST_PUBLIC_ROOT_URL`, `TEST_AUTH_COOKIE_DOMAIN`, `TEST_TURNSTILE_SITE_KEY`
- Secret: `TEST_TURNSTILE_SECRET_KEY`
- Secrets: `TEST_NAMECHEAP_API_USER`, `TEST_NAMECHEAP_API_KEY`, `TEST_NAMECHEAP_CLIENT_IP`
- Optional secret: `TEST_OTEL_OTLP_ENDPOINT`

Manual production rollout via `.github/workflows/deploy-prod.yml` expects:
- Secrets: `PROD_SSH_HOST`, `PROD_SSH_USER`, `PROD_SSH_PRIVATE_KEY`
- Secret: `PROD_SSH_KNOWN_HOSTS`
- Secret: `PROD_GHCR_PULL_TOKEN`
- Secrets: `PROD_POSTGRES_PASSWORD`, `PROD_TURNSTILE_SECRET_KEY`
- Secrets: `PROD_NAMECHEAP_API_USER`, `PROD_NAMECHEAP_API_KEY`, `PROD_NAMECHEAP_CLIENT_IP`
- Optional secret: `PROD_OTEL_OTLP_ENDPOINT`
- Repository or environment variable: `PROD_TURNSTILE_SITE_KEY`

The `test` and `production` GitHub environments are the intended places to scope approval and deployment secrets separately. Shared-test and production must not share deploy keys, host-key material, or GHCR pull credentials.
`.github/workflows/deploy-test.yml` explicitly joins the tailnet through `tailscale/github-action@v4` before any SSH step, which matches the current firewall posture where SSH ingress is allowed only on the private overlay interface. `.github/workflows/deploy-prod.yml` does not yet do this, so do not assume a plain GitHub-hosted runner can reach a tailscale-only production SSH target until the production workflow is given the same tailnet reachability or moved to a self-hosted runner inside the tailnet.
The workflow `deploy_path` input is the base install directory. The live production app directory is derived as `<deploy_path>/app`, and the workflow verifies the pinned SSH host key before any upload, remote GHCR login, or remote compose command runs.

## Deploy Procedure

Run production compose commands from the live app directory that contains `.env`, `docker-compose.prod.yml`, and `deploy/prod/Caddyfile`:

```bash
cd /opt/paperbinder/app
```

1. SSH to the host through the private overlay access path.
2. Confirm host identity against the pinned production `known_hosts` entry before any deploy automation uploads `.env` or sends credentials.
3. Validate environment configuration.
4. Pull the tagged GHCR images for the target release:
   - `docker compose --env-file .env -f docker-compose.prod.yml pull`
5. Apply schema updates:
   - `docker compose --env-file .env -f docker-compose.prod.yml run --rm migrations`
6. Start/update services:
   - `docker compose --env-file .env -f docker-compose.prod.yml up -d`
7. Verify, allowing bounded warm-up retries before treating health checks as failed:
   - unauthenticated `GET /health/live` returns `200`
   - unauthenticated `GET /health/ready` returns `200`
   - health payloads are minimal and non-sensitive (no dependency internals, no version metadata)
   - root host loads
   - production root and tenant hosts are crawlable and do not emit blanket `noindex` policy
   - root-host provisioning requires challenge proof, returns one-time credentials, and redirects to the server-resolved tenant host
   - root-host login works and redirects to the server-resolved tenant host
   - tenant-host logout requires CSRF, clears both auth and CSRF cookies, and returns a root-host `redirectUrl` anchored to `PAPERBINDER_PUBLIC_ROOT_URL`
   - root-host provisioning/login return `429` with `Retry-After` when the shared pre-auth rate-limit budget is exhausted
   - authenticated unsafe tenant-host `/api/*` mutations reject with `429` and `Retry-After` when the canonical tenant-scoped budget is exhausted
   - `GET /api/tenant/lease` and `POST /api/tenant/lease/extend` behavior matches lease rules
   - tenant subdomain routing works
   - auth persists across subdomains

## Rollback Procedure

- Tagged-image flow: redeploy previous known-good tag.
- Shared-test source flow: checkout previous commit and redeploy with `docker compose -f docker-compose.test.yml ...`.
- Production image flow: change `PAPERBINDER_IMAGE_TAG` in `.env` and rerun the production Compose pull, migrations, and `up -d` sequence.
- Validate DB schema compatibility before rollback if migrations ran.
- If rollback requires a down-migration, execute it explicitly through the migrations workflow before restoring the older app image.

## Data and Observability Minimums

- PaperBinder `V1` demo tenants are ephemeral, so tenant-content durability requirements are intentionally low. The environment still has persistent operational state that matters for recovery: the PostgreSQL Docker volume, the Data Protection key-ring volume mounted at `/data/keys`, the Caddy data/config volumes, and the server-side `.env` files.
- For `V1`, recoverability may be satisfied by a documented rebuild procedure plus provider snapshots or selective off-host volume backup. If the environment is expected to be recoverable after host loss, recurring backups or snapshots are not conceptually optional.
- Take a provider snapshot before risky infrastructure changes such as Droplet rebuilds, major Docker or OS upgrades, or production cutover work.
- If recurring backups are enabled, prefer off-host storage and periodically validate that the restore path is still executable from the current runbooks.
- Track at minimum:
  - `paperbinder_security_denials_total`
  - `paperbinder_rate_limit_rejections_total`
  - `paperbinder_cleanup_cycles_total`
  - `paperbinder_cleanup_tenants_total`

## Security Controls

- Public ingress only on `80/tcp`, `443/tcp`, and `443/udp`.
- SSH ingress is restricted by firewall to the private overlay interface rather than the public internet.
- PostgreSQL is bound to loopback only (`127.0.0.1:5432`).
- App and worker services remain internal; the app listens on Docker-internal `8080/tcp` only.
- Parent-domain auth cookie and CSRF cookie must align with `PAPERBINDER_PUBLIC_ROOT_URL`.
- Auth cookie uses `Secure`, `HttpOnly`, and CSRF protections.
- Root-host provisioning and login require challenge verification and shared pre-auth rate limiting.
- Wildcard TLS for tenant hosts requires ACME DNS-01 validation through the configured DNS provider module; the current test topology uses Namecheap API credentials plus a whitelisted droplet IPv4.
- The shared public test host is intentionally non-indexable via `robots.txt` plus `X-Robots-Tag`; this lowers accidental discovery but does not hide the hostname from certificate-transparency logs or direct scans.
- The production host is intentionally indexable.
- The current deployment keeps app and worker containers running as root. This is an accepted `V1` limitation that matches observed runtime state until the Dockerfiles change.

## Alternatives Considered

- Local-only deployment as the only supported topology: rejected; weak reviewer signal.
- Cloud-native stack: rejected; excessive V1 complexity.
- Serverless approach: rejected; weak fit for this tenancy model.
