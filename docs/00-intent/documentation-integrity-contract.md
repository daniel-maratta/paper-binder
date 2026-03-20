# Documentation Integrity Contract

## Purpose

This contract defines PaperBinder-specific documentation integrity requirements.

## AI Summary

- Documentation integrity is required for every PaperBinder change.
- If paths, anchors, contracts, or terms change, required propagation happens in the same change set.
- `docs/ai-index.md` and `docs/repo-map.json` are the canonical local navigation artifacts.

## Non-Negotiable Rules

- Do not leave stale file paths or heading anchors in docs.
- Do not defer required propagation to a later change when behavior/contracts/terms changed now.
- Keep canonical docs synchronized in the same change set.
- If a concept is renamed, update `docs/00-intent/glossary.md` and downstream references together.

## Propagation Matrix

| Change type | Required propagation |
| --- | --- |
| File moved, renamed, or deleted | Update all references; update `docs/ai-index.md`; update `docs/repo-map.json` nodes/edges/paths. |
| Heading renamed | Update inbound links and `docs/repo-map.json` retrieval anchors. |
| Lane-level docs reorganized | Update affected lane guide `README.md`, `docs/ai-index.md`, and `docs/repo-map.json`. |
| Product or scope boundary changed | Update `docs/10-product/prd.md`, `docs/00-intent/canonical-decisions.md`, and impacted lane docs. |
| Architecture boundary changed | Update `docs/20-architecture/system-overview.md` and impacted architecture/security docs; add ADR when required. |
| Security or tenancy rule changed | Update `docs/30-security/tenant-isolation.md` and related architecture docs. |
| API contract changed | Update `docs/40-contracts/` docs and related ADR/versioning docs. |
| Testing posture changed | Update `docs/80-testing/` docs and affected references. |
| AI subsystem scope or behavior changed | Update `docs/60-ai/` docs, `docs/ai-index.md`, and `docs/repo-map.json`. |

## Required Validation Before Completion

- Confirm changed docs link to real files/directories.
- Confirm navigation anchors resolve to real headings.
- Confirm `docs/repo-map.json` remains valid JSON.
- Confirm lane guides and central navigation reflect current repo structure.

## Canonical Integrity Docs

- `docs/ai-index.md`
- `docs/repo-map.json`
- `docs/00-intent/canonical-decisions.md`
- `docs/00-intent/glossary.md`
- `docs/60-ai/ai-subsystem-overview.md`
- `docs/60-ai/ai-architecture.md`
- `docs/60-ai/ai-features-v1.md`

## Related Documents

- `AGENTS.md`
- `README.md`
- `docs/ai-index.md`
- `docs/repo-map.json`
