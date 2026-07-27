# CP5 Critic Review: Tenancy Resolution And Immutable Tenant Context

Reviewed: 2026-04-02
Reviewer: code-critic (agent)
Status: Approve with findings

## Verdict

Approve with findings (no blockers, 2 medium, 2 low).

The checkpoint is well-scoped and cleanly implements the CP5 merge gate: tenant context is resolved server-side once per request, client tenant identifiers cannot affect scoping, and the implementation stays inside the documented CP5 boundary. The layering is correct (Application owns the contract, Infrastructure owns Dapper, Api owns middleware and request context), and the test coverage hits all four golden-path scenarios from the integration test doc. Docs are synchronized in the same change set.

## Findings

### M1 — XSS vector in TenantHostFailurePage.Render (Medium / Security)

`src/PaperBinder.Api/TenantHostFailurePage.cs` lines 6-68 interpolate `title` and `detail` into raw HTML via `$$"""...{{title}}...{{detail}}..."""` with no HTML encoding. Today both values are hardcoded string literals from `src/PaperBinder.Api/TenantResolutionMiddleware.cs` lines 43-44 and 57-58, so there is no active exploit path. However, the method signature accepts arbitrary strings, and a future caller passing user-derived input would create a reflected XSS. Since the threat model lite explicitly lists XSS as a top threat with "output encoding" as a mitigation, this is a gap in the defense-in-depth posture.

**Recommendation:** HTML-encode the interpolated values inside `Render` (e.g. `System.Net.WebUtility.HtmlEncode(title)`) so the method is safe by construction regardless of call site.

### M2 — DapperTenantLookupService registered as Singleton but opens a new connection per call (Medium / Lifetime)

`src/PaperBinder.Infrastructure/Persistence/PaperBinderPersistenceServiceCollectionExtensions.cs` line 28 registers `DapperTenantLookupService` as `Singleton`. The service itself is stateless and `ISqlConnectionFactory` is also singleton, so this is not broken: every call to `FindBySlugAsync` opens and disposes its own connection. But per-request tenant lookup is a scoped concern, and when CP6 adds membership/expiry checks that compose with the same lookup path, singleton lifetime may become a surprising constraint. More importantly, injecting it into the middleware via `InvokeAsync` method injection already gives you per-request resolution, so the singleton registration adds no performance benefit over scoped.

**Recommendation:** Consider registering as `Scoped` to match the per-request nature of tenant lookup and to avoid surprising lifetime conflicts when downstream CP6/CP8 services compose with it. This is not a blocker — the current code is correct — but it is the kind of thing that is cheaper to fix now than after CP6 couples to it.

### L1 — Loopback bypass skips tenant resolution entirely (Low / Design note)

`src/PaperBinder.Api/TenantResolutionMiddleware.cs` lines 64-66 and `src/PaperBinder.Api/PaperBinderTenantHostResolution.cs` lines 29-30: loopback hosts in Development/Test resolve straight to System context without any tenant lookup. This is documented and intentional per the tenancy-resolution doc ("Development and Test environments may treat loopback hosts as explicit system-context requests"). Noting it here so the CP6 reviewer knows: any test that needs to exercise the tenant path against a real database must set the Host header to a subdomain, which the integration tests already do correctly.

No action needed.

### L2 — TenantContext as a positional record used with Dapper column mapping (Low / Fragility)

`src/PaperBinder.Application/Tenancy/TenantContext.cs` is a positional record (`TenantContext(Guid TenantId, string TenantSlug, string TenantName)`). `src/PaperBinder.Infrastructure/Tenancy/DapperTenantLookupService.cs` line 17 maps it via `QuerySingleOrDefaultAsync<TenantContext>`. Dapper maps by property name, so this works because positional records generate matching property names. But if a field is ever added or reordered, Dapper silently ignores unmapped columns rather than failing, which could mask a real bug. This is a minor fragility, not a defect.

No action required for CP5.

## Contract and doc consistency check

| Check | Result |
| --- | --- |
| `tenancy-resolution.md` rules match implementation | Pass — host validation, single-label subdomain, immutable context, fail-closed, client hints ignored |
| `tenant-isolation.md` updated with host rejection rule | Pass — "Request hosts outside the configured root/tenant pattern are rejected before tenant-scoped handling runs" |
| `threat-model-lite.md` updated with host spoofing mitigations | Pass — "Host header spoofing / tenant confusion" section references configured root-domain validation, single-label parsing, reject before handlers, ignore client hints |
| `api-contract.md` error codes match middleware constants | Pass — `TENANT_HOST_INVALID` (400) and `TENANT_NOT_FOUND` (404) match both the doc and middleware constants |
| Integration test names match golden-path list in `integration-tests.md` | Pass — all four CP5 scenarios present |
| Middleware ordering: correlation/version before tenancy | Pass — `UsePaperBinderHttpContract()` then `UsePaperBinderTenancy()`, so rejection responses still get `X-Api-Version` and `X-Correlation-Id` |
| Checkpoint ledger and task file updated in same change set | Pass |
| No private-path references in committed content | Pass |
| No scope creep beyond CP5 boundary | Pass — no auth, no membership, no domain endpoints |

## Summary

Clean checkpoint. The two medium findings (HTML encoding in the error page, singleton vs scoped lifetime) are both cheap fixes that would be good to land before CP6 adds the auth/membership layer on top of this boundary. Everything else — layering, immutability enforcement, fail-closed behavior, test coverage, doc sync — is solid.
