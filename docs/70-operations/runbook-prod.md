# Runbook (Public Demo)
Status: V1

This runbook covers minimal incident triage and recovery for the public demo.

## Scope

In scope:
- Availability triage.
- Basic recovery actions.
- Weekly operational checks.

Out of scope:
- Formal on-call structure.
- SLA/SLO program.

## Access

- Primary: SSH via Tailscale.
- Break-glass: provider console.
- Public entry: `https://lab.danielmaratta.com/`.

## Triage Checklist

1. Confirm host accessibility and resource headroom.
2. Confirm container health (`docker compose ps`) and app probes:
   - unauthenticated `GET /health/live` returns `200`
   - unauthenticated `GET /health/ready` returns `200`
   - probe payloads remain minimal (no dependency internals or version metadata)
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

### Tenant Subdomain Routing Failure
- Verify wildcard DNS record.
- Verify proxy host routing.
- Verify host parsing logic in app.

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
- Verify cookie domain is `.lab.danielmaratta.com`.
- Verify secure cookie flags and CSRF flow.

## Weekly Checks

- Provision and validate a test tenant.
- Confirm tenant lease read/extend behavior from a tenant-admin session.
- Confirm lease-expiration cleanup behavior.
- Confirm backup freshness.
- Confirm disk headroom.

## Recovery and Rollback

- Restart services: `docker compose restart`.
- Re-apply schema if the migration container did not complete cleanly: `docker compose run --rm migrations`.
- Redeploy current revision: `docker compose up -d --build`.
- Roll back to previous known-good revision/tag when needed.
- Validate schema compatibility during rollback.

## Non-goals

- 24/7 incident response.
- Enterprise incident process tooling.
