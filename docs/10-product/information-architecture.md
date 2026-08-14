# Information Architecture
Status: Current (V1.1.0 presentation-aligned)

This document defines top-level pages and navigation for the demo.

## Root Host (`paperbinder.danielmaratta.com`)

Primary views:
- Product-first landing
- Start Demo flow
- Login
- About
- Hosted flagship article rendered from the accepted article body's Markdown web representation
- Reviewer-support content (secondary public path or section)

Navigation:
- Start Demo
- About
- Featured article from About
- Reviewer Notes (secondary)
- Repo (external link)
- Login/Logout (contextual)

## Tenant Host (`{tenant}.paperbinder.danielmaratta.com`)

Primary views:
- Home dashboard (includes lease status)
- Binders list
- Binder detail (documents list)
- Document details with rendered preview + source toggle (read-only)
- Users and access (admin-only)

Navigation:
- Home
- Binders
- Users
- Account/Logout

## Cross-Cutting UI Elements

- Always-visible time-remaining indicator in tenant shell.
- Top-of-page lease-extension banner only when the server reports the extension window is open.
- Users management actions stay on `/app/users` through same-route expandable panels.
- Safe expired/not-found page for invalid or expired tenant host.

## Alternatives Considered

- Single host without subdomains: rejected; weak tenancy signal.
- Deep feature-heavy IA: rejected; exceeds V1 scope.
