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

## Root Reviewer Artifacts

- [PROJECT_ORIGIN.md](../PROJECT_ORIGIN.md) `(Project provenance, canonical public references, and verification guidance)`

## Active V1.1 Presentation Canon

The approved `v1.1` presentation contract and `ADR-0013` are the active presentation canon for this phase. Current V1 presentation docs remain available as historical shipped-surface references. The temporary redesign packet was pruned after its useful decisions moved into durable docs and taskboard records.

- [docs/10-product/presentation-contract-v1-1.md](./10-product/presentation-contract-v1-1.md) `(Approved)`
- [docs/90-adr/ADR-0013-v1-1-presentation-direction-and-canon-reset.md](./90-adr/ADR-0013-v1-1-presentation-direction-and-canon-reset.md) `(Approved)`

## V1.1 Presentation History And Current Execution

- [docs/10-product/presentation-adoption-plan-v1-1.md](./10-product/presentation-adoption-plan-v1-1.md) `(Historical implementation planning under approved canon)`
- [docs/05-taskboard/v1-1-backlog.md](./05-taskboard/v1-1-backlog.md) `(Current canonical backlog and execution order for the remaining v1.1 work)`
- [docs/05-taskboard/tasks/T-0033-phase-4-1-v1-1-presentation-realignment.md](./05-taskboard/tasks/T-0033-phase-4-1-v1-1-presentation-realignment.md) `(Completed Phase 4.1 presentation/UI tranche record)`
- [docs/05-taskboard/tasks/T-0038-v1-1-authenticated-mobile-layout.md](./05-taskboard/tasks/T-0038-v1-1-authenticated-mobile-layout.md) `(Completed authenticated mobile shell baseline)`
- [docs/05-taskboard/tasks/T-0040-v1-1-documentation-truth-pruning.md](./05-taskboard/tasks/T-0040-v1-1-documentation-truth-pruning.md) `(Completed documentation and screenshot refresh task)`

## Lane Indexes

- [docs/00-intent/README.md](./00-intent/README.md)
- [docs/05-taskboard/README.md](./05-taskboard/README.md) `(internal execution state)`
- [docs/10-product/README.md](./10-product/README.md)
- [docs/15-feature-definition/README.md](./15-feature-definition/README.md)
- [docs/20-architecture/README.md](./20-architecture/README.md)
- [docs/30-security/README.md](./30-security/README.md)
- [docs/40-contracts/README.md](./40-contracts/README.md)
- [docs/50-engineering/README.md](./50-engineering/README.md) `(active standards plus historical remediation records)`
- [docs/55-execution/README.md](./55-execution/README.md) `(internal V1 execution history)`
- [docs/60-ai/README.md](./60-ai/README.md)
- [docs/70-operations/README.md](./70-operations/README.md)
- [docs/80-testing/README.md](./80-testing/README.md)
- [docs/90-adr/README.md](./90-adr/README.md)
- [docs/95-delivery/README.md](./95-delivery/README.md) `(active release guidance plus historical PR artifacts)`

## Key ADRs

- [docs/90-adr/ADR-0005-no-bff.md](./90-adr/ADR-0005-no-bff.md)
- [docs/90-adr/ADR-0007-persistence-stack-ef-core-migrations-dapper-runtime.md](./90-adr/ADR-0007-persistence-stack-ef-core-migrations-dapper-runtime.md)
- [docs/90-adr/ADR-0008-identity-auth-boundary-with-dapper-stores.md](./90-adr/ADR-0008-identity-auth-boundary-with-dapper-stores.md)
- [docs/90-adr/ADR-0009-frontend-component-test-stack-for-cp12.md](./90-adr/ADR-0009-frontend-component-test-stack-for-cp12.md)
- [docs/90-adr/ADR-0010-playwright-root-host-e2e-runtime.md](./90-adr/ADR-0010-playwright-root-host-e2e-runtime.md)
- [docs/90-adr/ADR-0011-observability-opentelemetry-baseline.md](./90-adr/ADR-0011-observability-opentelemetry-baseline.md)
- [docs/90-adr/ADR-0012-ghcr-production-deployment-and-public-indexing.md](./90-adr/ADR-0012-ghcr-production-deployment-and-public-indexing.md)
- [docs/90-adr/ADR-0013-v1-1-presentation-direction-and-canon-reset.md](./90-adr/ADR-0013-v1-1-presentation-direction-and-canon-reset.md)
- [docs/90-adr/ADR-0014-tenant-host-failure-externalization-and-trusted-expiry-disclosure.md](./90-adr/ADR-0014-tenant-host-failure-externalization-and-trusted-expiry-disclosure.md)
- [docs/90-adr/ADR-0015-responsive-breakpoint-policy.md](./90-adr/ADR-0015-responsive-breakpoint-policy.md)

## Focused Retrieval

- For release work, start with [docs/95-delivery/README.md](./95-delivery/README.md), then load `release-workflow.md` or `release-checklist.md`. Open a specific PR artifact only when historical delivery context is needed.
- For checkpoint history, start with [docs/55-execution/checkpoint-status.md](./55-execution/checkpoint-status.md), then load a specific `T-####` task or PR artifact only when the current task depends on internal V1 execution history.
- For v1.1 presentation-governance work, start with [docs/10-product/presentation-contract-v1-1.md](./10-product/presentation-contract-v1-1.md) and [docs/90-adr/ADR-0013-v1-1-presentation-direction-and-canon-reset.md](./90-adr/ADR-0013-v1-1-presentation-direction-and-canon-reset.md). Use current V1 presentation docs, including `docs/10-product/ux-notes.md`, as historical shipped-surface references only.
- For repo-specific `v1.1` presentation adoption history, load [docs/10-product/presentation-adoption-plan-v1-1.md](./10-product/presentation-adoption-plan-v1-1.md).
- For the current remaining `v1.1` execution lane, then load [docs/05-taskboard/v1-1-backlog.md](./05-taskboard/v1-1-backlog.md) first and follow the queued successor tasks it points to.
- For the completed detailed `Phase 4.1` presentation tranche, load [docs/05-taskboard/tasks/T-0033-phase-4-1-v1-1-presentation-realignment.md](./05-taskboard/tasks/T-0033-phase-4-1-v1-1-presentation-realignment.md) as the execution record.
- For curated reviewer-support context that the public path should eventually reference, start with `REVIEWERS.md`, then `review/README.md`, then the selected canonical docs those files point to.
- For implementation guidance, start with [docs/50-engineering/README.md](./50-engineering/README.md), then load the active standards in that lane. Use the code-quality audit and batch documents only when historical remediation context is needed.
- For local command execution, validation, or git-write workflows, then load [docs/50-engineering/agent-execution-hygiene.md](./50-engineering/agent-execution-hygiene.md) before composing commands.
- Treat `docs/70-operations/pipeline-setup/` as historical setup analysis, not a default read set.
- For canonical term definitions (tenant, workspace, binder, document, view-as/impersonation, actor/effective user, caller role, binder policy, application service, command/query/outcome record, historical artifact, ADR), see [docs/00-intent/glossary.md](./00-intent/glossary.md). It is a reference to consult when a term is ambiguous, not required first reading.

## Local-Only Overrides

If present, local-only override docs may add additional workflow guidance.
Committed PaperBinder docs remain product/domain focused.

## Operating Rules

- Do not duplicate canonical definitions.
- Keep links and anchors synchronized when docs move or headings change.
- Update `docs/repo-map.json` when adding/removing/renaming docs.
