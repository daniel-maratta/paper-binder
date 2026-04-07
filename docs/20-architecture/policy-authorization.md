# Policy Authorization

## Authorization Placement

- Authorization is enforced at the API boundary via named policies/requirements.
- Every endpoint that invokes an application handler must attach an authorization policy.
- Command/query handlers assume authorization has already been enforced.
- Handlers must not accept caller-role parameters.

## Named Policies

- `AuthenticatedUser`: requires an authenticated principal plus an established request-scoped tenant membership context.
- `BinderRead`: requires tenant membership with effective role `BinderRead` or higher.
- `BinderWrite`: requires tenant membership with effective role `BinderWrite` or higher.
- `TenantAdmin`: requires tenant membership with effective role `TenantAdmin`.

## Host Gating

- Tenant-host-only and system-host-only routes are marked explicitly with resolved-host metadata.
- Host gating is enforced from `IRequestResolvedTenantHostContext` before CSRF or authorization middleware runs.
- Wrong-host requests to scoped routes return `404` instead of falling through to handler logic.

## Role Model (v1)

- v1 RBAC uses one effective role per user per tenant.
- This is a v1 simplification, not a permanent architecture constraint.
- Future versions may support multi-role additive aggregation while preserving API-boundary enforcement and tenant isolation rules.

## Binder Policy Layer

- Binder access evaluation is layered:
  1. Resolve immutable tenant context.
  2. Enforce endpoint policy (`BinderRead` or `BinderWrite`).
  3. Evaluate binder policy for requested binder.
  4. Allow only when all checks pass.
- Binder policy modes:
  - `inherit` (default): endpoint policy is sufficient.
  - `restricted_roles`: endpoint policy plus binder-level role allow-list.
- Binder policy evaluation remains in application/domain authorization abstractions.

## System Execution Paths

- Background services and other system paths execute through explicit system execution context.
- System execution must not impersonate end users.
- System execution permissions are reviewed separately from interactive user policies.
