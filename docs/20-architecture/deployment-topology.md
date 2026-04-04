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
  - coarse security headers and optional coarse limits
- ASP.NET app host:
  - serves SPA + API
  - exposes `/health/live` and `/health/ready` (anonymous, minimal payload)
  - validates challenge for pre-auth actions
  - resolves tenant from host/subdomain + membership
- PostgreSQL:
  - tenant and app data
- Worker runtime (separate container in the local/demo Compose topology):
  - tenant lease cleanup

## Platform Assumptions

- DigitalOcean droplet (or equivalent single VM).
- Cloudflare DNS (DNS only, no proxy).
- Caddy reverse proxy.

## Administrative Access

- SSH via Tailscale only.
- Public port 22 closed.
- SSH keys required; password auth disabled.
- Provider console used only for break-glass.

## Trust Boundaries

1. Internet -> reverse proxy:
   - threats: bot traffic, floods, probing
   - controls: TLS, coarse limits, headers
2. Reverse proxy -> app:
   - threats: header spoofing, host injection
   - controls: strict host/subdomain resolution and forwarded-header validation
3. App -> database:
   - threats: injection, over-privileged access
   - controls: parameterized queries and least-privileged DB user

## Routing and Identity

- Root host: `lab.danielmaratta.com` (pre-auth).
- Tenant host: `{tenant}.lab.danielmaratta.com` (tenant-scoped).
- Tenant context is resolved server-side from host + membership.

## Anti-Abuse Friction

- Turnstile (or equivalent challenge) is required on root-host pre-auth actions.
- Verification is server-side before provisioning or root-host login executes.
- Challenge is friction, not an authorization boundary.

## Alternatives Considered

- Local-only hosting: rejected; weak demo signal.
- Full cloud-native stack: rejected; excessive V1 complexity.
- Serverless: rejected; adds complexity for subdomain + stateful DB model.
