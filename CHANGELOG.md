# Changelog

All notable changes to this project are documented in this file.

## Unreleased

### Added
- CP2 runtime scaffold: typed backend runtime configuration, minimal health/readiness endpoints, root `.env.example`, Docker Compose local topology, Caddy reverse proxy config, and a containerized single app-host build for SPA + API delivery.
- CP4 HTTP contract baseline: global `X-Correlation-Id` middleware, `/api/*` version negotiation with `API_VERSION_UNSUPPORTED` ProblemDetails failures, and a canonical `/api/*` fallback that returns RFC 7807 errors with trace/correlation metadata.
- CP6 auth boundary: ASP.NET Core Identity managers with Dapper-backed runtime stores, `users` plus `user_tenants` schema, root-host login, tenant-host logout, cross-subdomain cookie auth, and CSRF protection for authenticated unsafe API routes.
- CP6 tenant validation: authenticated tenant-host requests now require matching membership and active tenant state before request tenant context is established.

### Docs
- Added ADR-0008 to lock the CP6 auth boundary: ASP.NET Core Identity managers with Dapper runtime stores, parent-domain cookie auth, and membership authority in `user_tenants`.
- Updated architecture, security, API-contract, operations, testing, taskboard, and delivery docs to describe the live CP6 login/logout/CSRF/membership behavior and to defer challenge verification and root-login rate limiting explicitly to CP7.
- Updated API contract and integration-testing docs to record the live CP4 protocol behavior: invalid client correlation IDs are replaced server-side, invalid API-version failures still emit `X-Api-Version: 1`, and unmatched `/api/*` routes return ProblemDetails instead of falling through to SPA handling.
- Updated README, operations runbooks, security config guidance, testing strategy, and execution-plan docs to reflect the CP2 local topology and shared `.env` contract.
- Refined ADR-0023 wording to tighten router boundaries: React Router client-side SPA routing only, no framework mode, and no route-module server features/server loaders/actions in v1.
- Locked npm (not pnpm) as the frontend package manager and propagated npm-based local runbook/tooling guidance.
- Updated frontend Node/npm pins to Node `24.13.x` and npm `11.8.x` via `.nvmrc` and `package.json`.
- Added ADR-0023 to lock frontend runtime/tooling boundaries: Vite build tool, React SPA-only architecture, no BFF drift, no SignalR in v1, and Node/package-manager pinning requirements.
- Updated canonical docs to propagate ADR-0023 decisions across architecture, intent, engineering, and operations (`docs/20-architecture/frontend-spa.md`, `docs/20-architecture/frontend-app-route-map.md`, `docs/20-architecture/system-overview.md`, `docs/00-intent/canonical-decisions.md`, `docs/50-engineering/tech-stack.md`, `docs/70-operations/runbook-local.md`).
- Added root tooling pins for frontend reproducibility via `.nvmrc` and `package.json` (`engines` + `packageManager`).
- Updated AI navigation metadata to include ADR-0023 in `docs/ai-index.md`, `docs/repo-map.json`, and `docs/90-adr/README.md`.
- Added ADR-0022 to lock the frontend UI stack baseline to React + TypeScript, Tailwind CSS, and Radix UI; aligned UI contract docs to reference the approved ADR.
- Added `docs/20-architecture/frontend-app-route-map.md` as the canonical root-host/tenant-host frontend route contract mapped to API endpoints and auth/policy expectations.
- Added `docs/50-engineering/tech-stack.md` as the authoritative stack baseline with explicit governance: consult-before-implementation, permission-first for stack changes, and ADR-required propagation for approved changes.
- Updated lane navigation and retrieval metadata to include the new route-map, tech-stack, and ADR docs (`docs/20-architecture/README.md`, `docs/50-engineering/README.md`, `docs/50-engineering/coding-standards.md`, `docs/90-adr/README.md`, `docs/ai-index.md`, `docs/repo-map.json`).
- Added V1 UI implementation contracts: `docs/10-product/ui-ux-contract-v1.md` and `docs/10-product/component-specification-v1.md`, and propagated product-lane navigation metadata in `docs/10-product/README.md`, `docs/ai-index.md`, and `docs/repo-map.json`.
- Refined ADR-0021 and downstream contracts: `X-Api-Version` negotiation now applies to `/api/*` routes only (optional in v1, server emits on `/api/*` responses), `X-Correlation-Id` remains global for all requests, API examples normalized under `/api/*`, and middleware design guidance added for versioning/correlation/logging-scope enforcement.
- Replaced legacy agent folders with canonical execution docs: removed `.claude/`, moved staged plans into `docs/55-execution/stages/`, added vendor-agnostic workflows in `docs/55-execution/workflows/`, added engineering/testing standards docs, and reconciled repo references and docs-tree lint rules for the new lane.
- Normalized duplicated scaffold docs across intent/product/architecture/security/contracts/operations/testing lanes by consolidating generated and V2 blocks into single canonical versions, removing stale `CHANGE REQUIRED` sections, and removing extraction-related terminology from repository docs.
- Removed pre-canonical compatibility documentation and consolidated content into the canonical lane structure under `docs/`.
- Canonicalized ADR 0016-0020 titles; standardized tenancy/API contract language to host+server-side membership resolution; removed tenant ID route examples; set tenant extension route to `POST /api/tenant/extend`; replaced access-code wording with Turnstile challenge language; and standardized error contract language on RFC 7807 ProblemDetails.
- Added repo-native task tracking docs: owner ledger, work queue, task template/task files, task log, and task tracking policy under `docs/00-intent/`.
- Refactor: progressive-disclosure agent guidance; moved agent policy rules from root AGENTS.md into scoped docs under docs/ and kept root guidance minimal.
- Added ADR-0013 to lock runtime data access to Dapper and restrict EF Core usage to migrations tooling only.
- Added minimum-viable documentation at `docs/40-contracts/api-contract.md`, `docs/20-architecture/tenancy-model.md`, `docs/30-security/threat-model-lite.md`, `docs/30-security/secrets-and-config.md`, and testing/operations runbook docs (now represented under canonical lanes in `docs/70-operations/` and `docs/80-testing/`).
- Resolved conflict: runtime data access policy now consistently states "Dapper runtime only; EF Core migrations/tooling only" across PRD, canonical decisions, and ADRs.
- Resolved conflict: auth mechanism now consistently states "cross-subdomain cookie only; no JWT in v1" across architecture and PRD docs.
- Resolved conflict: audit scope now consistently states "minimal security-relevant audit event emission in scope; audit UI/reporting out of scope" in PRD and ADR-aligned docs.
- Added precedence rules to canonical decisions defining ADR/canonical precedence and required immediate contradiction fix + changelog naming.
- Aligned v1 canonical decisions to immutable documents, policy-based RBAC wording, Dapper-only runtime access, and TTL cleanup SLA (5 minutes best effort).
- Added ADR-0002 through ADR-0012 to document canonical architecture, tenancy, auth/authz, audit, observability, security impersonation, dependency, and TTL operations decisions.
- Reconciled ADR-0002 through ADR-0009 with updated canonical decision language while preserving prior sections where new text was not supplied.
- Reconciled ADR-0010 through ADR-0012 with updated canonical observability, impersonation, and TTL cleanup decision language while preserving prior unsupplied sections.
- Codified tenant-boundary, DB isolation, trust model, error handling, testing, observability, retention, dependency, performance, and readability lock-ins across architecture, engineering, operations docs, and ADRs.
- Updated scope and PRD to remove document content editing from v1 and clarify immutable document behavior with optional supersession metadata.
- Added concrete v1 feature slices and acceptance criteria in `docs/10-product/user-stories.md`.
- Filled architecture/security placeholders for tenancy resolution, ASP.NET Core Identity posture, and tenant isolation rules.
