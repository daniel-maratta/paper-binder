# Phase 4 - Frontend Experience

Checkpoints: CP12, CP13, CP14, CP15

## Goal

Build the browser experience from foundation through complete product flows, including root-host onboarding, tenant-host product UX, and tenant-local impersonation.

## Entry Conditions

- Phase 3 exit criteria are satisfied.
- Backend API surface for binders, documents, users, provisioning, and lease is complete and tested.
- API contract and error behavior are stable.

## Checkpoints

### CP12 - Frontend Foundation And Shared UI System

- App shell, route skeleton, API client layer, and auth-aware routing.
- Shared UI primitives for forms, tables, alerts, dialogs, and status badges.
- Frontend build/test pipeline and route-map alignment.
- Component-level tests for shared primitives and client error handling.

### CP13 - Root-Host Frontend Flows

- Landing/provisioning view and login view on root host.
- Challenge flow, provisioning, login, and redirect handling wiring.
- User-facing ProblemDetails-based failure handling.
- E2E coverage for provisioning and login happy/deny paths.

### CP14 - Tenant-Host Frontend Flows

- Dashboard, binder list/detail, and document detail/create flows.
- Tenant user management and binder policy UI for `TenantAdmin`.
- Lease-status banner/countdown and extend interaction.
- E2E coverage for normal user, admin, forbidden, expired, and logout flows.

### CP15 - Tenant-Local Impersonation And Audit Safety

- Start/stop impersonation application flow and API endpoints.
- Tenant-local validation preventing cross-tenant impersonation.
- Audit events and session-state handling.
- Integration tests for same-tenant success, cross-tenant denial, and audit behavior.

## Exit Criteria

- Frontend builds cleanly and shared primitives are stable.
- A user can provision a tenant and log in through the browser.
- The end-to-end reviewer workflow works in the browser.
- UI permissions align with API policy behavior.
- Cross-tenant impersonation is impossible and audit behavior matches expectations.
- E2E tests cover major happy and deny paths.

## Task Integration

Each checkpoint should map to one or more tasks under `docs/05-taskboard/tasks/`. E2E test tasks should reference the specific user flows being validated. Reference the checkpoint ID in task context fields.

## Key References

- [execution-plan.md](../execution-plan.md) - Full checkpoint details
- [docs/10-product/prd.md](../../10-product/prd.md) - Product requirements
- [docs/40-contracts/api-contract.md](../../40-contracts/api-contract.md) - API contract
