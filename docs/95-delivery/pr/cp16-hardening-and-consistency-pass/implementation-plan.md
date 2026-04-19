# CP16 Implementation Plan: Hardening And Consistency Pass
Status: Draft

## Goal

Implement CP16 so PaperBinder closes the remaining security, operability, and documentation-consistency gaps before release: the shipped runtime matches the stated threat model and operational posture, the minimum observability baseline is real rather than aspirational, carried-forward hardening defects from CP13-CP15 are resolved, and the full validation story is reviewer-safe without widening into CP17 release packaging or new product features.

## Scope

Included:
- a bounded security and runtime consistency pass across the already-shipped root-host, tenant-host, worker, and browser-E2E surfaces
- reconciliation of host validation, cookie and CSRF behavior, redirect-construction trust boundaries, and secret-handling claims against the current implementation
- implementation of one canonical fixed-window authenticated unsafe-mutation limiter for tenant-host `/api/*` mutations using the existing `PAPERBINDER_RATE_LIMIT_AUTHENTICATED_PER_MINUTE` config surface
- docs-only narrowing of stale CSP and browser-security-header claims so canonical XSS posture matches the shipped runtime
- reconciliation of markdown and XSS posture with the actual document-rendering behavior
- a minimal observability baseline for API, worker, and database execution paths:
  - OpenTelemetry instrumentation and exporter wiring
  - correlated structured logs with stable field names
  - a minimum low-cardinality metric set for operational and security-boundary incidents
- carried-forward frontend/runtime hygiene from earlier checkpoints:
  - remove the E2E-only mock challenge asset from the default production bundle and committed default app `wwwroot` output
  - rename the repo-native browser gate to `run-browser-e2e.ps1` under `scripts/` so the entrypoint matches the browser suite it now owns
  - keep `PB_ENV=Test` isolated to the dedicated Playwright runtime only
- behavior-preserving extraction of the tenant-host shell and route owners out of `src/PaperBinder.Web/src/app/tenant-host.tsx` so CP16 reduces cognitive load before release rather than after it
- targeted backend, frontend, worker, script, and test fixes required to satisfy the above and get the full regression suite green
- synchronized architecture, security, engineering, operations, testing, execution, ADR, navigation, taskboard, and delivery docs directly affected by CP16

Not included:
- CP17 release packaging work such as changelog finalization, reviewer snapshot curation, release tagging, final rollback notes, or release-freeze administration
- new end-user product features or admin workflows, including password reset, profile editing, user deletion, document editing, document preview UX, archive UX expansion, search, uploads, or audit browsing and export
- architecture changes that reopen the current V1 baseline:
  - BFF or SSR
  - React Router framework mode or route-module server loaders/actions
  - JWTs or token auth
  - server-side session stores or distributed caches
  - distributed or proxy-vendor-specific rate limiting
  - multi-role aggregation or multi-tenant user membership
- a generalized audit platform beyond the existing impersonation audit substrate
- broad UI redesign work beyond the maintainability extraction and consistency fixes needed to harden the current tenant-host surface
- multi-host, HA, Kubernetes, multi-region, or other non-V1 deployment expansion
- new browser-security-header middleware or CSP enforcement in CP16; this checkpoint removes stale claims instead of adding a new sticky browser-security contract

## Locked Design Decisions

CP16 is a hardening and refactor checkpoint, not a feature checkpoint. Implementation must not widen scope beyond tightening existing boundaries, closing drift, and resolving known carry-forward hygiene issues.

