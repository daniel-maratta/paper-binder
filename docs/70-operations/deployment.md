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
- Compose-managed containers use Docker's `local` logging driver with `max-size=10m` and `max-file=5`.

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
- As of `2026-06-30`, the public shared-test and production environments both run the GHCR-backed deploy-by-tag contract from `/opt/paperbinder/app`.
- Shared test uses `docker-compose.test-deploy.yml` plus `.github/workflows/deploy-test.yml`.
- Production uses `docker-compose.prod.yml` plus `.github/workflows/deploy-prod.yml`.
- Both public environments are in a known-good `v1.0.2` state after the successful `2026-07-02` rollouts, with certificate-backed ASP.NET Core Data Protection keys persisted under `/data/keys`.
- `docker-compose.test.yml` remains the repo-owned source-build test shape, but it is no longer the current public shared-test runtime contract.
- The canonical live app working directory on both public servers is `/opt/paperbinder/app`; `/opt/paperbinder` is the default base install directory used to hold that app subtree.
- `/opt/paperbinder/app` is owned by the deploy user in both environments. The parent `/opt/paperbinder` directory is a base install path only and its ownership should not be treated as a cross-environment contract.

DNS:
- Namecheap-managed DNS with API access enabled for ACME DNS-01 challenges.
- The production root host and its wildcard tenant host resolve to the production server.
- The shared-test root host and its wildcard tenant host resolve to the shared-test server.
- The Namecheap API must whitelist each deployment server IPv4 before wildcard certificate issuance or renewal will work.

## Required Configuration (Illustrative)

- `POSTGRES_USER=paperbinder-prod`
- `PAPERBINDER_DB_CONNECTION=...`
- `PAPERBINDER_PUBLIC_ROOT_URL=https://<production-root-host>`
- `PAPERBINDER_AUTH_COOKIE_DOMAIN=.<production-base-domain>`
- `PAPERBINDER_AUTH_COOKIE_NAME=paperbinder.auth`
- `PAPERBINDER_AUTH_KEY_RING_PATH=/data/keys`
- `PAPERBINDER_DATA_PROTECTION_APPLICATION_NAME=PaperBinder-Example`
- `PAPERBINDER_DATA_PROTECTION_CERTIFICATE_PATH=/run/paperbinder-secrets/data-protection.pfx`
- `PAPERBINDER_DATA_PROTECTION_CERTIFICATE_PASSWORD=<secret>`
- `PAPERBINDER_CHALLENGE_SITE_KEY=...`
- `PAPERBINDER_CHALLENGE_SECRET_KEY=...`
- `PAPERBINDER_LEASE_DEFAULT_MINUTES=60`
- `PAPERBINDER_LEASE_EXTENSION_WINDOW_MINUTES=10`
- `PAPERBINDER_LEASE_EXTENSION_MINUTES=15`
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
Keep real `.pfx` files and certificate passwords on the server only; never commit them.
.env for public deployments lives under `/opt/paperbinder/app/.env`, remains untracked, and should be mode `600`.
For production GHCR rollouts, the workflow-generated `.env`, the `docker-compose.prod.yml` defaults, and the existing PostgreSQL role on the host must agree on both `POSTGRES_DB` and `POSTGRES_USER`. The current production role is `paperbinder-prod`.
If production migrations fail with PostgreSQL password-authentication errors such as Npgsql `28P01`, first confirm the deployed `.env` still matches the actual server role and password before assuming the GHCR image or migration binary is at fault.
Hyphenated PostgreSQL identifiers require double quotes in SQL. For example: `ALTER USER "paperbinder-prod" WITH PASSWORD '...';`
Do not enable `PAPERBINDER_CHALLENGE_LOCAL_BYPASS_ENABLED` or `VITE_PAPERBINDER_CHALLENGE_LOCAL_BYPASS_ENABLED` in deployed/public environments. The app and frontend build now reject that configuration unless the root host is loopback or `.localhost`.
The shared public test deployment now uses `docker compose -f docker-compose.test-deploy.yml ...` so the tagged-image contract, generated `.env`, and checked-in test proxy assets stay aligned on the host.
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
- Repository or environment variables: `TEST_DATA_PROTECTION_APPLICATION_NAME`, `TEST_DATA_PROTECTION_CERTIFICATE_PATH`
- Secret: `TEST_DATA_PROTECTION_CERTIFICATE_PASSWORD`
- Repository or environment variables: `TEST_PUBLIC_ROOT_URL`, `TEST_AUTH_COOKIE_DOMAIN`, `TEST_TURNSTILE_SITE_KEY`
- Secret: `TEST_TURNSTILE_SECRET_KEY`
- Secrets: `TEST_NAMECHEAP_API_USER`, `TEST_NAMECHEAP_API_KEY`, `TEST_NAMECHEAP_CLIENT_IP`
- Optional secret: `TEST_OTEL_OTLP_ENDPOINT`

