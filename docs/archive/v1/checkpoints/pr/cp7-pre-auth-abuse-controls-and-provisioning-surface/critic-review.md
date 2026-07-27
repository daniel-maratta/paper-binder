# CP7 Critic Review: Pre-Auth Abuse Controls And Provisioning Surface

Reviewer: Claude (code critic)
Date: 2026-04-04
Scope: Full post-implementation review of CP7 source, tests, docs, and delivery artifacts.

## Verdict

CP7 is well-implemented. The code is clean, scope-disciplined, and consistent with the approved implementation plan. All pre-implementation review findings were addressed. The issues below are minor and none block merge.

---

## What the implementation gets right

### Architecture and layering

- **Provisioning is properly application-layered.** `ITenantProvisioningService` lives in `PaperBinder.Application`, `DapperTenantProvisioningService` lives in `PaperBinder.Infrastructure`, and the endpoint in `PaperBinder.Api` stays thin. The endpoint delegates to the service, then handles session establishment and response shaping. This is the correct separation for a transactional operation that CP9/CP10 will extend.

- **Challenge verification uses `AddHttpClient<T>` for `IHttpClientFactory`-managed lifetime.** `PaperBinderPreAuthProtectionExtensions.cs:19` registers via `services.AddHttpClient<IChallengeVerificationService, TurnstileChallengeVerificationService>()`. This avoids socket-leak risks and sets the pattern for future HTTP integrations. This was a pre-implementation review recommendation and was followed.

- **PB_ENV reads from process environment at the verification boundary only.** `PaperBinderChallengeVerification.AllowsTestBypass` calls `Environment.GetEnvironmentVariable` directly, not through `PaperBinderRuntimeSettings`. `PB_ENV` does not appear in `PaperBinderConfigurationKeys` or the typed settings class. Correct.

- **Insert order is tenant, user, membership.** The Dapper transaction in `DapperTenantProvisioningService.cs:44-121` inserts tenant first, user second, membership third. Both parent rows exist before the FK-dependent child is written. Matches the semantic order from the approved plan.

### Security posture

- **Challenge is enforced before any credential or provisioning logic.** `RequireValidChallengeAsync` is called before password checks in login and before `ProvisionAsync` in provisioning. Rate limiting is applied at the endpoint mapping level via `.RequireRateLimiting()`. The ordering means: rate limit -> challenge -> business logic. Correct.

- **Turnstile failure returns safe detail.** The `CHALLENGE_FAILED` response says "The submitted challenge token could not be verified" — it does not leak whether the Turnstile service was unreachable vs. returned a rejection. The `HttpRequestException` catch in `TurnstileChallengeVerificationService.cs:82-84` returns `null`, which maps to `false`, which maps to `CHALLENGE_FAILED`. Good.

- **Password generation uses `RandomNumberGenerator` exclusively.** `TenantProvisioningRules.GenerateOneTimePassword` uses `RandomNumberGenerator.GetInt32` for both character selection and Fisher-Yates shuffle. No `System.Random` anywhere. The alphabet excludes ambiguous characters (0/O, 1/l/I). The first three positions guarantee at least one lowercase, one uppercase, and one digit before the shuffle randomizes placement.

- **Provisioning is all-or-nothing.** The `NpgsqlTransactionScopeRunner` wraps all three inserts in a single `DbTransaction` with explicit commit/rollback. The `PostgresException` catch with `UniqueViolation` handling in `DapperTenantProvisioningService.cs:125-129` returns a failure outcome without leaking partial state. The integration test `Should_ReturnConflictAndPreserveExistingState_When_TenantNameAlreadyExists` verifies exactly 1 tenant, 1 user, 1 membership after the conflict — confirming the first provision's rows survived and the second's did not.

### Test quality

- **Integration tests use per-test isolated databases.** Each test calls `postgres.CreateDatabaseAsync()` for a fresh containerized Postgres instance. No shared state between tests.

- **Rate limit tests set the limit to 1 and verify the second request is rejected.** `Should_RateLimit_RepeatedLoginRequests_When_PreAuthLimitIsOne` and `Should_SharePreAuthRateLimitBudgetAcrossLoginAndProvision_When_LimitIsOne` both override `PAPERBINDER_RATE_LIMIT_PREAUTH_PER_MINUTE` to `"1"`, then verify the second request gets 429 with `Retry-After`. The shared-budget test crosses login and provision to prove the single-window behavior. Both are specific and deterministic.

