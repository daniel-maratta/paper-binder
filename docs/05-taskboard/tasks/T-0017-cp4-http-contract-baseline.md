# T-0017: CP4 HTTP Contract Baseline

## Status
done

## Type
feature

## Priority
P0

## Owner
agent

## Created
2026-04-02

## Updated
2026-04-02

## Checkpoint
CP4

## Phase
Phase 1

## Summary
Implement the first real HTTP protocol baseline for PaperBinder: global correlation handling, `/api/*` version negotiation, RFC 7807 ProblemDetails shaping, and protocol-focused integration coverage that locks the contract before feature endpoints arrive.

## Context
- CP4 turns the documented protocol contract into running behavior instead of leaving it as aspirational documentation.
- The implementation must keep health endpoints outside API version negotiation while still applying global correlation headers.
- The fallback strategy must be a real API contract surface, not a temporary probe endpoint or test-host-only branch.

## Acceptance Criteria
- [x] All HTTP responses emit `X-Correlation-Id`, with invalid client values replaced server-side
- [x] `/api/*` enforces `X-Api-Version` with v1 defaulting and `API_VERSION_UNSUPPORTED` ProblemDetails failures
- [x] Unmatched `/api/*` routes return ProblemDetails with trace/correlation metadata and version headers
- [x] Health endpoint coverage proves they stay non-versioned while still carrying correlation headers
- [x] Canonical contract/testing docs and the CP4 PR artifact are updated in the same change set
- [x] Validation evidence is captured for build, tests, and docs validation

## Dependencies
- [T-0015](./T-0015-cp3-persistence-baseline-and-migration-pipeline.md)
- [T-0016](./T-0016-repo-validation-tooling-hardening.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Locked to CP4 only: correlation, API versioning, ProblemDetails shaping, API fallback behavior, synchronized docs, and protocol-focused tests.
- Pre-PR Critique: Passed for the intended CP4 scope. No open blocker findings remained after unit, integration, Docker-backed, Release build, and docs validation passed.
- Escalation Notes: Release build and the full test script required escalation because the sandbox blocks the real frontend build path and Docker-backed integration execution.

## Current State
- Completed and validated on the current branch. The checkpoint remains active at the ledger level pending PR/merge, but the scoped task work is done.

## Touch Points
- `src/PaperBinder.Api`
- `tests/PaperBinder.IntegrationTests`
- `tests/PaperBinder.UnitTests`
- `docs/40-contracts`
- `docs/80-testing`
- `docs/55-execution`
- `docs/95-delivery/pr`

## Next Action
- Use the CP4 PR artifact for reviewer handoff and keep the checkpoint active until merge.

## Validation Evidence
- `dotnet test tests/PaperBinder.UnitTests/PaperBinder.UnitTests.csproj` (passed: 24/24 unit tests)
- `dotnet test tests/PaperBinder.IntegrationTests/PaperBinder.IntegrationTests.csproj --filter "Category=NonDocker"` (passed: 19/19 non-Docker integration tests)
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release` (passed)
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require` (passed: 24/24 unit tests, 19/19 non-Docker integration tests, 4/4 Docker-backed integration tests)
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` (passed)

## Decision Notes
- Use a canonical `/api/*` fallback endpoint rather than a public probe endpoint.
- Keep health/readiness failure payloads on their existing health JSON contract; ProblemDetails applies to API-route failures.

## Validation Plan
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`

## Outcome (Fill when done)
- Added protocol middleware and helpers in `PaperBinder.Api` for correlation resolution, API version negotiation, ProblemDetails enrichment, and a canonical `/api/*` fallback.
- Added unit tests for API-path classification, version parsing, and correlation validation plus integration coverage for fallback/version/correlation behavior and health-route header boundaries.
- Updated canonical API/testing docs, the changelog, the reviewer-facing SPA placeholder copy, and the CP4 PR artifact to match the implemented contract.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
