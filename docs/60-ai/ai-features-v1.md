# AI Features - v1

## Purpose

Define the bounded AI feature set for v1.

## AI Summary

- v1 AI is optional and non-blocking.
- All features are manual-triggered and tenant-scoped.
- AI outputs are suggestions/analysis, not automatic document mutation.
- Inputs are bounded; usage is metered; failures degrade gracefully.

## Feature Catalog (v1)

| Feature | Trigger | Output | Hard Limits |
| --- | --- | --- | --- |
| Document summary | User action | concise summary of one doc or bounded binder set | bounded doc count/size/token/time |
| Metadata tag suggestions | User action | suggested categories/topics/risk labels | bounded input; suggestion-only |
| Cross-document synthesis | User action | common themes, gaps, potential conflicts | same-tenant docs only; structured output |
| Document insight alerts | User action | risk/compliance/ambiguity/missing-section hints | manual trigger only; no background scans |

## Shared Rules

- Operates only on DB-backed immutable text documents.
- Uses resolved tenant context only.
- Never auto-applies changes or mutates source content.
- Persistence of AI output is explicit, user-confirmed behavior.
- UI must label generated content (for example: "AI-generated insight").

## Acceptance Baseline

- Oversized requests are rejected with structured errors.
- Token/latency/outcome telemetry is recorded per tenant.
- Timeouts and caps are enforced.
- On quota/cost limit breach, feature fails safely with clear response.

## Non-Goals (v1)

- No chatbot interface.
- No conversational memory.
- No autonomous agents.
- No vector database requirement.
- No semantic search requirement.
- No cross-tenant intelligence.
- No background AI jobs or automatic alerting.

## Related Documents

- `docs/60-ai/ai-subsystem-overview.md`
- `docs/60-ai/ai-architecture.md`
