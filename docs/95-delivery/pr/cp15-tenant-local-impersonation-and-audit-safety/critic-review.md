# CP15 Critic Review: Tenant-Local Impersonation And Audit Safety
Status: Scope-Lock Review (Pre-Implementation) — Re-Review Complete

Historical note: This artifact begins with the `2026-04-17` first-pass scope-lock review, which returned five blocking findings (`B1`-`B5`) and five non-blocking findings (`NB-1`-`NB-5`). The plan was revised the same day to resolve all blockers and either resolve or intentionally defer every non-blocker. The Re-Review section at the bottom of this file records the `2026-04-17` re-review outcome: scope-locked.

Reviewer: PaperBinder Critic
Date: 2026-04-17

Inputs reviewed:
- `docs/55-execution/execution-plan.md` (CP15 checkpoint definition)
- `docs/55-execution/phases/phase-4-frontend-experience.md`
- `docs/95-delivery/pr/cp15-tenant-local-impersonation-and-audit-safety/implementation-plan.md`
- `docs/90-adr/ADR-0002-security-tenant-local-impersonation-for-demo-view-as.md`
- `docs/15-feature-definition/FD-0007-tenant-purge-audit-retention-mode.md`
- `docs/40-contracts/api-contract.md` (current surface; no impersonation contract yet)
- `docs/30-security/tenant-isolation.md` (no current impersonation content)
- `docs/10-product/user-stories.md` (no current impersonation stories)
- `docs/95-delivery/pr/cp14-tenant-host-frontend-flows/critic-review.md` (prior checkpoint posture)
- Current infrastructure surface (`src/PaperBinder.Infrastructure/`) — confirms no existing durable audit-event persistence

---

## Verdict

**The plan is not yet scope-locked. Blocking findings below must be resolved in the plan (and in the canonical-doc reconciliation pass called out as Planned Work step 1) before broad CP15 implementation begins.**

The plan's shape is correct: it translates the CP15 checkpoint outcome into a bounded, testable change, identifies the right risk surfaces (actor-vs-effective identity, target-validation leakage, durable audit evidence, tenant-shell banner ownership), front-loads doc reconciliation, and uses a credible vertical-slice TDD sequence. However, the plan ships with two unresolved Open Decisions that are genuine scope-lock decisions — both feed directly into acceptance criteria, the audit substrate, and the ADR posture — and several acceptance-criteria gaps that would force the executor to invent scope mid-implementation. Locking those items is a one-pass edit; the rest of the plan is in good shape.

---

## Blocking Findings

### B1: Audit-durability Open Decision must be locked before implementation begins

Plan Open Decision #1 leaves "durable append-only audit-event store vs. structured logs only" unresolved. This is not deferrable:

- The plan itself flags "adding durable audit-event persistence, a new audit schema, or another sticky audit mechanism" as an ADR trigger.
- Planned Work step 2 is the audit substrate. The executor cannot start it without knowing whether a migration, schema, and persistence contract are in scope.
- AC line "`ImpersonationStarted` and `ImpersonationEnded` are recorded with **durable audit evidence**" already implies durable persistence but the plan hedges in the Open Decision.
- `ADR-0002` currently says "logged via AuditEvents" without specifying durability. `FD-0007` says CP11 does not add durable audit persistence; CP15 would be the first to do so.

