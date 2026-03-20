# AGENTS - Intent and Product Constraints

This file is authoritative for product intent, scope boundaries, and public-repo tone.
Root `AGENTS.md` is intentionally minimal.

## Project Intent

PaperBinder is a deliberately scoped, constrained multi-tenant SaaS demonstration.

It must remain:
- Narrow in scope.
- Security-aware (tenant isolation is a boundary).
- Auditable (clear change history and ADRs for sticky decisions).
- Easy to review by a hiring team.

## Non-Goals

Do not introduce without explicit approval via ADR + feature spec:
- File uploads, blob storage pipelines, or virus scanning requirements.
- Cross-tenant sharing of documents/data.
- Realtime collaboration features.
- Complex workflow engines.
- Multi-region deployment complexity.

Default posture: DB-backed text documents and minimal supporting primitives.

## Content and Tone

- Keep docs technical, durable, and reviewer-friendly.
- Do not include private planning or internal-only process details.

## Documentation Navigation Policy

When a task changes documentation structure, references, or indexability:
- update `docs/ai-index.md` and `docs/repo-map.json`
- update lane guides (`docs/*/README.md`) when lane composition changes
- fix moved/renamed file references in the same change set

## Documentation Integrity Enforcement

For any task that changes file paths, headings, concepts, contracts, or behavior:
- apply `docs/00-intent/documentation-integrity-contract.md`
- propagate changes to canonical docs in the same change set
- do not leave stale references
