# ADR Lane Guide

## AI Summary

- This lane records architecture decisions that are expensive to reverse.
- ADRs are binding unless superseded by newer ADRs.
- Follow repository ADR policy from root and intent constraints when proposing new ADRs.

## Read First

- `docs/90-adr/ADR-0001-domain-immutable-documents-with-supersedes-chain.md`
- `docs/90-adr/ADR-0002-security-tenant-local-impersonation-for-demo-view-as.md`
- `docs/90-adr/ADR-0005-no-bff.md`
- `docs/90-adr/ADR-0007-persistence-stack-ef-core-migrations-dapper-runtime.md`
- `docs/90-adr/ADR-0008-identity-auth-boundary-with-dapper-stores.md`

## Key Decision Clusters

- Domain/content behavior: `ADR-0001`
- Security/authz behavior: `ADR-0002`, `ADR-0008`
- Operations/lifecycle behavior: `ADR-0003`, `ADR-0004`, `ADR-0006`
- Persistence/runtime behavior: `ADR-0007`
- Architecture scope constraints: `ADR-0005`
