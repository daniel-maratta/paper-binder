# CP9 Critic Review: Binder Domain And Policy Model

Reviewer: Claude (code critic)
Date: 2026-04-08
Scope: Full post-implementation review of CP9 source, tests, docs, and delivery artifacts.

Inputs reviewed:
- `docs/95-delivery/pr/cp9-binder-domain-and-policy-model/implementation-plan.md`
- `docs/95-delivery/pr/cp9-binder-domain-and-policy-model/description.md`
- `docs/05-taskboard/tasks/T-0023-cp9-binder-domain-and-policy-model.md`
- `docs/40-contracts/api-contract.md` (Binders section, Error Contract, RBAC Policy Map)
- `docs/10-product/domain-nouns.md` (Binder and BinderPolicy)
- `docs/10-product/prd.md` (Binders section)
- `docs/10-product/user-stories.md` (Slice 4)
- `docs/15-feature-definition/FD-0004-binder-policy-model.md`
- `docs/20-architecture/data-model.md`
- `docs/20-architecture/policy-authorization.md`
- `docs/50-engineering/data-access-standards.md`
- `docs/80-testing/test-strategy.md`, `integration-tests.md`, `testing-standards.md`
- `docs/55-execution/checkpoint-status.md`
- `docs/ai-index.md`, `docs/repo-map.json`
- Full source diff on branch `checkpoint-9-binder-domain-and-policy-model`
- `AGENTS.md`

---

## Verdict

**Pass. The checkpoint is ship-ready.** The implementation is well-scoped, correctly layered, and consistent with the locked design decisions, the implementation plan, the AGENTS contract, and the cross-repo platform baselines. All pre-implementation blocking and non-blocking findings have been resolved. No scope drift detected. No document-domain pull-forward. No blockers remain.

---

## What the implementation gets right

### Schema and migration

- **Correct composite key enforcement.** `binder_policies` uses composite PK `(tenant_id, binder_id)` and composite FK to `binders` via `(tenant_id, binder_id)` → the alternate key `(tenant_id, id)`. This satisfies NB5 from the pre-implementation review and is consistent (composite keys including `tenant_id` for tenant-owned relationships).

- **Database-level constraint enforcement.** The migration adds three check constraints on `binder_policies`: mode validity (`inherit` or `restricted_roles`), allowed-role membership against the v1 role set, and structural payload consistency (inherit requires empty roles; restricted_roles requires non-empty roles). These constraints prevent invalid policy states from persisting even outside application code paths.

- **Correct index alignment.** `ix_binders_tenant_id_created_at_utc_id` covers the `ListAsync` query's `WHERE tenant_id = @TenantId ORDER BY created_at_utc, id` access pattern. The `binder_policies` composite PK covers the join and policy-read paths. No superfluous indexes.

- **Binder name constraint at the database level.** `ck_binders_name_not_blank` uses `char_length(btrim(name)) > 0`, matching the application-level `BinderNameRules.TryNormalize` logic. Defense in depth.

### Tenant isolation and data access

- **Tenant predicates in SQL by construction.** Every binder query in `DapperBinderService` includes `b.tenant_id = @TenantId` in the WHERE clause. The list query joins `binders` and `binder_policies` within the tenant predicate set. No filter-after-fetch. Consistent with AGENTS.md hard invariants, data-access standards.

- **List omission enforced in SQL.** The `ListAsync` query uses `bp.mode = @InheritMode OR (bp.mode = @RestrictedRolesMode AND bp.allowed_roles @> @AllowedRoles)` to exclude inaccessible binders at the query level. The `@>` (contains) operator correctly checks whether the binder's allowed-role set includes the caller's role. No in-memory filtering. Satisfies the locked design decision and data-access standards.

- **Cross-tenant binder IDs return 404, not 403.** Both `GetDetailAsync` and `GetPolicyAsync` query with `tenant_id = @TenantId`, so a binder from another tenant produces a null result mapped to `BinderFailureKind.NotFound`. This avoids tenant-existence disclosure.

- **Service APIs require `TenantContext` explicitly.** `IBinderService` and `DapperBinderService` take `TenantContext` as a parameter on all methods. No implicit tenant resolution in the data access layer.

### Authorization layering

- **Endpoint policy via route group.** All five binder endpoints use `.RequireAuthorization()` with the correct named policies: `BinderRead` for list/detail, `BinderWrite` for create, `TenantAdmin` for policy read/write. Consistent with the RBAC Policy Map.

