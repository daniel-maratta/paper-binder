# CP15 Implementation Plan: Tenant-Local Impersonation And Audit Safety
Status: Draft

## Goal

Implement CP15 so a `TenantAdmin` can safely "view as" a same-tenant user from the live tenant-host experience, the browser clearly signals when impersonation is active, the request pipeline preserves both actor and effective identity, and impersonation start/stop behavior is auditable without broadening into general audit reporting or CP16 hardening work.

## Scope

Included:
- tenant-host-only impersonation status, start, and stop flow inside the existing `src/PaperBinder.Web` SPA, centered on `/app/users` and the tenant shell
- a minimal tenant-host API surface for impersonation state on the current cookie-auth model:
  - `GET /api/tenant/impersonation`
  - `POST /api/tenant/impersonation`
  - `DELETE /api/tenant/impersonation`
- server-issued impersonation session state carried by the existing signed auth cookie or equivalent trusted server-issued context; no client-controlled impersonation headers, query params, or browser-stored identity state
- tenant-local target validation by current host-resolved tenant membership only, so target resolution never crosses tenant boundaries and cross-tenant existence is not leaked
- request-scoped actor/effective identity handling so impersonated requests authorize as the effective user while preserving original actor identity for audit-safe behavior
- the minimum audit-event recording and persistence required for impersonation start/stop reviewer evidence and configured tenant-purge retention compatibility
- visible tenant-shell signaling when impersonation is active, including actor/effective labels and a stop action that remains available while the effective role is downgraded
- targeted unit, integration, component, and browser E2E coverage for same-tenant success, safe denial, stop behavior, active-banner behavior, and audit behavior
- synchronized contract, architecture, security, testing, execution, and delivery docs directly affected by CP15

Not included:
- cross-tenant impersonation, root-host or system-host impersonation, support backdoors, or any system-execution path that impersonates end users
- nested impersonation, replace-in-place impersonation while a session is already impersonating, or multi-user session stacks
- generic audit browsing UI, audit search/export/reporting, or a broad retrofit of every historical auditable action in the repo
- password reset or recovery, profile editing, user deletion, document editing, archive UX, or other broader admin and hardening work reserved for `CP16`
- server-side session stores, distributed caches, JWT or token auth, BFF routes, SSR, a second SPA, or browser token or session storage
- multi-role aggregation, multi-tenant user membership, or a generalized current-user bootstrap endpoint beyond what CP15 needs
- cross-tab synchronization polish, realtime session fan-out, or other post-V1 impersonation ergonomics

## Locked Design Decisions

CP15 scope is stable at the checkpoint boundary. Implementation must not reopen these decisions without updating this plan and the affected canonical docs first.

- Reuse the current single React SPA, tenant-host route map, shared browser API client, and cookie-auth baseline. CP15 does not introduce a BFF, SSR, React Router framework mode, route loaders or actions, JWTs, or a second frontend workspace.
- Impersonation is tenant-host-only and lives inside the existing authenticated tenant shell. `/app/users` owns the start action, and the tenant shell owns the active-state banner and stop action. CP15 does not add a dedicated impersonation route.
- The tenant-host API surface is locked to `GET`, `POST`, and `DELETE` on `/api/tenant/impersonation` rather than widening the existing lease contract or introducing a generic session-bootstrap endpoint.
- `POST /api/tenant/impersonation` accepts only the target `userId`. Tenant identity remains host-derived and server-authoritative; client payload, query, or header tenant hints are ignored. Both `POST` and `DELETE` are unsafe mutations and therefore require a valid CSRF token.
- Server-issued impersonation state must preserve both actor identity and effective identity. A request must never rely on client-provided claims, arbitrary headers, or browser storage to determine impersonation state.
- Authorization for normal tenant-host features must evaluate the effective impersonated membership or role, not the original actor's `TenantAdmin` role. Original actor identity remains available only for stop behavior, logging, and audit-safe behavior.
- `DELETE /api/tenant/impersonation` must remain available while impersonation is active even when the effective user is not a `TenantAdmin`. That allowance must come from trusted actor or impersonation context, not from leaving admin authorization in place for the impersonated session.
- Target lookup must stay tenant-local by construction. Unknown or cross-tenant targets return the same safe same-tenant not-found behavior; CP15 must not reveal whether a user exists outside the current tenant. Self-target requests are rejected with safe conflict or validation behavior and record no impersonation-start event.
- One active impersonation session is allowed at a time. CP15 rejects nested or replace-in-place impersonation attempts instead of silently swapping targets, and concurrent `POST /api/tenant/impersonation` requests must be serialized server-side so only one start succeeds.
- CP15 includes durable append-only audit-event persistence for impersonation start and stop. Before broad implementation begins, step 1 must either amend `docs/90-adr/ADR-0002-security-tenant-local-impersonation-for-demo-view-as.md` or add a companion ADR that locks:
  - the tenant-scoped append-only audit-event table
  - `tenant_id` enforcement and tenant-scoped query construction
  - actor versus effective identity capture
  - purge-retention behavior under `PurgeTenantAudit` and `RetainTenantPurgedSummary`
