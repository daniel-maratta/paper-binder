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
- Loopback debug aliases such as `localhost` are allowed only for compiled-SPA root-host debugging and never establish tenant context.

Root-host flows are pre-auth provisioning/login flows. CP7 ships the backend contracts for provisioning plus shared challenge/rate-limit guards; CP13 adds the live browser wiring on the root host.
Tenant-host flows are authenticated and tenant-scoped.
Root-host flows are live in CP13 and stay bounded to onboarding only; tenant-host feature CRUD remains a later checkpoint.

## Root Host Route Map

| Route | View Purpose | Primary API Calls | Auth Expectation | Notes |
| --- | --- | --- | --- | --- |
| `/` | Welcome/About + provision | `POST /api/provision` | Anonymous allowed | Live in CP13. Successful provision shows one-time generated credentials in a short-lived root-host handoff state, then navigates only after an explicit user action that uses the server-provided `redirectUrl`. |
| `/login` | Dedicated login view | `POST /api/auth/login` | Anonymous allowed | Live in CP13. Login uses `email`, password, and challenge proof only; redirect uses the server-provided `redirectUrl`. |
| `/about` | Static product/repo context | none | Anonymous allowed | May be a route or in-page section. |

## Tenant Host Route Map

Tenant routes assume redirect entry from provisioning/login to `/app`.
CP12 bootstraps the tenant shell through `GET /api/tenant/lease` before rendering placeholder route content; later checkpoints add per-view feature calls.

| Route | View Purpose | Primary API Calls | Auth/Policy Expectation | Notes |
| --- | --- | --- | --- | --- |
| `/app` | Tenant home dashboard + lease visibility | `GET /api/tenant/lease` | Authenticated tenant member | Lease indicator must be visible in tenant shell. |
| `/app/binders` | Binders list | `GET /api/binders` | `BinderRead` | List is tenant-scoped only and omits restricted binders the caller cannot access. |
| `/app/binders/:binderId` | Binder detail + document summaries | `GET /api/binders/{binderId}` | `BinderRead` | Returns binder metadata plus visible `DocumentSummary[]`; archived documents stay hidden by default. |
| `/app/documents/:documentId` | Read-only document view | `GET /api/documents/{documentId}` | `BinderRead` | No in-place editing route in V1; archived documents remain directly readable by id. |
| `/app/users` | Tenant user management | `GET /api/tenant/users`, `POST /api/tenant/users`, `POST /api/tenant/users/{userId}/role` | `TenantAdmin` | Admin-only route; non-admin must receive forbidden behavior. |

## Route-Linked Actions (Non-Route Endpoints)

- Lease extension action (tenant shell/banner): `POST /api/tenant/lease/extend`
- Logout action: `POST /api/auth/logout`

These are action endpoints triggered from multiple views rather than dedicated pages. CP12 reserves the banner and shell slots but does not yet ship lease-extend or logout interaction wiring.

## Redirect and Guard Rules

- Successful provisioning/login must redirect to tenant host via server-provided `redirectUrl`.
- Successful provisioning keeps the authenticated cookie flow, but generated credentials stay in transient in-memory root-host UI state only until the user explicitly continues to the tenant host.
- Tenant context is server-resolved from host + membership; client tenant hints are ignored for authorization.
- Root-host challenge wrapper markup is browser-owned and must provide label, helper/error association, keyboard reachability, and visible state messaging around the provider surface.
- Tenant-host route access failure behavior:
  - `403`: tenant membership/policy failure
  - `404`: unknown or already-purged tenant/resource
  - `410`: expired tenant before purge
- Tenant host must show safe generic expired/not-found UI without leaking internals.

## API Header and Error Contract (Frontend)

- All `/api/*` requests send `X-Api-Version: 1`.
- All responses must include `X-Correlation-Id` handling as documented in API contracts.
- Unsafe authenticated requests send `X-CSRF-TOKEN` using the existing readable CSRF cookie contract.
- Error rendering uses ProblemDetails and stable `errorCode` semantics.
- Shared client error handling preserves `status`, `errorCode`, display-safe detail, correlation id, and `Retry-After` when present.
- Root-host error UX renders safe, actionable handling for `CHALLENGE_REQUIRED`, `CHALLENGE_FAILED`, `RATE_LIMITED`, `INVALID_CREDENTIALS`, `TENANT_EXPIRED`, `TENANT_NAME_INVALID`, and `TENANT_NAME_CONFLICT`.

## Non-Goals

- No BFF route layer in V1.
- No React Router framework mode in V1.
- No route-module server features or server loaders/actions in V1.
- No JWT/token route flow.
- No cross-tenant route affordances.
