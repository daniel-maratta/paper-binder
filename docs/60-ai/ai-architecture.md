# AI Architecture

## Purpose

Define architecture boundaries and technical controls for AI execution in v1.

## AI Summary

- AI respects Clean Architecture boundaries.
- Provider SDK usage is infrastructure-only.
- Prompt assembly is deterministic and bounded.
- Logging and failure handling must be safe and structured.
- AI remains removable without breaking core document behavior.

## Layer Boundaries

- Domain/Application contracts:
  - AI request/response types.
  - Provider and service abstractions.
- Application orchestration:
  - retrieval, prompt assembly, provider invocation, output shaping.
- Infrastructure adapters:
  - concrete provider SDK integration.
- Prohibited:
  - direct provider SDK calls from domain or handlers outside approved boundaries.

## Provider Contract

```csharp
public interface IAiProvider
{
    Task<AiCompletionResult> CompleteAsync(AiCompletionRequest request);
}
```

## Prompt and Input Guardrails

- Deterministic prompt templates/versioning.
- Max document count per request.
- Max characters per document.
- Max token budget and timeout per request.
- Reject oversized input with structured validation errors.

## Security and Logging Controls

- No user-controlled system prompts.
- Sanitize/normalize document input before prompt assembly.
- Never log raw secrets, API keys, or full prompt bodies.
- Log tenant-scoped usage metadata only.

## Failure Behavior

- Return typed error responses.
- Do not crash request pipeline.
- Do not run unbounded retries.
- Emit failure telemetry with reason code.

## Testing Minimum

- Deterministic unit tests using mock provider.
- Tenant isolation tests for AI access paths.
- Oversized-input rejection tests.
- Timeout/error-path tests.

## Removability Requirement

Removing AI integrations must not:

- break core binder/document workflows
- require core-domain schema redesign
- alter tenancy resolution semantics