- The current cookie-auth, tenant-resolution, Dapper-runtime, single-SPA, and tenant-local impersonation model remains binding. CP16 does not reopen ADR-0002, ADR-0005, ADR-0007, ADR-0008, or ADR-0010 except to tighten implementation and documentation around them.
- Browser E2E remains a repo-native Playwright path isolated from the default reviewer and local runtime. CP16 renames the canonical entrypoint to `run-browser-e2e.ps1` under `scripts/`, and `PB_ENV=Test` must not leak into `scripts/start-local.ps1`, `scripts/reviewer-full-stack.ps1`, the base `docker-compose.yml` flow, or the default production bundle.
- E2E-only assets must not publish into the default frontend build output or the committed default app `wwwroot` tree. The mock challenge fixture is owned only by the isolated Playwright runtime.
- CP16 ships one canonical fixed-window limiter for authenticated unsafe tenant-host `/api/*` mutations, sourced from `PAPERBINDER_RATE_LIMIT_AUTHENTICATED_PER_MINUTE`.
- The authenticated unsafe-mutation limiter partitions by `(tenant_id, effective_user_id)` once tenant membership is established. `actor_user_id` remains available in logs and traces only; it is not a metric label.
- The authenticated unsafe-mutation limiter exempts `POST /api/auth/logout` and `DELETE /api/tenant/impersonation` so logout and impersonation stop behavior stay safe under downgraded effective roles.
- CSRF rejection remains applied before authenticated-mutation rate-limit accounting. Missing-CSRF requests are rejected but do not consume the authenticated mutation budget.
- Redirect construction for root-host provision/login and tenant-host logout remains anchored to configured `PAPERBINDER_PUBLIC_ROOT_URL`, never the raw request host or forwarded-host headers.
- CP16 resolves stale CSP and browser-security-header claims by narrowing the docs to the runtime PaperBinder actually ships. CP16 does not add a new CSP or browser-security-header middleware contract.
- The shipped XSS posture is locked to output encoding plus the conservative document renderer already in the repo: raw markdown is HTML-encoded and presented as safe source, without markdown parsing, sanitizer pipelines, raw-HTML support, or stored rendered HTML.
- Observability scope stays minimal and explicit. CP16 lands `ADR-0011-observability-opentelemetry-baseline.md` under `docs/90-adr/` in the same change set as the instrumentation and does not add vendor dashboards, alerting programs, PII, credentials, connection strings, or raw tenant document content to traces, logs, or metrics.
- The minimum CP16 metric set is locked to:
  - `paperbinder_security_denials_total` with labels `reason`, `surface`
  - `paperbinder_rate_limit_rejections_total` with labels `policy`, `surface`
  - `paperbinder_cleanup_cycles_total` with label `result`
  - `paperbinder_cleanup_tenants_total` with label `result`
- No metric label may use `tenant_id`, `user_id`, `actor_user_id`, `effective_user_id`, `correlation_id`, path parameters, or any free-form string.
- `tenant-host.tsx` extraction is behavior-preserving only and lands as a dedicated sub-PR after slices 1-3 settle the runtime behavior and observability contract.
- The tenant-host refactor must extract these exact module owners beneath `src/PaperBinder.Web/src/app/`:
  - `tenant-shell.tsx`
  - `tenant-lease-banner.tsx`
  - `tenant-impersonation-banner.tsx`
  - `tenant-dashboard-route.tsx`
  - `tenant-binders-route.tsx`
  - `tenant-binder-detail-route.tsx`
  - `tenant-document-detail-route.tsx`
  - `tenant-users-route.tsx`
- Post-refactor `tenant-host.tsx` is limited to host-context wiring, shell bootstrap composition, provider wiring, and route registration, and must be under 400 lines.
- All browser API calls continue to route through the shared API client. No direct `fetch(`, no `localStorage` / `sessionStorage`, no client-built tenant identity, and no custom impersonation or tenant headers may be introduced during the tenant-host extraction.
- The `tenant_impersonation_audit_events` table is not generalized, expanded, read by UI, exported, or otherwise widened during CP16.

## Planned Work

