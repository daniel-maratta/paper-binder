# CP6 Critic Review

## Summary

CP6 implements identity, cookie auth, CSRF enforcement, login/logout endpoints, and tenant membership/expiry validation. The implementation maps cleanly to the four canonical CP6 execution-plan commits. All planned deliverables are present. No scope creep. ADR-0007's Dapper-only runtime rule is preserved throughout.

Validation passed with 44 unit, 23 non-Docker integration, and 17 Docker-backed integration tests.

## Architecture and Plan Alignment

The changeset covers:

- ASP.NET Core Identity with custom Dapper-backed stores (`DapperPaperBinderUserStore`)
- `users` and `user_tenants` schema with one-membership-per-user unique constraint
- Root-host login, tenant-host logout, parent-domain cookie auth
- Readable CSRF cookie with `X-CSRF-TOKEN` enforcement on authenticated unsafe `/api/*` routes
- Tenant resolution rework: host identity resolved early, tenant context materialized only after membership and expiry validation
- ADR-0008, `PAPERBINDER_PUBLIC_ROOT_URL` config, and synchronized docs

No planned items are missing. No unplanned items were added.

## Correctness

### Identity and Dapper Stores

`DapperPaperBinderUserStore` implements exactly the four store interfaces Identity needs (`IUserStore`, `IUserPasswordStore`, `IUserSecurityStampStore`, `IUserEmailStore`). All SQL is explicit, parameterized, and uses `CommandDefinition` with cancellation. `FindByEmailAsync` queries by `normalized_email`, which is correct because `UserManager.FindByEmailAsync` normalizes before calling the store.

### Login Flow

`PaperBinderAuthEndpoints.LoginAsync` follows the planned sequence: host policy check, credential validation, membership lookup, expiry check, session rotation (`SignOutAsync` then `SignInAsync`), CSRF issuance, redirect URL return. The session rotation prevents session fixation by clearing any prior session before issuing a new one.

### Tenant Resolution Rework

`TenantResolutionMiddleware` now manages two context objects: `IRequestResolvedTenantHostContext` (host-level, established early) and `IRequestTenantContext` (tenant-scoped, established only after auth plus membership plus expiry). Anonymous tenant-host requests get the former but not the latter. This is the correct split for the documented resolution flow.

### CSRF

`PaperBinderCsrfProtection.IsValid` uses `CryptographicOperations.FixedTimeEquals` for timing-safe comparison. The middleware exempts safe methods, non-API paths, unauthenticated requests, and root-host pre-auth routes. The exemption logic matches the plan.

### Schema

The migration creates `users` and `user_tenants` with:

- Unique constraint on `user_tenants.user_id` (`ux_user_tenants_user_id`) enforcing one-membership-per-user
- Check constraint on `role` restricting values to `TenantAdmin`, `BinderWrite`, `BinderRead`
- Foreign keys with cascade delete to both `users` and `tenants`
- Unique indexes on `normalized_email` and `normalized_user_name`

### Config Validation

`TryParsePublicUrl` validates the new `PAPERBINDER_PUBLIC_ROOT_URL` thoroughly: absolute URI, no userinfo/query/fragment, root path only, and host must match the auth-cookie domain after stripping the leading dot. The test config confirms the parent-domain case works: `PublicRootUrl = "http://paperbinder.localhost:8080"` with `AuthCookieDomain = ".paperbinder.localhost"`.

## Prior Review Notes -- Resolution

**Note 1 (cookie domain matching).** The validation normalizes the cookie domain via `Trim().Trim('.').ToLowerInvariant()` before comparing against the URI host. This correctly handles `.paperbinder.localhost` matching `paperbinder.localhost`. Confirmed by test config and `Should_RejectPublicRootUrl_When_HostDoesNotMatchCookieDomain`. Addressed correctly.

**Note 2 (CP5 test assertions).** `MigrationWorkflowIntegrationTests` updated to expect two applied migrations and assert both names. `Should_NotEstablishTenantContextForAnonymousTenantHostRequests` (renamed from the prior CP5 test) now asserts `IsEstablished = false` for anonymous requests. The spoofed-hints test now seeds a user and authenticates before checking tenant context. Addressed correctly.

## Issues

