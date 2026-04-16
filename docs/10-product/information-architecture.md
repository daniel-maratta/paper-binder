# Information Architecture
Status: V1

This document defines top-level pages and navigation for the demo.

## Root Host (`lab.danielmaratta.com`)

Primary views:
- Welcome/About
- Challenge widget
- Login
- Provision tenant
- Provisioning handoff (one-time credentials + continue to tenant)

Navigation:
- About
- Repo (external link)
- Login/Logout (contextual)

## Tenant Host (`{tenant}.lab.danielmaratta.com`)

Primary views:
- Home dashboard (includes lease status)
- Binders list
- Binder detail (documents list)
- Document view (read-only)
- Tenant users (admin-only)

Navigation:
- Home
- Binders
- Account/Logout

## Cross-Cutting UI Elements

- Always-visible lease indicator in tenant shell.
- Expiration warning threshold near end of lease.
- Safe expired/not-found page for invalid or expired tenant host.

## Alternatives Considered

- Single host without subdomains: rejected; weak tenancy signal.
- Deep feature-heavy IA: rejected; exceeds V1 scope.
