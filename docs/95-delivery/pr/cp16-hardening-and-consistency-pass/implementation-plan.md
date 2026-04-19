# CP16 Implementation Plan: Hardening And Consistency Pass
Status: Draft

## Goal

Implement CP16 so PaperBinder closes the remaining security, operability, and documentation-consistency gaps before release: the shipped runtime matches the stated threat model and operational posture, the minimum observability baseline is real rather than aspirational, carried-forward hardening defects from CP13-CP15 are resolved, and the full validation story is reviewer-safe without widening into CP17 release packaging or new product features.

## Scope

Included:
- a bounded security and runtime consistency pass across the already-shipped root-host, tenant-host, worker, and browser-E2E surfaces
- reconciliation of host validation, cookie and CSRF behavior, redirect-construction trust boundaries, and secret-handling claims against the current implementation
- resolution of the dormant authenticated-rate-limit contract so `PAPERBINDER_RATE_LIMIT_AUTHENTICATED_PER_MINUTE` is either a real shipped control or removed from the canonical runtime surface
- reconciliation of markdown, XSS, and Content-Security-Policy posture with the actual document-rendering and frontend-hosting behavior
- a minimal observability baseline for API, worker, and database execution paths:
  - OpenTelemetry or equivalent real trace instrumentation if kept in the canonical stack
  - correlated structured logs with stable field names
  - a minimum low-cardinality metric set for operational and security-boundary incidents
- carried-forward frontend/runtime hygiene from earlier checkpoints:
  - remove the E2E-only mock challenge asset from the default production bundle
  - rename or reshape the repo-native browser gate so the entrypoint matches the browser suite it now owns
  - keep `PB_ENV=Test` isolated to the dedicated Playwright runtime only
- behavior-preserving extraction of the tenant-host shell and route owners out of `src/PaperBinder.Web/src/app/tenant-host.tsx` so CP16 reduces cognitive load before release rather than after it
- targeted backend, frontend, worker, script, and test fixes required to satisfy the above and get the full regression suite green
- synchronized architecture, security, engineering, operations, testing, execution, ADR, navigation, and delivery docs directly affected by CP16

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

## Locked Design Decisions

CP16 is a hardening and refactor checkpoint, not a feature checkpoint. Implementation must not widen scope beyond tightening existing boundaries, closing drift, and resolving known carry-forward hygiene issues.

- The current cookie-auth, tenant-resolution, Dapper-runtime, single-SPA, and tenant-local impersonation model remains binding. CP16 does not reopen ADR-0002, ADR-0005, ADR-0007, ADR-0008, or ADR-0010 except to tighten implementation and documentation around them.
- Browser E2E remains a repo-native Playwright path isolated from the default reviewer and local runtime. CP16 may rename the entrypoint, move test fixtures, and tighten validation, but it must not leak `PB_ENV=Test` or E2E-only challenge behavior into `scripts/start-local.ps1`, `scripts/reviewer-full-stack.ps1`, the base `docker-compose.yml` flow, or the default production bundle.
- `tenant-host.tsx` extraction is a behavior-preserving refactor only. Route ownership, host-context rules, shell bootstrap ownership, and shared API-client usage remain unchanged.
- Observability scope must stay minimal and explicit if CP16 keeps the current OpenTelemetry posture:
  - inbound HTTP requests
  - Dapper or Npgsql database execution
  - worker cleanup-cycle and significant background-operation spans
  - correlated structured logs
  - low-cardinality metrics only
  - console export locally and optional OTLP when configured
  - no paid vendor platform requirement, dashboards, or alerting program
- Markdown hardening stays conservative. CP16 does not add raw HTML support, preview routes, stored rendered HTML, or a sticky markdown-parser dependency unless an ADR lands first. The minimum acceptable outcome is that the threat model and canonical docs stop claiming protections the shipped runtime does not actually provide.
- The authenticated-rate-limit contract must be resolved this checkpoint. Leaving a documented config key that does not back a real control is not acceptable after CP16.

