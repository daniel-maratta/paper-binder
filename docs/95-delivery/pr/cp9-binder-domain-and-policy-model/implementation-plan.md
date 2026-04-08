# CP9 Implementation Plan: Binder Domain And Policy Model
Status: Current Plan

## Goal

Implement CP9 so binders become the first tenant-scoped product entity, binder access stays inside the existing CP8 API-boundary authorization model, and binder-local policy restrictions can narrow access without pulling document, lease, or frontend work forward.

## Scope

Included:
- binder persistence schema and migration work for runtime Dapper access
- binder list/create/detail API endpoints
- binder policy read/update endpoints with `inherit` and `restricted_roles`
- binder API contract updates for request/response examples, stable binder error codes, and endpoint failure semantics that must land before endpoint implementation
- binder application/domain contracts, policy evaluation abstractions, and Dapper-backed persistence services
- tenant-scoped query/index strategy for binder read and write paths
- ProblemDetails mapping for binder and binder-policy failures
- unit and Docker-backed integration coverage for binder allow/deny paths
- synchronized contract, architecture, testing, execution, and delivery docs directly affected by CP9

Not included:
- document schema, document endpoints, archive behavior, markdown rendering, or supersedes rules (`CP10`)
- lease endpoints, cleanup orchestration, or worker lifecycle changes (`CP11`)
- frontend routes, forms, or binder-policy UI (`CP12+`)
- new tenant roles, multi-role aggregation, user-specific ACLs, or policy DSL/expression-engine work
- nested binders, cross-tenant sharing, public links, search indexing, or full-text search
- audit-reporting UI or durable audit-log expansion beyond demo-level structured events

## Locked Design Decisions

CP9 design is now stable. Implementation must not reopen these decisions without updating this plan and the affected canonical docs first.

- Reuse the existing named policies `BinderRead`, `BinderWrite`, and `TenantAdmin`; CP9 does not add new v1 roles.
- Preserve the current request pipeline order: host gating and tenant resolution remain authoritative, endpoint policy runs before binder-policy evaluation, and handlers do not perform ad-hoc role checks.
- `GET /api/binders` omits binders whose binder-local `restricted_roles` the caller cannot satisfy; the list endpoint does not return denial markers, inaccessible binder IDs, or partial-failure metadata.
- Binder names are not unique within a tenant in CP9. Do not add a `(tenant_id, name)` unique index or a `409` binder-name conflict path unless the canonical contract changes first.
- `GET /api/binders/{binderId}` returns binder metadata plus an explicit `documents: []` collection in CP9. The field remains present but empty until CP10 introduces document persistence.
- Binder-policy v1 shape is concrete `mode` (`inherit` | `restricted_roles`) plus `allowedRoles`; CP9 doc sync must align `domain-nouns.md` and `api-contract.md` to that shape rather than a generic policy engine.
- Tenant-owned binder query and mutation entrypoints must take `TenantContext` explicitly and apply tenant predicates in SQL by construction.
- Do not "filter after fetch" for either tenant scope or binder policy scope.
- `binder_policy` remains tenant-scoped and references `binder` via a composite foreign key `(tenant_id, binder_id)`; `binder` remains directly owned by tenant through `tenant_id`.
- Keep CP10 deferred: CP9 must not add document tables, document endpoints, document archive behavior, or markdown handling.
- Binder-policy mutation emits security-relevant structured log entries with `tenant_id`, `user_id`, and `event_name` via the existing structured logging infrastructure. CP9 does not add new audit tables or durable audit persistence.

## Planned Work

1. Update `docs/40-contracts/api-contract.md` before endpoint implementation: add stable binder error codes, request/response examples, endpoint failure semantics, locked list semantics, locked detail-response shape, and the concrete binder-policy payload model.
2. Align product/domain docs to the locked CP9 binder model, including `docs/10-product/domain-nouns.md` BinderPolicy fields and the CP9-only binder-detail response description.
3. Add binder persistence models, EF migration metadata, tenant-scoped indexes, and the composite `binder_policy` foreign key needed for runtime Dapper access.
4. Add application/domain contracts for binder reads, binder writes, and binder-policy evaluation.
5. Add Dapper-backed binder persistence services and register them in the existing persistence composition root.
6. Add tenant-host binder endpoints plus binder-specific ProblemDetails mapping without weakening current host gating, CSRF, or authorization behavior.
7. Add unit coverage for binder-policy evaluation, payload validation, and any binder timestamp assertions that depend on persisted metadata.
8. Add Docker-backed integration coverage for binder list/create/detail/policy allow-deny behavior, cross-tenant protection, wrong-host protection, protocol headers, and CSRF enforcement on unsafe binder routes.
9. Synchronize the remaining canonical docs and the CP9 delivery artifact in the same change set.

## Acceptance Criteria