- **The unit test for Turnstile delegation verifies the outbound request shape.** `ChallengeVerificationService_Should_DelegateToTurnstile_When_TestBypassIsNotEnabled` uses a `TestHttpMessageHandler` that asserts the POST URL, secret, response token, and remote IP in the form body. It sets PB_ENV to `"Development"` to ensure the bypass path is not taken. This is the load-bearing test for the non-bypass branch.

- **Module initializer for PB_ENV is process-scoped.** `IntegrationTestEnvironment.Initialize()` sets `PB_ENV=Test` once at module load. All integration tests inherit it. This is appropriate for the Docker-backed suite where every test needs the bypass.

### Contract and doc alignment

- **Error code naming is internally consistent.** The plan originally said `TENANT_NAME_UNAVAILABLE` but the implementation uses `TENANT_NAME_CONFLICT` everywhere: error codes, enum values, API contract doc, integration test constants, and implementation plan. No divergence.

- **API contract doc was updated to reflect live status.** `POST /api/provision` is now marked "live in the current build" with challenge/rate-limit fields documented. Login shows `Challenge required: Y` and `Rate limited: Y`.

- **Seeded-documents language was corrected.** Canonical docs now consistently say provisioning is owner-only in CP7 with binder/document seeds deferred to CP9/CP10.

---

## Issues

### 1. No structured logging for challenge failures, rate-limit rejections, or provisioning failures (Medium)

The approved implementation plan explicitly called for "structured logs for challenge failures, rate-limit rejections, and provisioning failures with correlation data." The FD-0002 security/ops impact section requires "structured logs must include trace and correlation identifiers for failed pre-auth actions."

None of the CP7 source files (`PaperBinderAuthEndpoints.cs`, `TurnstileChallengeVerificationService.cs`, `DapperTenantProvisioningService.cs`, `PaperBinderPreAuthProtectionExtensions.cs`) inject or use `ILogger`. The only logging in the codebase is in `NpgsqlTransactionScopeRunner` (rollback warnings), `RequestCorrelationMiddleware`, and `Worker`.

This means:
- A failed Turnstile verification produces no server-side log entry.
- A rate-limited request produces no server-side log entry beyond what the framework emits.
- A provisioning failure (name conflict, invalid name) produces no server-side log entry.

**Recommendation:** Add `ILogger` to `TurnstileChallengeVerificationService` and emit a warning on verification failure with the remote IP (already available). Add a warning log in `DapperTenantProvisioningService` for conflict/failure outcomes. The rate-limit rejection handler in `PaperBinderPreAuthProtectionExtensions.WriteRateLimitProblemAsync` could also log, though ASP.NET Core's rate limiter middleware may emit its own diagnostics. This is the one place where the implementation diverges from the plan's stated commitments.

### 2. `UserManager.FindByIdAsync` round-trip after successful provisioning (Low)

In `PaperBinderAuthEndpoints.cs:155`, after `tenantProvisioningService.ProvisionAsync` succeeds, the endpoint calls `userManager.FindByIdAsync(provisionedTenant.OwnerUserId.ToString("D"))` to get the `PaperBinderUser` for `SignInAsync`. This is a second database round-trip for a user that was just created inside the provisioning transaction.

The alternative would be for `ITenantProvisioningService.ProvisionAsync` to return the `PaperBinderUser` directly (since `DapperTenantProvisioningService.CreateOwnerUser` already constructs it). This would eliminate the round-trip and the defensive `InvalidOperationException` check.

However, the current approach has a valid argument: it keeps `ITenantProvisioningService` in the Application layer without coupling it to the Identity `PaperBinderUser` type in its public contract. The extra query is cheap on a single-row PK lookup after a successful write. The `InvalidOperationException` guard is correct defensive programming — if this ever fires, something is very wrong.

**Recommendation:** Accept as-is. The layering benefit outweighs the cost of one extra PK lookup on a low-frequency operation.

### 3. Missing integration test: wrong-host POST to /api/provision returns 404 (Low)

