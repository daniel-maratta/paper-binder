# Feature Definition Lifecycle

## AI Summary

- Feature Definitions (FDs) are temporary decision packets used to close specification gaps.
- Once merged into canonical docs, an FD is marked `Resolved` and becomes historical traceability.
- Resolved FDs are not canonical sources of truth.
- Canonical rules live in product, architecture, contracts, security, operations, testing, and ADR docs.

## Purpose

Define how Feature Definitions are created, integrated, and retained.

## Lifecycle

Feature lifecycle:

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

## Rules

1. FDs are temporary and scoped to unresolved behavior/specification ambiguity.
2. Approved FD decisions must be merged into canonical lane docs in the same change set.
3. After canonical integration, FD status must be changed to:
   - `Resolved — integrated into canonical documentation`
4. Resolved FDs must include a `Canonical locations` section pointing to authoritative docs.
5. Resolved FDs remain in-repo for traceability and auditability.
6. Resolved FDs must not be treated as canonical sources of truth.

## Canonical Lanes

- Product: `docs/10-product/`
- Architecture: `docs/20-architecture/`
- Contracts: `docs/40-contracts/`
- Security: `docs/30-security/`
- Operations: `docs/70-operations/`
- Testing: `docs/80-testing/`
- ADRs: `docs/90-adr/`

## Header Pattern for Resolved FDs

```md
## Status
Resolved — integrated into canonical documentation

## Canonical locations
- docs/40-contracts/api-contract.md
- docs/20-architecture/policy-authorization.md
- docs/30-security/rate-limiting-abuse.md
```