- **Binder-local policy evaluated after endpoint policy.** The endpoint handlers delegate to `DapperBinderService`, which calls `IBinderPolicyEvaluator.CanAccess()` for detail access and uses SQL-level filtering for list access. The handlers do not perform ad-hoc role checks. The role is passed to the service only for binder-policy evaluation, not for branching in the handler.

- **Tenant-host gating preserved.** The binder route group calls `.RequirePaperBinderTenantHost()`, ensuring wrong-host requests fail before any binder data access.

### Error contract and ProblemDetails mapping

- **Four stable binder error codes.** `BINDER_NAME_INVALID` (400), `BINDER_NOT_FOUND` (404), `BINDER_POLICY_DENIED` (403), `BINDER_POLICY_INVALID` (422). All documented in `api-contract.md` Error Contract section. All implemented in `PaperBinderErrorCodes.cs` and mapped in `PaperBinderBinderProblemMapping.cs`. Consistent logging-and-errors baseline (stable, documented error codes).

- **Exhaustive pattern match in problem mapping.** `PaperBinderBinderProblemMapping.Map` uses a switch expression with a `_` default that throws `ArgumentOutOfRangeException`. No silent fallthrough.

### Structured security logging

- **Binder-policy mutations emit structured log entries.** `DapperBinderService` logs `binder_created`, `binder_policy_updated`, `binder_policy_update_noop`, `binder_policy_update_rejected`, and `binder_policy_update_failed` events with `tenant_id`, `user_id`, and `event_name` fields. Consistent with logging-and-errors baseline and FD-0004 operational-log requirements.

- **Idempotent updates distinguish noop from actual update.** The `binder_policy_update_noop` event name is logged when the requested policy matches the current policy, avoiding misleading audit trails.

### Application layer design

- **Clean domain contracts.** `BinderContracts.cs` defines focused records for commands, outcomes, and domain types. No leaky abstractions. `BinderPolicy`, `BinderPolicyMode`, `BinderSummary`, `BinderDetail` are well-bounded.

- **Policy evaluator is injectable and testable.** `IBinderPolicyEvaluator` is an interface with a concrete `BinderPolicyEvaluator` implementation. Registered as singleton (stateless). Unit-tested independently.

- **Validation rules are pure and centralized.** `BinderNameRules.TryNormalize` and `BinderPolicyRules.ValidateAndNormalize` are static, deterministic, and unit-tested. Role normalization deduplicates and sorts.

- **Transaction scoping is correct.** `CreateAsync` wraps binder insert + policy insert in a single transaction via `ITransactionScopeRunner`. `UpdatePolicyAsync` uses `FOR UPDATE` row locking within a transaction to prevent concurrent policy writes from racing.

- **Clock abstraction used in production code.** `DapperBinderService` injects `ISystemClock` and uses `clock.UtcNow` for all timestamp generation. No `DateTime.UtcNow` or `DateTimeOffset.UtcNow` in production source.

### Endpoint implementation

- **Detail response includes explicit `documents: []`.** `GetBinderAsync` returns `Array.Empty<object>()` for the `Documents` field. Satisfies the locked design decision. CP10 will populate this.

- **CSRF enforcement via existing middleware.** `POST /api/binders` and `PUT /api/binders/{binderId}/policy` are unsafe methods routed under `/api/*`, so the existing CSRF middleware applies. No additional CSRF logic needed.

- **Endpoint registration order preserved.** `MapPaperBinderBinderEndpoints()` is called after `MapPaperBinderTenantUserEndpoints()` and before `MapPaperBinderApiFallback()` in `Program.Partial.cs`. The fallback remains last.

### Test coverage

- **15 unit test executions.** Cover binder-policy evaluator (4 theory cases for inherit/restricted allow/deny), binder-name validation (trim, blank rejection, overlength rejection), binder-policy payload validation (unsupported mode, roles-with-inherit, empty-roles-with-restricted, invalid role values, deduplication+ordering), and problem mapping (422 for PolicyInvalid).

- **11 Docker-backed integration tests.** Cover binder create + default policy read, list with tenant isolation + restricted-binder omission, detail with explicit empty documents, same-tenant policy denial (403), cross-tenant 404, TenantAdmin-only policy endpoints, invalid policy payload (422), idempotent policy update + list omission after restriction, CSRF rejection on binder create, CSRF rejection on policy update, and wrong-host 404.

- **All integration tests assert protocol headers.** Every test calls `AssertApiProtocolHeaders`, verifying `X-Api-Version` and `X-Correlation-Id` on all responses.

- **Migration workflow test updated.** `MigrationWorkflowIntegrationTests` asserts 3 migrations and includes `AddBindersAndBinderPolicies`.

