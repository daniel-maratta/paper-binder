# PaperBinder AI Index

## Purpose

Canonical local entry point for navigating PaperBinder domain and product docs.

## AI Summary

Start here, then load only the lane docs relevant to the task.

## Core Read Order

1. [docs/00-intent/canonical-decisions.md](./00-intent/canonical-decisions.md)
2. [docs/10-product/prd.md](./10-product/prd.md)
3. [docs/20-architecture/system-overview.md](./20-architecture/system-overview.md)
4. [docs/30-security/tenant-isolation.md](./30-security/tenant-isolation.md)
5. [docs/40-contracts/api-contract.md](./40-contracts/api-contract.md)

## Lane Indexes

- [docs/00-intent/README.md](./00-intent/README.md)
- [docs/05-taskboard/README.md](./05-taskboard/README.md)
- [docs/10-product/README.md](./10-product/README.md)
- [docs/15-feature-definition/README.md](./15-feature-definition/README.md)
- [docs/20-architecture/README.md](./20-architecture/README.md)
- [docs/30-security/README.md](./30-security/README.md)
- [docs/40-contracts/README.md](./40-contracts/README.md)
- [docs/50-engineering/README.md](./50-engineering/README.md)
- [docs/55-execution/README.md](./55-execution/README.md)
- [docs/60-ai/README.md](./60-ai/README.md)
- [docs/70-operations/README.md](./70-operations/README.md)
- [docs/80-testing/README.md](./80-testing/README.md)
- [docs/90-adr/README.md](./90-adr/README.md)
- [docs/95-delivery/README.md](./95-delivery/README.md)

## Key ADRs

- [docs/90-adr/ADR-0005-no-bff.md](./90-adr/ADR-0005-no-bff.md)
- [docs/90-adr/ADR-0007-persistence-stack-ef-core-migrations-dapper-runtime.md](./90-adr/ADR-0007-persistence-stack-ef-core-migrations-dapper-runtime.md)
- [docs/90-adr/ADR-0008-identity-auth-boundary-with-dapper-stores.md](./90-adr/ADR-0008-identity-auth-boundary-with-dapper-stores.md)
- [docs/90-adr/ADR-0009-frontend-component-test-stack-for-cp12.md](./90-adr/ADR-0009-frontend-component-test-stack-for-cp12.md)
- [docs/90-adr/ADR-0010-playwright-root-host-e2e-runtime.md](./90-adr/ADR-0010-playwright-root-host-e2e-runtime.md)
- [docs/90-adr/ADR-0011-observability-opentelemetry-baseline.md](./90-adr/ADR-0011-observability-opentelemetry-baseline.md)
- [docs/90-adr/ADR-0012-ghcr-production-deployment-and-public-indexing.md](./90-adr/ADR-0012-ghcr-production-deployment-and-public-indexing.md)

## Focused Retrieval

- For release work, start with [docs/95-delivery/README.md](./95-delivery/README.md), then load `release-workflow.md`, `release-checklist.md`, or a specific PR artifact only when needed.
- For checkpoint history, start with [docs/55-execution/checkpoint-status.md](./55-execution/checkpoint-status.md), then load a specific `T-####` task or PR artifact only when the current task depends on it.
- For implementation audit or remediation work, start with [docs/50-engineering/code-quality-review.md](./50-engineering/code-quality-review.md), [docs/50-engineering/code-quality-gap-analysis.md](./50-engineering/code-quality-gap-analysis.md), [docs/50-engineering/batch-1a-summary.md](./50-engineering/batch-1a-summary.md), [docs/50-engineering/batch-1a-acceptance-review.md](./50-engineering/batch-1a-acceptance-review.md), [docs/50-engineering/batch-1b-summary.md](./50-engineering/batch-1b-summary.md), [docs/50-engineering/batch-1b-acceptance-review.md](./50-engineering/batch-1b-acceptance-review.md), [docs/50-engineering/batch-1c-summary.md](./50-engineering/batch-1c-summary.md), and [docs/50-engineering/batch-1c-acceptance-review.md](./50-engineering/batch-1c-acceptance-review.md).
- Treat `docs/70-operations/pipeline-setup/` as historical setup analysis, not a default read set.

## Local-Only Overrides

If present, local-only override docs may add additional workflow guidance.
Committed PaperBinder docs remain product/domain focused.

## Operating Rules

- Do not duplicate canonical definitions.
- Keep links and anchors synchronized when docs move or headings change.
- Update `docs/repo-map.json` when adding/removing/renaming docs.
