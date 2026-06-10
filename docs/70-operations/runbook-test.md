# Runbook: Shared Test Deployment
Status: V1

This runbook covers the supported shared test environment for PaperBinder. It documents the repo-backed test deployment shape and the operator checks that matter before promoting production-facing changes.

## Scope

In scope:
- Shared-test deployment verification.
- DNS, TLS, and proxy checks for the public test host.
- Basic recovery actions for the source-build test stack.

Out of scope:
- Production rollout approval.
- Provider-account procedures not represented in this repo.
- Private host inventory such as current droplet IPs, SSH targets, or live secret values.

## Environment Contract

The shared test environment is intentionally distinct from both local development and production:

- Root host: `https://<shared-test-root-host>`
- Tenant host pattern: `https://{tenant}.<shared-test-base-domain>`
- Compose file: `docker-compose.test.yml`
- Compose project name: `paperbinder-test` (declared in the checked-in Compose file)
- Reverse proxy config: `deploy/test/Caddyfile`
- Public crawler policy: intentionally non-indexable via `robots.txt` and `X-Robots-Tag`
- Observed current runtime style: manual deployment from checked-out source with locally built images
- GHCR validation path: `.github/workflows/deploy-test.yml` stages `docker-compose.test-deploy.yml` plus the checked-in test Caddy assets, joins the tailnet before SSH, and validates the deploy-by-tag model on the shared-test host before production adoption
- Intended long-term split: shared test remains source-build by default unless the repo's supported runtime contract is changed explicitly

Expected services:

| Service | Expected state | Notes |
| --- | --- | --- |
| `proxy` | Up | Caddy reverse proxy; owns ports 80, 443 TCP, and 443 UDP |
| `app` | Up | ASP.NET app host; internal port 8080 |
| `worker` | Up | Background cleanup worker |
| `db` | Up / healthy | PostgreSQL 17; bound to loopback on the host |
| `migrations` | Exited 0 after deploy/update | One-shot schema application |

## Command Prefix

Run operational commands from the deployment root that contains `.env` and `docker-compose.test.yml`:

```bash
cd /opt/paperbinder/app
docker compose --env-file .env -f docker-compose.test.yml ...
```

Use the checked-in test Compose file explicitly. Because `docker-compose.test.yml` already declares `name: paperbinder-test`, an extra `-p paperbinder-test` is usually unnecessary when you invoke that file directly.
`/opt/paperbinder` is the default base install directory. `/opt/paperbinder/app` is the canonical working directory, is owned by the deploy user in the current shared-test environment, and stores the untracked `.env` file with expected mode `600`.

## Service Inventory

Check current service state:

```bash
cd /opt/paperbinder/app
docker compose --env-file .env -f docker-compose.test.yml ps
```

Expected proxy bindings:

- `0.0.0.0:80->80/tcp`
- `0.0.0.0:443->443/tcp`
- `0.0.0.0:443->443/udp`
- IPv6 equivalents may also appear

## DNS Validation

Shared test uses Namecheap-managed DNS for the root host and wildcard tenant host. Validate that both names resolve to the current shared-test host IP; do not treat a previously recorded IP address as canonical repo data.

Verify the root host:

```bash
dig @1.1.1.1 <shared-test-root-host> +short
dig @8.8.8.8 <shared-test-root-host> +short
```

Verify a representative tenant host:

```bash
dig @1.1.1.1 <representative-tenant-host> +short
dig @8.8.8.8 <representative-tenant-host> +short
```

Expected result:

- Both root and representative tenant names resolve to the same current host IP.

## TLS And Proxy Validation

The test environment uses Caddy-managed Let's Encrypt certificates with Namecheap DNS-01 validation.

Validate the root host:

```bash
curl -Iv https://<shared-test-root-host>
```

Expected result:

- TLS verification succeeds.
- Certificate subject matches `<shared-test-root-host>`.
- Root host returns a successful HTTP response.
- Response includes the shared-test non-indexing behavior, either through `robots.txt` or `X-Robots-Tag`.