Required resolution before scope-lock:
- Commit to durable append-only persistence (the plan's own recommendation).
- Either amend `ADR-0002` with the durability decision or add a companion ADR for the audit-event storage choice as part of step 1 doc reconciliation.
- Replace the Open Decision with a Locked Design Decision that references the amended/new ADR.

### B2: Retrofit-scope Open Decision must be locked before implementation begins

Plan Open Decision #3 leaves "retrofit actor-vs-effective attribution for every currently shipped tenant-host mutation seam vs. start/stop only" unresolved. Consequences:

- Planned Work step 6 lists binders, documents, lease extension, and tenant-user administration as "primary candidate seams" rather than a deterministic list. The critic cannot verify completeness against a "candidates" list.
- Leaving this open risks CP15 shipping with immediately audit-misleading evidence in already-merged seams (the boundary risk the plan itself calls out).
- This also drives the touch-point list for `DapperBinderService.cs`, `DapperDocumentService.cs`, `DapperTenantLeaseService.cs`, and `DapperTenantUserAdministrationService.cs`.

Required resolution before scope-lock:
- Commit to retrofitting every currently shipped tenant-host mutation seam that already stamps actor identity (the plan's own recommendation).
- Enumerate the exact seams and the exact field rename/addition (for example `ActorUserId` plus `EffectiveUserId` plus `IsImpersonated`) in the locked plan.

### B3: Acceptance criteria do not cover session-boundary interactions during impersonation

The plan's AC cover happy path, denial, stop, and audit, but are silent on three boundary conditions that are directly in scope:

1. **Logout during active impersonation.** What does `POST /api/auth/logout` do when impersonation is active? It must end the full actor session, not merely stop impersonation, and must record `ImpersonationEnded` first. Left unspecified this is a privilege-boundary and audit-completeness gap.
2. **Auth cookie expiry / session timeout during active impersonation.** The server-controlled impersonation state rides the existing auth cookie (per Locked Design Decision on cookie reuse). On cookie expiry the original actor identity must not silently survive, and the audit trail must not leave impersonation open-ended.
3. **Self-target semantics.** Plan Open Decision #2 leaves this unresolved. An admin impersonating themselves is a degenerate but reachable input and must have locked server behavior (the plan's own recommendation is "reject with safe conflict or validation"). This is an AC, not an Open Decision.

Required resolution before scope-lock:
- Add AC lines for logout-during-impersonation, session-expiry-during-impersonation, and self-target rejection.
- Add a corresponding RED slice for each in the Vertical-Slice TDD Plan.

### B4: Durable audit substrate must be tenant-scoped by construction and participate in tenant purge

Given B1's required resolution (durable persistence), the audit-event table is a new tenant-scoped persistence surface. The plan mentions "retention-mode compatibility" in AC but does not make the construction-level rules explicit. Against `AGENTS.md` hard invariants:

- The schema must carry `tenant_id` and all reads must be tenant-scoped by construction, not by post-fetch filter.
- The `PurgeTenantAudit` retention mode (per `FD-0007`) must hard-delete `ImpersonationStarted`/`ImpersonationEnded` rows for the purged tenant along with every other tenant-owned row.
- The `RetainTenantPurgedSummary` retention mode must not leave per-user audit rows behind.
- System execution paths (worker, cleanup, background jobs) must never write impersonation events; only the tenant-host request path does.

Required resolution before scope-lock:
- Add AC lines making the tenant_id column, tenant-scoped query construction, purge participation under both retention modes, and system-path write prohibition explicit.
- Add integration tests under the Validation Plan that assert purge removes impersonation events under `PurgeTenantAudit` and leaves no per-user rows under `RetainTenantPurgedSummary`.
- `PaperBinder.Migrations/Migrations/` must receive the new migration in the same change set; `docs/30-security/tenant-isolation.md` must describe the new tenant-scoped table.

### B5: CSRF enforcement scope for impersonation endpoints is ambiguous in AC

Planned Work step 5 says "CSRF on unsafe mutations." AC only explicitly names CSRF for `POST /api/tenant/impersonation`. `DELETE /api/tenant/impersonation` is also an unsafe mutation and must be CSRF-protected; the Locked Design Decision allowing DELETE to remain available under a downgraded effective role makes the CSRF contract more important, not less.

Required resolution before scope-lock:
- AC must name CSRF enforcement explicitly on both `POST` and `DELETE`.
- Add an integration test slice for "DELETE without valid CSRF token is rejected while impersonation is active."

---

## Non-Blocking Findings

### NB-1: Browser-gate script name is now semantically misleading

The Validation Plan keeps `scripts/run-root-host-e2e.ps1` as the CP15 browser gate and explicitly notes the ownership is deferred. CP14 already stretched this script to cover tenant-host flows; CP15 extends it further with impersonation specs. The script name is now off by one generation. Non-blocking because CP15 is not the correct place to fix it, but flag it in the CP16 hardening scope or a focused follow-up so the CP15 PR artifact can record the deferral cleanly.

### NB-2: Route-registry and UI guard surface under `/app/users` should note reviewer-guidance copy posture

`/app/users` owns the start affordance. Eligible-target filtering is a UX guard, not the security boundary (correctly stated). Consider adding a non-blocking note in the plan that the UI must not expose "why" a target is ineligible beyond "not eligible" (for example, do not disclose disabled/locked states if those are tenant-local admin facts), to avoid leaking state through the start affordance list. The security impact is minor in CP15's scope but worth naming once in the plan to keep reviewers from expanding it.

### NB-3: TDD slice ordering leaves effective-authorization proof for slice 3

Slices 1 and 2 add start and target-validation; slice 3 is where effective-membership authorization and actor preservation first appear. An admin can already "start" impersonation without effective-role enforcement landing until slice 3, which means the code is transiently a privilege-escalation bug on a feature branch. Non-blocking because the executor is committed to not merging mid-slice, but strongly recommend reordering or adding a guard: either fold the effective-context RED into slice 1, or land slices 1-3 in a single sub-PR before any user-visible "start" endpoint is wired.

### NB-4: Nested and race semantics

The plan rejects nested/replace-in-place impersonation with safe conflict behavior. Non-blocking observation: two concurrent `POST /api/tenant/impersonation` requests from the same admin session should be serialized server-side so only one succeeds and the other returns the conflict response. A row-level insert+unique-constraint on the impersonation session (or equivalent) is the smallest viable implementation. Worth one explicit line in the plan rather than relying on handler-order luck.

### NB-5: `tenant-host.tsx` size

CP14's critic noted `tenant-host.tsx` had grown to 1841 lines. CP15 adds impersonation banner ownership, stop action, and `/app/users` start affordance at the shell level. The plan does not call out extraction, and CP15 is the wrong checkpoint to force it. Non-blocking, but the post-implementation review should note whether the file crossed a cognitive-load threshold that CP16 should address.

---

## Locked Decisions

Treat these as binding for CP15 implementation. They already appear in the plan or are implied by `AGENTS.md`, `ADR-0002`, and the execution plan; they are restated here so the executor does not re-open them.

- Tenant-host only. No root-host, system-host, support, or worker impersonation path.
- Single React SPA and cookie-auth baseline. No BFF, SSR, framework-mode routing, JWT, or second SPA.
- API surface is exactly `GET`, `POST`, `DELETE` on `/api/tenant/impersonation`. Payload for `POST` is only `userId`; tenant is host-derived and server-authoritative.
- Server-issued impersonation session state. No client-supplied claims, headers, query params, or browser storage.
- Effective membership/role drives authorization while impersonation is active; original actor identity is preserved for stop behavior, logging, and audit-safe behavior.
- `DELETE /api/tenant/impersonation` remains available under downgraded effective role via trusted actor/impersonation context, not by leaving admin authorization in place for the impersonated session.
- Target lookup is tenant-local by construction. Cross-tenant existence is never leaked.
- One active impersonation session at a time. Nested or replace-in-place is rejected with conflict.
- `/app/users` owns the start affordance; tenant shell owns the active-state banner and stop action. No dedicated impersonation route.
- All browser calls go through the shared API client. No direct `fetch`, `localStorage`, or `sessionStorage` for impersonation state.
- Canonical docs (contracts, architecture, security, testing, execution, delivery) are updated in the same change set as implementation.
- Minimum audit-event recording only. No general audit browsing, search, export, or retrofit of unrelated historical events.
- ADR required before introducing: durable audit-event schema, server-side session store, distributed cache, or any change to the single-role/single-membership model.

---

## Required Plan Edits

Apply these edits to `docs/95-delivery/pr/cp15-tenant-local-impersonation-and-audit-safety/implementation-plan.md` before scope-lock is declared. All edits flow into the step 1 canonical-doc reconciliation pass already planned.

1. **Resolve Open Decision #1 (audit durability)** — commit to durable append-only persistence, then amend `ADR-0002` (or add a companion ADR) to state the decision, schema intent, tenant scoping, and retention-mode behavior. Move the resolution from "Open Decisions" into "Locked Design Decisions."
2. **Resolve Open Decision #2 (self-target)** — commit to rejecting self-target with safe conflict or validation behavior. Add this as an AC line and an integration-test RED slice.
3. **Resolve Open Decision #3 (retrofit scope)** — commit to retrofitting every currently shipped tenant-host mutation seam that stamps actor identity (binders, documents, lease extension, tenant-user administration). Replace "primary candidate seams" wording in Planned Work step 6 with a deterministic list and the exact field/shape change, and add an AC line requiring all retrofitted seams to distinguish actor vs. effective identity in their log/audit output.
4. **Add AC lines for session-boundary behavior** (from B3):
   - "Logout during active impersonation ends the full actor session and emits `ImpersonationEnded` before session teardown."
   - "Auth cookie expiry during active impersonation invalidates both actor and effective identity and does not leave impersonation state open-ended in the audit trail."
   - "Self-target impersonation is rejected with safe conflict or validation behavior and records no `ImpersonationStarted` event."
5. **Add AC lines for tenant-scoped audit substrate** (from B4):
   - "Impersonation audit events are stored in a tenant-scoped table with `tenant_id` enforced by construction."
   - "Tenant purge removes all impersonation events under `PurgeTenantAudit` and leaves no per-user rows under `RetainTenantPurgedSummary`."
   - "System-execution paths (worker, cleanup, background jobs) never write impersonation events."
6. **Tighten CSRF AC** (from B5) — name CSRF enforcement explicitly on both `POST /api/tenant/impersonation` and `DELETE /api/tenant/impersonation` and add a RED slice for the DELETE path.
7. **Tighten TDD ordering** (from NB-3) — either fold the effective-authorization slice into slice 1 or require slices 1-3 to land as a single sub-PR before any user-visible start endpoint is reachable from the SPA.
8. **Add serialization note for concurrent start** (from NB-4) — one line in Planned Work or Locked Decisions stating concurrent `POST /api/tenant/impersonation` requests are serialized server-side (for example via insert + unique constraint).
9. **Add migration and schema line to touch points** — call out the new audit-event migration under `src/PaperBinder.Migrations/Migrations/` and the new infrastructure service/repository files under `src/PaperBinder.Infrastructure/` explicitly once B1 is resolved.
10. **Cross-link docs reconciliation** — ensure step 1 explicitly lists `docs/90-adr/ADR-0002-security-tenant-local-impersonation-for-demo-view-as.md`, `docs/15-feature-definition/FD-0007-tenant-purge-audit-retention-mode.md`, `docs/30-security/tenant-isolation.md`, `docs/10-product/user-stories.md`, `docs/55-execution/phases/phase-4-frontend-experience.md`, `docs/ai-index.md`, and `docs/repo-map.json` as part of the blocking reconciliation set (most but not all are already named).

---

## Post-Implementation Checks

Record these as the CP15 post-implementation check table. Each must pass before the PR artifact is marked ship-ready.

1. **No cross-tenant target resolution.** Static review of target-lookup code path confirms queries are tenant-scoped by construction using the host-resolved tenant id; integration test for "target user in tenant B is indistinguishable from missing user in tenant A" passes.
2. **Effective-authorization under impersonation.** Integration tests prove every protected tenant-host endpoint evaluates policy against the effective membership/role, not the actor's `TenantAdmin` role. Includes a test where the effective user is a non-admin and the endpoint returns 403 even though the actor holds `TenantAdmin`.
3. **DELETE impersonation under downgraded effective role.** Integration test proves `DELETE /api/tenant/impersonation` succeeds while the effective user lacks `TenantAdmin`, driven by trusted actor/impersonation context rather than residual admin authorization.
4. **Server-issued state only.** Grep confirms no client-supplied impersonation state: no `X-Impersonate-*` headers accepted, no `impersonate=` query params honored, no `localStorage` or `sessionStorage` impersonation keys in `src/PaperBinder.Web/`.
5. **Shared API client transport.** Grep for `fetch(` in tenant-host impersonation code paths returns zero; all impersonation calls route through the shared client with CSRF, correlation-id, and API-version header handling.
6. **CSRF enforcement on POST and DELETE.** Integration tests prove both endpoints reject requests missing a valid CSRF token.
7. **Self-target and nested rejection.** Integration tests prove self-target returns safe conflict/validation with no `ImpersonationStarted` event recorded; nested/replace-in-place returns safe conflict with the existing impersonation session unchanged.
8. **Actor vs. effective identity preservation across retrofitted seams.** Static review of binders, documents, lease extension, and tenant-user administration seams confirms every log/audit write preserves actor vs. effective distinction; unit or integration tests cover at least one mutation per seam under active impersonation.
9. **Durable audit evidence shape.** `ImpersonationStarted` and `ImpersonationEnded` rows include at minimum event name, tenant id, actor user id, effective/target user id, timestamp, and correlation id; schema is tenant-scoped with `tenant_id`; read paths are tenant-scoped by construction.
10. **Tenant purge participation.** Integration tests under both retention modes confirm impersonation events are removed under `PurgeTenantAudit` and that no per-user rows remain under `RetainTenantPurgedSummary`.
11. **Logout and session expiry during impersonation.** Integration tests prove logout while impersonating ends the actor session and records `ImpersonationEnded`; cookie expiry during impersonation invalidates both identities and does not leave impersonation state open-ended in audit evidence.
12. **Tenant-shell signaling.** Component test confirms the banner renders with actor and effective labels and a stop action on every authenticated tenant route while impersonation is active; banner is owned once at shell level.
13. **Start affordance surface.** Component test confirms `/app/users` shows the start affordance only for eligible tenant-local targets; the affordance list does not disclose ineligibility reasons beyond a safe label.
14. **Browser E2E flow.** Playwright spec proves admin starts same-tenant impersonation from `/app/users`, sees the banner, confirms the effective user's restricted experience, stops impersonation, and is returned to the admin experience without a root-host login round-trip.
15. **No CP16 or out-of-scope feature bleed.** No generic audit UI, search, export, cross-tenant support, nested impersonation, server-side session store, token auth, password reset, profile editing, user deletion, document editing, or archive UX in the diff.
16. **Doc reconciliation completeness.** Every file listed in Planned Work step 1 plus ADR-0002 (or companion ADR), `FD-0007` alignment if needed, `docs/ai-index.md`, and `docs/repo-map.json` are updated in the same change set; `scripts/validate-docs.ps1` passes.
17. **Validation script gate.** `scripts/validate-launch-profiles.ps1` and `scripts/validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require` pass; the repo-native browser gate (currently `scripts/run-root-host-e2e.ps1`) passes with the new impersonation specs included.
18. **Manual VS Code and Visual Studio launch verification recorded in the PR artifact** before checkpoint closeout.

---

## Summary

The plan is close to scope-lock but not yet there. The structure, locked decisions, risk framing, TDD sequence, validation plan, and touch points are all substantively correct. The blockers are concentrated in three unresolved Open Decisions (audit durability, self-target, retrofit scope) and a small set of missing acceptance criteria around session boundaries, durable-audit tenant scoping, and CSRF coverage on DELETE. Apply the Required Plan Edits above and the plan will be scope-locked.

---

## Re-Review (Post-Revision)

Reviewer: PaperBinder Critic
Date: 2026-04-17

Inputs re-reviewed:
- Revised `docs/95-delivery/pr/cp15-tenant-local-impersonation-and-audit-safety/implementation-plan.md`
- The `Critic Review Resolution Log` section in the revised plan
- Unchanged canonical docs checked for continued alignment: `ADR-0002`, `FD-0007`, `docs/55-execution/execution-plan.md`, `docs/55-execution/phases/phase-4-frontend-experience.md`

### Verdict

**The plan is scope-locked. No blocking findings remain.**

All five blockers (`B1` audit durability, `B2` retrofit scope, `B3` session-boundary AC, `B4` tenant-scoped audit substrate, `B5` CSRF on DELETE) are resolved in the revised plan. Non-blocking findings `NB-2`, `NB-3`, and `NB-4` are resolved; `NB-1` and `NB-5` are correctly deferred with explicit rationale. Broad implementation may begin once Planned Work step 1 lands the ADR amendment (or companion ADR) and the named canonical-doc reconciliation pass.

### Blocker Resolution Verification

| # | Blocker | Resolution In Revised Plan | Verified |
| --- | --- | --- | --- |
| B1 | Audit-durability decision unresolved | Locked Design Decision now commits to a durable append-only tenant-scoped audit-event table. Planned Work step 2 requires the ADR amendment or companion ADR before broad implementation begins. Acceptance criteria name the durable table and required fields. TDD slice 7 covers the write path and purge-retention behavior. | Pass |
| B2 | Retrofit scope non-deterministic | Locked Design Decision enumerates the exact seams (binders, documents, lease extension, tenant-user administration) and locks the field set (`ActorUserId`, `EffectiveUserId`, `IsImpersonated`). Planned Work step 6 names the exact files. TDD slice 8 covers the retrofit as a single slice. Validation plan includes a static review for the same fields. | Pass |
| B3 | Session-boundary AC missing | Acceptance criteria now cover logout during impersonation, cookie-expiry teardown, and self-target rejection. TDD slices 2 and 6 cover self-target and session teardown. Validation plan adds logout and cookie-expiry coverage plus a second manual verification pass. | Pass |
| B4 | Tenant-scoped audit substrate | Locked Design Decision and acceptance criteria require `tenant_id` by construction, purge participation under `PurgeTenantAudit` and `RetainTenantPurgedSummary`, and prohibit system-execution paths from writing impersonation events. Validation plan adds a static review of tenant-scoped reads/writes and a purge-behavior check under both retention modes. | Pass |
| B5 | CSRF coverage ambiguous on DELETE | Locked Design Decision names CSRF on both `POST` and `DELETE`. Acceptance criteria name DELETE CSRF explicitly. TDD slice 5 is the dedicated DELETE-CSRF RED. Validation plan asserts CSRF rejection on both endpoints. | Pass |

### Non-Blocking Resolution Verification

| # | Non-Blocker | Status | Notes |
| --- | --- | --- | --- |
| NB-1 | Browser-gate script name misleading | Deferred | Explicitly deferred past CP15; CP16 or a focused delivery-doc cleanup is the correct home. |
| NB-2 | `/app/users` affordance ineligibility copy | Resolved | Planned Work step 7 and acceptance criteria now require safe-label copy without disclosing ineligibility reasons. |
| NB-3 | TDD slice ordering leaves effective-auth late | Resolved | Slice 1 now fires effective authorization on the first successful start path, and slices 1 through 5 must land as one cohesive sub-PR before the SPA start affordance is reachable. |
| NB-4 | Concurrent-start race | Resolved | Locked Design Decisions, Planned Work step 5, TDD slice 3, and Validation all require server-side serialization so only one concurrent start succeeds. |
| NB-5 | `tenant-host.tsx` size | Deferred | Correctly deferred to CP16 if the post-implementation review finds the file crossed a cognitive-load threshold. |

### Residual Risks (Carry Into Post-Implementation Review)

- **Cookie-expiry audit-trail closure.** The plan says auth-cookie expiry "does not leave impersonation state open-ended in the audit trail," but because expiry is noticed server-side only on the next request, the post-implementation review should verify whether the implementation writes a terminal `ImpersonationEnded` event on the first post-expiry request that detects the lapsed session, or whether the audit trail simply ages out with tenant purge. Both are defensible; the post-implementation evidence should record which was chosen.
- **Audit-event outcome field.** Acceptance criteria name event name, tenant id, actor user id, effective/target user id, timestamp, and correlation id as the minimum set. Denied starts (self-target, cross-tenant, nested, concurrent loser) correctly write no event; any future extension for denied-attempt observability is out of scope for CP15 and should remain so.
- **ADR landing timing.** The plan correctly requires the ADR amendment or companion ADR in step 1. Post-implementation review must confirm the ADR landed in the same change set and that its schema and retention-mode language match the implemented migration.
- **Browser-gate script name deferral.** The script name remains `scripts/run-root-host-e2e.ps1` even as it covers impersonation specs. The PR artifact should note this deferral so reviewers are not surprised by the name.

### Follow-ups For Executor Before Broad Implementation

1. Execute Planned Work step 1 as a separate first sub-PR, including the ADR amendment or companion ADR, before starting the vertical-slice sequence. This matches the plan's own gating language.
2. Confirm the migration file name and table name with the ADR wording so doc and migration terms match at merge time.
3. Treat slices 1 through 5 as an indivisible cohesive sub-PR per the revised TDD plan so no branch state ever exposes a reachable start affordance without effective-authorization and DELETE-CSRF safety in place.

---

## Post-Implementation Review

Reviewer: PaperBinder Critic
Date: 2026-04-17

Inputs reviewed:
- The revised and now scope-locked `docs/95-delivery/pr/cp15-tenant-local-impersonation-and-audit-safety/implementation-plan.md`
- The author notes block accompanying the implementation submission
- The current branch diff against `main`, with focused reads of:
  - `src/PaperBinder.Api/PaperBinderImpersonationService.cs`
  - `src/PaperBinder.Api/PaperBinderImpersonationEndpoints.cs`
  - `src/PaperBinder.Api/PaperBinderImpersonationClaims.cs`
  - `src/PaperBinder.Api/PaperBinderImpersonationProblemMapping.cs`
  - `src/PaperBinder.Api/PaperBinderExecutionUserRequestContext.cs`
  - `src/PaperBinder.Api/TenantResolutionMiddleware.cs`
  - `src/PaperBinder.Api/PaperBinderAuthEndpoints.cs`
  - `src/PaperBinder.Api/PaperBinderCsrfMiddleware.cs`
  - `src/PaperBinder.Application/Tenancy/TenantImpersonationAuditContracts.cs`
  - `src/PaperBinder.Infrastructure/Tenancy/DapperTenantImpersonationAuditService.cs`
  - `src/PaperBinder.Infrastructure/Tenancy/DapperTenantLeaseCleanupService.cs`
  - `src/PaperBinder.Infrastructure/Persistence/PaperBinderDbContext.cs`
  - `src/PaperBinder.Migrations/Migrations/202604170001_AddTenantImpersonationAuditEvents.cs`
  - the four retrofitted seams: `DapperBinderService.cs`, `DapperDocumentService.cs`, `DapperTenantLeaseService.cs`, `DapperTenantUserAdministrationService.cs`, plus the matching application command contracts
  - `src/PaperBinder.Web/src/api/client.ts` and `src/PaperBinder.Web/src/api/client.test.ts`
  - `src/PaperBinder.Web/src/app/tenant-host.tsx`, `tenant-host-errors.ts`, `tenant-shell.test.tsx`, and `src/PaperBinder.Web/e2e/tenant-host.spec.ts`
  - `tests/PaperBinder.IntegrationTests/TenantImpersonationIntegrationTests.cs`
  - canonical doc updates: `ADR-0002`, `FD-0007`, `docs/40-contracts/api-contract.md`, `docs/30-security/tenant-isolation.md`, `docs/20-architecture/policy-authorization.md`, `docs/20-architecture/authn-authz.md`, `docs/20-architecture/identity-aspnet-core-identity.md`, `docs/55-execution/checkpoint-status.md`, `docs/55-execution/execution-plan.md`, `docs/55-execution/phases/phase-4-frontend-experience.md`

### Verdict

**CP15 is ship-ready. No blocking findings remain.**

The implementation matches the scope-locked plan end-to-end. All five blockers (`B1`-`B5`) and the three resolved non-blockers (`NB-2`, `NB-3`, `NB-4`) from the scope-lock review are demonstrably honored in code, tests, and docs. The two intentionally deferred non-blockers (`NB-1`, `NB-5`) carry forward unchanged. Residual risks below are recorded for transparency and CP16 sequencing, not to gate this checkpoint.

### Blocking Findings

None.

The post-implementation checks 1 through 17 from the scope-lock section are all satisfied by the diff. Check 18 (manual VS Code and Visual Studio launch verification) is the only outstanding item required by the checkpoint-status manifest, and it belongs to the human reviewer rather than to this critic pass.

Spot-check evidence supporting "no blockers":

- **Tenant-scoped target lookup by construction.** `PaperBinderImpersonationService` resolves the target via `tenantMembershipLookupService.FindMembershipAsync(targetUserId, tenant.TenantId, ct)` and returns the same `TargetNotFound` shape for missing-in-tenant and exists-in-other-tenant. Self-target is rejected before any membership lookup. No code path performs a global user lookup followed by post-fetch filter.
- **Effective authorization throughout.** `TenantResolutionMiddleware` derives `effectiveUserId` from the impersonation claims, then authorizes downstream handlers against the effective membership. The integration-test probes at `/api/__tests/impersonation/policies/binder-read` and `/policies/tenant-admin` confirm the effective user's role drives policy outcome even when the actor holds `TenantAdmin`.
- **DELETE under downgraded effective role.** `PaperBinderImpersonationEndpoints` carries `DELETE /api/tenant/impersonation` with `RequireAuthorization(AuthenticatedUser)` only, and the integration test "stop under downgraded role" passes from a non-admin effective context.
- **Server-issued state only.** No `X-Impersonate-*` header is read; no `localStorage`, `sessionStorage`, or query-string impersonation key exists in `src/PaperBinder.Web/`. All impersonation state is carried by the signed auth cookie via `SignInWithClaimsAsync` in `PaperBinderImpersonationService`.
- **CSRF on POST and DELETE.** `PaperBinderCsrfMiddleware` enforces CSRF globally on all unsafe methods on authenticated `/api/*` requests. The DELETE-without-CSRF integration test asserts the rejection path. Logout's inline CSRF check additionally guards the impersonation-stop side effect there.
- **Self-target and nested rejection without audit pollution.** Both rejection paths short-circuit before `auditService.TryAppendAsync` is ever reached. The integration test asserts no `tenant_impersonation_audit_events` row is written on self-target. Nested-start rejection returns the locked `Conflict` shape without altering the existing session.
- **Concurrent start serialization.** `TryRotateActorSecurityStampAsync` holds a `SELECT ... FOR UPDATE` on `users.security_stamp` for the actor row, rotates the stamp, and commits within the same transaction as the cookie issuance. A racing second start fails the actor security-stamp check on its next request and is signed out, and the audit table's `ux_tenant_impersonation_audit_events_session_id_event_name` unique index is the belt-and-braces idempotency guard.
- **Tenant-scoped audit substrate by construction.** Migration `202604170001_AddTenantImpersonationAuditEvents` declares `tenant_id uuid NOT NULL` with `ReferentialAction.Cascade` to `tenants`, the unique index on `(session_id, event_name)`, the secondary index on `(tenant_id, occurred_at_utc, id)`, and check constraints for the event-name enumeration and non-blank `correlation_id`. `DapperTenantImpersonationAuditService.TryAppendAsync` parameterizes every column. There is no read path that fans out across tenants.
- **Purge participation under both retention modes.** `DapperTenantLeaseCleanupService` explicitly deletes from `tenant_impersonation_audit_events` during purge. Under `RetainTenantPurgedSummary` the post-purge log captures only the aggregate `deleted_impersonation_audit_events` count - no per-user row leaks into the retained summary. The parameterized integration `Theory` over both modes confirms this.
- **System-execution paths never write impersonation events.** Cleanup deletes events but never appends them. No background or worker code references `ITenantImpersonationAuditService.TryAppendAsync`.
- **Logout-during-impersonation closure.** `PaperBinderAuthEndpoints.LogoutAsync` calls `impersonationService.StopAsync` first when `executionUserContext.IsImpersonated` is true, then signs out the actor session. The integration test "logout during impersonation" verifies a corresponding `ImpersonationEnded` row exists and the cookie is cleared.
- **Cookie-expiry teardown.** `TenantResolutionMiddleware` invokes `impersonationService.TryRecordExpiredImpersonationAsync` for unauthenticated requests on a tenant host, which appends the missing `ImpersonationEnded` row using the cookie's prior session id when an open session is detected. Behavior validated by the cookie-expiry integration test.
- **Retrofitted seams preserve actor or effective.** `BinderCreateCommand`, `BinderPolicyUpdateCommand`, `DocumentCreateCommand`, `DocumentArchiveCommand`, `TenantLeaseExtendCommand`, `TenantUserCreateCommand`, and `TenantUserRoleChangeCommand` all carry `ActorUserId`, `EffectiveUserId`, and `IsImpersonated`. The Dapper services emit those three fields as structured-log scope or message properties on every mutation log line.
- **Frontend boundary discipline.** `client.ts` exposes `getImpersonationStatus`, `startImpersonation`, and `stopImpersonation` only through the shared client; no `fetch(` lives in tenant-host impersonation paths. The "Not eligible" copy in the users-page View-as column never reveals why a target is ineligible. The tenant shell owns the active-state banner once.
- **Browser E2E flow.** The Playwright spec "Should_StartViewAsFromUsersRoute_AndReturnToAdminSession_InBrowser" exercises the full admin-to-impersonated-back-to-admin loop on the locally hosted stack.
- **Doc reconciliation completeness.** Every doc the scope-lock plan named is updated in this change set. `ADR-0002` records the durable tenant-scoped audit table, the cascade-on-purge behavior, and retention-mode language. `api-contract.md` documents the three endpoints with failure semantics. `tenant-isolation.md` and `policy-authorization.md` cover impersonation-specific construction-level rules. `FD-0007` acknowledges CP15 as the first audit-row contributor.

### Non-Blocking Findings

#### NBI-1: Cookie-expiry audit closure depends on a subsequent request

`TryRecordExpiredImpersonationAsync` runs only when an unauthenticated request arrives at a tenant host with the prior impersonation marker still parseable from a recently expired cookie. If the user closes the browser tab and never returns, the audit trail will not see an explicit `ImpersonationEnded` until tenant purge eventually removes the `ImpersonationStarted` row. This was called out as a residual risk in the scope-lock review and the implementation matches one of the two defensible options. Recommend the PR description note this trade-off explicitly so reviewers do not file it as a future bug.

#### NBI-2: Cookie-expiry integration test uses real-time delay

`TenantImpersonationIntegrationTests` sets `ExpireTimeSpan` to one second and uses `Task.Delay(2s)` to force expiry. This is the smallest viable construction but is sensitive to suspended hosts and constrained CI runners. If the test ever flakes in CI, prefer driving expiry through a controllable `ISystemClock` advance rather than wall-clock sleep. Non-blocking because the fixture uses real cookie machinery and the alternative would require additional test seams.

#### NBI-3: `tenant-host.tsx` continued to grow

CP15 added the impersonation banner, the View-as start affordance on `/app/users`, the parallel `refreshShellState` orchestration, and several state hooks to `tenant-host.tsx`. Per the scope-lock decision (`NB-5`, deferred), no extraction was required for CP15. The post-implementation observation is: the file did cross a noticeable cognitive-load threshold this checkpoint, and CP16 should evaluate splitting the shell, banner, lease, and impersonation state owners into separate modules before adding further surface area there.

#### NBI-4: Browser-gate script name carries forward as `run-root-host-e2e.ps1`

Per `NB-1` (deferred), the script name remains semantically off by one generation. The deferral is correctly recorded in the scope-lock review. Recommend the CP15 PR description repeat the deferral note so the misleading name is not re-raised by future reviewers.

#### NBI-5: ADR-0002 amendment stayed inline rather than landing as a companion ADR

The scope-lock plan permitted either an `ADR-0002` amendment or a companion ADR. The implementation chose to amend `ADR-0002` in place. This is consistent with the "smallest coherent change" principle and is acceptable. Reviewers comparing the original ADR text to the amended text should rely on git history rather than expecting a diffable companion ADR.

### Residual Risks

These risks are not blockers and require no code change to merge CP15. They are recorded so they can be tracked into CP16 or operational runbooks.

- **Open-ended audit row when the impersonator never returns.** As noted in NBI-1: an `ImpersonationStarted` event without a paired `ImpersonationEnded` event will remain until tenant purge if the actor abandons the session and never makes another tenant-host request before cookie expiry is observed. Audit consumers should treat the unique constraint on `(session_id, event_name)` as the authoritative pairing key and not assume every started session has an ended row.
- **Concurrent-start serialization correctness depends on the actor's security-stamp claim freshness.** The race is closed by rotating the stamp under `SELECT FOR UPDATE` and validating it on the next request. If a future change reduces or removes security-stamp validation in `TenantResolutionMiddleware`, the serialization guarantee weakens. The `ux_tenant_impersonation_audit_events_session_id_event_name` unique index remains a backstop, but the cookie-side race would resurface. Worth flagging in `tenant-isolation.md` if not already named there.
- **Manual launch verification is still pending.** `docs/55-execution/checkpoint-status.md` records that VS Code and Visual Studio launch verification must be manually performed before checkpoint closeout. That gate sits with the human author/reviewer, not with code, but it is the last open task before declaring the checkpoint done.
- **Scope discipline around the audit substrate must hold in CP16.** The new `tenant_impersonation_audit_events` table is the first durable audit surface in the repo. The temptation to expand it into a generalized `audit_events` substrate, search UI, or export pipeline must be resisted unless `AGENTS.md` and `ADR-0002` are revisited first. CP15's locked decision to keep this minimal must remain the default for CP16 sequencing.
- **`tenant-host.tsx` cognitive load.** Per NBI-3: not a CP15 blocker, but the file is the most likely candidate for refactor pressure in CP16. If CP16 adds further shell-level surface area (e.g., richer admin tooling), an extraction pass should land before that scope rather than after.

### Required Fixes Before Merge

None.

The only remaining checkpoint-closure activity is the scope-lock check #18: manual VS Code and Visual Studio launch verification recorded in the PR artifact. That is owned by the human reviewer per the scope-locked Validation Plan, not by the code change set under review.

Recommended (not required) PR-description additions:
- Note the cookie-expiry audit-closure trade-off (NBI-1) so reviewers see it called out rather than discovering it as a perceived gap.
- Note the carry-forward of `scripts/run-root-host-e2e.ps1` (NBI-4) and the deferred `tenant-host.tsx` extraction (NBI-3) as known CP16 follow-ups, matching the scope-lock deferrals already on record.

