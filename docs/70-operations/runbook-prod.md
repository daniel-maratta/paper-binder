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
5. Check root-host login, tenant-host logout, and CSRF behavior.
6. Remember that challenge verification and root-login rate limiting remain CP7 work and are not expected in the current CP6 build.

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
- Root-host challenge/rate-limit enforcement is not live until CP7.
- Use edge-level mitigations or temporary route restrictions if demo abuse appears before CP7 lands.
- Optionally disable provisioning temporarily via config.

### Tenant Cleanup Not Running
- Verify worker/in-process cleanup runtime.
- Verify lease settings and cleanup logs.

### Cross-Subdomain Login Issues
- Verify `PAPERBINDER_PUBLIC_ROOT_URL` matches the deployed root host.
- Verify cookie domain is `.lab.danielmaratta.com`.
- Verify secure cookie flags and CSRF flow.

## Weekly Checks

- Provision and validate a test tenant.
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
