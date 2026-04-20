# AI Subsystem Overview

## Purpose

Define the deferred post-`V1` AI subsystem candidate scope, invariants, and navigation.

## AI Summary

- No AI feature ships in `V1`; core document workflows work without it.
- Any future AI execution must remain tenant-scoped and authorization-aware.
- Provider integration would use adapters.
- AI execution boundary would remain application layer only.
- Candidate features remain manual-triggered, bounded, and auditable.
- Use this file for deferred policy; use `ai-architecture.md` and `ai-features-v1.md` for detail.

## Invariants If AI Is Approved Later

- Tenant context is required before any AI call.
- Inputs are same-tenant only and bounded by count or size or token limits.
- AI never mutates source documents.
- No cross-tenant embeddings, prompts, or memory.
- Usage must be logged per tenant (tokens, latency, outcome).
- No background inference in `V1`.

## Hypothetical Execution Flow (Post-`V1`)

1. User triggers an AI feature.
2. API resolves tenant and authorization context.
3. Application retrieves bounded tenant documents.
4. Prompt or context is assembled deterministically.
5. `IAiProvider` executes inference through an infrastructure adapter.
6. Structured result is returned and usage telemetry is recorded.

## `V1` Release Boundary

- No AI endpoint, provider contract, or runtime dependency is part of the shipped `V1` system.
- Reviewer-facing release docs should treat the AI lane as deferred context only.

## Non-Goals

- No chatbot UX.
- No conversational memory.
- No autonomous agents.
- No vector database requirement in `V1`.
- No cross-tenant intelligence.

## Related Documents

- `docs/60-ai/ai-architecture.md`
- `docs/60-ai/ai-features-v1.md`
