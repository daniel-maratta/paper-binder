# Integration Tests (Minimum Viable, v1)

## Coverage Scope

Integration tests in v1 must cover:

- Tenant isolation (no cross-tenant reads/writes).
- Tenant host validation and server-authoritative tenant resolution.
- Authentication, cookie, CSRF, and membership boundary behavior.
- RBAC enforcement at API boundary.
- Tenant lease and cleanup behavior (best-effort SLA behavior validation).
- API version negotiation behavior on `/api/*` routes (`X-Api-Version`).
- Correlation ID request/response behavior on all routes (`X-Correlation-Id` and ProblemDetails extensions).

## Test Environment Setup

- PostgreSQL test container.
- Create an isolated database per test or per fixture scope inside the shared container.
- Apply schema migrations through `PaperBinder.Migrations` or the shared migration runner before exercising runtime code.
- Seed only the minimal rows required by the scenario under test.
- Use the real API host or runtime persistence services instead of in-memory substitutes when validating data-access behavior.
- Worker or cleanup job entrypoint remains invokable in test context once that behavior lands.

## Execution Buckets

- `Category=NonDocker`: integration coverage that runs without Docker and should stay fast enough for default local feedback.
- `Category=Docker`: integration coverage that requires a working Docker daemon and backs persistence-sensitive or container-backed verification.
- `scripts/test.ps1` runs both buckets separately so Docker availability failures are explicit rather than buried inside the entire integration suite.

## Naming and Location Conventions

- Test project location: `tests/PaperBinder.IntegrationTests` (or equivalent integration test project).
- Test class naming: `<Feature>IntegrationTests`.
- Test method naming: `Should_<ExpectedBehavior>_When_<Condition>`.

## Golden Path Test List

- `Should_CreateBinder_AndExposeDefaultInheritPolicy_When_RequestIsValid`.
- `Should_ListOnlyCurrentTenantBinders_AndOmitRestrictedBinders_When_CallerLacksAllowedRole`.
- `Should_ReturnForbidden_When_BinderPolicyDeniesSameTenantCaller`.
- `Should_ReturnNotFound_When_BinderIdBelongsToAnotherTenant`.
- `Should_RequireTenantAdmin_ForBinderPolicyEndpoints`.
- `Should_ReturnUnprocessableEntity_When_BinderPolicyPayloadIsInvalid`.
- `Should_RejectBinderCreate_When_CsrfTokenIsMissing`.
- `Should_RejectBinderPolicyUpdate_When_CsrfTokenIsMissing`.
- `Should_RejectCrossTenantBinderRead_When_UserFromDifferentTenant`.
- `Should_RejectCrossTenantDocumentWrite_When_TenantIdTamperedInPayload`.
- `Should_ReturnForbidden_When_RoleLacksBinderWritePolicy`.
- `Should_AllowBinderCreate_When_UserHasBinderWritePolicy`.
- `Should_AllowTenantLeaseExtension_OnlyWithinAllowedWindow`.
- `Should_DeleteExpiredTenantData_When_CleanupJobRuns`.
- `Should_NotDeleteActiveTenant_When_CleanupJobRuns`.
- `Should_NotEstablishTenantContextForAnonymousTenantHostRequests`.
- `Should_IgnoreSpoofedTenantHints_When_HostResolvesKnownTenant`.
- `Should_ReturnNotFoundForUnknownTenantHost_EvenWhen_ClientSuppliesSpoofedHints`.
- `Should_ReturnBadRequestProblemDetails_When_HostIsOutsideConfiguredBaseDomain`.
- `Should_LoginAndEstablishTenantContext_When_CredentialsAreValid`.
- `Should_ReturnForbidden_When_LoginUserHasNoTenantMembership`.
- `Should_Logout_When_TenantHostRequestIncludesValidCsrfToken`.
- `Should_RejectLogout_When_CsrfTokenIsMissing`.
- `Should_ReturnForbidden_When_AuthenticatedUserTargetsDifferentTenantHost`.
- `Should_ReturnGone_When_LoginTargetsExpiredTenant`.
- `Should_ListOnlyCurrentTenantUsers_When_CallerIsTenantAdmin`.
- `Should_CreateTenantUser_AndAllowLogin_When_RequestIsValid`.
- `Should_ReturnBadRequest_When_TenantUserEmailIsStructurallyInvalid`.
- `Should_ReturnConflict_When_RequestWouldDemoteLastTenantAdmin`.
- `Should_ApplyRoleHierarchy_On_TestPolicyProbes`.
- `Should_AllowAnonymousHealthChecks_OnKnownTenantHosts`.
- `Should_ReturnBadRequest_When_ApiVersionIsUnsupported`.
- `Should_DefaultToV1_When_ApiVersionHeaderIsMissing`.
- `Should_ReturnProblemDetails_When_ApiRouteDoesNotExist`.
- `Should_NotRequireApiVersion_When_RouteIsNotUnderApiPrefix`.
- `Should_NotRequireApiVersion_When_RouteIsHealthEndpoint`.
- `Should_AllowAnonymousHealthChecks_WithMinimalPayload`.
- `Should_EchoCorrelationId_When_ClientSuppliesHeader`.
- `Should_GenerateCorrelationId_When_HeaderIsMissing`.
- `Should_ReplaceInvalidCorrelationId_When_ClientSuppliesRejectedHeader`.
- `Should_IncludeTraceAndCorrelationIds_When_ProblemDetailsIsReturned`.

## Execution Expectations

- Integration tests are deterministic and isolated.
- Baseline persistence tests should prove migration application, real database readiness checks, and runtime transaction behavior against PostgreSQL.
- Clock-sensitive lease tests use a controllable clock abstraction.
- Failures must emit trace/correlation identifiers in test logs where available.
- Assertions should verify `X-Api-Version` on representative `/api/*` endpoints.
- Assertions should verify `X-Correlation-Id` on representative API and non-API endpoints.
- Assertions should verify tenant host parsing and rejection behavior before tenant-scoped handlers execute.
- Assertions should verify health endpoints remain outside API version negotiation even when they return `503`.
- Docker-backed tests should emit a clear preflight or fixture-level failure message when Docker is unavailable.
