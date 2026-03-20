# Integration Tests (Minimum Viable, v1)

## Coverage Scope

Integration tests in v1 must cover:

- Tenant isolation (no cross-tenant reads/writes).
- RBAC enforcement at API boundary.
- Tenant lease and cleanup behavior (best-effort SLA behavior validation).
- API version negotiation behavior on `/api/*` routes (`X-Api-Version`).
- Correlation ID request/response behavior on all routes (`X-Correlation-Id` and ProblemDetails extensions).

## Test Environment Setup

- PostgreSQL test container.
- Schema migrations applied at test start.
- Seeded tenants and users for at least two tenants.
- API host configured with tenant-resolution middleware and cookie auth enabled.
- Worker or cleanup job entrypoint invokable in test context.

## Naming and Location Conventions

- Test project location: `tests/PaperBinder.IntegrationTests` (or equivalent integration test project).
- Test class naming: `<Feature>IntegrationTests`.
- Test method naming: `Should_<ExpectedBehavior>_When_<Condition>`.

## Golden Path Test List

- `Should_RejectCrossTenantBinderRead_When_UserFromDifferentTenant`.
- `Should_RejectCrossTenantDocumentWrite_When_TenantIdTamperedInPayload`.
- `Should_ReturnForbidden_When_RoleLacksBinderWritePolicy`.
- `Should_AllowBinderCreate_When_UserHasBinderWritePolicy`.
- `Should_AllowTenantLeaseExtension_OnlyWithinAllowedWindow`.
- `Should_DeleteExpiredTenantData_When_CleanupJobRuns`.
- `Should_NotDeleteActiveTenant_When_CleanupJobRuns`.
- `Should_ReturnBadRequest_When_ApiVersionIsUnsupported`.
- `Should_DefaultToV1_When_ApiVersionHeaderIsMissing`.
- `Should_NotRequireApiVersion_When_RouteIsNotUnderApiPrefix`.
- `Should_NotRequireApiVersion_When_RouteIsHealthEndpoint`.
- `Should_AllowAnonymousHealthChecks_WithMinimalPayload`.
- `Should_EchoCorrelationId_When_ClientSuppliesHeader`.
- `Should_GenerateCorrelationId_When_HeaderIsMissing`.
- `Should_IncludeTraceAndCorrelationIds_When_ProblemDetailsIsReturned`.

## Execution Expectations

- Integration tests are deterministic and isolated.
- Clock-sensitive lease tests use a controllable clock abstraction.
- Failures must emit trace/correlation identifiers in test logs where available.
- Assertions should verify `X-Api-Version` on representative `/api/*` endpoints.
- Assertions should verify `X-Correlation-Id` on representative API and non-API endpoints.