1. Reconcile the CP16 contract and carry-forward hardening scope before broad implementation. This blocking pass must align `README.md`, `docs/55-execution/execution-plan.md`, `docs/55-execution/phases/phase-5-hardening-release.md`, `docs/00-intent/canonical-decisions.md`, `docs/10-product/domain-nouns.md`, `docs/20-architecture/authn-authz.md`, `docs/20-architecture/tenancy-resolution.md`, `docs/20-architecture/frontend-spa.md`, `docs/20-architecture/frontend-app-route-map.md`, `docs/20-architecture/deployment-topology.md`, `docs/30-security/threat-model-lite.md`, `docs/30-security/tenant-isolation.md`, `docs/30-security/rate-limiting-abuse.md`, `docs/30-security/secrets-and-config.md`, `docs/40-contracts/api-contract.md`, `docs/50-engineering/tech-stack.md`, `docs/70-operations/observability.md`, `docs/70-operations/runbook-local.md`, `docs/70-operations/runbook-prod.md`, `docs/70-operations/deployment.md`, `docs/80-testing/test-strategy.md`, `docs/80-testing/testing-standards.md`, `docs/80-testing/e2e-tests.md`, `docs/90-adr/README.md`, `docs/90-adr/ADR-0008-identity-auth-boundary-with-dapper-stores.md`, `docs/90-adr/ADR-0010-playwright-root-host-e2e-runtime.md`, `ADR-0011-observability-opentelemetry-baseline.md` under `docs/90-adr/`, `docs/ai-index.md`, `docs/repo-map.json`, the CP16 taskboard entry under `docs/05-taskboard/tasks/` when created, and any touched feature-definition docs that reference document rendering on:
   - the exact CP16 hardening scope versus CP17 release-prep work
   - the authenticated unsafe-mutation limiter contract, including exempt routes and partition-key shape
   - the current cookie, CSRF, host-validation, redirect-construction, and secret-handling contract
   - the carried-forward frontend/runtime hygiene items from CP13 through CP15
   - the `run-browser-e2e.ps1` rename and which historical references stay as history versus active guidance
   - the observability baseline and ADR ownership that will actually ship
   - the exact markdown/XSS posture the runtime can credibly claim
   - removal of stale CSP or sanitizer-implying claims from canonical docs
2. Resolve security and configuration drift at the runtime boundary:
   - verify host-validation failure behavior and middleware ordering
   - verify cookie flags, logout behavior, impersonation-cookie-expiry audit closure, and CSRF enforcement remain consistent with the documented tenant-host and root-host split
   - add the authenticated unsafe-mutation limiter with the locked partition key, exempt routes, and CSRF-before-limiter precedence
   - prove redirect construction continues to use `PAPERBINDER_PUBLIC_ROOT_URL`
   - reconcile markdown and XSS claims with the current safe-source document rendering path and remove dormant CSP claims from docs
3. Land the minimal observability baseline:
   - add the smallest real OpenTelemetry instrumentation and exporter wiring that keeps the docs honest
   - land `ADR-0011-observability-opentelemetry-baseline.md` in the same change set as the instrumentation
   - preserve or improve structured log consistency for `event_name`, `tenant_id`, `user_id`, `trace_id`, and `correlation_id`
   - add the locked low-cardinality metrics and label sets only
4. Fix the carried-forward browser/runtime hygiene and maintainability issues:
   - move the E2E-only mock challenge fixture out of the default frontend build output and committed `wwwroot`
   - rename the browser gate entrypoint to `run-browser-e2e.ps1` under `scripts/` and update the supporting script/docs wiring
   - add automated non-leakage and fixture-absence guards
   - extract the tenant-host shell and route owners into the locked smaller modules while preserving the current route map, state ownership, and shared-client boundary
5. Run targeted defect remediation across backend, frontend, worker, scripts, and tests only where required to satisfy the above and meet the CP16 merge gate.
6. Reconcile the remaining canonical docs, delivery metadata, navigation metadata, and validation commands in the same change set so no stale or aspirational behavior claims remain once CP16 closes.

## Open Decisions

None. The critic-review blockers are resolved in this plan. The Critic Review Resolution Log below records the disposition of every finding.

## Vertical-Slice TDD Plan

TDD applies to every non-trivial runtime change in this checkpoint. Docs-only reconciliation work does not waive the TDD requirement for code or script behavior changes.

Public seams under test:
- authenticated tenant-host API mutations and their `429` or `Retry-After` behavior
- the root-host redirect construction boundary under spoofed host input
- middleware and request-boundary precedence for host validation, CSRF, rate limiting, and authorization
- API host startup and worker host startup for observability registration and configuration validation
- representative HTTP, worker, and database execution paths for trace or metric coverage
- the repo-native browser E2E entrypoint and isolated runtime behavior
- the tenant-host browser route surface guarded by component and Playwright tests

Planned `RED -> GREEN -> REFACTOR` slices:

1. `RED`: `Should_ReturnTooManyRequests_When_AuthenticatedTenantHostMutationRateLimitBudgetIsExceeded`
   `GREEN`: add the smallest authenticated unsafe-mutation limiter that uses `PAPERBINDER_RATE_LIMIT_AUTHENTICATED_PER_MINUTE`, partitions by `(tenant_id, effective_user_id)`, and preserves the locked exempt routes.
   `REFACTOR`: centralize authenticated partition-key resolution and limiter registration so tenant-host mutation routes do not drift.
