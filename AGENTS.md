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
- Implementation quality at hotspot seams is a delivery requirement, not a cosmetic follow-up.
- Prefer platform-native parsing and validation when the contract matches the platform primitive.
- Helper and type names must describe actual behavior; do not call trim/coalesce helpers `Normalize`.
- Split public types by responsibility unless a multi-type file has one clear, defensible reason to stay together.

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

## Execution Hygiene

- Prefer repo-native PowerShell scripts under `scripts/` for build, test, and validation workflows.
- Do not compose repo workflows with shell separators such as `&&`, `||`, or `;`.
- Use one command per tool call unless a checked-in script already bundles the workflow.
- For known elevated workflows in this repo, request escalation immediately instead of probing the sandbox first:
  - `git add ...`
  - `git commit -m ...`
  - frontend Vite/Vitest commands
  - Docker-backed integration tests
- If command friction repeats, promote the workflow into `scripts/` and update the workflow docs.

---

## Load When Relevant

- If task touches tenancy/auth/data access: read `docs/30-security/AGENTS.md` and `docs/20-architecture/tenancy-resolution.md`.
- If task introduces dependencies or architectural decisions: read `docs/90-adr/README.md`.
- If task touches tests: read `docs/80-testing/test-strategy.md` and `docs/80-testing/testing-standards.md`.
- If task involves local command execution, validation workflows, or git write operations: read `docs/50-engineering/agent-execution-hygiene.md`.
- If task touches config/secrets/operations: read `docs/70-operations/README.md`.
- If task touches implementation quality, hotspot cleanup, or audit remediation: read `docs/50-engineering/coding-standards.md`, `docs/archive/v1-1/remediation/engineering-quality/code-quality-review.md`, and `docs/archive/v1-1/remediation/engineering-quality/code-quality-gap-analysis.md`.
- If task touches product scope or non-goals: read `docs/00-intent/AGENTS.md`, `docs/00-intent/project-scope.md`, and `docs/00-intent/non-goals.md`.
- If task touches docs structure or docs navigation: read `docs/ai-index.md` and `docs/repo-map.json`.
- If task changes file paths, headings, contracts, or canonical terms: read and apply `docs/00-intent/documentation-integrity-contract.md`.
