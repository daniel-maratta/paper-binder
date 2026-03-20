# AGENTS CONTRACT - PaperBinder

PaperBinder is a deliberately scoped, constrained multi-tenant SaaS demonstration and public hiring artifact.
This contract keeps agent behavior aligned to scope discipline, tenant isolation, and reviewer-friendly delivery.

This document defines non-negotiable rules for code agents contributing to this repository.
If a requested change conflicts with this contract, preserve this contract.

If `AGENTS.local.md` exists, read it at task start and apply its local-only constraints.
Do not reference local-only files in committed artifacts.

---

## Hard Invariants

- Tenant isolation is a security boundary.
- Every request must establish tenant context early.
- Every data access path must be tenant-scoped by construction.
- Never "filter after fetch" for tenant isolation.
- Scope discipline is mandatory.
- Prefer DB-backed text documents.
- Do not add non-goals without explicit ADR + feature spec approval.
- Documentation integrity is mandatory: path, anchor, and concept changes must be propagated in the same change set.

---

## Progressive Disclosure

Load only task-relevant docs. Do not pre-load everything by default.

---

## Always Read

Read these files at the start of every task:
- `AGENTS.md`
- `AGENTS.local.md` if present
- `README.md`
- `docs/00-intent/documentation-integrity-contract.md`

---

## Scoped Agent Docs

Use these as authoritative topic guides:
- Security and tenant isolation: `docs/30-security/AGENTS.md`
- Product scope and intent constraints: `docs/00-intent/AGENTS.md`
- Local documentation navigation: `docs/ai-index.md`

---

## Load When Relevant

- If task touches tenancy/auth/data access: read `docs/30-security/AGENTS.md` and `docs/20-architecture/tenancy-resolution.md`.
- If task introduces dependencies or architectural decisions: read `docs/90-adr/README.md`.
- If task touches tests: read `docs/80-testing/test-strategy.md` and `docs/80-testing/testing-standards.md`.
- If task touches config/secrets/operations: read `docs/70-operations/README.md`.
- If task touches product scope or non-goals: read `docs/00-intent/AGENTS.md`, `docs/00-intent/project-scope.md`, and `docs/00-intent/non-goals.md`.
- If task touches docs structure or docs navigation: read `docs/ai-index.md` and `docs/repo-map.json`.
- If task changes file paths, headings, contracts, or canonical terms: read and apply `docs/00-intent/documentation-integrity-contract.md`.