### 1. CSRF middleware double-validates on logout (cosmetic, no bug)

The CSRF middleware validates the token for authenticated unsafe tenant-host requests. The logout handler then validates CSRF again independently. The endpoint-level check is redundant since the middleware has already validated by the time the handler runs. This means the handler's CSRF rejection path is dead code in practice.

**Severity:** cosmetic. Double-checking is safe. If defense-in-depth is intended, keep it. If dead code is unwanted, remove the handler-level CSRF check.

### 2. `LoginRequest.ChallengeToken` is declared but unused

The `LoginRequest` record declares `string? ChallengeToken = null`. The plan says challenge verification is CP7. Including the field now means CP7 will not need to change the request contract.

**Severity:** informational. Forward-compatible design choice, not a defect. The current API silently accepts and ignores the field.

### 3. Middleware ordering dependency is correct but implicit

`Program.Partial.cs` registers middleware in this order:

```
app.UsePaperBinderHttpContract();
app.UsePaperBinderAuthentication();
app.UsePaperBinderTenancy();
app.UsePaperBinderApiProtection();
```

Authentication must run before tenancy (so `context.User` is populated), and tenancy must run before CSRF (so `IRequestResolvedTenantHostContext` is available for host-based exemptions). The ordering is correct. Reordering any of these lines would silently break the auth boundary.

**Severity:** low. A comment or startup-time assertion would prevent a future checkpoint from accidentally reordering.

### 4. `ShouldValidateRequest` final guard is always true

`PaperBinderCsrfMiddleware.ShouldValidateRequest` ends with `return !string.IsNullOrWhiteSpace(csrfCookieService.CookieName)`. The cookie name is derived from `runtimeSettings.AuthCookie.Name + ".csrf"`, and `AuthCookie.Name` is a required non-empty config value. This condition can never be false in a valid runtime.

**Severity:** cosmetic. Safety guard against impossible misconfiguration. Not harmful.

## Test Coverage

All planned test scenarios are covered:

- Login success with redirect URL and cookie assertions
- Invalid credentials (401, `INVALID_CREDENTIALS`)
- No membership on login (403, `TENANT_FORBIDDEN`)
- Logout with valid CSRF (204, emits auth and CSRF Set-Cookie headers)
- Logout without CSRF (403, `CSRF_TOKEN_INVALID`)
- Logout with invalid CSRF (403, `CSRF_TOKEN_INVALID`)
- Cross-tenant authenticated request (403, `TENANT_FORBIDDEN`)
- Expired tenant on tenant-host request (410, `TENANT_EXPIRED`)
- Expired tenant on login (410, `TENANT_EXPIRED`)
- Health endpoints on tenant hosts remain anonymous and reachable
- Spoofed tenant hints ignored for authenticated users
- Unit tests for redirect builder, CSRF validation, host policy, and authenticated user parsing
- Migration tests updated for the new schema

### Suggested additions (non-blocking)

- Login on a tenant host returns 404 (verifying the wrong-host-returns-404 assumption end-to-end).
- Logout on a root host returns 404 (inverse of the above; currently covered only by the unit-level host policy test).

## Doc Synchronization

All touched docs are updated correctly:

- ADR-0008 added to ADR README, ai-index, and repo-map
- `tenancy-resolution.md` reflects the anonymous-tenant-host behavior change and updated resolution flow
- `api-contract.md` has all four new error codes and updated login/logout contracts with CP7 deferral notes
- `checkpoint-status.md` updated to CP6 active, CP5 done
- `threat-model-lite.md` has deferred controls section for CP7
- `secrets-and-config.md` documents `PAPERBINDER_PUBLIC_ROOT_URL` and its relationship to cookie domain
- `identity-aspnet-core-identity.md` updated with boundary rules and CP6/CP8 staging
- `authn-authz.md`, `system-overview.md`, `deployment.md`, `runbook-local.md`, `runbook-prod.md` all updated
- `integration-tests.md` updated with the full CP6 test name list
- `.env.example` includes the new key

## Verdict

Clean, well-executed checkpoint. The auth boundary is correctly implemented, the Dapper-only runtime rule is preserved, tenant isolation is maintained, and test coverage matches the plan. All four issues are minor or informational. None are blocking.