### Documentation integrity

- **API contract fully documented.** All five binder endpoints have request/response examples, failure semantics, auth requirements, and CSRF notes. Resolves pre-implementation B2.

- **`domain-nouns.md` aligned to v1 shape.** BinderPolicy now shows `BinderId`, `TenantId`, `Mode`, `AllowedRoles`, `CreatedAt`, `UpdatedAt` instead of the prior generic `PolicyName` + `RuleData`. Resolves pre-implementation NB1.

- **Synchronized docs.** `prd.md`, `user-stories.md`, `FD-0001`, `FD-0004`, `data-model.md`, `policy-authorization.md`, `frontend-app-route-map.md`, `data-access-standards.md`, `checkpoint-status.md`, `test-strategy.md`, `testing-standards.md`, `integration-tests.md`, `work-queue.md`, `ai-index.md`, and `repo-map.json` are all updated in the same change set.

- **`repo-map.json` is valid JSON.** Verified.

- **No document-domain behavior in change set.** No document tables, endpoints, archive behavior, or markdown handling. CP10 boundary preserved.

---

## Blocking Findings

None.

---

## Non-Blocking Findings

### NB1 — No integration test for binder-name validation `400` response

`POST /api/binders` with a blank or overlength name should return `400` with `errorCode` `BINDER_NAME_INVALID`. This path is covered by unit tests (`BinderNameRules_Should_RejectBlankNames`, `BinderNameRules_Should_RejectOverlengthNames`) and the problem-mapping unit test, but no Docker-backed integration test exercises the full endpoint → validation → ProblemDetails round-trip for this failure.

**Impact**: Low. The unit coverage proves the validation logic and the mapping logic independently. The risk is a wiring gap between the endpoint deserialization and the validation path, but this is structurally similar to the other binder validation paths that are integration-tested.

**Recommendation**: Consider adding a `Should_ReturnBadRequest_When_BinderNameIsBlank` integration test in a future checkpoint or as an incidental follow-up.

### NB2 — Wrong-host integration test covers only `GET /api/binders`

`Should_ReturnNotFound_When_RootHostRequestsBinderEndpoint` tests wrong-host behavior on the binder list endpoint only. The policy endpoints (`GET /api/binders/{binderId}/policy`, `PUT /api/binders/{binderId}/policy`) are not individually tested for wrong-host rejection.

**Impact**: Low. All five binder endpoints share the same route group with `.RequirePaperBinderTenantHost()`, so the middleware enforcement is identical. The CP8 test suite also tests wrong-host behavior for tenant-user routes via the same mechanism.

**Recommendation**: No action needed. The shared middleware pattern provides structural confidence.

### NB3 — Test seed helper uses `DateTimeOffset.UtcNow` instead of clock abstraction

`TenantResolutionIntegrationTestHost.SeedBinderAsync` defaults `createdAtUtc` to `DateTimeOffset.UtcNow` when no value is provided. This is consistent with the existing `SeedTenantAsync` pattern (which also uses `DateTimeOffset.UtcNow`), so it is not a regression. No current tests assert on specific timestamp values from seeded binders.

**Impact**: Low. The production code correctly uses `clock.UtcNow`. The seed helper's `DateTimeOffset.UtcNow` usage only affects test data setup, not time-sensitive assertions. If a future test needs to assert on clock-relative binder timestamps, the `createdAtUtc` parameter allows overriding.

**Recommendation**: No action needed for CP9. If timestamp-sensitive binder tests are added in CP10+, consider aligning the seed helper to use the host's `ISystemClock`.

### NB4 — Pre-implementation critic review references private repo names in committed artifact

**Impact**: Low. The references were scoped to a "Cross-repo inputs" header clearly marked as private. No paths, content, or internal structure details were exposed.

**Recommendation**: Adopted in this review — cross-repo inputs are listed generically.

---

## Residual Risks

1. **CP10 coupling via `documents: []` contract commitment.** The binder-detail response now commits to an explicit `documents` field typed as `IReadOnlyList<object>`. CP10 must introduce a concrete document-summary type for this field. If CP10 changes the field name or nesting, existing consumers will break. This is a known, accepted risk per the locked design decision.

2. **Binder-policy `FOR UPDATE` locking under high concurrency.** The `UpdatePolicyAsync` path takes a row-level lock via `FOR UPDATE` on the binder-policy row. Under high concurrent policy-update traffic to the same binder, this could create lock contention. For the demo-tenant v1 scenario this is a non-concern; a production deployment would need to evaluate whether optimistic concurrency (version column) is more appropriate.

