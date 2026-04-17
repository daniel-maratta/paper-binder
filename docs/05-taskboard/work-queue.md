# Work Queue

This is the active PaperBinder task board for agent execution.

## Board Limits

- `Now` WIP limit: 1-3 tasks.
- Default `Now` target: 1 task unless deliberate low-conflict parallelism is justified.
- `Next` should stay focused (generally <= 10 tasks).
- `Blocked` must include explicit unblock condition.

## Now (WIP 1-3)

- [T-0030: CP15 Tenant-Local Impersonation And Audit Safety](./tasks/T-0030-cp15-tenant-local-impersonation-and-audit-safety.md)

## Next

- (empty)

## Later

- (empty)

## Blocked

- (empty)

## Recently Done

- [T-0029: CP14 Tenant-Host Frontend Flows](./tasks/T-0029-cp14-tenant-host-frontend-flows.md)
- [T-0028: CP13 Root-Host Frontend Flows](./tasks/T-0028-cp13-root-host-frontend-flows.md)
- [T-0024: Track Remaining Test Coverage Gaps](./tasks/T-0024-track-remaining-test-coverage-gaps.md)
- [T-0027: CP12 Frontend Foundation And Shared UI System](./tasks/T-0027-cp12-frontend-foundation-and-shared-ui-system.md)
- [T-0026: CP11 Worker Runtime And Lease Lifecycle](./tasks/T-0026-cp11-worker-runtime-and-lease-lifecycle.md)
- [T-0025: CP10 Document Domain And Immutable Document Rules](./tasks/T-0025-cp10-document-domain-and-immutable-document-rules.md)
- [T-0023: CP9 Binder Domain And Policy Model](./tasks/T-0023-cp9-binder-domain-and-policy-model.md)
- [T-0022: CP8 Authorization Policies And Tenant User Administration](./tasks/T-0022-cp8-authorization-policies-and-tenant-user-administration.md)
- [T-0021: Build And Restore Diagnostics Hardening](./tasks/T-0021-build-and-restore-diagnostics-hardening.md)
- [T-0020: CP7 Pre-Auth Abuse Controls And Provisioning Surface](./tasks/T-0020-cp7-pre-auth-abuse-controls-and-provisioning-surface.md)
- [T-0019: CP6 Identity, Cookie Auth, And Tenant Membership Validation](./tasks/T-0019-cp6-identity-cookie-auth-and-tenant-membership-validation.md)
- [T-0018: CP5 Tenancy Resolution And Immutable Tenant Context](./tasks/T-0018-cp5-tenancy-resolution-and-immutable-tenant-context.md)
- [T-0017: CP4 HTTP Contract Baseline](./tasks/T-0017-cp4-http-contract-baseline.md)
- [T-0015: CP3 Persistence Baseline And Migration Pipeline](./tasks/T-0015-cp3-persistence-baseline-and-migration-pipeline.md)
- [T-0016: Repo Validation Tooling Hardening](./tasks/T-0016-repo-validation-tooling-hardening.md)
- [T-0014: CP2 Runtime Configuration And Local Deployment Scaffold](./tasks/T-0014-cp2-runtime-configuration-and-local-deployment-scaffold.md)
- [T-0013: CP1 CI Pipeline](./tasks/T-0013-cp1-ci-pipeline.md)
- [T-0012: CP1 Root Scripts And Docs Validation](./tasks/T-0012-cp1-root-scripts-and-docs-validation.md)
- [T-0011: CP1 Frontend Scaffold](./tasks/T-0011-cp1-frontend-scaffold.md)
- [T-0010: CP1 Solution Skeleton](./tasks/T-0010-cp1-solution-skeleton.md)
- [T-0003: Polish Operator Guidance](./tasks/T-0003-operator-guidance-polish.md)
- [T-0002: Establish Agent Operating Model](./tasks/T-0002-agent-operating-model.md)
- [T-0001: Bootstrap Repo-Native Task Tracking](./tasks/T-0001-bootstrap-task-tracking.md)

## Queue Maintenance Rules

- Every queue entry must link to a `T-####` task file.
- Queue ordering is value/risk/dependency driven.
- A task is moved to `Recently Done` only after `Status: done` and Outcome are recorded.