- Impersonation audit events are tenant-scoped by construction, stored with `tenant_id`, and participate in tenant purge according to the configured retention mode. System-execution paths such as worker cleanup never write impersonation events and never consume end-user impersonation state.
- CP15 retrofits every currently shipped tenant-host mutation seam that already stamps actor identity in structured logs or audit output: binders, documents, lease extension, and tenant-user administration. Those seams must preserve `ActorUserId`, `EffectiveUserId`, and `IsImpersonated` explicitly once impersonation exists.
- CP15 adds only the minimum audit-event recording and persistence required for impersonation start and stop plus audit-safe actor attribution. It does not add general audit reporting, export, or a wide audit-platform rollout.

## Planned Work

1. Reconcile the CP15 contract docs before broad implementation. This blocking pass must align `docs/40-contracts/api-contract.md`, `docs/20-architecture/authn-authz.md`, `docs/20-architecture/identity-aspnet-core-identity.md`, `docs/20-architecture/policy-authorization.md`, `docs/20-architecture/frontend-app-route-map.md`, `docs/20-architecture/frontend-spa.md`, `docs/30-security/tenant-isolation.md`, `docs/10-product/user-stories.md`, `docs/80-testing/test-strategy.md`, `docs/80-testing/testing-standards.md`, `docs/80-testing/e2e-tests.md`, `docs/70-operations/runbook-local.md`, `docs/90-adr/ADR-0002-security-tenant-local-impersonation-for-demo-view-as.md`, `docs/15-feature-definition/FD-0007-tenant-purge-audit-retention-mode.md`, `docs/55-execution/phases/phase-4-frontend-experience.md`, `docs/ai-index.md`, and `docs/repo-map.json` on:
   - tenant-host-only impersonation route and API ownership
   - actor versus effective identity semantics
   - target-not-found, self-target, nested-session, and concurrent-start behavior without cross-tenant leakage
   - durable audit-event expectations, tenant_id scoping, and audit-retention compatibility
   - tenant-shell banner ownership and `/app/users` start-action ownership
   - logout and session-expiry behavior while impersonation is active
   - the browser gate and manual verification expectations for impersonation flows
2. Add the minimum impersonation audit substrate needed by CP15: a tenant-scoped append-only audit-event table, a migration, persistence contract, and event-recording seam for `ImpersonationStarted` and `ImpersonationEnded`, plus the required ADR amendment or companion ADR. The audit substrate must honor `PurgeTenantAudit` and `RetainTenantPurgedSummary` without widening into general audit reporting.
3. Extend auth and session handling so the existing auth cookie can carry trusted impersonation markers and original actor identity without introducing a new session store or changing the root-host login model.
4. Extend request-scoped context so tenant resolution and downstream handlers can read:
   - original actor identity
   - effective impersonated identity
   - whether impersonation is active
   - a stop-allowed signal derived from trusted server-issued impersonation context
