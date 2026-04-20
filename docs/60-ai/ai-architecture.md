# AI Architecture

## Purpose

Define the architecture boundaries and technical controls that would apply if AI work is approved after `V1`.

## AI Summary

- No AI architecture is implemented in `V1`.
- Future AI work must respect Clean Architecture boundaries.
- Provider SDK usage must remain infrastructure-only.
- Prompt assembly must remain deterministic and bounded.
- Logging and failure handling must be safe and structured.
- AI must remain removable without breaking core document behavior.

## Layer Boundaries

- Domain or Application contracts:
  - AI request or response types.
  - Provider and service abstractions.
- Application orchestration:
  - retrieval, prompt assembly, provider invocation, output shaping.
- Infrastructure adapters:
  - concrete provider SDK integration.
- Prohibited:
  - direct provider SDK calls from domain or handlers outside approved boundaries.

## Provider Contract

If AI work is approved later, the provider boundary remains:

```csharp
public interface IAiProvider
{
    Task<AiCompletionResult> CompleteAsync(AiCompletionRequest request);
}
```

## Prompt and Input Guardrails

- Deterministic prompt templates or versioning.
- Max document count per request.
- Max characters per document.
- Max token budget and timeout per request.
- Reject oversized input with structured validation errors.

## Security and Logging Controls

- No user-controlled system prompts.
- Sanitize or normalize document input before prompt assembly.
- Never log raw secrets, API keys, or full prompt bodies.
- Log tenant-scoped usage metadata only.

## Failure Behavior

- Return typed error responses.
- Do not crash the request pipeline.
- Do not run unbounded retries.
- Emit failure telemetry with a reason code.

## Testing Minimum If Approved Later

- Deterministic unit tests using a mock provider.
- Tenant isolation tests for AI access paths.
- Oversized-input rejection tests.
- Timeout and error-path tests.

## Removability Requirement

Removing future AI integrations must not:

- break core binder or document workflows
- require core-domain schema redesign
- alter tenancy resolution semantics
