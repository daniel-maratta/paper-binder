# Architecture Review Artifacts

This directory contains reviewer-first architecture summaries.

These files are a quick orientation layer. Canonical behavior and constraints are defined in `docs/`.

If a summary here conflicts with canonical docs, canonical docs win.

## Core Review

Use this set for a 10-15 minute pre-read before hands-on discussion:

1. `architecture-overview.md`
2. `security-model-summary.md`
3. `multi-tenancy-diagram.md`
4. `request-lifecycle.md`
5. `user-flows.md`

## Optional Deep Dives

- `domain-model-diagram.md`
- `system-architecture-diagram.md`
- `ai-surface-map.md`
- `scaling-considerations.md`
- `future-evolution.md`

## Proof Points

Use these to validate reviewer-summary claims quickly:

- API behavior and failure semantics: `docs/40-contracts/api-contract.md`
- Tenancy resolution and trust model: `docs/20-architecture/tenancy-resolution.md`
- Security isolation rules: `docs/30-security/tenant-isolation.md`
- Scope and non-goal boundaries: `docs/00-intent/project-scope.md`, `docs/00-intent/non-goals.md`
- Decision rationale and tradeoffs: `docs/90-adr/README.md`
- Tenancy model decision: `docs/90-adr/ADR-0003-data-shared-schema-multi-tenancy-with-tenantid-discriminator.md`
- Authorization boundary decision: `docs/90-adr/ADR-0006-authz-policy-based-authorization-at-api-boundary.md`
- Frontend boundary decision (no BFF): `docs/90-adr/ADR-0019-no-bff.md`

## Drift Control

To reduce maintenance overlap, each reviewer doc has a narrow purpose:

- `architecture-overview.md`: one-page narrative and tradeoffs
- `system-architecture-diagram.md`: topology snapshot only
- `multi-tenancy-diagram.md`: tenancy resolution and isolation invariants
- `security-model-summary.md`: trust model and failure semantics
- `request-lifecycle.md`: request execution order and guarantees

If content would duplicate another reviewer doc, keep only a one-line pointer and link to the owning doc.

## Canonical Sources

- `docs/20-architecture/system-overview.md`
- `docs/20-architecture/data-model.md`
- `docs/20-architecture/tenancy-model.md`
- `docs/20-architecture/tenancy-resolution.md`
- `docs/20-architecture/authn-authz.md`
- `docs/20-architecture/policy-authorization.md`
- `docs/20-architecture/frontend-app-route-map.md`
- `docs/20-architecture/demo-tenant-lease.md`
- `docs/40-contracts/api-contract.md`
- `docs/30-security/tenant-isolation.md`
- `docs/60-ai/ai-subsystem-overview.md`
- `docs/60-ai/ai-features-v1.md`
- `docs/00-intent/project-scope.md`
- `docs/00-intent/non-goals.md`

## Maintenance Note

When canonical architecture or scope docs change, update this folder in the same change set.