Manual production rollout via `.github/workflows/deploy-prod.yml` expects:
- Secrets: `PROD_TAILSCALE_OAUTH_CLIENT_ID`, `PROD_TAILSCALE_OAUTH_SECRET`
- Repository or environment variable: `PROD_TAILSCALE_TAGS`
- Secret: `PROD_SSH_HOST`
- Repository or environment variable: `PROD_SSH_USER`
- Secret: `PROD_SSH_PRIVATE_KEY`
- Secret: `PROD_SSH_KNOWN_HOSTS`
- Secret: `PROD_GHCR_PULL_TOKEN`
- Secrets: `PROD_POSTGRES_PASSWORD`, `PROD_TURNSTILE_SECRET_KEY`
- Repository or environment variables: `PROD_DATA_PROTECTION_APPLICATION_NAME`, `PROD_DATA_PROTECTION_CERTIFICATE_PATH`
- Secret: `PROD_DATA_PROTECTION_CERTIFICATE_PASSWORD`
- Secrets: `PROD_NAMECHEAP_API_USER`, `PROD_NAMECHEAP_API_KEY`, `PROD_NAMECHEAP_CLIENT_IP`
- Optional secret: `PROD_OTEL_OTLP_ENDPOINT`
- Repository or environment variable: `PROD_TURNSTILE_SITE_KEY`

Current note:
- `TEST_AUTH_KEY_RING_PATH` and `PROD_AUTH_KEY_RING_PATH` are not currently consumed by the deploy workflows.
- The checked-in deploy Compose files set `PAPERBINDER_AUTH_KEY_RING_PATH=/data/keys` directly for the public test and production contracts.

The `test` and `production` GitHub environments are the intended places to scope approval and deployment secrets separately. Shared-test and production must not share deploy keys, host-key material, or GHCR pull credentials.
GitHub Actions deploy SSH keys must be dedicated CI deploy keys without passphrases. Do not reuse workstation or admin SSH keys for CI. The matching public key must be installed for the deploy user on the target host, and the private key belongs only in the corresponding GitHub environment secret.
Both deployment workflows explicitly join the tailnet through `tailscale/github-action@v4` before any SSH step, which matches the current firewall posture where SSH ingress is allowed only on the private overlay interface.
The workflow `deploy_path` input is the base install directory. The live production app directory is derived as `<deploy_path>/app`, and the workflow verifies the pinned SSH host key before any upload, remote GHCR login, or remote compose command runs.

## Deploy Procedure

Run production compose commands from the live app directory that contains `.env`, `docker-compose.prod.yml`, and `deploy/prod/Caddyfile`:

```bash
cd /opt/paperbinder/app
```

Before the first rollout of certificate-backed Data Protection key protection on a server:

1. Create `/opt/paperbinder/secrets`.
2. Install the environment-specific `data-protection.pfx` at `/opt/paperbinder/secrets/data-protection.pfx`.
3. Restrict the certificate file permissions appropriately for the host.
4. Add `PAPERBINDER_DATA_PROTECTION_APPLICATION_NAME`, `PAPERBINDER_DATA_PROTECTION_CERTIFICATE_PATH`, and `PAPERBINDER_DATA_PROTECTION_CERTIFICATE_PASSWORD` to `/opt/paperbinder/app/.env`.

1. SSH to the host through the private overlay access path.
2. Confirm host identity against the pinned production `known_hosts` entry before any deploy automation uploads `.env` or sends credentials.
3. Validate environment configuration.
4. Pull the tagged GHCR images for the target release:
   - `docker compose --env-file .env -f docker-compose.prod.yml pull`
5. Apply schema updates:
   - `docker compose --env-file .env -f docker-compose.prod.yml run --rm migrations`
6. Start/update services:
   - `docker compose --env-file .env -f docker-compose.prod.yml up -d`
   - If the logging driver or logging options changed, add `--force-recreate` so existing containers receive the updated log configuration.
7. Verify, allowing bounded warm-up retries before treating health checks as failed:
   - unauthenticated `GET /health/live` returns `200`
   - unauthenticated `GET /health/ready` returns `200`
   - health payloads are minimal and non-sensitive (no dependency internals, no version metadata)
   - root host loads
   - production root and tenant hosts are crawlable and do not emit blanket `noindex` policy
   - root-host provisioning requires challenge proof, returns generated workspace credentials once, and redirects to the server-resolved tenant host
   - root-host login works and redirects to the server-resolved tenant host
   - tenant-host logout requires CSRF, clears both auth and CSRF cookies, and returns a root-host `redirectUrl` anchored to `PAPERBINDER_PUBLIC_ROOT_URL`
   - root-host provisioning/login return `429` with `Retry-After` when the shared pre-auth rate-limit budget is exhausted
   - authenticated unsafe tenant-host `/api/*` mutations reject with `429` and `Retry-After` when the canonical tenant-scoped budget is exhausted
   - `GET /api/tenant/lease` and `POST /api/tenant/lease/extend` behavior matches lease rules
   - tenant subdomain routing works
   - auth persists across subdomains
   - app logs no longer emit `No XML encryptor configured. Key ... may be persisted to storage in unencrypted form.`

## Rollback Procedure

- Tagged-image flow: redeploy previous known-good tag.
- Shared-test image flow: change `PAPERBINDER_IMAGE_TAG` in `.env` and rerun the shared-test `pull`, migrations, and `up -d` sequence through `docker-compose.test-deploy.yml`.
- Production image flow: change `PAPERBINDER_IMAGE_TAG` in `.env` and rerun the production Compose pull, migrations, and `up -d` sequence.
- Validate DB schema compatibility before rollback if migrations ran.
- If rollback requires a down-migration, execute it explicitly through the migrations workflow before restoring the older app image.

## Data and Observability Minimums

- PaperBinder `V1` demo tenants are ephemeral, so tenant-content durability requirements are intentionally low. The environment still has persistent operational state that matters for recovery: the PostgreSQL Docker volume, the Data Protection key-ring volume mounted at `/data/keys`, the Caddy data/config volumes, and the server-side `.env` files.
- Container stdout/stderr logs are bounded by the Compose logging contract. The production and shared-test compose files use Docker's `local` logging driver with five 10 MB files per container. Docker applies logging driver changes only to newly created containers, so recreate containers after changing the logging block.
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
- Tailscale carries administrative access, but PaperBinder uses standard OpenSSH over the tailnet rather than Tailscale SSH.
- The broad allow-all Tailscale grant has been removed from the current administrative policy.
- Admin SSH access is restricted by Tailscale policy to `group:paperbinder-admins` on `tcp:22`.
- The shared-test deploy identity may reach only `tag:paperbinder-test-server` on `tcp:22`.
- The production deploy identity may reach only `tag:paperbinder-prod-server` on `tcp:22`.
- Cross-environment deploy SSH is denied by policy tests.
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