## Planned Work

1. Reconcile the CP16 contract and carry-forward hardening scope before broad implementation. This blocking pass must align `docs/55-execution/execution-plan.md`, `docs/55-execution/phases/phase-5-hardening-release.md`, `docs/00-intent/canonical-decisions.md`, `docs/20-architecture/authn-authz.md`, `docs/20-architecture/tenancy-resolution.md`, `docs/20-architecture/frontend-spa.md`, `docs/20-architecture/deployment-topology.md`, `docs/30-security/threat-model-lite.md`, `docs/30-security/tenant-isolation.md`, `docs/30-security/rate-limiting-abuse.md`, `docs/30-security/secrets-and-config.md`, `docs/40-contracts/api-contract.md`, `docs/50-engineering/tech-stack.md`, `docs/70-operations/observability.md`, `docs/70-operations/runbook-local.md`, `docs/70-operations/runbook-prod.md`, `docs/70-operations/deployment.md`, `docs/80-testing/test-strategy.md`, `docs/80-testing/testing-standards.md`, `docs/80-testing/e2e-tests.md`, `docs/90-adr/ADR-0008-identity-auth-boundary-with-dapper-stores.md`, `docs/90-adr/ADR-0010-playwright-root-host-e2e-runtime.md`, `docs/ai-index.md`, and `docs/repo-map.json` on:
   - the exact CP16 hardening scope versus CP17 release-prep work
   - the current cookie, CSRF, host-validation, redirect-construction, and secret-handling contract
   - the carried-forward frontend/runtime hygiene items from CP13 through CP15
   - the fate of the dormant authenticated-rate-limit setting
   - the observability baseline that will actually ship
   - the markdown/XSS/CSP posture that the runtime can credibly claim
2. Resolve security and configuration drift at the runtime boundary:
   - verify host-validation failure behavior and middleware ordering
   - verify cookie flags, logout behavior, and CSRF enforcement remain consistent with the documented tenant-host and root-host split
   - resolve the authenticated-rate-limit contract either by implementing one canonical documented limiter for authenticated unsafe tenant-host `/api/*` mutations or by removing the dormant docs and config claim
   - reconcile markdown, XSS, and CSP claims with the current safe-source document rendering path and frontend host behavior
3. Land the minimal observability baseline:
   - add the smallest real trace instrumentation and exporter wiring that keeps the docs honest
   - preserve or improve structured log consistency for `event_name`, `tenant_id`, `user_id`, `trace_id`, and `correlation_id`
   - add the minimum low-cardinality metrics needed for request failures, rate-limit and CSRF denials, challenge failures, and cleanup-cycle outcomes
4. Fix the carried-forward browser/runtime hygiene and maintainability issues:
   - move the E2E-only mock challenge fixture out of the default frontend build output
   - rename or reshape the browser gate entrypoint so the script name matches the suite it owns now that it covers root-host, tenant-host, and impersonation flows
   - extract the tenant-host shell and route owners into smaller modules while preserving the current route map, state ownership, and shared-client boundary
5. Run targeted defect remediation across backend, frontend, worker, scripts, and tests only where required to satisfy the above and meet the CP16 merge gate.
6. Reconcile the remaining canonical docs, delivery metadata, and validation commands in the same change set so no stale or aspirational behavior claims remain once CP16 closes.

## Open Decisions

1. Authenticated mutation rate limiting
   Recommendation: implement one canonical fixed-window limiter for authenticated unsafe tenant-host `/api/*` mutations keyed by established tenant plus effective user identity, and keep per-route tuning or distributed limiting out of scope.
   Alternative allowed by this plan: if implementation risk is judged too broad for CP16, remove `PAPERBINDER_RATE_LIMIT_AUTHENTICATED_PER_MINUTE` from the canonical runtime contract and docs rather than leaving it half-shipped.
2. Security-header and CSP ownership
   Recommendation: land a minimal explicit browser-security-header posture only if it can be proven safe for the current SPA and Playwright runtime without widening scope; otherwise narrow the stale doc claims this checkpoint and defer a richer browser-hardening pass to a later focused task.
