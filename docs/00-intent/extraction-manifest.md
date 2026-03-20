# PaperBinder Extraction Manifest

## Purpose

Record what has been extracted from PaperBinder and what remains intentionally local.

## Completed Extractions

- Process/token doctrine removed from PaperBinder intent lane.
- Layer-planning tracking artifact removed from PaperBinder intent lane.

## Current Local Scope

PaperBinder keeps:
- product/domain intent docs
- product architecture, security, contracts, operations, testing, ADR, and delivery docs
- local navigation artifacts: `docs/ai-index.md` and `docs/repo-map.json`

## Guardrails

- Do not add private repository names or paths to committed PaperBinder docs.
- Keep PaperBinder docs focused on product/domain/reviewer value.
- Treat local-only override docs as optional runtime context, not committed repository policy.
