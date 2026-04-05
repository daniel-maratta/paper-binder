# Phase 2 - Security Boundary

Checkpoints: CP5, CP6, CP7, CP8

## Goal

Establish the tenant resolution, authentication, abuse controls, provisioning surface, and authorization policy system so that all product-domain work operates within a proven security boundary.

## Entry Conditions

- Phase 1 exit criteria are satisfied.
- Platform builds, deploys locally, and passes protocol-level tests.
- Tenancy resolution rules are defined in `docs/20-architecture/tenancy-resolution.md`.
- Auth model is ASP.NET Core Identity per canonical decisions.

## Checkpoints

### CP5 - Tenancy Resolution And Immutable Tenant Context

- Host/subdomain parsing and tenant resolution middleware/services.
- Immutable request-scoped tenant context abstractions.
- Host validation and rejection paths for invalid or unknown tenants.
- Integration tests for spoofed tenant hints, invalid hosts, unknown tenants.

### CP6 - Identity, Authentication, And Membership Validation

- ASP.NET Core Identity integration, cross-subdomain cookie configuration, CSRF protection.
- Login/logout endpoints and authenticated session flow.
- Tenant membership model and membership validation during tenant-host requests.
- Integration tests for login, logout, CSRF enforcement, missing membership, expired-tenant auth failures.

### CP7 - Pre-Auth Abuse Controls And Provisioning Surface

- Challenge verification integration with environment-gated test bypass.
- Rate limits for provisioning and root-host login flows.
- `POST /api/provision` transactional tenant creation with owner user, membership, lease, and session establishment only.
- Integration tests for challenge-required, rate-limited, successful, and rollback-on-failure paths.

### CP8 - Authorization Policies And Tenant User Administration

- Named policies, requirements, and endpoint policy mapping.
- Tenant user list/create and role assignment endpoints.
- Last-admin protection and invalid-role handling.
- Integration tests for allow/deny paths across role and tenant boundaries.

## Exit Criteria

- Tenant context is resolved server-side once per request and cannot be overridden by client payloads.
- Authenticated requests establish both user and tenant context correctly.
- Wrong-host or missing-membership access is rejected before feature handlers run.
- Provisioning is all-or-nothing with challenge bypass test-only.
- All protected endpoints use explicit policy enforcement with no ad-hoc role checks.
- Integration tests prove cross-tenant access is rejected at every layer.

## Task Integration

Each checkpoint should map to one or more tasks under `docs/05-taskboard/tasks/`. Security checkpoints are release-blocking; mark tasks accordingly with appropriate priority. Reference the checkpoint ID in task context fields.

## Key References

- [execution-plan.md](../execution-plan.md) - Full checkpoint details
- [docs/30-security/tenant-isolation.md](../../30-security/tenant-isolation.md) - Tenant isolation rules
- [docs/20-architecture/tenancy-resolution.md](../../20-architecture/tenancy-resolution.md) - Tenancy resolution
- [docs/30-security/AGENTS.md](../../30-security/AGENTS.md) - Security agent guidance
