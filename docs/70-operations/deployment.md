# Deployment
Status: V1 (Public Demo)

This document describes deployment and rollback for the public single-host demo.

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
- Single DigitalOcean droplet (or equivalent VM).
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
- `docker-compose.yml`
- `src/PaperBinder.Api/Dockerfile`
- `src/PaperBinder.Worker/Dockerfile`
- `src/PaperBinder.Migrations/Dockerfile`
- `deploy/local/Caddyfile`
- repo-root `.env` copied from `.env.example`

DNS:
- Cloudflare DNS only (no proxy mode).
- `lab.danielmaratta.com` and `*.lab.danielmaratta.com` records to host IP.

## Required Configuration (Illustrative)

- `PAPERBINDER_DB_CONNECTION=...`
- `PAPERBINDER_AUTH_COOKIE_DOMAIN=.lab.danielmaratta.com`
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
- `VITE_PAPERBINDER_ROOT_URL=https://lab.danielmaratta.com`
- `VITE_PAPERBINDER_API_BASE_URL=https://lab.danielmaratta.com`
- `VITE_PAPERBINDER_TENANT_BASE_DOMAIN=lab.danielmaratta.com`

Keep secrets out of git. Use server-side `.env` or secret injection.
Keep `.env.example` aligned to the canonical runtime and frontend build-time keys using fake values only.

## Deploy Procedure

1. SSH to host via Tailscale.
2. Pull latest source or image.
3. Validate environment configuration.
4. Run:
   - `docker compose pull` or
   - `docker compose build`
5. Apply schema updates:
   - `docker compose run --rm migrations`
6. Start/update services:
   - `docker compose up -d`
7. Verify:
   - unauthenticated `GET /health/live` returns `200`
   - unauthenticated `GET /health/ready` returns `200`
   - health payloads are minimal and non-sensitive (no dependency internals, no version metadata)
   - root host loads
   - challenge flow works
   - provisioning and root login challenge checks work
   - `GET /api/tenant/lease` and `POST /api/tenant/lease/extend` behavior matches lease rules
   - tenant subdomain routing works
   - auth persists across subdomains

## Rollback Procedure

- Tagged-image flow: redeploy previous known-good tag.
- Source flow: checkout previous commit and redeploy with compose.
- Validate DB schema compatibility before rollback if migrations ran.
- If rollback requires a down-migration, execute it explicitly through the migrations workflow before restoring the older app image.

## Data and Observability Minimums

- Daily `pg_dump` backup with retention (>= 7 days).
- Prefer off-host backup storage.
- Track at minimum:
  - app 5xx rate
  - challenge verification failures
  - provisioning volume
  - tenant cleanup activity

## Security Controls

- Public ingress only on 80/443.
- SSH not publicly exposed.
- Pre-auth endpoints rate-limited.
- Challenge check required for provisioning and root login.
- Auth cookie uses `Secure`, `HttpOnly`, and CSRF protections.

## Alternatives Considered

- Local-only deployment: rejected; weak reviewer signal.
- Cloud-native stack: rejected; excessive V1 complexity.
- Serverless approach: rejected; weak fit for this tenancy model.