Inspect the root certificate:

```bash
openssl s_client \
  -connect <shared-test-root-host>:443 \
  -servername <shared-test-root-host> \
  </dev/null 2>/dev/null | openssl x509 -noout -issuer -subject -dates
```

Validate a representative tenant host:

```bash
curl -Iv https://<representative-tenant-host>
```

Expected result:

- TLS verification succeeds.
- Certificate subject or SAN matches `*.<shared-test-base-domain>`.
- A `404` is acceptable when the representative tenant does not exist; that is an application-routing outcome, not necessarily a proxy or certificate failure.

Inspect the wildcard certificate:

```bash
openssl s_client \
  -connect <representative-tenant-host>:443 \
  -servername <representative-tenant-host> \
  </dev/null 2>/dev/null | openssl x509 -noout -issuer -subject -dates -ext subjectAltName
```

Confirm the explicit non-indexing policy:

```bash
curl -I https://<shared-test-root-host>/robots.txt
curl -I https://<shared-test-root-host>
```

Expected result:

- `robots.txt` is served by the proxy from `deploy/test/robots.txt`.
- Root and tenant-host responses may emit `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`.

## ACME DNS-01 Challenge Records

Caddy may create temporary TXT records during certificate issuance or renewal at:

- `_acme-challenge.<shared-test-base-domain>`

In the Namecheap UI, the host value is typically:

- the `_acme-challenge` label for the shared-test base domain

Check authoritative Namecheap DNS:

```bash
dig @dns1.registrar-servers.com TXT _acme-challenge.<shared-test-base-domain> +short
dig @dns2.registrar-servers.com TXT _acme-challenge.<shared-test-base-domain> +short
```

Check public recursive DNS:

```bash
dig @1.1.1.1 TXT _acme-challenge.<shared-test-base-domain> +short
dig @8.8.8.8 TXT _acme-challenge.<shared-test-base-domain> +short
```

Expected steady-state result after cleanup:

- No TXT records remain.

If stale TXT records remain after successful certificate issuance:

1. Verify root-host HTTPS.
2. Verify wildcard-host HTTPS.
3. Check proxy logs for active ACME activity.
4. If Caddy is not recreating the record, remove the stale TXT record from Namecheap.
5. Recheck authoritative DNS before trusting recursive resolvers.

Do not treat leftover TXT records as an outage when certificates are valid and no active renewal is running.

## Proxy Logs

Check recent ACME- or certificate-related proxy logs:

```bash
cd /opt/paperbinder/app
docker compose --env-file .env -f docker-compose.test.yml logs proxy --since=6h \
  | grep -Ei "acme|challenge|certificate|cert|dns|cleanup|error|failed"
```

Check unfiltered recent proxy logs:

```bash
cd /opt/paperbinder/app
docker compose --env-file .env -f docker-compose.test.yml logs proxy --since=6h | tail -200
```

Useful success indicators include ACME renewal or certificate-storage entries for both the root host and the wildcard host.

## Compose Metadata

If the active Compose metadata is unclear, inspect the current proxy container id reported by Compose:

```bash
cd /opt/paperbinder/app
proxy_id="$(docker compose --env-file .env -f docker-compose.test.yml ps -q proxy)"
docker inspect "$proxy_id" --format 'Name={{.Name}}
Project={{ index .Config.Labels "com.docker.compose.project" }}
Service={{ index .Config.Labels "com.docker.compose.service" }}
WorkingDir={{ index .Config.Labels "com.docker.compose.project.working_dir" }}
ConfigFiles={{ index .Config.Labels "com.docker.compose.project.config_files" }}'
```

Expected values:

- Project: `paperbinder-test`
- Service: `proxy`
- Config file includes `docker-compose.test.yml`

## Port Ownership

Confirm what is listening on the public HTTP and HTTPS ports:

```bash
ss -ltnp | grep -E ':80|:443'
```

Expected result:

- Docker-owned bindings for the proxy container

## Restart Procedures

Restart only the proxy:

```bash
cd /opt/paperbinder/app
docker compose --env-file .env -f docker-compose.test.yml restart proxy
```

Restart only the app service:

```bash
cd /opt/paperbinder/app
docker compose --env-file .env -f docker-compose.test.yml restart app
```

Restart the full stack without rebuilding source images:

```bash
cd /opt/paperbinder/app
docker compose --env-file .env -f docker-compose.test.yml up -d
```

Refresh the source-build images and restart the stack:

```bash
cd /opt/paperbinder/app
docker compose --env-file .env -f docker-compose.test.yml up -d --build
```

Avoid unnecessary restarts during active ACME validation unless the failure mode is understood.

## Snapshot Before Or After Changes

Use this snapshot before and after infrastructure or config changes:

```bash
cd /opt/paperbinder/app
docker compose --env-file .env -f docker-compose.test.yml ps
curl -Iv https://<shared-test-root-host>
curl -Iv https://<representative-tenant-host>
openssl s_client \
  -connect <shared-test-root-host>:443 \
  -servername <shared-test-root-host> \
  </dev/null 2>/dev/null | openssl x509 -noout -issuer -subject -dates
openssl s_client \
  -connect <representative-tenant-host>:443 \
  -servername <representative-tenant-host> \
  </dev/null 2>/dev/null | openssl x509 -noout -issuer -subject -dates -ext subjectAltName
dig @dns1.registrar-servers.com TXT _acme-challenge.<shared-test-base-domain> +short
dig @dns2.registrar-servers.com TXT _acme-challenge.<shared-test-base-domain> +short
```

## Troubleshooting Guide

### `docker compose ps` shows no services

Likely causes:

- Command ran outside the deployment root.
- Command used the default local `docker-compose.yml` instead of `docker-compose.test.yml`.

Use:

```bash
cd /opt/paperbinder/app
docker compose --env-file .env -f docker-compose.test.yml ps
```

### Root host works but tenant host fails TLS

Likely causes:

- Wildcard DNS record is missing or stale.
- Wildcard certificate was not issued or renewed.
- ACME DNS-01 validation failed.
- Namecheap API configuration or whitelist state is wrong.

Checks:

```bash
dig @1.1.1.1 <representative-tenant-host> +short
docker compose --env-file .env -f docker-compose.test.yml logs proxy --since=6h \
  | grep -Ei "acme|challenge|certificate|cert|dns|cleanup|error|failed"
```

### Tenant host returns `404`

If TLS succeeds and the request is reaching the app surface, a `404` is compatible with missing tenant seed data or host-to-tenant resolution state. Treat it as an application check, not an automatic infra outage.

### ACME TXT records remain after issuance

If certificates are valid and Caddy is not recreating records, remove the stale record in Namecheap and verify authoritative DNS again before waiting on recursive caches.

### Caddy recreates ACME TXT records

Check proxy logs for an active issuance or renewal attempt. Do not manually delete the record mid-validation unless intentionally resetting the ACME flow.

### Root host returns a failing HTTP response

Check service state:

```bash
docker compose --env-file .env -f docker-compose.test.yml ps
```

Check proxy logs:

```bash
docker compose --env-file .env -f docker-compose.test.yml logs proxy --since=30m
```

Check app logs:

```bash
docker compose --env-file .env -f docker-compose.test.yml logs app --since=30m
```

## Promotion Notes

Before treating the shared test environment as promotion evidence, capture:

- Current git commit SHA
- Current source checkout state
- Non-secret `.env` values relevant to hostnames, rate limits, lease settings, and challenge settings
- Current certificate expiry dates
- Root-host and representative tenant-host smoke-check results
- Confirmation that the shared-test non-indexing policy is still active

Do not copy shared-test settings into production without separately reviewing hostnames, cookie domain, challenge keys, Namecheap API values, indexing policy, and whether the rollout is source-build or GHCR-image based.