3. Observability ADR shape
   Recommendation: if CP16 adds new OpenTelemetry packages, exporter configuration keys, or telemetry conventions not already locked by an existing ADR, create a single bounded observability ADR in the same change set rather than letting the dependency choice remain implicit.

## Vertical-Slice TDD Plan

TDD applies to every non-trivial runtime change in this checkpoint. Docs-only reconciliation work does not waive the TDD requirement for code or script behavior changes.

Public seams under test:
- authenticated tenant-host API mutations and their `429` or `Retry-After` behavior
- API host startup and worker host startup for observability registration and configuration validation
- representative HTTP, worker, and database execution paths for trace or metric coverage
- the repo-native browser E2E entrypoint and isolated runtime behavior
- the tenant-host browser route surface guarded by component and Playwright tests

Planned `RED -> GREEN -> REFACTOR` slices:

1. `RED`: `Should_ResolveAuthenticatedTenantMutationRateLimitContract_When_BudgetIsExceeded`
   `GREEN`: add the smallest representative authenticated mutation limiter or explicit contract-removal path so the repo no longer carries a dormant authenticated-rate-limit setting.
   `REFACTOR`: centralize authenticated partition-key resolution and limiter registration so tenant-host mutation routes do not drift.
2. `RED`: `Should_EmitCorrelatedTraceContext_For_ApiRequests_DatabaseCalls_And_WorkerCleanup`
   `GREEN`: add the smallest real instrumentation path that proves API requests, Dapper or Npgsql activity, and worker cleanup cycles emit trace-correlated diagnostics.
   `REFACTOR`: keep observability registration in one host-builder and one persistence seam rather than scattering setup across handlers.
3. `RED`: `Should_RecordMinimumLowCardinalityMetrics_For_SecurityBoundaryAndCleanupOutcomes`
   `GREEN`: add the smallest metric set that captures cleanup-cycle outcomes plus representative rate-limit, CSRF, or challenge-denial signals without unbounded labels.
   `REFACTOR`: extract metric names and tag keys into one reviewed constants seam.
4. `RED`: `Should_Exclude_E2ETurnstileFixture_From_DefaultFrontendBuild_While_Preserving_IsolatedBrowserRuntime`
   `GREEN`: move or rewire the E2E-only challenge fixture so the default compiled frontend no longer publishes it, while the isolated Playwright runtime still passes.
   `REFACTOR`: isolate E2E-only asset ownership away from the default Vite and Docker build path.
5. `RED`: `Should_RunRepoNativeBrowserGate_Through_The_CP16Entrypoint_Without_Leaking_TestRuntimeInto_DefaultStack`
   `GREEN`: rename or reshape the browser-gate script and update the supporting wiring so the documented entrypoint matches current ownership while `PB_ENV=Test` remains isolated.
   `REFACTOR`: keep common Docker and Playwright orchestration in shared script helpers rather than duplicating shell logic.
6. `RED`: `Should_Preserve_TenantHostBrowserBehavior_After_ShellAndRouteExtraction`
   `GREEN`: split `tenant-host.tsx` using the smallest behavior-preserving extraction steps necessary to get shell, lease, impersonation, binder, document, and user-admin owners out of one file while existing component and browser tests stay green.
   `REFACTOR`: deduplicate shell-state refresh and route-owned UI seams only after the extracted modules are stable.

Broad implementation should not start until the first failing hardening behavior test exists. The tenant-host extraction is explicitly a `REFACTOR` activity guarded by existing and newly added tests; it must not introduce feature behavior not already driven by earlier slices.

## Acceptance Criteria

- Threat-model, security, engineering, operations, testing, execution, and delivery docs no longer claim behavior that the shipped CP16 runtime does not actually provide.
- The current host-validation, tenant-host versus system-host gating, cookie, CSRF, and redirect-construction behavior is explicitly documented and covered by representative regression tests where behavior changed.
- `PAPERBINDER_RATE_LIMIT_AUTHENTICATED_PER_MINUTE` is no longer dormant. Either:
  - a real documented authenticated unsafe-mutation limiter ships, or
  - the config key and its docs claims are removed from the canonical runtime surface.