2. `RED`: `Should_EmitCorrelatedTraceContext_For_ApiRequests_DatabaseCalls_And_WorkerCleanup`
   `GREEN`: add the smallest real instrumentation path that proves API requests, Dapper or Npgsql activity, and worker cleanup cycles emit trace-correlated diagnostics.
   `REFACTOR`: keep observability registration in one host-builder and one persistence seam rather than scattering setup across handlers.
3. `RED`: `Should_RecordLockedLowCardinalityMetrics_For_SecurityDenials_RateLimitRejections_And_CleanupOutcomes`
   `GREEN`: add only the locked metric names and label sets, and prove no unbounded labels are introduced.
   `REFACTOR`: extract metric names and tag keys into one reviewed constants seam.
4. `RED`: `Should_ConstructProvisionLoginAndLogoutRedirects_FromConfiguredPublicRootUrl_When_RequestCarriesSpoofedHostHeaders`
   `GREEN`: keep redirect construction anchored to `PAPERBINDER_PUBLIC_ROOT_URL` and prove raw or forwarded host values cannot change the emitted redirect target.
   `REFACTOR`: centralize redirect-root resolution so host-spoof regressions do not reappear during later hardening.
5. `RED`: `Should_RejectAuthenticatedTenantMutationForMissingCsrf_WithoutChargingAuthenticatedRateLimitBudget`
   `GREEN`: keep CSRF rejection ahead of authenticated-mutation rate-limit accounting and preserve the representative pipeline boundary ordering for a tenant-host mutation path.
   `REFACTOR`: isolate rate-limit accounting and CSRF checks so the precedence is explicit instead of accidental.
6. `RED`: `Should_Exclude_E2ETurnstileFixture_From_DefaultFrontendBuild_And_CommittedWwwroot`
   `GREEN`: move or rewire the E2E-only challenge fixture so the default compiled frontend and default app `wwwroot` no longer publish it, while the isolated Playwright runtime still passes.
   `REFACTOR`: isolate E2E-only asset ownership away from the default Vite, Docker, and committed compiled-output paths.
7. `RED`: `Should_RunBrowserE2EThrough_RunBrowserE2eEntrypoint_Without_LeakingPB_ENVTestInto_DefaultRuntimePaths`
   `GREEN`: rename the browser-gate script to `run-browser-e2e.ps1` under `scripts/`, update the supporting wiring, and add the smallest automated non-leakage guard that proves `PB_ENV=Test` stays isolated.
   `REFACTOR`: keep common Docker and Playwright orchestration in shared script helpers rather than duplicating shell logic.
8. `RED`: `Should_PreserveTenantHostBrowserBehavior_After_ShellAndRouteExtraction`
   `GREEN`: extract only the locked tenant-host modules while keeping route behavior, shell bootstrap, and shared-client ownership unchanged.
   `REFACTOR`: deduplicate shell-state refresh and route-owned UI seams only after the extracted modules are stable.

Slices 1 through 3 settle the runtime hardening and observability contract first. Slice 8, the tenant-host extraction, lands as a dedicated follow-on sub-PR after slices 1 through 3 have merged and the runtime behavior is already locked.

## Acceptance Criteria

- Threat-model, security, engineering, operations, testing, execution, taskboard, and delivery docs no longer claim behavior that the shipped CP16 runtime does not actually provide.
- Authenticated unsafe tenant-host `/api/*` mutations are protected by one canonical fixed-window limiter sourced from `PAPERBINDER_RATE_LIMIT_AUTHENTICATED_PER_MINUTE`, keyed by `(tenant_id, effective_user_id)`, and exempting `POST /api/auth/logout` plus `DELETE /api/tenant/impersonation`.
- The authenticated unsafe-mutation limiter returns `429 RATE_LIMITED` plus `Retry-After` on budget exhaustion and does not weaken tenant scoping or role enforcement.
- Representative regressions prove the boundary pipeline order remains: correlation and API-version handling first; authentication plus tenant resolution establish request context before tenant-host mutation enforcement; host-gated rejection still occurs before authorization; CSRF rejection occurs before authenticated rate-limit accounting; endpoint policy still gates handler execution.
- Root-host provision/login and tenant-host logout redirect construction continues to use configured `PAPERBINDER_PUBLIC_ROOT_URL`, not the raw request host or forwarded-host headers, proven by spoofed-host regression tests.
- Cookie flags, logout behavior, and impersonation-cookie-expiry audit closure remain preserved while CP16 tightens middleware and observability wiring.
- The observability baseline is real rather than aspirational:
  - API request paths emit trace-correlated diagnostics
  - representative database activity is correlated
  - worker cleanup cycles emit correlated diagnostics
  - local or development execution exports to console
  - OTLP export remains optional when configured
