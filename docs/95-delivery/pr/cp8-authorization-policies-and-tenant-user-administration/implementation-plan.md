# CP8 Implementation Plan: Authorization Policies And Tenant User Administration
Status: Current Plan

## Goal

Implement CP8 so policy-based RBAC is enforced at the API boundary and tenant admins can manage tenant-local users without weakening tenant isolation or violating existing auth/CSRF contracts.

## Scope

Included:
- named authorization policies and explicit endpoint policy mapping
- request-scoped authenticated membership context
- tenant-host and system-host route gating using the existing request-host context model
- `GET /api/tenant/users`
- `POST /api/tenant/users`
- `POST /api/tenant/users/{userId}/role`
- last-admin protection
- invalid role, invalid password, duplicate email, and unknown-tenant-user ProblemDetails mapping
- unit and integration coverage
- synchronized checkpoint, taskboard, contract, architecture, testing, and delivery docs

Not included:
- lease endpoints (`CP11`)
- binder or document endpoints (`CP9`/`CP10`)
- frontend work (`CP12+`)
- multi-role aggregation
- invite/reset-email flows
- audit persistence or audit UI

## Locked Design Decisions

- Lease endpoints remain out of scope until CP11.
- Add a new DI-scoped `IRequestTenantMembershipContext` populated by `TenantResolutionMiddleware` after authenticated membership validation succeeds.
- Do not use `.RequireHost()`. Continue using the existing tenancy-resolution host model and centralize host checks with request-host-context-backed route extensions or endpoint filters.
- Role hierarchy is fixed for v1:
  - `TenantAdmin` satisfies `TenantAdmin`, `BinderWrite`, and `BinderRead`
  - `BinderWrite` satisfies `BinderWrite` and `BinderRead`
  - `BinderRead` satisfies `BinderRead`
- Preserve atomicity for tenant-user creation:
  - validate password with Identity password validators
  - normalize email/name with `ILookupNormalizer`
  - hash with `IPasswordHasher<PaperBinderUser>`
  - generate `SecurityStamp`
  - insert `users` and `user_tenants` inside one Dapper transaction
- Existing `PaperBinderCsrfMiddleware` remains authoritative for authenticated unsafe tenant-host `/api/*` requests.
- Test-only policy probe routes are registered only through `PaperBinderApplicationHost.StartAsync(..., configureBeforeStart: ...)`.

## Planned Work

1. Update checkpoint/taskboard/delivery artifacts for CP8 start.
2. Add request-scoped tenant-membership context and authorization requirement/handler infrastructure.
3. Add host-gating extensions/filters using `IRequestResolvedTenantHostContext`.
4. Map explicit named policies:
   - `AuthenticatedUser`
   - `BinderRead`
   - `BinderWrite`
   - `TenantAdmin`
5. Add tenant-user admin service and endpoints with stable ProblemDetails mapping.
6. Add structured security logs for user-create and role-change success/failure paths.
7. Add unit and Docker-backed integration coverage.
8. Synchronize affected docs and PR artifacts.

## Error Contract Additions

- `404 TENANT_USER_NOT_FOUND`
- `409 TENANT_USER_EMAIL_CONFLICT`
- `409 LAST_TENANT_ADMIN_REQUIRED`
- `422 TENANT_ROLE_INVALID`
- `422 TENANT_USER_PASSWORD_INVALID`

## Test Plan

Unit tests:
- policy hierarchy allow/deny matrix
- membership-context behavior
- invalid role parsing
- password-validation failure mapping
- last-admin guard behavior

Docker-backed integration tests:
- admin can list tenant-local users
- non-admin receives `403` on tenant-user routes
- root-host access to tenant-user routes returns `404`
- create user succeeds and the new user can log in on the tenant host
- duplicate email returns `409 TENANT_USER_EMAIL_CONFLICT`
- invalid role returns `422 TENANT_ROLE_INVALID`
- invalid password returns `422 TENANT_USER_PASSWORD_INVALID`
- missing/invalid CSRF on tenant-user POST routes returns `403 CSRF_TOKEN_INVALID`
- same-tenant role reassignment succeeds
- cross-tenant role reassignment target returns `404 TENANT_USER_NOT_FOUND`
- demoting the last remaining admin returns `409 LAST_TENANT_ADMIN_REQUIRED`
- test-only policy probes prove the role hierarchy and tenant-boundary enforcement

## Validation Plan

- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`
- manual VS Code and Visual Studio launch verification recorded in the CP8 PR artifact before checkpoint closeout