- If a real authenticated unsafe-mutation limiter ships, it returns `429 RATE_LIMITED` and `Retry-After` on budget exhaustion and does not weaken tenant scoping or role enforcement.
- The observability baseline is real rather than aspirational:
  - API request paths emit trace-correlated diagnostics
  - representative database activity is correlated
  - worker cleanup cycles emit correlated diagnostics
  - local or development execution exports to console
  - OTLP export remains optional when configured
- Structured logs for request-scoped and worker-scoped events preserve stable field conventions and do not log secrets, credentials, or raw tenant document content.
- Minimum metrics exist for cleanup outcomes and representative security-boundary denials without sensitive or unbounded labels.
- The default compiled frontend and default app image no longer publish the E2E-only mock challenge fixture.
- The browser E2E runtime remains isolated and still uses `PB_ENV=Test` only inside the dedicated Playwright path.
- The repo-native browser gate entrypoint name and ownership now match the browser suite it runs, and all scripts, docs, and ADR references are synchronized in the same change set.
- The tenant-host browser surface is decomposed into smaller modules so shell/bootstrap ownership is separated from route-specific binder, document, and user-management UI, while the route map and shared API-client boundary remain unchanged.
- CP16 does not add direct `fetch` calls, browser token storage, custom tenant or impersonation headers, or client-controlled tenant identity shortcuts during the tenant-host refactor.
- Markdown and XSS posture is no longer overstated. The runtime and docs agree on the actual safe rendering behavior, and CP16 does not introduce raw HTML support or a sticky markdown dependency without an ADR.
- If CP16 introduces new OpenTelemetry packages, exporter configuration, or telemetry field conventions, the binding ADR lands in the same change set.
- No open critical or high isolation/auth defects remain in the shipped CP16 branch state.
- The full regression suite is green, including browser coverage and required repo validation scripts.
- Canonical docs, navigation metadata, and delivery artifacts are updated in the same change set as the hardening work.
- The implementation ships without new end-user features, CP17 release packaging work, generalized audit UI, BFF or SSR changes, JWTs, or distributed runtime infrastructure.

## Validation Plan

- pre-implementation scope-lock check that `docs/55-execution/execution-plan.md`, `docs/55-execution/phases/phase-5-hardening-release.md`, `docs/00-intent/canonical-decisions.md`, `docs/20-architecture/authn-authz.md`, `docs/20-architecture/tenancy-resolution.md`, `docs/20-architecture/frontend-spa.md`, `docs/20-architecture/deployment-topology.md`, `docs/30-security/threat-model-lite.md`, `docs/30-security/tenant-isolation.md`, `docs/30-security/rate-limiting-abuse.md`, `docs/30-security/secrets-and-config.md`, `docs/40-contracts/api-contract.md`, `docs/50-engineering/tech-stack.md`, `docs/70-operations/observability.md`, `docs/70-operations/runbook-local.md`, `docs/70-operations/runbook-prod.md`, `docs/70-operations/deployment.md`, `docs/80-testing/test-strategy.md`, `docs/80-testing/testing-standards.md`, `docs/80-testing/e2e-tests.md`, `docs/90-adr/ADR-0008-identity-auth-boundary-with-dapper-stores.md`, `docs/90-adr/ADR-0010-playwright-root-host-e2e-runtime.md`, `docs/ai-index.md`, and `docs/repo-map.json` agree on the exact CP16 hardening story before broad code changes begin
- targeted backend unit and integration coverage for:
  - the resolved authenticated-rate-limit contract on a representative authenticated unsafe tenant-host mutation
  - representative wrong-host, wrong-tenant, or CSRF denial behavior if CP16 changes those seams
  - startup validation and configuration handling for any new observability keys
  - trace or metric emission on representative API, database, and worker paths when observability wiring changes
