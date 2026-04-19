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

## Execution References

- [docs/55-execution/execution-plan.md](./55-execution/execution-plan.md)
- [docs/55-execution/checkpoint-status.md](./55-execution/checkpoint-status.md)
- [docs/55-execution/workflows/agent-operating-model.md](./55-execution/workflows/agent-operating-model.md)
- [docs/05-taskboard/tasks/T-0023-cp9-binder-domain-and-policy-model.md](./05-taskboard/tasks/T-0023-cp9-binder-domain-and-policy-model.md)
- [docs/05-taskboard/tasks/T-0025-cp10-document-domain-and-immutable-document-rules.md](./05-taskboard/tasks/T-0025-cp10-document-domain-and-immutable-document-rules.md)
- [docs/05-taskboard/tasks/T-0026-cp11-worker-runtime-and-lease-lifecycle.md](./05-taskboard/tasks/T-0026-cp11-worker-runtime-and-lease-lifecycle.md)
- [docs/05-taskboard/tasks/T-0027-cp12-frontend-foundation-and-shared-ui-system.md](./05-taskboard/tasks/T-0027-cp12-frontend-foundation-and-shared-ui-system.md)
- [docs/05-taskboard/tasks/T-0028-cp13-root-host-frontend-flows.md](./05-taskboard/tasks/T-0028-cp13-root-host-frontend-flows.md)
- [docs/05-taskboard/tasks/T-0029-cp14-tenant-host-frontend-flows.md](./05-taskboard/tasks/T-0029-cp14-tenant-host-frontend-flows.md)
- [docs/05-taskboard/tasks/T-0030-cp15-tenant-local-impersonation-and-audit-safety.md](./05-taskboard/tasks/T-0030-cp15-tenant-local-impersonation-and-audit-safety.md)
- [docs/05-taskboard/tasks/T-0031-cp16-hardening-and-consistency-pass.md](./05-taskboard/tasks/T-0031-cp16-hardening-and-consistency-pass.md)
- [docs/95-delivery/pr/cp9-binder-domain-and-policy-model/description.md](./95-delivery/pr/cp9-binder-domain-and-policy-model/description.md)
- [docs/95-delivery/pr/cp10-document-domain-and-immutable-document-rules/implementation-plan.md](./95-delivery/pr/cp10-document-domain-and-immutable-document-rules/implementation-plan.md)
- [docs/95-delivery/pr/cp10-document-domain-and-immutable-document-rules/critic-review.md](./95-delivery/pr/cp10-document-domain-and-immutable-document-rules/critic-review.md)
- [docs/95-delivery/pr/cp10-document-domain-and-immutable-document-rules/description.md](./95-delivery/pr/cp10-document-domain-and-immutable-document-rules/description.md)
- [docs/95-delivery/pr/cp11-worker-runtime-and-lease-lifecycle/implementation-plan.md](./95-delivery/pr/cp11-worker-runtime-and-lease-lifecycle/implementation-plan.md)
- [docs/95-delivery/pr/cp11-worker-runtime-and-lease-lifecycle/critic-review.md](./95-delivery/pr/cp11-worker-runtime-and-lease-lifecycle/critic-review.md)
- [docs/95-delivery/pr/cp11-worker-runtime-and-lease-lifecycle/description.md](./95-delivery/pr/cp11-worker-runtime-and-lease-lifecycle/description.md)
- [docs/95-delivery/pr/cp12-frontend-foundation-and-shared-ui-system/implementation-plan.md](./95-delivery/pr/cp12-frontend-foundation-and-shared-ui-system/implementation-plan.md)
- [docs/95-delivery/pr/cp12-frontend-foundation-and-shared-ui-system/critic-review.md](./95-delivery/pr/cp12-frontend-foundation-and-shared-ui-system/critic-review.md)
- [docs/95-delivery/pr/cp12-frontend-foundation-and-shared-ui-system/description.md](./95-delivery/pr/cp12-frontend-foundation-and-shared-ui-system/description.md)
- [docs/95-delivery/pr/cp13-root-host-frontend-flows/implementation-plan.md](./95-delivery/pr/cp13-root-host-frontend-flows/implementation-plan.md)
- [docs/95-delivery/pr/cp13-root-host-frontend-flows/critic-review.md](./95-delivery/pr/cp13-root-host-frontend-flows/critic-review.md)
- [docs/95-delivery/pr/cp13-root-host-frontend-flows/description.md](./95-delivery/pr/cp13-root-host-frontend-flows/description.md)
- [docs/95-delivery/pr/cp14-tenant-host-frontend-flows/implementation-plan.md](./95-delivery/pr/cp14-tenant-host-frontend-flows/implementation-plan.md)
- [docs/95-delivery/pr/cp14-tenant-host-frontend-flows/critic-review.md](./95-delivery/pr/cp14-tenant-host-frontend-flows/critic-review.md)
- [docs/95-delivery/pr/cp14-tenant-host-frontend-flows/description.md](./95-delivery/pr/cp14-tenant-host-frontend-flows/description.md)
- [docs/95-delivery/pr/cp15-tenant-local-impersonation-and-audit-safety/implementation-plan.md](./95-delivery/pr/cp15-tenant-local-impersonation-and-audit-safety/implementation-plan.md)
- [docs/95-delivery/pr/cp15-tenant-local-impersonation-and-audit-safety/critic-review.md](./95-delivery/pr/cp15-tenant-local-impersonation-and-audit-safety/critic-review.md)
- [docs/95-delivery/pr/cp15-tenant-local-impersonation-and-audit-safety/description.md](./95-delivery/pr/cp15-tenant-local-impersonation-and-audit-safety/description.md)
- [docs/95-delivery/pr/cp16-hardening-and-consistency-pass/implementation-plan.md](./95-delivery/pr/cp16-hardening-and-consistency-pass/implementation-plan.md)
- [docs/95-delivery/pr/cp16-hardening-and-consistency-pass/critic-review.md](./95-delivery/pr/cp16-hardening-and-consistency-pass/critic-review.md)
- [docs/95-delivery/pr/cp16-hardening-and-consistency-pass/description.md](./95-delivery/pr/cp16-hardening-and-consistency-pass/description.md)

## Local-Only Overrides

If present, local-only override docs may add additional workflow guidance.
Committed PaperBinder docs remain product/domain focused.

## Operating Rules

- Do not duplicate canonical definitions.
- Keep links and anchors synchronized when docs move or headings change.
- Update `docs/repo-map.json` when adding/removing/renaming docs.
