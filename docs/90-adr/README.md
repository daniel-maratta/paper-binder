# ADR Lane Guide

## AI Summary

- This lane records architecture decisions that are expensive to reverse.
- Approved ADRs are binding unless superseded by newer ADRs.
- Proposed ADRs are candidate canon only and do not bind the repo until approved.
- Follow repository ADR policy from root and intent constraints when proposing new ADRs.

## Read First

- `docs/90-adr/ADR-0001-domain-immutable-documents-with-supersedes-chain.md`
- `docs/90-adr/ADR-0002-security-tenant-local-impersonation-for-demo-view-as.md`
- `docs/90-adr/ADR-0005-no-bff.md`
- `docs/90-adr/ADR-0007-persistence-stack-ef-core-migrations-dapper-runtime.md`
- `docs/90-adr/ADR-0008-identity-auth-boundary-with-dapper-stores.md`
- `docs/90-adr/ADR-0009-frontend-component-test-stack-for-cp12.md`
- `docs/90-adr/ADR-0010-playwright-root-host-e2e-runtime.md`
- `docs/90-adr/ADR-0011-observability-opentelemetry-baseline.md`
- `docs/90-adr/ADR-0012-ghcr-production-deployment-and-public-indexing.md`
- `docs/90-adr/ADR-0013-v1-1-presentation-direction-and-canon-reset.md`
- `docs/90-adr/ADR-0014-tenant-host-failure-externalization-and-trusted-expiry-disclosure.md`
- `docs/90-adr/ADR-0015-responsive-breakpoint-policy.md`

## Key Decision Clusters

- Domain/content behavior: `ADR-0001`
- Security/authz behavior: `ADR-0002`, `ADR-0008`
- Operations/lifecycle behavior: `ADR-0003`, `ADR-0004`, `ADR-0006`
- Persistence/runtime behavior: `ADR-0007`
- Observability baseline: `ADR-0011`
- Deployment distribution and environment indexing: `ADR-0012`
- Architecture scope constraints: `ADR-0005`
- Frontend/testing foundation: `ADR-0009`, `ADR-0010`
- Presentation canon and reviewer-support posture: `ADR-0013`
- Tenant-host disclosure and trusted expiry posture: `ADR-0014`
- Responsive breakpoint policy: `ADR-0015`