- targeted frontend component and browser coverage for:
  - tenant-host shell behavior after extraction
  - representative root-host and tenant-host happy or deny paths after browser-gate renaming and E2E fixture relocation
  - continued impersonation banner and stop behavior after tenant-host extraction
- static review that no new browser code bypasses the shared API client with direct `fetch`, browser storage, or client-built tenant identity shortcuts
- static review that observability changes do not emit secrets, credentials, unbounded labels, or raw document content
- static review that the default frontend build output and default app image no longer contain the E2E-only mock challenge fixture
- static review that `PB_ENV=Test` remains isolated to the dedicated Playwright runtime path only
- `npm.cmd run build` from `src/PaperBinder.Web`
- `npm.cmd run test` from `src/PaperBinder.Web`
- the repo-native browser gate command through the CP16 browser entrypoint, expected to replace `powershell -ExecutionPolicy Bypass -File .\scripts\run-root-host-e2e.ps1` with a name that matches current suite ownership
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
- new extracted tenant-host modules beneath `src/PaperBinder.Web/src/app/`
- `src/PaperBinder.Web/src/api/client.ts`
- `src/PaperBinder.Web/src/app/tenant-shell.test.tsx`
- `src/PaperBinder.Web/e2e/root-host.spec.ts`
- `src/PaperBinder.Web/e2e/tenant-host.spec.ts`
- `src/PaperBinder.Web/public/e2e-turnstile.js` or its CP16 replacement E2E-only location
- `src/PaperBinder.Web/vite.config.ts` if the E2E fixture ownership changes
- `src/PaperBinder.Api/Dockerfile`
- `docker-compose.e2e.yml`
- `scripts/common.ps1`
- `scripts/run-root-host-e2e.ps1` or its CP16 replacement
- `scripts/validate-checkpoint.ps1` if the browser-gate name changes
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
- `docs/55-execution/phases/phase-5-hardening-release.md`
- `docs/90-adr/ADR-0008-identity-auth-boundary-with-dapper-stores.md`
- `docs/90-adr/ADR-0010-playwright-root-host-e2e-runtime.md`
- a new observability ADR under `docs/90-adr/` if CP16 adds a new sticky dependency or telemetry contract
- `docs/95-delivery/pr/cp16-hardening-and-consistency-pass/`
- `docs/ai-index.md`
- `docs/repo-map.json`

## ADR Triggers And Boundary Risks

- ADR trigger: adding OpenTelemetry packages, exporter configuration, or telemetry field conventions that are not already locked by an existing ADR.
- ADR trigger: introducing a new sticky markdown parser, sanitization dependency, or browser-security-header strategy that is expensive to reverse.
- ADR trigger: changing the browser-E2E runtime model beyond a rename or fixture relocation, such as replacing the isolated Playwright path with a different runtime topology.
- ADR trigger: changing cookie/session shape, tenant-resolution trust rules, or introducing a server-side session store while hardening impersonation and auth boundaries.
- Boundary risk: host, cookie, or CSRF tightening can accidentally break the root-host to tenant-host login handoff, tenant-host logout, or impersonation stop behavior if middleware ordering drifts.
- Boundary risk: authenticated mutation rate limiting can create reviewer-visible false positives if the partition key, scope, or default limit is too broad.
- Boundary risk: observability work can leak secrets, PII, tenant document content, or high-cardinality labels if trace and log enrichment are not tightly constrained.
- Boundary risk: moving the E2E fixture or renaming the browser gate can accidentally leak `PB_ENV=Test` into the default runtime or make browser validation less deterministic.
- Boundary risk: `tenant-host.tsx` extraction can reintroduce behavior drift, direct `fetch` usage, or duplicated shell-state ownership if done as a broad rewrite instead of a test-guarded refactor.
- Boundary risk: CP16 can sprawl into release packaging, new admin features, generalized audit tooling, or platform extraction work unless the scope lock above is held.