- `ADR-0011-observability-opentelemetry-baseline.md` under `docs/90-adr/` lands in the same change set as the observability wiring and is indexed in `docs/90-adr/README.md` and navigation metadata.
- Structured logs for request-scoped and worker-scoped events preserve stable field conventions and do not log secrets, credentials, connection strings, or raw tenant document content.
- Minimum metrics exist only for the locked names and label sets, with no sensitive or unbounded labels.
- The default compiled frontend and committed default app `wwwroot` no longer publish the E2E-only mock challenge fixture.
- The browser E2E runtime remains isolated and still uses `PB_ENV=Test` only inside the dedicated Playwright path.
- `run-browser-e2e.ps1` under `scripts/` is the canonical repo-native browser gate entrypoint, and all active scripts, canonical docs, and ADR references are synchronized in the same change set.
- The tenant-host browser surface is decomposed into the locked smaller modules, `tenant-host.tsx` is reduced to shell/bootstrap/route-registration ownership under the 400-line ceiling, and the route map plus shared API-client boundary remain unchanged.
- Post-extraction `tenant-shell.test.tsx` and `e2e/tenant-host.spec.ts` retain coverage parity with pre-extraction behavior, and no existing test is deleted to accommodate the refactor.
- Static grep against the extracted tenant-host modules shows zero direct `fetch(`, zero `localStorage` / `sessionStorage` usage, zero custom `X-Impersonate-*` headers, and zero client-supplied tenant-identifier headers; all browser `/api/*` calls continue to route through the shared client.
- Canonical docs state the v1 document renderer HTML-encodes raw markdown and presents it as safe source without markdown parsing, sanitizer pipelines, raw-HTML support, or stored rendered HTML.
- No canonical doc retains language that implies a CSP, markdown parsing, raw-HTML allowance, or a sanitizer sandbox in v1.
- The `tenant_impersonation_audit_events` table is unchanged in shape and remains ungeneralized: no new rows, readers, UI surface, or export pipeline ship in CP16.
- No open critical or high isolation/auth defects remain in the shipped CP16 branch state.
- The full regression suite is green, including browser coverage and required repo validation scripts.
- The implementation ships without new end-user features, CP17 release packaging work, generalized audit UI, BFF or SSR changes, JWTs, or distributed runtime infrastructure.

## Validation Plan

- pre-implementation scope-lock check that `README.md`, `docs/55-execution/execution-plan.md`, `docs/55-execution/phases/phase-5-hardening-release.md`, `docs/00-intent/canonical-decisions.md`, `docs/10-product/domain-nouns.md`, `docs/20-architecture/authn-authz.md`, `docs/20-architecture/tenancy-resolution.md`, `docs/20-architecture/frontend-spa.md`, `docs/20-architecture/frontend-app-route-map.md`, `docs/20-architecture/deployment-topology.md`, `docs/30-security/threat-model-lite.md`, `docs/30-security/tenant-isolation.md`, `docs/30-security/rate-limiting-abuse.md`, `docs/30-security/secrets-and-config.md`, `docs/40-contracts/api-contract.md`, `docs/50-engineering/tech-stack.md`, `docs/70-operations/observability.md`, `docs/70-operations/runbook-local.md`, `docs/70-operations/runbook-prod.md`, `docs/70-operations/deployment.md`, `docs/80-testing/test-strategy.md`, `docs/80-testing/testing-standards.md`, `docs/80-testing/e2e-tests.md`, `docs/90-adr/README.md`, `docs/90-adr/ADR-0008-identity-auth-boundary-with-dapper-stores.md`, `docs/90-adr/ADR-0010-playwright-root-host-e2e-runtime.md`, `ADR-0011-observability-opentelemetry-baseline.md` under `docs/90-adr/`, `docs/ai-index.md`, and `docs/repo-map.json` agree on the exact CP16 hardening story before broad code changes begin
- targeted backend unit and integration coverage for:
  - authenticated tenant-host unsafe-mutation budget exhaustion, reset behavior, exempt-route behavior, and `429 RATE_LIMITED` plus `Retry-After`
  - spoofed-host redirect construction on provision/login/logout
  - representative wrong-host or wrong-tenant rejection paths if CP16 changes those seams
  - CSRF rejection before authenticated rate-limit accounting on a representative tenant-host mutation
  - impersonation-cookie-expiry audit closure on the next tenant-host request after middleware or observability changes
  - startup validation and configuration handling for the new observability keys
  - trace or metric emission on representative API, database, and worker paths when observability wiring changes
