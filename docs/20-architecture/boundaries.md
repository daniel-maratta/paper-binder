# Boundaries
Status: V1

This document defines code placement and dependency direction for V1.

## Scope

In scope:
- API boundary, tenancy resolution boundary, auth boundary.
- Domain/application separation.
- Infrastructure boundaries (DB, adapters, worker jobs).

Out of scope:
- Full DDD taxonomy.
- Microservice decomposition.
- Multi-environment architecture expansion.

## Layer Model

1. Presentation (HTTP/Web):
   - endpoints, middleware, request/response shaping, auth gates.
2. Application:
   - use-case orchestration, policy checks, cross-cutting behavior.
3. Domain:
   - invariants and business rules; no DB/HTTP/provider calls.
4. Infrastructure:
   - Dapper data access, migrations tooling, providers, worker runtime.

## Hard Rules

### Tenancy
- Tenant scope is server-resolved.
- Client tenant identifiers are never trusted for scoping.

### Authentication and Authorization
- Enforce authn/authz at API boundary (and application orchestration where needed).
- Domain code does not depend on ASP.NET identity primitives.

### Data Access
- Runtime data access is Dapper-only in V1.
- Domain code does not reference SQL or infrastructure types.

### AI
- AI execution stays in application layer via interfaces.
- Domain code does not invoke provider adapters.

## Demo Friction Boundary

- Challenge checks are anti-abuse friction for pre-auth actions.
- Friction is not a substitute for tenant authn/authz controls.

## Non-goals

- Over-generalized framework design.
- Multiple service splits for the same concern in V1.

## Alternatives Considered

- No explicit boundary document: rejected; drift risk.
- Full service split (API/worker/AI): rejected; unnecessary V1 ops burden.
- Domain-to-DB direct access: rejected; poor testability and coupling.