- A migration adds tenant-owned binder storage and any required binder-policy storage with tenant-consistent keys, a composite `(tenant_id, binder_id)` foreign key from `binder_policy` to `binder`, and indexes aligned to the documented runtime query paths.
- `POST /api/binders` creates a binder only inside the established request tenant, defaults new binders to policy mode `inherit`, and does not enforce per-tenant binder-name uniqueness in CP9.
- `GET /api/binders` returns only binders from the current tenant and omits binders the caller cannot satisfy under `restricted_roles` without leaking inaccessible binder IDs or denial metadata.
- `GET /api/binders/{binderId}` resolves binders with a tenant predicate, returns `404` for unknown or wrong-tenant binders, enforces binder-policy denial for same-tenant callers who fail the binder-local restriction, and returns an explicit empty `documents` collection until CP10.
- `GET /api/binders/{binderId}/policy` and `PUT /api/binders/{binderId}/policy` are tenant-admin-only, tenant-host-only, and idempotent for unchanged policy payloads.
- The final change set documents stable binder request/response examples, failure semantics, and binder-specific `errorCode` values in `docs/40-contracts/api-contract.md` before endpoint behavior is considered complete.
- `restricted_roles` payloads validate allowed role values against the existing v1 role set, invalid binder-policy payloads return stable documented ProblemDetails failures, and binder-policy denial uses the documented binder-specific error contract.
- Cross-tenant binder IDs and wrong-host binder requests are never readable or writable from another tenant context and do not fall through to unscoped reads.
- `POST /api/binders` and `PUT /api/binders/{binderId}/policy` preserve the existing CSRF requirement, and all five binder endpoints preserve `X-Api-Version` and `X-Correlation-Id` response headers.
- The implementation ships without document-domain behavior, lease behavior, or frontend binder screens.
- Canonical product, architecture, contract, testing, execution, and delivery docs are updated in the same change set as the implementation.

## Validation Plan

- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
- targeted unit tests for binder-policy evaluation, binder payload validation, and any binder timestamp assertions via the existing clock abstraction rather than `DateTime.UtcNow`
- targeted Docker-backed integration tests for binder list/create/detail/policy success paths, `restricted_roles` omission semantics, wrong-role `403`, cross-tenant `404`, wrong-host `404`, CSRF rejection on `POST /api/binders` and `PUT /api/binders/{binderId}/policy`, documented binder ProblemDetails `errorCode` values, idempotent `PUT /api/binders/{binderId}/policy`, and `X-Api-Version`/`X-Correlation-Id` headers on all five binder endpoints
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`
- manual VS Code and Visual Studio launch verification recorded in the eventual CP9 PR artifact before checkpoint closeout

## Likely Touch Points

- `src/PaperBinder.Migrations/Migrations/`
- `src/PaperBinder.Infrastructure/Persistence/PaperBinderDbContext.cs`
- `src/PaperBinder.Infrastructure/Persistence/PaperBinderPersistenceServiceCollectionExtensions.cs`
- `src/PaperBinder.Application/` with a new binder-focused slice
- `src/PaperBinder.Infrastructure/` with Dapper-backed binder persistence implementations
- `src/PaperBinder.Api/Program.Partial.cs`
- `src/PaperBinder.Api/` with binder endpoints and binder ProblemDetails mapping
- `tests/PaperBinder.UnitTests/`
- `tests/PaperBinder.IntegrationTests/`
- `docs/15-feature-definition/FD-0004-binder-policy-model.md`
- `docs/10-product/prd.md`
- `docs/10-product/domain-nouns.md`
- `docs/10-product/user-stories.md`
- `docs/20-architecture/policy-authorization.md`
- `docs/20-architecture/data-model.md`
- `docs/40-contracts/api-contract.md`
- `docs/50-engineering/data-access-standards.md`
- `docs/80-testing/test-strategy.md`
- `docs/80-testing/testing-standards.md`
- `docs/95-delivery/pr/cp9-binder-domain-and-policy-model/`

## Critic Review Resolution Log

- `B1` Accepted and resolved: list semantics, binder-name uniqueness posture, and the CP9-only binder-detail response shape are now locked in the design section above.
- `B2` Accepted and resolved: planned work now requires `docs/40-contracts/api-contract.md` to add binder request/response examples, failure semantics, and stable binder `errorCode` values before endpoint implementation.
- `NB1` Accepted: planned doc sync now aligns `docs/10-product/domain-nouns.md` BinderPolicy fields to the concrete v1 `mode` + `allowedRoles` model.
- `NB2` Accepted: the binder-detail contract is locked as binder metadata plus an explicit empty `documents` collection until CP10 introduces document persistence.
- `NB3` Accepted: no design expansion is required, but validation now explicitly covers CSRF enforcement on `POST /api/binders` and `PUT /api/binders/{binderId}/policy`.
- `NB4` Accepted for structured logging and rejected for durable audit expansion: CP9 requires structured log entries with `tenant_id`, `user_id`, and `event_name`, while new audit-table persistence remains out of scope under the current repo state and v1 non-goals.
- `NB5` Accepted: schema work now explicitly requires a composite `(tenant_id, binder_id)` foreign key from `binder_policy` to `binder`.
- `NB6` Accepted: validation now requires any binder timestamp assertions to use the existing clock abstraction instead of `DateTime.UtcNow`.
- No remaining blocking open decisions remain. Any future change to a locked decision requires revising this plan and the affected canonical docs before implementation begins.

## ADR Triggers And Boundary Risks

- ADR trigger: choosing a sticky binder-policy storage model beyond a simple v1 role allow-list, such as JSON policy blobs, a generic policy engine, or user-specific ACLs.
- ADR trigger: introducing durable audit tables or audit-reporting behavior for binder-policy changes.
- ADR trigger: changing authorization layering, tenant-boundary evaluation order, or the current v1 role model.
- Boundary risk: CP10 pull-forward through binder-detail responses, document-summary queries, or document-table coupling.
- Boundary risk: implementing binder policy by broad reads plus in-memory filtering would violate tenant/data-access rules and is not acceptable.
- Boundary risk: wrong-host and cross-tenant denial paths must continue to fail before any unscoped binder data access occurs.