The implementation plan's test plan specified: "wrong-host access to POST /api/provision returns 404." The unit test in `HttpContractHelperTests.cs:152-167` covers the host policy logic (`AllowsProvision` returns false for tenant hosts). But there is no Docker-backed integration test that sends a provision request with a tenant host header and asserts a 404 response.

The existing integration tests for auth already cover the host-policy pattern for login and logout. The unit test coverage is sufficient for the policy logic. But the plan explicitly listed this as an integration test item.

**Recommendation:** Add a short integration test that sends `POST /api/provision` with a tenant host header and asserts 404. This is a one-minute addition.

### 4. `ProvisionRequest.TenantName` is non-nullable but no explicit null guard before service call (Info)

`ProvisionRequest` is declared as `record ProvisionRequest(string TenantName, string? ChallengeToken = null)` where `TenantName` is non-nullable. However, JSON deserialization can still bind `null` to a non-nullable `string` property (it will be `null` at runtime despite the type declaration). The `TenantProvisioningRules.TryNormalizeTenantName` method handles `null` via `string.IsNullOrWhiteSpace`, so this is safe in practice. But the code relies on the downstream validation rather than failing at the API boundary.

**Recommendation:** No action needed. The downstream null handling is correct and the failure message is appropriate. This is an informational note, not a defect.

### 5. `TENANT_NAME_CONFLICT` vs plan's `TENANT_NAME_UNAVAILABLE` (Info)

The approved plan used `TENANT_NAME_UNAVAILABLE` as the error code for slug conflicts. The implementation uses `TENANT_NAME_CONFLICT` everywhere. The API contract doc, error codes class, integration tests, and implementation plan doc all consistently use `TENANT_NAME_CONFLICT`.

This is a deliberate and internally consistent naming change. `CONFLICT` is arguably better because it aligns with the HTTP 409 semantics. The plan was updated to match. No divergence exists.

**Recommendation:** No action needed. Noting for traceability.

---

## Summary table

| # | Finding | Severity | Action |
|---|---------|----------|--------|
| 1 | No structured logging for pre-auth failures | Medium | Add ILogger to challenge verifier and provisioning service |
| 2 | Extra DB round-trip for user after provisioning | Low | Accept — layering benefit outweighs cost |
| 3 | Missing wrong-host provision integration test | Low | Add one short integration test |
| 4 | Non-nullable TenantName could be null from JSON | Info | No action — downstream handles it |
| 5 | TENANT_NAME_CONFLICT vs plan's UNAVAILABLE | Info | No action — consistently updated |

## Pre-implementation plan adherence

All eight findings from the pre-implementation review were addressed:

| Pre-implementation finding | Status |
|---|---|
| Insert order: tenant, user, membership | Implemented correctly |
| 63 vs 80 slug gap documented as app rule | Implemented correctly |
| PB_ENV excluded from runtime settings | Implemented correctly |
| LoginRequest.ChallengeToken reused from CP6 | Implemented correctly |
| Shared rate limit tradeoff documented | Implemented correctly |
| Session flow mirrors existing login pattern | Implemented correctly |
| Unit tests are load-bearing for non-bypass branch | Implemented correctly |
| Password generation with RandomNumberGenerator | Implemented correctly |

## Merge readiness

CP7 is merge-ready pending the author's judgment on finding #1 (structured logging). The logging gap is the only item where the implementation diverges from a stated plan commitment. Findings #2-#5 are informational or low-severity and do not block merge.

The checkpoint-close items (launch profile validation and manual VS Code/Visual Studio verification) are correctly documented as pending per repo policy.

## Author Follow-Up

Addressed on the current branch after this review:

- Finding #1: added structured logging for missing/failed challenge validation, pre-auth rate-limit rejections, invalid tenant-name provisioning requests, tenant-name conflicts, and unexpected provisioning failures.
- Finding #3: added a Docker-backed integration test proving tenant-host `POST /api/provision` is rejected with `404`.

Accepted as-is after review:

- Finding #2: the extra `UserManager.FindByIdAsync` round-trip remains acceptable for layering reasons.
- Finding #4: downstream tenant-name validation already handles null/blank input safely.
- Finding #5: `TENANT_NAME_CONFLICT` remains the accepted canonical error-code name.
