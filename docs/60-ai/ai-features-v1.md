# AI Features Deferred From `V1`

## Purpose

Define the bounded AI candidate feature set that was deferred from the shipped `V1` release.

## AI Summary

- No AI feature ships in `V1`.
- These candidates remain manual-triggered and tenant-scoped if they are ever approved later.
- AI outputs would remain suggestions or analysis, not automatic document mutation.
- Inputs would remain bounded; usage would be metered; failures would need to degrade gracefully.

## Candidate Feature Catalog (Post-`V1`)

| Feature | Trigger | Output | Hard Limits |
| --- | --- | --- | --- |
| Document summary | User action | concise summary of one doc or bounded binder set | bounded doc count or size or token or time |
| Metadata tag suggestions | User action | suggested categories or topics or risk labels | bounded input; suggestion-only |
| Cross-document synthesis | User action | common themes, gaps, potential conflicts | same-tenant docs only; structured output |
| Document insight alerts | User action | risk or compliance or ambiguity or missing-section hints | manual trigger only; no background scans |

## Shared Rules If Implemented Later

- Operates only on DB-backed immutable text documents.
- Uses resolved tenant context only.
- Never auto-applies changes or mutates source content.
- Persistence of AI output is explicit, user-confirmed behavior.
- UI must label generated content (for example: "AI-generated insight").

## `V1` Release Boundary

- No AI endpoint, browser flow, worker job, or provider adapter is part of the `V1` release.
- Release readiness, reviewer walkthrough, and deployment validation do not depend on AI behavior.

## Acceptance Baseline If Approved Later

- Oversized requests are rejected with structured errors.
- Token or latency or outcome telemetry is recorded per tenant.
- Timeouts and caps are enforced.
- On quota or cost limit breach, the feature fails safely with a clear response.

## Non-Goals For This Candidate Scope

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