5. Add tenant-host impersonation endpoints with CSRF enforcement on both `POST` and `DELETE`, tenant-local target validation, self-target and nested-session conflict handling, safe not-found behavior, and no client-controlled claims or tenant hints.
6. Update the exact impersonation-sensitive mutation seams that already stamp actor identity so actor and effective identity remain distinguishable anywhere CP15 would otherwise make existing logs or audit evidence misleading:
   - `src/PaperBinder.Infrastructure/Binders/DapperBinderService.cs`
   - `src/PaperBinder.Infrastructure/Documents/DapperDocumentService.cs`
   - `src/PaperBinder.Infrastructure/Tenancy/DapperTenantLeaseService.cs`
   - `src/PaperBinder.Infrastructure/Tenancy/DapperTenantUserAdministrationService.cs`
   These seams must emit `ActorUserId`, `EffectiveUserId`, and `IsImpersonated` explicitly in structured log or audit output.
7. Extend the shared browser API client plus tenant shell state with impersonation summary, start, and stop methods. Add `/app/users` start controls, active impersonation banner content, and safe stop behavior without introducing direct `fetch` calls or browser storage. Eligible-target UI may improve reviewer ergonomics, but it must not disclose ineligibility reasons beyond a safe label.
8. Add targeted backend, frontend, and browser tests for same-tenant success, target-not-found or cross-tenant-safe denial, self-target rejection, nested or concurrent-start conflict behavior, active banner rendering, effective authorization behavior, `DELETE` CSRF rejection, logout and session-expiry teardown behavior, and audit recording plus purge-retention behavior.
9. Synchronize the remaining canonical docs, delivery navigation, and repository metadata in the same change set.

## Open Decisions

None. The scope-lock blockers from the CP15 critic review are resolved in this plan. Non-blocking deferrals remain recorded in the Critic Review Resolution Log below.

## Vertical-Slice TDD Plan

Public interfaces under test:
- tenant-host impersonation status, start, and stop endpoints
- cookie-issued impersonation claims or equivalent trusted session context
- request-scoped actor or effective identity context
- the impersonation audit-event write seam
- shared browser API client impersonation methods
- tenant shell and `/app/users` impersonation UI
- the repo-native tenant-host browser E2E surface

Planned `RED -> GREEN -> REFACTOR` slices:

1. `RED`: `Should_StartTenantLocalImpersonation_AndApplyEffectiveAuthorization_When_TenantAdminTargetsSameTenantUser`
   `GREEN`: add the smallest `POST /api/tenant/impersonation` path plus request-scoped actor or effective context so the first successful start behavior already authorizes downstream tenant-host requests as the effective impersonated user.
   `REFACTOR`: isolate impersonation session issuance and actor or effective context hydration into one reviewed seam rather than scattering cookie-claim writes.
2. `RED`: `Should_RejectImpersonation_When_TargetUserIsMissingOutsideCurrentTenantOrMatchesActor`
   `GREEN`: constrain target lookup to the current host-resolved tenant, reject self-target requests with safe conflict or validation behavior, and ensure no impersonation-start event is written on denial.
   `REFACTOR`: centralize target validation and ProblemDetails mapping.
3. `RED`: `Should_RejectNestedOrConcurrentImpersonationStart_When_SessionAlreadyImpersonates`
   `GREEN`: reject replace-in-place starts and serialize concurrent `POST /api/tenant/impersonation` requests so only one start succeeds and the rest fail with the locked conflict behavior.
   `REFACTOR`: isolate the single-active-session guard away from transport code.
4. `RED`: `Should_StopImpersonation_When_ActiveSessionUsesDowngradedEffectiveRole`
   `GREEN`: add the smallest `DELETE /api/tenant/impersonation` path that succeeds from trusted actor or impersonation context even when the effective user lacks `TenantAdmin`.
   `REFACTOR`: keep stop-allowed semantics local to one server-owned impersonation context instead of duplicating policy exceptions.
5. `RED`: `Should_RejectStopImpersonationWithoutValidCsrfToken_When_ImpersonationIsActive`
   `GREEN`: enforce the existing unsafe-mutation CSRF contract on `DELETE /api/tenant/impersonation` as explicitly as on `POST`.
   `REFACTOR`: centralize impersonation-endpoint mutation guards so POST and DELETE do not drift.
