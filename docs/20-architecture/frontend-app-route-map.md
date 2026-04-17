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
Root-host flows are live in CP13, tenant-host routes are live in CP14, and CP15 adds tenant-shell impersonation state plus `/app/users` view-as controls.

## Root Host Route Map

| Route | View Purpose | Primary API Calls | Auth Expectation | Notes |
| --- | --- | --- | --- | --- |
| `/` | Welcome/About + provision | `POST /api/provision` | Anonymous allowed | Live in CP13. Successful provision shows one-time generated credentials in a short-lived root-host handoff state, then navigates only after an explicit user action that uses the server-provided `redirectUrl`. |
| `/login` | Dedicated login view | `POST /api/auth/login` | Anonymous allowed | Live in CP13. Login uses `email`, password, and challenge proof only; redirect uses the server-provided `redirectUrl`. |
| `/about` | Static product/repo context | none | Anonymous allowed | May be a route or in-page section. |

## Tenant Host Route Map

Tenant routes assume redirect entry from provisioning/login to `/app`.
CP14 bootstraps the tenant shell through `GET /api/tenant/lease`, then layers per-view feature calls on top of the shell-owned lease state.

| Route | View Purpose | Primary API Calls | Auth/Policy Expectation | Notes |
| --- | --- | --- | --- | --- |
| `/app` | Tenant home dashboard + lease visibility | `GET /api/tenant/lease`, `GET /api/tenant/impersonation`, `GET /api/binders` | Authenticated tenant member | Lease banner and active-impersonation banner are both shell-owned; dashboard shows reviewer-useful recent binders without a new backend aggregator endpoint. |
| `/app/binders` | Binders list + inline create | `GET /api/binders`, `POST /api/binders` | `BinderRead` for reads, `BinderWrite` for create | List is tenant-scoped only and omits restricted binders the caller cannot access. Binder creation lives on this route rather than on a separate create page. |
| `/app/binders/:binderId` | Binder detail + document summaries + document create + binder policy | `GET /api/binders/{binderId}`, `POST /api/documents`, `GET /api/binders/{binderId}/policy`, `PUT /api/binders/{binderId}/policy` | `BinderRead` for reads, `TenantAdmin` for binder-policy management | Returns binder metadata plus visible `DocumentSummary[]`; archived documents stay hidden by default; document creation stays within the binder route. |
| `/app/documents/:documentId` | Read-only document view | `GET /api/documents/{documentId}` | `BinderRead` | No in-place editing route in V1; archived documents remain directly readable by id; CP14 renders safe markdown source rather than raw HTML. |
| `/app/users` | Tenant user management + view-as start | `GET /api/tenant/users`, `POST /api/tenant/users`, `POST /api/tenant/users/{userId}/role`, `POST /api/tenant/impersonation` | `TenantAdmin` for user management, actor-side `TenantAdmin` for view-as start | Start affordance uses safe eligible/not-eligible copy only; non-admin effective sessions must receive safe forbidden behavior inside the current tenant shell. |

## Route-Linked Actions (Non-Route Endpoints)

- Lease extension action (tenant shell/banner): `POST /api/tenant/lease/extend`
- Impersonation banner status + stop: `GET /api/tenant/impersonation`, `DELETE /api/tenant/impersonation`
- Logout action: `POST /api/auth/logout`

These are action endpoints triggered from multiple views rather than dedicated pages. CP14 wires lease/logout into the tenant shell, and CP15 adds shell-owned impersonation status plus stop behavior.

## Redirect and Guard Rules

- Successful provisioning/login must redirect to tenant host via server-provided `redirectUrl`.
- Successful provisioning keeps the authenticated cookie flow, but generated credentials stay in transient in-memory root-host UI state only until the user explicitly continues to the tenant host.
- Tenant context is server-resolved from host + membership; client tenant hints are ignored for authorization.
- Root-host challenge wrapper markup is browser-owned and must provide label, helper/error association, keyboard reachability, and visible state messaging around the provider surface.
- Tenant-host route access failure behavior:
  - `403`: tenant membership/policy failure
  - `404`: unknown or already-purged tenant/resource
  - `410`: expired tenant before purge
- Tenant host must show safe expired/not-found UI without leaking internals, and generic authorization `403` responses must still normalize into a display-safe access-denied state in the browser.
- While impersonation is active, stopping impersonation must remain reachable from the shell even when the current route has reloaded into a denied state for the effective user.

## API Header and Error Contract (Frontend)

- All `/api/*` requests send `X-Api-Version: 1`.
- All responses must include `X-Correlation-Id` handling as documented in API contracts.
- Unsafe authenticated requests send `X-CSRF-TOKEN` using the existing readable CSRF cookie contract.
- Error rendering uses ProblemDetails and stable `errorCode` semantics.
- Shared client error handling preserves `status`, `errorCode`, display-safe detail, correlation id, and `Retry-After` when present.
- Root-host error UX renders safe, actionable handling for `CHALLENGE_REQUIRED`, `CHALLENGE_FAILED`, `RATE_LIMITED`, `INVALID_CREDENTIALS`, `TENANT_EXPIRED`, `TENANT_NAME_INVALID`, and `TENANT_NAME_CONFLICT`.
- Tenant-host error UX now also renders safe impersonation handling for target-not-found, self-target, already-active, not-active, session-conflict, and CSRF failures.

## Non-Goals

- No BFF route layer in V1.
- No React Router framework mode in V1.
- No route-module server features or server loaders/actions in V1.
- No JWT/token route flow.
- No cross-tenant route affordances.
