# CP4 PR Description: HTTP Contract Baseline
Status: Review Ready

## Checkpoint
- `CP4`: HTTP Contract Baseline
- Task IDs: `T-0017`

## Summary
- Adds the first real HTTP protocol baseline in `PaperBinder.Api`: global request/response correlation, `/api/*` version negotiation, RFC 7807 ProblemDetails shaping, and a canonical `/api/*` fallback.
- Keeps health endpoints explicitly outside API version negotiation while still applying `X-Correlation-Id` to all responses.
- Adds unit coverage for the protocol helper rules plus integration coverage for API fallback/version failures and health-route header boundaries.
- Updates canonical API/testing docs and checkpoint tracking artifacts so the shipped behavior matches the documented contract.

## Scope Boundaries
- Included:
  - request correlation resolution and response-header emission for all routes
  - `/api/*` version negotiation with v1 defaulting and `API_VERSION_UNSUPPORTED` failures
  - API-scoped ProblemDetails enrichment (`traceId`, `correlationId`, and current error-code surface)
  - canonical `/api/*` fallback plus protocol-focused unit/integration tests
- Not included:
  - tenancy resolution, authentication, authorization, or domain feature endpoints from later checkpoints
  - health endpoint payload changes beyond the new global correlation header
  - new ADRs or additional stable error codes beyond the documented `API_VERSION_UNSUPPORTED`

## Critic Review
- Scope-lock outcome: Passed. The implementation stays inside CP4 boundaries: protocol middleware, fallback handling, synchronized docs, and test coverage.
- Findings summary: No blocker findings remained after unit tests, non-Docker integration tests, Docker-backed integration tests, Release build validation, and docs validation passed.
- Unresolved risks or accepted gaps:
  - `dotnet restore` still has an opaque exit-1 follow-up in the current Windows/.NET 10 SDK environment; this remains a repo-level incidental outside CP4 scope.

## Risks And Rollout Notes
- Config or migration considerations:
  - No new configuration keys or schema changes were introduced.
  - The canonical local/runtime command surface remains the existing repo scripts.
- Security or operational considerations:
  - Invalid client correlation IDs are replaced server-side rather than echoed blindly.
  - Unmatched `/api/*` routes now return ProblemDetails instead of falling through to non-API fallback behavior, which tightens the reviewer-visible protocol boundary.

## Validation Evidence
- Commands run:
  - `dotnet test tests/PaperBinder.UnitTests/PaperBinder.UnitTests.csproj`
  - `dotnet test tests/PaperBinder.IntegrationTests/PaperBinder.IntegrationTests.csproj --filter "Category=NonDocker"`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- Tests added/updated:
  - `tests/PaperBinder.UnitTests/HttpContractHelperTests.cs`
  - `tests/PaperBinder.IntegrationTests/ApiProtocolIntegrationTests.cs`
  - `tests/PaperBinder.IntegrationTests/HealthEndpointIntegrationTests.cs`
  - `tests/PaperBinder.IntegrationTests/HealthEndpointFailureIntegrationTests.cs`
- Manual verification:
  - Confirmed Release build succeeds with the frontend build pipeline and API host compilation.
  - Confirmed the full test script passes, including the Docker-backed integration bucket.
  - Confirmed docs validation passes after the contract/testing doc updates.

## Follow-Ups
- `CP5` is next.