- targeted frontend component and browser coverage for:
  - tenant-host shell behavior after extraction
  - representative root-host and tenant-host happy or deny paths after browser-gate renaming and E2E fixture relocation
  - continued impersonation banner and stop behavior after tenant-host extraction
- automated non-leakage guard that `rg -n "PB_ENV\\s*=\\s*Test|PB_ENV=Test" docker-compose.yml docker-compose.e2e.yml scripts src/PaperBinder.Api src/PaperBinder.Worker` returns hits only in `docker-compose.e2e.yml` and `run-browser-e2e.ps1`
- automated fixture-absence guard that `rg -n "e2e-turnstile" src/PaperBinder.Web/dist src/PaperBinder.Api/wwwroot` returns zero hits after the default frontend build and against the committed default app output tree
- static grep against the extracted tenant-host modules that `fetch\\(`, `localStorage`, `sessionStorage`, `X-Impersonate-`, and tenant-identifier header strings do not appear
- static review that observability changes do not emit secrets, credentials, unbounded labels, or raw document content
- static review that active scripts, canonical docs, ADRs, and taskboard entries use `run-browser-e2e.ps1`, while historical CP13-CP15 delivery evidence may retain `run-root-host-e2e.ps1` only where preserving history is intentional
- `npm.cmd run build` from `src/PaperBinder.Web`
- `npm.cmd run test` from `src/PaperBinder.Web`
- `powershell -ExecutionPolicy Bypass -File .\scripts\run-browser-e2e.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require`
- acceptance-criteria traceability review that every CP16 acceptance criterion maps to at least one automated test or explicit manual verification step
- manual reviewer verification with the canonical local stack for:
  - root-host provision or login flow
  - tenant-host binder or document flow
  - tenant-host logout and CSRF expectations
  - impersonation start or stop flow
  - worker cleanup visibility through the reviewer surface or logs
  - browser-gate documentation and entrypoint clarity
- manual VS Code and Visual Studio launch verification recorded in the eventual CP16 PR artifact before checkpoint closeout

## Likely Touch Points