3. **Test seed data uses real clock.** As noted in NB3, the binder seed helper uses `DateTimeOffset.UtcNow`. If CP10+ adds tests that assert on clock-relative binder ordering or time windows, those tests may be flaky unless the seed helper is updated to use the host's `ISystemClock`.

---

## Required Fixes Before Merge

None.

---

## Pre-Implementation Review Resolution

All pre-implementation findings have been addressed:

| Finding | Resolution |
| --- | --- |
| **B1** — Three open decisions unresolved | All three locked: list omission in SQL, non-unique names, explicit `documents: []`. Verified in implementation and docs. |
| **B2** — API contract missing binder error codes | Four stable error codes documented in `api-contract.md` Error Contract section. Request/response examples and failure semantics added for all five endpoints. |
| **NB1** — `domain-nouns.md` BinderPolicy shape loose | Fields updated to `BinderId`, `TenantId`, `Mode`, `AllowedRoles`, `CreatedAt`, `UpdatedAt`. |
| **NB2** — Detail contract says "document summaries" | Contract updated: `documents` is present and empty in CP9, with explicit note that document persistence lands in CP10. |
| **NB3** — No explicit CSRF requirement for binder mutations | CSRF enforcement covered by existing middleware. Two integration tests (`Should_RejectBinderCreate_When_CsrfTokenIsMissing`, `Should_RejectBinderPolicyUpdate_When_CsrfTokenIsMissing`) verify. |
| **NB4** — Audit event boundaries vague | Structured log entries with `tenant_id`, `user_id`, `event_name` confirmed in `DapperBinderService`. No audit table expansion. |
| **NB5** — Composite FK requirement | `binder_policies` FK is composite `(tenant_id, binder_id)` → `binders (tenant_id, id)`. Verified in migration and DbContext. |
| **NB6** — Time abstraction for timestamp assertions | Production code uses `clock.UtcNow`. No `DateTime.UtcNow` or `DateTimeOffset.UtcNow` in production source. Integration tests do not assert on specific timestamp values. |

---

## Post-Implementation Checklist

- [x] All five binder endpoints return correct `X-Api-Version` and `X-Correlation-Id` headers.
- [x] `POST /api/binders` and `PUT /api/binders/{binderId}/policy` reject requests missing valid CSRF tokens.
- [x] `GET /api/binders` with `restricted_roles` active omits binders the caller cannot access — no information leakage.
- [x] Cross-tenant binder access returns `404` (not `403`) to avoid tenant-existence disclosure.
- [x] Wrong-host requests to binder endpoints fail before any binder data access occurs.
- [x] Binder-policy mutation from non-`TenantAdmin` roles returns `403`.
- [x] `PUT /api/binders/{binderId}/policy` with `restricted_roles` and invalid role values returns `422` with documented `errorCode`.
- [x] `PUT /api/binders/{binderId}/policy` is idempotent for unchanged payloads (no side effects, same response).
- [x] Binder migration adds tenant-scoped indexes aligned to the query paths used by `GET /api/binders` and `GET /api/binders/{binderId}`.
- [x] Binder-to-tenant FK includes `tenant_id`; binder-policy-to-binder FK is composite `(tenant_id, binder_id)`.
- [x] Binder-policy mutation emits structured log entries with `tenant_id`, `user_id`, and `event_name` fields.
- [x] Repository/service APIs require `TenantContext` explicitly — no implicit tenant resolution in data access layer.
- [x] Handlers do not perform ad-hoc role checks; role is passed to the service layer only for binder-policy evaluation.
- [x] `domain-nouns.md` BinderPolicy fields match the implemented schema.
- [x] `api-contract.md` binder section has request/response examples and error codes matching implementation.
- [x] `repo-map.json` remains valid JSON after structural changes.
- [x] `docs/ai-index.md` reflects new files.
- [x] `validate-docs.ps1` and `validate-launch-profiles.ps1` passed.
- [x] Docker-backed integration tests cover: binder create, list, detail, policy read, policy update, cross-tenant denial, wrong-role denial, binder-policy restriction denial, and CSRF enforcement on unsafe binder routes.
- [x] No `DateTime.UtcNow` or `DateTimeOffset.UtcNow` in production source code.
- [x] No document-domain tables, endpoints, or behavior exist in the change set.
- [x] No private-boundary leakage in committed source or doc content.
- [ ] Manual VS Code and Visual Studio launch verification pending (documented in PR artifact as a closure prerequisite).
