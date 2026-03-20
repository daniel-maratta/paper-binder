# Feature Definition Lane Guide

## AI Summary

- This lane captures feature-level decisions that close execution ambiguity without creating new ADR-level architecture decisions.
- Use the feature definition template to author new entries and keep scope explicit.
- Keep feature definitions aligned with canonical docs in product, architecture, contracts, security, operations, testing, and ADR lanes.
- Resolved FDs are historical records and are not canonical after integration.

## Read First

- `docs/15-feature-definition/feature-definition-index.md`
- `docs/15-feature-definition/feature-definition-lifecycle.md`
- `docs/15-feature-definition/FD-0000-feature-definition-template.md`
- `docs/00-intent/documentation-integrity-contract.md`

## FD Authority Model

Feature Definitions (FD) are temporary decision packets used to resolve specification gaps.

Once a feature definition is approved:
1. The decisions are merged into canonical documentation.
2. The FD is marked `Resolved`.
3. The FD remains in the repository as historical traceability.

FD documents are not canonical sources of truth after resolution.

## Lifecycle

```text
Ambiguity
   ↓
Feature Definition (FD)
   ↓
Canonical Docs Updated
   ↓
FD Marked "Resolved"
   ↓
FD remains as historical record
```

See full process details in `docs/15-feature-definition/feature-definition-lifecycle.md`.

## Current Definitions (Historical Records)

- `FD-0001`: binder document detail and archive semantics (Resolved).
- `FD-0002`: demo provisioning login flow (Resolved).
- `FD-0003`: tenant user management and role assignment (Resolved).
- `FD-0004`: binder policy model (Resolved).
- `FD-0005`: demo tenant lease status contract (Resolved).
- `FD-0006`: challenge verification and rate limits (Resolved).
- `FD-0007`: tenant purge audit retention mode (Resolved).
- `FD-0008`: health and readiness contract (Resolved).
- `FD-0009`: configuration contract (Resolved).