- `README.md`
- `src/PaperBinder.Api/Program.Partial.cs`
- `src/PaperBinder.Api/PaperBinderHttpContractExtensions.cs`
- `src/PaperBinder.Api/RequestCorrelationMiddleware.cs`
- `src/PaperBinder.Api/TenantResolutionMiddleware.cs`
- `src/PaperBinder.Api/PaperBinderEndpointHostRequirementMiddleware.cs`
- `src/PaperBinder.Api/PaperBinderAuthenticationExtensions.cs`
- `src/PaperBinder.Api/PaperBinderCsrfMiddleware.cs`
- `src/PaperBinder.Api/PaperBinderCsrfProtection.cs`
- `src/PaperBinder.Api/PaperBinderPreAuthProtectionExtensions.cs`
- `src/PaperBinder.Api/PaperBinderAuthEndpoints.cs`
- `src/PaperBinder.Api/PaperBinder.Api.csproj`
- `src/PaperBinder.Api/wwwroot/`
- `src/PaperBinder.Worker/PaperBinderWorkerHostBuilder.cs`
- `src/PaperBinder.Worker/Worker.cs`
- `src/PaperBinder.Worker/PaperBinder.Worker.csproj`
- `src/PaperBinder.Infrastructure/Configuration/PaperBinderRuntimeSettings.cs`
- `src/PaperBinder.Infrastructure/Persistence/PaperBinderPersistenceServiceCollectionExtensions.cs`
- `src/PaperBinder.Infrastructure/Documents/HtmlEncodingMarkdownDocumentRenderer.cs`
- `src/PaperBinder.Infrastructure/Binders/DapperBinderService.cs`
- `src/PaperBinder.Infrastructure/Documents/DapperDocumentService.cs`
- `src/PaperBinder.Infrastructure/Tenancy/DapperTenantLeaseService.cs`
- `src/PaperBinder.Infrastructure/Tenancy/DapperTenantLeaseCleanupService.cs`
- `src/PaperBinder.Infrastructure/Tenancy/DapperTenantImpersonationAuditService.cs`
- `src/PaperBinder.Infrastructure/PaperBinder.Infrastructure.csproj`
- `src/PaperBinder.Web/src/app/tenant-host.tsx`
- planned extracted tenant-host module `tenant-shell.tsx` under `src/PaperBinder.Web/src/app/`
- planned extracted tenant-host module `tenant-lease-banner.tsx` under `src/PaperBinder.Web/src/app/`
- planned extracted tenant-host module `tenant-impersonation-banner.tsx` under `src/PaperBinder.Web/src/app/`
- planned extracted tenant-host module `tenant-dashboard-route.tsx` under `src/PaperBinder.Web/src/app/`
- planned extracted tenant-host module `tenant-binders-route.tsx` under `src/PaperBinder.Web/src/app/`
- planned extracted tenant-host module `tenant-binder-detail-route.tsx` under `src/PaperBinder.Web/src/app/`
- planned extracted tenant-host module `tenant-document-detail-route.tsx` under `src/PaperBinder.Web/src/app/`
- planned extracted tenant-host module `tenant-users-route.tsx` under `src/PaperBinder.Web/src/app/`
- `src/PaperBinder.Web/src/api/client.ts`
- `src/PaperBinder.Web/src/app/tenant-shell.test.tsx`
- `src/PaperBinder.Web/e2e/root-host.spec.ts`
- `src/PaperBinder.Web/e2e/tenant-host.spec.ts`
- `src/PaperBinder.Web/e2e/e2e-turnstile.js`
- `src/PaperBinder.Web/vite.config.ts`
- `src/PaperBinder.Api/Dockerfile`
- `docker-compose.e2e.yml`
- `scripts/common.ps1`
- `scripts/run-root-host-e2e.ps1`
- browser E2E gate script (`run-browser-e2e.ps1`) under `scripts/`
- `scripts/validate-checkpoint.ps1`
- `docs/10-product/domain-nouns.md`
- `docs/20-architecture/authn-authz.md`
- `docs/20-architecture/tenancy-resolution.md`
- `docs/20-architecture/frontend-spa.md`
- `docs/20-architecture/frontend-app-route-map.md`
- `docs/20-architecture/deployment-topology.md`
- `docs/30-security/threat-model-lite.md`
- `docs/30-security/tenant-isolation.md`
- `docs/30-security/rate-limiting-abuse.md`
- `docs/30-security/secrets-and-config.md`
- `docs/50-engineering/tech-stack.md`
- `docs/70-operations/observability.md`
- `docs/70-operations/runbook-local.md`
- `docs/70-operations/runbook-prod.md`
- `docs/70-operations/deployment.md`
- `docs/80-testing/test-strategy.md`
- `docs/80-testing/testing-standards.md`
- `docs/80-testing/e2e-tests.md`
- `docs/55-execution/execution-plan.md`
- `docs/55-execution/phases/phase-5-hardening-release.md`
- `docs/90-adr/README.md`
- `docs/90-adr/ADR-0008-identity-auth-boundary-with-dapper-stores.md`
- `docs/90-adr/ADR-0010-playwright-root-host-e2e-runtime.md`
- `ADR-0011-observability-opentelemetry-baseline.md` under `docs/90-adr/`
- the CP16 taskboard entry under `docs/05-taskboard/tasks/` when created
- `docs/95-delivery/pr/cp16-hardening-and-consistency-pass/`
- `docs/ai-index.md`
- `docs/repo-map.json`

## Critic Review Resolution Log

