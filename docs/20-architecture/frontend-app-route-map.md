# Frontend App Route Map
Status: V1 (Implementation Contract)

## AI Summary

- Defines canonical frontend route behavior for root-host and tenant-host contexts.
- Maps UI routes to API endpoints, auth expectations, and failure behavior.
- Keeps tenant resolution server-authoritative and host-driven.
- Treats this map as the route-level implementation contract for V1.

## Purpose

This document removes route-level ambiguity for the React SPA described in:

- `docs/20-architecture/frontend-spa.md`
- `docs/10-product/information-architecture.md`
- `docs/10-product/ux-notes.md`
- `docs/40-contracts/api-contract.md`

## Host Contexts

- Root host: `lab.danielmaratta.com`
- Tenant host: `{tenant}.lab.danielmaratta.com`

Root-host flows are pre-auth provisioning/login flows. CP7 ships the backend contracts for provisioning plus shared challenge/rate-limit guards; browser UI wiring remains a later frontend checkpoint.
Tenant-host flows are authenticated and tenant-scoped.

## Root Host Route Map

| Route | View Purpose | Primary API Calls | Auth Expectation | Notes |
| --- | --- | --- | --- | --- |
| `/` | Welcome/About + provision + login entry | `POST /api/provision`, `POST /api/auth/login` | Anonymous allowed | Provisioning and login both target live root-host API contracts; dedicated browser UI wiring lands in CP13. |
| `/login` | Dedicated login view (if split from `/`) | `POST /api/auth/login` | Anonymous allowed | Same semantics as root login section; challenge and shared pre-auth throttling are enforced at the API boundary. |
| `/about` | Static product/repo context | none | Anonymous allowed | May be a route or in-page section. |

## Tenant Host Route Map

Tenant routes assume redirect entry from provisioning/login to `/app`.

| Route | View Purpose | Primary API Calls | Auth/Policy Expectation | Notes |
| --- | --- | --- | --- | --- |
| `/app` | Tenant home dashboard + lease visibility | `GET /api/tenant/lease` | Authenticated tenant member | Lease indicator must be visible in tenant shell. |
| `/app/binders` | Binders list | `GET /api/binders` | `BinderRead` | List is tenant-scoped only and omits restricted binders the caller cannot access. |
| `/app/binders/:binderId` | Binder detail + document summaries | `GET /api/binders/{binderId}` | `BinderRead` | CP9 returns binder metadata plus `documents: []`; archived/default document behavior lands with document persistence. |
| `/app/documents/:documentId` | Read-only document view | `GET /api/documents/{documentId}` | `BinderRead` | No in-place editing route in V1. |
| `/app/users` | Tenant user management | `GET /api/tenant/users`, `POST /api/tenant/users`, `POST /api/tenant/users/{userId}/role` | `TenantAdmin` | Admin-only route; non-admin must receive forbidden behavior. |

## Route-Linked Actions (Non-Route Endpoints)

- Lease extension action (tenant shell/banner): `POST /api/tenant/lease/extend`
- Logout action: `POST /api/auth/logout`

These are action endpoints triggered from multiple views rather than dedicated pages.

## Redirect and Guard Rules

- Successful provisioning/login must redirect to tenant host via server-provided `redirectUrl`.
- Tenant context is server-resolved from host + membership; client tenant hints are ignored for authorization.
- Tenant-host route access failure behavior:
  - `403`: tenant membership/policy failure
  - `404`: unknown or already-purged tenant/resource
  - `410`: expired tenant before purge
- Tenant host must show safe generic expired/not-found UI without leaking internals.

## API Header and Error Contract (Frontend)

- All `/api/*` requests send `X-Api-Version: 1`.
- All responses must include `X-Correlation-Id` handling as documented in API contracts.
- Error rendering uses ProblemDetails and stable `errorCode` semantics.

## Non-Goals

- No BFF route layer in V1.
- No React Router framework mode in V1.
- No route-module server features or server loaders/actions in V1.
- No JWT/token route flow.
- No cross-tenant route affordances.
