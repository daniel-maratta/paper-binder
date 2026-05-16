# Deployment
Status: V1 (Supported Topology)

This document describes deployment and rollback for the supported single-host `V1` topology.
It documents the repo-supported deployment model and rollback path; it does not claim that a live public host is part of the release-blocking evidence set.

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
- `docker-compose.test.yml`
- `src/PaperBinder.Api/Dockerfile`
- `src/PaperBinder.Worker/Dockerfile`
- `src/PaperBinder.Migrations/Dockerfile`
- `deploy/local/Caddyfile`
- `deploy/test/Caddyfile`
- `deploy/test/Caddy.Dockerfile`
- repo-root `.env` copied from `.env.example`

DNS:
- Namecheap-managed DNS with API access enabled for ACME DNS-01 challenges.
- `paperbinder-test.danielmaratta.com` and `*.paperbinder-test.danielmaratta.com` A records to host IP.
- The Namecheap API must whitelist the droplet IPv4 before wildcard certificate issuance or renewal will work.

## Required Configuration (Illustrative)

- `PAPERBINDER_DB_CONNECTION=...`
- `PAPERBINDER_PUBLIC_ROOT_URL=https://paperbinder-test.danielmaratta.com`
- `PAPERBINDER_AUTH_COOKIE_DOMAIN=.paperbinder-test.danielmaratta.com`
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
- `VITE_PAPERBINDER_ROOT_URL=https://paperbinder-test.danielmaratta.com`
- `VITE_PAPERBINDER_API_BASE_URL=https://paperbinder-test.danielmaratta.com`
- `VITE_PAPERBINDER_TENANT_BASE_DOMAIN=paperbinder-test.danielmaratta.com`
- `NAMECHEAP_API_USER=<namecheap-username>` (required for `docker-compose.test.yml`)
- `NAMECHEAP_API_KEY=<secret>` (required for `docker-compose.test.yml`)
- `NAMECHEAP_CLIENT_IP=<whitelisted-ipv4>` (required for `docker-compose.test.yml`)
- `NAMECHEAP_API_ENDPOINT=https://api.namecheap.com/xml.response` (optional)

Keep secrets out of git. Use server-side `.env` or secret injection.
Keep `.env.example` aligned to the canonical runtime and frontend build-time keys using fake values only.
Do not enable `PAPERBINDER_CHALLENGE_LOCAL_BYPASS_ENABLED` or `VITE_PAPERBINDER_CHALLENGE_LOCAL_BYPASS_ENABLED` in deployed/public environments. The app and frontend build now reject that configuration unless the root host is loopback or `.localhost`.
The shared test deployment uses `docker compose -f docker-compose.test.yml ...` so the stock local-only proxy contract stays intact.

## Deploy Procedure

1. SSH to host via Tailscale.
2. Pull latest source or image.
3. Validate environment configuration.
4. Run:
   - `docker compose -f docker-compose.test.yml pull` or
   - `docker compose -f docker-compose.test.yml build`
5. Apply schema updates:
   - `docker compose -f docker-compose.test.yml run --rm migrations`
6. Start/update services:
   - `docker compose -f docker-compose.test.yml up -d`
7. Verify:
   - unauthenticated `GET /health/live` returns `200`
   - unauthenticated `GET /health/ready` returns `200`
   - health payloads are minimal and non-sensitive (no dependency internals, no version metadata)
   - root host loads
   - `GET /robots.txt` returns a blanket `Disallow: /` policy on the shared test host
   - root and tenant-host responses include `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`
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
- Source flow: checkout previous commit and redeploy with `docker compose -f docker-compose.test.yml ...`.
- Validate DB schema compatibility before rollback if migrations ran.
- If rollback requires a down-migration, execute it explicitly through the migrations workflow before restoring the older app image.

## Data and Observability Minimums

- Daily `pg_dump` backup with retention (>= 7 days).
- Prefer off-host backup storage.
- Track at minimum:
  - `paperbinder_security_denials_total`
  - `paperbinder_rate_limit_rejections_total`
  - `paperbinder_cleanup_cycles_total`
  - `paperbinder_cleanup_tenants_total`

## Security Controls

- Public ingress only on 80/443.
- SSH not publicly exposed.
- Parent-domain auth cookie and CSRF cookie must align with `PAPERBINDER_PUBLIC_ROOT_URL`.
- Auth cookie uses `Secure`, `HttpOnly`, and CSRF protections.
- Root-host provisioning and login require challenge verification and shared pre-auth rate limiting.
- Wildcard TLS for tenant hosts requires ACME DNS-01 validation through the configured DNS provider module; the current test topology uses Namecheap API credentials plus a whitelisted droplet IPv4.
- The shared public test host is intentionally non-indexable via `robots.txt` plus `X-Robots-Tag`; this lowers accidental discovery but does not hide the hostname from certificate-transparency logs or direct scans.

## Alternatives Considered

- Local-only deployment as the only supported topology: rejected; weak reviewer signal.
- Cloud-native stack: rejected; excessive V1 complexity.
- Serverless approach: rejected; weak fit for this tenancy model.