- `B1` Accepted and resolved: CP16 now locks one canonical fixed-window limiter for authenticated unsafe tenant-host `/api/*` mutations, keyed by `(tenant_id, effective_user_id)` and sourced from `PAPERBINDER_RATE_LIMIT_AUTHENTICATED_PER_MINUTE`. The plan also locks the exempt routes, removes the hedge from slice 1, and updates AC, validation, and touch points accordingly.
- `B2` Accepted and resolved: CP16 now chooses docs-only narrowing for CSP and browser-security-header drift. The plan locks the runtime XSS posture to output encoding plus the conservative document renderer and explicitly excludes new CSP or browser-security-header middleware from this checkpoint.
- `B3` Accepted and resolved: the observability ADR is no longer conditional. CP16 now requires `ADR-0011-observability-opentelemetry-baseline.md` under `docs/90-adr/` in the same change set as the instrumentation, and the reconciliation set plus touch points now name it explicitly.
- `B4` Accepted and resolved: acceptance criteria, TDD slices, and validation now cover middleware ordering, redirect construction from `PAPERBINDER_PUBLIC_ROOT_URL`, and CSRF-before-rate-limit precedence.
- `B5` Accepted and resolved: the tenant-host extraction contract is now deterministic. The plan locks the exact extracted module list, a post-refactor `tenant-host.tsx` line ceiling, coverage parity requirements, a no-test-deletion requirement, and grep guards against browser-boundary regressions.
- `B6` Accepted and resolved: acceptance criteria and the reconciliation set now explicitly name the shipped v1 renderer behavior as HTML-encoded safe source without markdown parsing or sanitizer pipelines, and require removal of sanitizer-implying or CSP-implying claims from canonical docs.
- `B7` Accepted and resolved: slice ordering now requires runtime behavior and observability slices to settle first, with the tenant-host extraction landing as a dedicated follow-on sub-PR after slices 1 through 3.
- `NB-1` Accepted and resolved: the authenticated limiter now explicitly partitions by `(tenant_id, effective_user_id)`, and `actor_user_id` is retained only in logs and traces rather than as a metric label.
- `NB-2` Accepted and resolved: the validation plan now includes an automated grep-based guard proving `PB_ENV=Test` remains isolated to the dedicated browser-E2E runtime.
- `NB-3` Accepted and resolved: the fixture-absence check now covers both the built frontend output and the committed default app `wwwroot` tree.
- `NB-4` Accepted and resolved: the browser-gate replacement name is now locked to `run-browser-e2e.ps1` under `scripts/`, and validation plus touch points are updated to match.
- `NB-5` Accepted and resolved: the minimum CP16 metric names and label keys are now enumerated in Locked Design Decisions.
- `NB-6` Accepted and resolved: redirect-construction validation now explicitly ties runtime spoofed-host regressions back to the `PAPERBINDER_PUBLIC_ROOT_URL` trust boundary.
- `NB-7` Accepted and resolved: Locked Design Decisions now restate that `tenant_impersonation_audit_events` remains ungeneralized during CP16.
- `NB-8` Accepted and resolved: acceptance criteria and validation now explicitly preserve the impersonation cookie-expiry audit-closure behavior while middleware and observability changes land.

## ADR Triggers And Boundary Risks

- ADR requirement: CP16 lands `ADR-0011-observability-opentelemetry-baseline.md` under `docs/90-adr/` in the same change set as the instrumentation.
- ADR trigger: adding a new sticky markdown parser, sanitization dependency, or stored-rendered-content pipeline.
- ADR trigger: changing cookie/session shape, tenant-resolution trust rules, or introducing a server-side session store while hardening impersonation and auth boundaries.
- ADR trigger: changing the isolated Playwright runtime model beyond the locked `run-browser-e2e.ps1` rename and E2E-fixture relocation.
- Boundary risk: host, cookie, or CSRF tightening can accidentally break the root-host to tenant-host login handoff, tenant-host logout, or impersonation stop behavior if middleware ordering drifts.
- Boundary risk: authenticated mutation rate limiting can create reviewer-visible false positives if the partition key, exempt routes, or default limit are implemented incorrectly.
- Boundary risk: observability work can leak secrets, PII, tenant document content, or high-cardinality labels if trace and log enrichment are not tightly constrained.
- Boundary risk: moving the E2E fixture or renaming the browser gate can accidentally leak `PB_ENV=Test` into the default runtime or make browser validation less deterministic.
- Boundary risk: `tenant-host.tsx` extraction can reintroduce behavior drift, direct `fetch` usage, or duplicated shell-state ownership if done as a rewrite instead of a test-guarded refactor.
- Boundary risk: CP16 can sprawl into release packaging, new admin features, generalized audit tooling, or platform extraction work unless the scope lock above is held.
