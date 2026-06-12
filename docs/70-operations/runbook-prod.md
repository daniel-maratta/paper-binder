# Runbook: Production Deployment
Status: V1

This runbook covers minimal incident triage and recovery for the supported single-host `V1` deployment topology.
It documents the production-shaped operating model the repo supports; it is not evidence that a public host is currently running.

## Scope

In scope:
- Availability triage.
- Basic recovery actions.
- Weekly operational checks.

Out of scope:
- Formal on-call structure.
- SLA/SLO program.

## Access

- Primary: SSH via the private overlay interface.
- Break-glass: provider console.
- Public entry when deployed: the configured production root host.

## Environment Contract

- Root host: `https://<production-root-host>`
- Tenant host pattern: `https://{tenant}.<production-base-domain>`
- Compose file: `docker-compose.prod.yml`
- Observed current runtime style: manually deployed from checked-out source with locally built images
- Intended deployment contract: tagged GHCR images referenced by `PAPERBINDER_IMAGE_REGISTRY` and `PAPERBINDER_IMAGE_TAG` once the production rollout workflow is adopted on the live host
- Reverse proxy config: `deploy/prod/Caddyfile`
- Public crawler policy: intentionally indexable

Run operational commands from the live app directory that contains `.env`, `docker-compose.prod.yml`, and `deploy/prod/Caddyfile`:

```bash
cd /opt/paperbinder/app
docker compose --env-file .env -f docker-compose.prod.yml ...
```

`/opt/paperbinder` remains the base install directory. The checked-in GitHub deployment workflow still accepts that base directory as input, but it derives the live app directory as `<deploy_path>/app` before it uploads compose assets or runs remote compose commands.
`/opt/paperbinder/app` is the canonical working directory and is owned by the deploy user in the current public environments. `/opt/paperbinder/app/.env` is untracked and should remain mode `600`.

## Triage Checklist

1. Confirm host accessibility and resource headroom.
2. Confirm container health (`docker compose ps`) and app probes:
   - unauthenticated `GET /health/live` returns `200`
   - unauthenticated `GET /health/ready` returns `200`
   - probe payloads remain minimal (no dependency internals or version metadata)
   - production root and tenant hosts do not emit blanket `noindex` policy
3. Confirm root and tenant host routing.
4. Confirm DB connectivity.
5. Check root-host login, tenant-host logout, the configured root-host logout redirect, and CSRF behavior.
6. Confirm root-host provisioning/login require challenge proof and return `429` with `Retry-After` when the shared pre-auth budget is exhausted.
7. Confirm tenant-host `GET /api/tenant/lease` and `POST /api/tenant/lease/extend` behavior matches the documented admin, CSRF, and rate-limit boundary.

## Common Incidents

### Site Unavailable (502/504)
- Verify app container health and logs.
- Verify `/health/live` and `/health/ready` responses.
- Verify reverse-proxy routing.
- Restart affected services if needed.

### Unexpected Deindexing Or Crawl Blocking
- Verify production `GET /robots.txt` does not disallow the site.
- Verify production root-host and tenant-host responses do not emit blanket `X-Robots-Tag: noindex`.
- Remember that the shared test host is intentionally non-indexable; do not copy that proxy policy onto production.

### Tenant Subdomain Routing Failure
- Verify wildcard DNS record.
- Verify proxy host routing.
- Verify host parsing logic in app.

### Wildcard Certificate Issuance Or Renewal Failure
- Verify `NAMECHEAP_API_USER`, `NAMECHEAP_API_KEY`, and `NAMECHEAP_CLIENT_IP`.
- Verify the droplet IPv4 is still whitelisted in Namecheap API Access.
- Verify the production proxy logs.
- Confirm the wildcard and root A records still point to the current host IP.

### Provisioning Spikes or Bot Noise
- Root-host challenge/rate-limit enforcement is live on provisioning and root-host login.
- Use edge-level mitigations or temporary route restrictions if single-node limits are insufficient during a spike.
- Optionally disable provisioning temporarily via config.

### Tenant Cleanup Not Running
- Verify worker/in-process cleanup runtime.
- Verify `PAPERBINDER_LEASE_CLEANUP_INTERVAL_SECONDS`, lease settings, and cleanup logs.
- Look for `tenant_cleanup_cycle_started`, `tenant_cleanup_cycle_completed`, `tenant_cleanup_cycle_failed`, and `tenant_purge_failed`.
- Confirm `PAPERBINDER_AUDIT_RETENTION_MODE` matches the expected purge-summary behavior.

### Cross-Subdomain Login Issues
- Verify `PAPERBINDER_PUBLIC_ROOT_URL` matches the deployed root host.
- Verify cookie domain is `.<production-base-domain>`.
- Verify secure cookie flags and CSRF flow.

## Weekly Checks

- Provision and validate a test tenant when a public deployment is running.
- Confirm tenant lease read/extend behavior from a tenant-admin session.
- Confirm lease-expiration cleanup behavior.
- Confirm production responses remain indexable and do not inherit shared-test `robots.txt` or `X-Robots-Tag: noindex` behavior.
- Confirm disk headroom.
- Confirm the most recent pre-change snapshot exists before any risky infrastructure maintenance window.
- Confirm the current backup or snapshot path still covers the PostgreSQL volume, Data Protection keys, Caddy state, and the server `.env`.

## Recovery and Rollback

- Restart services: `docker compose --env-file .env -f docker-compose.prod.yml restart`.
- Re-apply schema: `docker compose --env-file .env -f docker-compose.prod.yml run --rm migrations`.
- Current observed live-host refresh path: `docker compose --env-file .env -f docker-compose.prod.yml up -d --build`.
- Intended tagged-image rollout path after GHCR adoption: `docker compose --env-file .env -f docker-compose.prod.yml pull`, then `docker compose --env-file .env -f docker-compose.prod.yml run --rm migrations`, then `docker compose --env-file .env -f docker-compose.prod.yml up -d`.
- Roll back under the intended GHCR contract by setting `PAPERBINDER_IMAGE_TAG` in `.env` to the previous known-good release tag and rerunning the production pull, migrations, and `up -d` sequence.
- Validate schema compatibility during rollback. If the older image requires an older schema, run an explicit down-migration before restoring the older app image.
- If the rollback uses `.github/workflows/deploy-prod.yml`, rerun it for the prior tag so the compose file, Caddyfile, and image tag all come from the same release revision.

## Useful Checks

- Service state: `docker compose --env-file .env -f docker-compose.prod.yml ps`
- Proxy logs: `docker compose --env-file .env -f docker-compose.prod.yml logs proxy --since=30m`
- App logs: `docker compose --env-file .env -f docker-compose.prod.yml logs app --since=30m`
- Worker logs: `docker compose --env-file .env -f docker-compose.prod.yml logs worker --since=30m`
- Root-host health: `curl --fail --silent --show-error https://<production-root-host>/health/live`
- Root-host readiness: `curl --fail --silent --show-error https://<production-root-host>/health/ready`

## Non-goals

- 24/7 incident response.
- Enterprise incident process tooling.