6. `RED`: `Should_EndImpersonationOnLogoutOrSessionExpiry_AndCloseAuditTrail`
   `GREEN`: ensure logout during active impersonation ends the full actor session and emits `ImpersonationEnded`, and ensure auth-cookie expiry invalidates both identities without leaving impersonation state open-ended in audit evidence.
   `REFACTOR`: keep impersonation-teardown audit behavior behind one session-end seam rather than distributing it across callers.
7. `RED`: `Should_RecordDurableTenantScopedImpersonationAuditEvents_AndHonorPurgeRetentionMode`
   `GREEN`: add the minimum tenant-scoped append-only audit-event persistence and write path for `ImpersonationStarted` and `ImpersonationEnded`, including `tenant_id`, actor, target or effective user, timestamp, and correlation fields, plus purge-retention behavior under both configured modes.
   `REFACTOR`: centralize impersonation audit-event construction so event naming and required fields do not drift.
8. `RED`: `Should_PreserveActorAndEffectiveIdentity_AcrossRetrofittedTenantMutations_When_Impersonating`
   `GREEN`: update binders, documents, lease extension, and tenant-user administration so each structured log or audit write preserves `ActorUserId`, `EffectiveUserId`, and `IsImpersonated`.
   `REFACTOR`: reuse one actor-or-effective metadata helper rather than open-coding these fields per service.
9. `RED`: `Should_RenderActiveImpersonationBannerAndSafeEligibilityCopy_When_TenantShellLoadsImpersonatedSession`
   `GREEN`: extend the shared browser API client and tenant shell with the smallest status, banner, stop, and `/app/users` affordance wiring needed to show clear active impersonation state without disclosing detailed ineligibility reasons.
   `REFACTOR`: keep tenant-shell impersonation state owned once at shell level rather than duplicating state per route.
10. `RED`: `Should_StartViewAsFromUsersRoute_AndReturnToAdminSession_InBrowser`
    `GREEN`: add the smallest stable Playwright flow that starts impersonation from `/app/users`, proves the impersonated experience is effective-role-limited, then stops impersonation and returns to the admin experience.
    `REFACTOR`: extract browser helpers only after the first end-to-end impersonation flow is stable.

Broad implementation should not start until the first failing impersonation behavior test exists. The executor must land slices 1 through 5 as one cohesive sub-PR before the SPA makes the start affordance reachable, so no intermediate branch state exposes an admin-only start endpoint without effective-authorization or DELETE-CSRF safety in place.

## Acceptance Criteria

