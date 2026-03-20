# AI Surface Map (Reviewer)

This summary shows where AI exists in v1 and where it is explicitly constrained.

AI is optional. Core workflows must operate without AI.

## v1 AI Surface

| Area | Trigger | Inputs | Output | Guardrails |
| --- | --- | --- | --- | --- |
| Document summary | manual user action | bounded same-tenant docs | concise summary | no mutation, bounded tokens/time |
| Metadata tag suggestions | manual user action | bounded same-tenant docs | suggested tags/labels | suggestion-only, explicit user acceptance |
| Cross-document synthesis | manual user action | bounded same-tenant docs | themes/gaps/conflicts | strict tenant scope, structured output |
| Insight alerts | manual user action | bounded same-tenant docs | risk/ambiguity hints | no background jobs in v1 |

## AI Boundary Rules

- Tenant context and authorization are resolved before AI execution.
- AI executes through application-layer abstractions.
- Provider calls run via adapter (`IAiProvider`) boundary.
- No cross-tenant prompts, memory, or embeddings.
- AI output never mutates source documents automatically.
- Usage telemetry is tenant-scoped (tokens, latency, outcome).

## Explicit Non-Goals (v1)

- no chatbot interface
- no conversational memory
- no autonomous agents
- no background inference pipeline
- no cross-tenant intelligence

## Canonical References

- `docs/60-ai/ai-subsystem-overview.md`
- `docs/60-ai/ai-features-v1.md`
- `docs/90-adr/ADR-0014-ai-provider-abstraction-strategy.md`
- `docs/90-adr/ADR-0015-ai-execution-boundary-application-layer-only.md`
- `docs/00-intent/non-goals.md`
