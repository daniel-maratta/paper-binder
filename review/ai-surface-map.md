# AI Surface Map (Reviewer, Post-V1 Context)

This summary records the deferred AI candidate scope that remains outside the shipped `V1` release.

No AI feature ships in `V1`. Core reviewer walkthroughs, release readiness, and the canonical local stack do not depend on this material.

## Post-V1 Candidate Surface

| Area | Trigger | Inputs | Output | Guardrails |
| --- | --- | --- | --- | --- |
| Document summary | manual user action | bounded same-tenant docs | concise summary | no mutation, bounded tokens/time |
| Metadata tag suggestions | manual user action | bounded same-tenant docs | suggested tags/labels | suggestion-only, explicit user acceptance |
| Cross-document synthesis | manual user action | bounded same-tenant docs | themes/gaps/conflicts | strict tenant scope, structured output |
| Insight alerts | manual user action | bounded same-tenant docs | risk/ambiguity hints | no background jobs in `V1` |

## AI Boundary Rules If Approved Later

- Tenant context and authorization are resolved before AI execution.
- AI executes through application-layer abstractions.
- Provider calls run via adapter (`IAiProvider`) boundary.
- No cross-tenant prompts, memory, or embeddings.
- AI output never mutates source documents automatically.
- Usage telemetry is tenant-scoped (tokens, latency, outcome).

## Explicit `V1` Boundary

- no shipped AI endpoints, background jobs, browser flows, or provider integrations
- no AI-dependent reviewer path
- no AI-dependent release gate

## Explicit Non-Goals For The Candidate Scope

- no chatbot interface
- no conversational memory
- no autonomous agents
- no background inference pipeline
- no cross-tenant intelligence

## Canonical References

- `docs/60-ai/ai-subsystem-overview.md`
- `docs/60-ai/ai-architecture.md`
- `docs/60-ai/ai-features-v1.md`
- `docs/00-intent/non-goals.md`
