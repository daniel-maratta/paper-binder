# AI Subsystem Overview

## Purpose

Define the v1 AI subsystem scope, invariants, and navigation.

## AI Summary

- AI is optional; core document workflows must work without it.
- Execution is always tenant-scoped and authorization-aware.
- Provider integration uses adapters.
- AI execution boundary is application layer only.
- Features are manual-triggered, bounded, and auditable.
- Use this file for policy; use `ai-architecture.md` and `ai-features-v1.md` for detail.

## Invariants

- Tenant context is required before any AI call.
- Inputs are same-tenant only and bounded by count/size/token limits.
- AI never mutates source documents.
- No cross-tenant embeddings, prompts, or memory.
- Usage must be logged per tenant (tokens, latency, outcome).
- No background inference in v1.

## Execution Flow (v1)

1. User triggers an AI feature.
2. API resolves tenant and authorization context.
3. Application retrieves bounded tenant documents.
4. Prompt/context is assembled deterministically.
5. `IAiProvider` executes inference through infrastructure adapter.
6. Structured result is returned and usage telemetry is recorded.

## Non-Goals

- No chatbot UX.
- No conversational memory.
- No autonomous agents.
- No vector database requirement in v1.
- No cross-tenant intelligence.

## Related Documents

- `docs/60-ai/ai-architecture.md`
- `docs/60-ai/ai-features-v1.md`