- Tenant-host-only impersonation state is live at `GET /api/tenant/impersonation`, `POST /api/tenant/impersonation`, and `DELETE /api/tenant/impersonation`.
- `POST /api/tenant/impersonation` requires a tenant host, `TenantAdmin` authorization, a valid CSRF token, and a request payload that identifies only the target `userId`.
- `DELETE /api/tenant/impersonation` also requires a valid CSRF token and remains available through trusted actor or impersonation context even when the effective user no longer has `TenantAdmin`.
- Start requests resolve the target user only inside the current host-resolved tenant. A user from another tenant is not impersonable and does not produce cross-tenant existence leakage.
- Self-target impersonation is rejected with safe conflict or validation behavior and records no `ImpersonationStarted` event.
- Nested or replace-in-place impersonation is rejected with safe conflict behavior until the current impersonation session is stopped, and concurrent start attempts are serialized so only one can succeed.
- Root-host requests, system-context paths, and background jobs cannot start or use end-user impersonation.
- Impersonation session state is server-controlled and trusted. The browser never supplies impersonation claims or target identity through local storage, session storage, query-string state, or custom identity headers.
- While impersonation is active, normal tenant-host feature authorization evaluates the effective impersonated membership or role rather than the actor's original `TenantAdmin` role.
- The request pipeline preserves original actor identity separately from effective impersonated identity so downstream audit or logging behavior can distinguish them.
- `DELETE /api/tenant/impersonation` stops an active impersonation session and restores the original actor session without a root-host login round-trip.
- Logout during active impersonation ends the full actor session and emits `ImpersonationEnded` before session teardown rather than silently leaving impersonation open.
- Auth-cookie expiry during active impersonation invalidates both actor and effective identity and does not leave impersonation state open-ended in the audit trail.
- The tenant shell shows persistent active impersonation state across tenant routes, including visible actor and effective user labels plus a stop action.
- `/app/users` exposes the impersonation start affordance only for eligible tenant-local targets. UI guards improve UX but are not the security boundary, and the browser does not disclose detailed ineligibility reasons beyond a safe label.
- All impersonation browser calls flow through the shared API client only. No tenant-host impersonation code path uses direct `fetch` or browser token or session storage.
- `ImpersonationStarted` and `ImpersonationEnded` are recorded in a durable append-only tenant-scoped audit-event table with `tenant_id` enforced by construction and at least event name, tenant id, actor user id, effective or target user id, timestamp, and correlation id.
- Existing tenant-host mutation seams touched by CP15 do not become audit-misleading while impersonation is active. Binders, documents, lease extension, and tenant-user administration each preserve `ActorUserId`, `EffectiveUserId`, and `IsImpersonated` explicitly in structured log or audit output.
- Audit recording remains compatible with the configured tenant-purge retention mode and does not introduce cross-tenant retention leakage.
- Tenant purge removes all impersonation events under `PurgeTenantAudit` and leaves no per-user audit rows behind under `RetainTenantPurgedSummary`.
- System-execution paths such as worker cleanup never write impersonation events.
- Browser validation proves an admin can start same-tenant impersonation, see the impersonated restricted experience, stop impersonation, and safely return to the original admin experience.
- Cross-tenant impersonation is impossible by construction, and wrong-host or wrong-tenant access still fails before tenant-scoped handlers run.
- The implementation ships without generic audit UI, cross-tenant support, nested impersonation, server-side session infrastructure, token auth, or broader CP16 hardening work.
- Canonical product, architecture, security, testing, execution, ADR, and delivery docs are updated in the same change set as the implementation.

## Validation Plan

- pre-implementation scope-lock check that `docs/40-contracts/api-contract.md`, `docs/20-architecture/authn-authz.md`, `docs/20-architecture/identity-aspnet-core-identity.md`, `docs/20-architecture/policy-authorization.md`, `docs/20-architecture/frontend-app-route-map.md`, `docs/20-architecture/frontend-spa.md`, `docs/30-security/tenant-isolation.md`, `docs/10-product/user-stories.md`, `docs/80-testing/test-strategy.md`, `docs/80-testing/testing-standards.md`, `docs/80-testing/e2e-tests.md`, `docs/70-operations/runbook-local.md`, `docs/90-adr/ADR-0002-security-tenant-local-impersonation-for-demo-view-as.md`, `docs/15-feature-definition/FD-0007-tenant-purge-audit-retention-mode.md`, `docs/55-execution/phases/phase-4-frontend-experience.md`, `docs/ai-index.md`, and `docs/repo-map.json` explicitly agree on endpoint ownership, actor versus effective identity semantics, durable audit expectations, tenant-local target validation, self-target and nested behavior, tenant-shell banner ownership, purge-retention behavior, and browser-gate expectations before broad code changes begin
- targeted backend unit and integration coverage for:
  - same-tenant impersonation start success with effective authorization semantics active immediately
  - target-not-found, cross-tenant-safe denial, and self-target rejection
  - nested or replace-in-place rejection plus concurrent-start conflict or serialization behavior
  - `DELETE /api/tenant/impersonation` success under downgraded effective role
  - CSRF rejection on both `POST /api/tenant/impersonation` and `DELETE /api/tenant/impersonation`
  - logout behavior and auth-cookie-expiry teardown while impersonation is active
  - durable audit-event writes, `tenant_id` scoping, and retention compatibility under both configured purge modes
