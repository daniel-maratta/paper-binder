# FD-0003 - Tenant User Management and Role Assignment

## AI Summary

- User management is tenant-local and admin-gated.
- Roles are assigned through explicit tenant-scoped endpoints and audited.
- v1 simplifies RBAC to a single effective role per user.
- Future versions may adopt multi-role aggregation without changing tenant isolation boundaries.
- Authorization remains policy-based at API boundary with no ad-hoc handler role checks.

## Status
Resolved — integrated into canonical documentation

## Canonical locations
- docs/40-contracts/api-contract.md
- docs/20-architecture/policy-authorization.md
- docs/20-architecture/authn-authz.md
- docs/10-product/user-stories.md

## Why this exists
Current docs define roles and policy-based authorization, but do not fully define the tenant-admin user management contract. This definition resolves endpoint and rule ambiguity for creating users and assigning roles.

## Scope
This definition covers:
- Tenant-scoped user listing, creation, and role assignment.
- Allowed v1 role set and assignment constraints.
- API-boundary policy requirements for user-management actions.

This definition does not cover:
- Self-service sign-up.
- Password recovery/email workflows.
- Cross-tenant user memberships.

## Decision
Tenant user administration is performed only by tenant admins.

Rules:
- v1 roles are `TenantAdmin`, `BinderWrite`, and `BinderRead`.
- v1 simplifies RBAC to one effective role per user.
- This one-role rule is a v1 simplification, not a permanent architecture constraint.
- Future versions may support multiple assigned roles with additive aggregation semantics.
- `TenantAdmin` can create tenant users and assign role at creation time.
- `TenantAdmin` can reassign role for tenant users.
- Last remaining tenant admin cannot be demoted through API.
- User and role management endpoints are tenant-scoped and never accept trusted tenant identity from client payload.

## User-visible behavior
- Tenant admins can view users and current roles.
- Tenant admins can add users and set initial role.
- Tenant admins can change a user's role.
- Non-admin users cannot access management endpoints and receive `403`.

## API / contract impact
Contract additions:
- `GET /api/tenant/users`
- `POST /api/tenant/users`
- `POST /api/tenant/users/{userId}/role`

ProblemDetails expectations:
- `403` for non-admin caller.
- `404` for unknown tenant-scoped user.
- `409` when demotion violates last-admin safety rule.
- `422` for invalid role value.

## Domain / architecture impact
- `UserTenant` membership remains source of truth for tenant linkage.
- Policy enforcement is API-boundary first; handlers do not take caller-role arguments.
- Role assignment updates are mutable security state and must emit audit events.
- Query paths must maintain tenant predicate by construction.
- Future multi-role support should extend assignment shape and evaluator logic without moving authorization out of the API boundary.

## Security / ops impact
- Role-change and user-create actions must be auditable with actor identity.
- Rate limits should protect user-management mutation endpoints from abuse.
- Tenant isolation tests must include denied and allowed management paths.

## Canonical updates required
- `docs/10-product/prd.md` (tenant admin responsibilities)
- `docs/10-product/user-stories.md` (new user-management slice or acceptance criteria)
- `docs/20-architecture/authn-authz.md` and `docs/20-architecture/policy-authorization.md` (role-management paths)
- `docs/40-contracts/api-contract.md` (user-management routes and errors)
- `docs/80-testing/integration-tests.md` and `docs/80-testing/e2e-tests.md` (allow/deny and last-admin safeguards)

## Open questions
None.

## Resolution outcome
No new ADR required. This definition operationalizes existing authorization and tenancy constraints.
