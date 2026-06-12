# Deployment Topology
Status: V1 (Public Demo)

PaperBinder runs on a single-host public demo topology with explicit trust boundaries.

## Scope

In scope:
- Single-host topology and trust boundaries.
- Subdomain routing for tenant resolution.

Out of scope:
- Multi-region, autoscaling, blue/green.
- Full IaC and multi-environment promotion.

## Topology (V1)

Components:
- Reverse proxy at edge:
  - TLS termination
  - host-based routing
  - optional coarse limits
- ASP.NET app host:
  - serves SPA + API
  - exposes `/health/live` and `/health/ready` (anonymous, minimal payload)
  - issues the cross-subdomain auth cookie and companion CSRF cookie
  - resolves tenant from host/subdomain + membership
- PostgreSQL:
  - tenant and app data
- Worker runtime (separate container in the local/demo Compose topology):
  - tenant lease cleanup

## Platform Assumptions

- Separate DigitalOcean droplets (or equivalent single VMs) for production and shared test.
- DNS provider with API access suitable for ACME DNS-01 challenges; the current shared test environment uses Namecheap-managed DNS.
- Caddy reverse proxy.
- Tagged OCI images published to GitHub Container Registry for production rollout.

## Administrative Access

- SSH via Tailscale only.
- Public port 22 closed.
- SSH keys required; password auth disabled.
- Provider console used only for break-glass.

## Trust Boundaries

1. Internet -> reverse proxy:
   - threats: bot traffic, floods, probing
   - controls: TLS and coarse limits
2. Reverse proxy -> app:
   - threats: header spoofing, host injection
   - controls: strict host/subdomain resolution and explicit public-root configuration for redirect construction
3. App -> database:
   - threats: injection, over-privileged access
   - controls: parameterized queries and least-privileged DB user

## Routing and Identity

- Production root host: `paperbinder.danielmaratta.com` (pre-auth).
- Production tenant host: `{tenant}.paperbinder.danielmaratta.com` (tenant-scoped).
- Shared test root host: `paperbinder-test.danielmaratta.com` (pre-auth).
- Shared test tenant host: `{tenant}.paperbinder-test.danielmaratta.com` (tenant-scoped).
- Tenant context is resolved server-side from host + membership.
- `PAPERBINDER_PUBLIC_ROOT_URL` is the canonical public root origin and must share the same host as the configured parent-domain auth cookie.
- Production is indexable by default. Shared test is intentionally non-indexable.

## Anti-Abuse Friction

- Turnstile (or equivalent challenge) is enforced on root-host pre-auth provisioning and login.
- Root-host provisioning and login share one per-IP pre-auth rate-limit budget in the current build.
- Challenge is friction, not an authorization boundary.

## Alternatives Considered

- Local-only hosting: rejected; weak demo signal.
- Full cloud-native stack: rejected; excessive V1 complexity.
- Serverless: rejected; adds complexity for subdomain + stateful DB model.