- `npm.cmd run build` from `src/PaperBinder.Web`
- `npm.cmd run test` from `src/PaperBinder.Web`
- the resolved tenant-host browser E2E command through the existing repo-native browser gate, expected to remain `powershell -ExecutionPolicy Bypass -File .\scripts\run-root-host-e2e.ps1` unless CP15 explicitly revises that ownership in canonical docs first
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
- static review that target lookup and audit-event reads or writes are tenant-scoped by construction using `tenant_id`, never by post-fetch filtering, and that purge behavior deletes impersonation rows under `PurgeTenantAudit` while leaving no per-user rows under `RetainTenantPurgedSummary`
- static review or repo search that tenant-host impersonation code does not use direct `fetch`, local or session storage for impersonation state, or client-built tenant identity
- static review that actor-versus-effective identity handling is request-scoped, server-issued, and unavailable to system execution paths
- static review that nested impersonation, self-target semantics, and concurrent-start behavior are explicit rather than implied by accidental cookie overwrite behavior
- static review that impersonation audit-event writes are durable rather than free-form logs only, and that system-execution paths never write impersonation events
- static review that the binders, documents, lease extension, and tenant-user administration seams preserve `ActorUserId`, `EffectiveUserId`, and `IsImpersonated` anywhere current logs or audit writes would otherwise become misleading
- acceptance-criteria traceability review that every CP15 acceptance criterion maps to at least one automated test or explicit manual verification step
- manual reviewer verification with the local stack: provision a tenant, create a non-admin tenant user, start impersonation from `/app/users`, confirm the tenant shell shows active impersonation state, confirm the impersonated experience reflects the effective user's limited capabilities, stop impersonation, confirm the admin session is restored, log out while impersonation is active in a second pass, and verify the expected audit evidence exists for the start and stop events
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require`
- manual VS Code and Visual Studio launch verification recorded in the eventual CP15 PR artifact before checkpoint closeout

## Likely Touch Points

- `src/PaperBinder.Api/PaperBinderAuthenticationExtensions.cs`
- `src/PaperBinder.Api/PaperBinderAuthEndpoints.cs` and likely a new impersonation endpoint module under `src/PaperBinder.Api/`
- `src/PaperBinder.Api/PaperBinderAuthenticatedUser.cs`
- `src/PaperBinder.Api/TenantResolutionMiddleware.cs`
- `src/PaperBinder.Api/PaperBinderTenantMembershipRequestContext.cs`
- new request-scoped impersonation or actor-context types under `src/PaperBinder.Api/`
- `src/PaperBinder.Application/Tenancy/` contracts if actor or effective identity abstractions or audit contracts need application-level seams
- `src/PaperBinder.Infrastructure/Tenancy/DapperTenantMembershipLookupService.cs`
- `src/PaperBinder.Infrastructure/Tenancy/DapperTenantUserAdministrationService.cs`
- `src/PaperBinder.Infrastructure/Binders/DapperBinderService.cs`
- `src/PaperBinder.Infrastructure/Documents/DapperDocumentService.cs`
- `src/PaperBinder.Infrastructure/Tenancy/DapperTenantLeaseService.cs`
- `src/PaperBinder.Infrastructure/Configuration/PaperBinderRuntimeSettings.cs` only if audit-event persistence needs explicit configuration binding beyond the current retention-mode settings
- `src/PaperBinder.Infrastructure/Persistence/PaperBinderDbContext.cs`
- new audit-event storage, writer, and model code under `src/PaperBinder.Infrastructure/` for the tenant-scoped append-only audit-event table
- `src/PaperBinder.Migrations/` including a new migration beneath `src/PaperBinder.Migrations/Migrations/` that adds the tenant-scoped audit-event table and any required indexes or constraints
- `tests/PaperBinder.UnitTests/`
- `tests/PaperBinder.IntegrationTests/`
- `src/PaperBinder.Web/src/api/client.ts`
- `src/PaperBinder.Web/src/api/client.test.ts`
- `src/PaperBinder.Web/src/app/tenant-host.tsx`
- `src/PaperBinder.Web/src/app/tenant-shell.test.tsx`
- `src/PaperBinder.Web/src/app/tenant-host-errors.ts`
- `src/PaperBinder.Web/src/test/test-helpers.ts`
- `src/PaperBinder.Web/e2e/tenant-host.spec.ts`
- `scripts/run-root-host-e2e.ps1`
- `docs/10-product/user-stories.md`
- `docs/20-architecture/authn-authz.md`
- `docs/20-architecture/identity-aspnet-core-identity.md`
- `docs/20-architecture/policy-authorization.md`
- `docs/20-architecture/frontend-app-route-map.md`
- `docs/20-architecture/frontend-spa.md`
- `docs/30-security/tenant-isolation.md`
- `docs/40-contracts/api-contract.md`
- `docs/70-operations/runbook-local.md`
- `docs/80-testing/test-strategy.md`
- `docs/80-testing/testing-standards.md`
- `docs/80-testing/e2e-tests.md`
- `docs/55-execution/execution-plan.md`
- `docs/55-execution/phases/phase-4-frontend-experience.md`
- `docs/90-adr/ADR-0002-security-tenant-local-impersonation-for-demo-view-as.md`
- `docs/95-delivery/pr/cp15-tenant-local-impersonation-and-audit-safety/`
- `docs/ai-index.md`
- `docs/repo-map.json`

## Critic Review Resolution Log

- `B1` Accepted and resolved: CP15 now locks durable append-only audit-event persistence in scope, requires a tenant-scoped audit table, and requires step 1 to amend `ADR-0002` or land a companion ADR before broad implementation begins.
- `B2` Accepted and resolved: the retrofit scope is now deterministic. The plan commits to updating binders, documents, lease extension, and tenant-user administration, and it locks the structured field set as `ActorUserId`, `EffectiveUserId`, and `IsImpersonated`.
- `B3` Accepted and resolved: acceptance criteria, planned work, TDD slices, and validation now cover logout during impersonation, auth-cookie expiry during impersonation, and self-target rejection.
- `B4` Accepted and resolved: the durable audit substrate now explicitly requires `tenant_id` scoping by construction, purge participation under both retention modes, and a prohibition on system-path impersonation writes.
- `B5` Accepted and resolved: the plan now names CSRF enforcement explicitly on both `POST /api/tenant/impersonation` and `DELETE /api/tenant/impersonation`, and the TDD plus validation plan include the DELETE-CSRF path.
- `NB-1` Deferred intentionally: the browser-gate script name remains `scripts/run-root-host-e2e.ps1` through CP15. Renaming or reshaping that entrypoint is deferred to CP16 or a focused delivery-doc cleanup because it does not change checkpoint behavior.
- `NB-2` Accepted and resolved: the `/app/users` affordance now has a locked safe-copy posture that avoids disclosing detailed ineligibility reasons beyond a safe label.
- `NB-3` Accepted and resolved: the first TDD slice now includes effective authorization from the first successful start path, and the plan requires slices 1 through 5 to land together before the SPA start affordance is reachable.
- `NB-4` Accepted and resolved: locked design decisions, planned work, TDD, and validation now require concurrent start requests to be serialized server-side so only one start succeeds.
- `NB-5` Deferred intentionally: no `tenant-host.tsx` extraction is required for CP15. If the post-implementation review finds the file crossed a cognitive-load threshold, that refactor belongs in CP16 rather than in this checkpoint.

## ADR Triggers And Boundary Risks

- ADR requirement: before broad implementation begins, step 1 must amend `ADR-0002` or add a companion ADR that locks the durable tenant-scoped append-only audit-event schema and purge-retention behavior.
- ADR trigger: introducing server-side session storage, distributed cache, or another new authentication or session dependency to carry impersonation state.
- ADR trigger: changing the v1 single-role or single-membership model, or moving authorization decisions out of the documented API-boundary policy model.
- Boundary risk: if normal endpoint authorization accidentally continues to use the original actor's `TenantAdmin` role while impersonation is active, CP15 silently becomes a privilege-escalation bug.
- Boundary risk: if the auth cookie is rewritten to the target user without preserving original actor identity, stop behavior and audit safety both become brittle or misleading.
- Boundary risk: if CP15 claims audit safety but records impersonation only through free-form logs, reviewer evidence and purge-retention behavior remain ambiguous.
- Boundary risk: if the new audit substrate expands into generic audit history, reporting, or broad backfill work, CP15 will sprawl into a platform project instead of a bounded checkpoint.
- Boundary risk: self-target or nested impersonation behavior can become confusing and hard to review unless conflict semantics are explicit in both API and UI.
- Boundary risk: CP15 can easily sprawl into password reset, richer user administration, cross-tenant admin affordances, or broader CP16 hardening and polish work.
