# FD-0004 - Binder Policy Model

## AI Summary

- Binder-level policy is explicit, tenant-scoped, and evaluated after API boundary policy checks.
- Default behavior inherits tenant role permissions unless a binder policy restricts access.
- Policy evaluation remains centralized in application/domain authorization abstractions.
- Binder policy changes are auditable security-relevant mutations.

## Status
Resolved — integrated into canonical documentation

## Canonical locations
- docs/40-contracts/api-contract.md
- docs/20-architecture/policy-authorization.md
- docs/10-product/prd.md
- docs/10-product/domain-nouns.md

## Why this exists
The docs establish policy-based authorization and mention binder access constraints, but they do not define a concrete binder policy model. Teams need one contract for representation and evaluation order.

## Scope
This definition covers:
- Binder policy representation and default behavior.
- Binder policy evaluation order.
- API mutations for binder policy.

This definition does not cover:
- Policy DSL/expression engine.
- Attribute-based access control beyond role-based v1 needs.
- Cross-tenant or external principal rules.

## Decision
Binder policy is modeled as an optional binder-local role restriction layer.

Rules:
- Every binder has a policy mode: `inherit` (default) or `restricted_roles`.
- `inherit` means tenant role policies (`BinderRead`, `BinderWrite`) are sufficient.
- `restricted_roles` adds binder-specific allowed-role checks on top of tenant role policies.
- Evaluation order for binder access:
  1. Resolve immutable tenant context.
  2. Enforce endpoint policy (`BinderRead` or `BinderWrite`).
  3. Evaluate binder policy for requested binder.
  4. Allow only if all checks pass.

## User-visible behavior
- Binder policies can be viewed and updated by tenant admins.
- Restricted binders may deny access to users who otherwise have general binder permissions.
- Denied access returns consistent authorization errors.

## API / contract impact
Contract additions:
- `GET /api/binders/{binderId}/policy`
- `PUT /api/binders/{binderId}/policy`

Policy shape (conceptual):
- `mode`: `inherit` | `restricted_roles`
- `allowedRoles`: role list (required when `mode=restricted_roles`)

ProblemDetails expectations:
- `403` for unauthorized caller or restricted binder access.
- `404` for unknown tenant-scoped binder.
- `422` for invalid policy payload.

## Domain / architecture impact
- `BinderPolicy` remains tenant-scoped by construction.
- Policy evaluator stays in application/domain layer; handlers remain free of ad-hoc role checks.
- Policy write operations emit audit events and update timestamps.

## Security / ops impact
- Binder policy is a security boundary control and must be covered by integration tests.
- Tenant-scoped data access and policy reads/writes require mandatory tenant predicates.
- Operational logs should include policy mode transitions and actor identity.

## Canonical updates required
- `docs/10-product/prd.md` and `docs/10-product/domain-nouns.md` (binder policy representation)
- `docs/20-architecture/policy-authorization.md` (evaluation order and layering)
- `docs/40-contracts/api-contract.md` (policy endpoints and errors)
- `docs/80-testing/test-strategy.md` and `docs/80-testing/integration-tests.md` (policy allow/deny scenarios)

## Open questions
None.

## Resolution outcome
No new ADR required. This definition remains within current authorization and tenancy boundaries.
