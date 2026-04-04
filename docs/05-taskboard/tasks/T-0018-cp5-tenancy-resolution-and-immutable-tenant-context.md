# T-0018: CP5 Tenancy Resolution And Immutable Tenant Context

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
CP5

## Phase
Phase 2

## Summary
Implement host-derived tenancy resolution as an early request boundary: validate root and tenant hosts, materialize immutable request-scoped tenant context once per request, and reject invalid or unknown tenant hosts before tenant-scoped handling runs.

## Context
- CP5 establishes the first real tenant boundary before authentication, policy, or domain handlers arrive.
- Client-provided tenant hints must not influence request scoping; only server-side host resolution is trusted.
- Local process debugging and non-Docker integration execution still need a safe system-context path on loopback hosts.

## Acceptance Criteria
- [x] Host/subdomain parsing resolves either system context or a single tenant slug from the configured base domain
- [x] Request-scoped tenant context is established once and remains immutable for the request lifetime
- [x] Invalid hosts and unknown tenant hosts are rejected before tenant-scoped handlers run
- [x] API-route host failures return ProblemDetails with stable tenant-host error codes
- [x] Unit and integration coverage prove loopback/system handling, spoofed tenant-hint rejection, invalid hosts, and unknown tenants
- [x] Canonical tenancy/security/contract/testing docs and the CP5 PR artifact are updated in the same change set
- [x] Validation evidence is captured for build, tests, and docs validation

## Dependencies
- [T-0017](./T-0017-cp4-http-contract-baseline.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Locked to CP5 only: host parsing, tenant lookup, immutable request context, host rejection behavior, test-host diagnostics seam, synchronized docs, and integration/unit coverage.
- Pre-PR Critique: Passed for the intended CP5 scope. No open blocker findings remained after Release build, full Release test coverage, and docs validation passed.
- Escalation Notes: Release build and the full Release test suite required escalation because the sandbox blocked Vite/esbuild process spawning and Docker-backed integration execution.

## Current State
- Completed and validated on the current branch. The checkpoint remains active at the ledger level pending PR/merge, but the scoped CP5 task work is done.

## Touch Points
- `src/PaperBinder.Api`
- `src/PaperBinder.Application`
- `src/PaperBinder.Infrastructure`
- `src/PaperBinder.Web`
- `tests/PaperBinder.UnitTests`
- `tests/PaperBinder.IntegrationTests`
- `docs/20-architecture`
- `docs/30-security`
- `docs/40-contracts`
- `docs/80-testing`
- `docs/55-execution`
- `docs/95-delivery/pr`

## Next Action
- Use the CP5 PR artifact for reviewer handoff and keep the checkpoint active until merge.

## Validation Evidence
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release` (passed)
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require` (passed: 38/38 unit tests, 21/21 non-Docker integration tests, 7/7 Docker-backed integration tests)
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` (passed)

## Decision Notes
- Use the configured auth-cookie base domain as the trusted root/tenant host boundary for CP5 instead of introducing a second backend-only host-routing setting.
- Keep tenant-context verification on a test-host-only probe route instead of adding a public diagnostic endpoint to the shipped API surface.
- Preserve Development/Test loopback hosts as system-context only so focused local API/debug flows do not regress before the full root-host topology is running.

## Validation Plan
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`

## Outcome (Fill when done)
- Added host-validation and tenant-resolution middleware that resolves system or tenant context once per request, rejects invalid hosts with `400`, and rejects unknown tenant hosts with `404` before downstream handling.
- Added a Dapper-backed tenant lookup service plus immutable request-scoped tenant-context abstractions for future endpoint/auth work.
- Added unit coverage for host parsing and request-context immutability plus integration coverage for loopback system context, invalid hosts, known tenant resolution, spoofed tenant hints, and unknown tenants.
- Updated the reviewer-facing SPA placeholder copy, canonical tenancy/security/contract/testing docs, the checkpoint ledger, and the CP5 PR artifact to match the shipped behavior.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
