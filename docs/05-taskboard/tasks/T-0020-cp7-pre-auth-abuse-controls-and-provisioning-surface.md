# T-0020: CP7 Pre-Auth Abuse Controls And Provisioning Surface

## Status
done

## Type
feature

## Priority
P0

## Owner
agent

## Created
2026-04-04

## Updated
2026-04-04

## Checkpoint
CP7

## Phase
Phase 2

## Summary
Implement the CP7 pre-auth guard layer and provisioning surface: root-host challenge verification with a test-only bypass, shared pre-auth rate limiting for login and provision, and transactional owner-only tenant provisioning that establishes the authenticated session.

## Context
- CP6 left root-host challenge verification, pre-auth rate limiting, and provisioning intentionally deferred.
- CP7 must keep tenant isolation intact while exposing the first public onboarding surface.
- Provisioning stays owner-only in CP7; binder/document seed data remains deferred until later domain checkpoints exist.

## Acceptance Criteria
- [x] `IChallengeVerificationService` is wired through `AddHttpClient` with server-side Turnstile verification and a fixed `PB_ENV=Test` bypass token
- [x] Root-host `POST /api/auth/login` and `POST /api/provision` share one per-IP pre-auth rate-limit budget with stable `429` ProblemDetails behavior
- [x] `POST /api/provision` creates the tenant, owner user, membership, and lease state transactionally, then establishes the authenticated cookie/CSRF session
- [x] Provisioning remains owner-only in CP7 and does not seed binder or document demo data
- [x] Unit and Docker-backed integration coverage prove challenge-required, bypass-success, rate-limit, happy-path provisioning, and duplicate-name rollback behavior
- [x] Canonical docs, taskboard, checkpoint ledger, and CP7 delivery artifact are synchronized in the same change set
- [x] Validation evidence is captured for build, tests, and docs validation

## Dependencies
- [T-0019](./T-0019-cp6-identity-cookie-auth-and-tenant-membership-validation.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Locked to CP7 abuse controls, provisioning, tests, and synchronized docs only. No CP8-CP10 feature pull-forward.
- Pre-PR Critique: Addressed before implementation start. Key constraints locked in: `PB_ENV` stays process-env-only, provisioning stays owner-only, tenant/user/membership insert order stays `tenant -> user -> membership`, and Turnstile verification uses `AddHttpClient`.
- Escalation Notes: Release build and the full Release test suite used the canonical repo scripts and required Docker-backed integration execution for merge-gate coverage.

## Current State
- Completed, launch-profile-validated, runtime-verified, and manually launch-verified on the current branch. The checkpoint remains active at the ledger level pending PR/merge.

## Touch Points
- `src/PaperBinder.Api`
- `src/PaperBinder.Application`
- `src/PaperBinder.Infrastructure`
- `tests/PaperBinder.UnitTests`
- `tests/PaperBinder.IntegrationTests`
- `docs/15-feature-definition`
- `docs/20-architecture`
- `docs/30-security`
- `docs/40-contracts`
- `docs/55-execution`
- `docs/70-operations`
- `docs/95-delivery/pr`

## Next Action
- Use the CP7 delivery artifact for reviewer handoff and keep the checkpoint active until the PR merges.

## Validation Evidence
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release` (passed)
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require` (passed: 50/50 unit tests, 25/25 non-Docker integration tests, 24/24 Docker-backed integration tests)
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` (passed)
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1` (passed)
- `powershell -ExecutionPolicy Bypass -File .\scripts\reviewer-full-stack.ps1 -NoBrowser` (passed)
- Headless command-equivalent launch verification passed for `API Only`, `UI Only`, `Worker Only`, and `App + Worker (Process)` using the refreshed Release outputs
- Headless `Launch Frontend Dev Server` verification passed outside the sandbox because Vite/esbuild child-process startup hit sandbox `spawn EPERM`
- Manual VS Code launch verification passed for `Reviewer Full Stack`, `App + Worker (Process)`, `API Only`, `UI Only`, `Worker Only`, and `Launch Frontend Dev Server`
- Manual Visual Studio launch verification passed for `Reviewer Full Stack`, `App + Worker (Process)`, `API Only`, `UI Only`, and `Worker Only`

## Decision Notes
- `PB_ENV` is read directly from process environment at the challenge boundary and is not part of typed runtime settings.
- Login and provision intentionally share one pre-auth rate-limit budget in v1.
- Tenant slug normalization caps at 63 characters even though the current database column allows 80.

## Validation Plan
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`

## Outcome (Fill when done)
- Added server-side challenge verification with a fixed test-only bypass token, structured logging for challenge/throttle/provisioning failures, and shared root-host pre-auth rate limiting for login and provision.
- Added transactional owner-only provisioning that creates the tenant, owner user, membership, lease state, and authenticated session without seeding later-checkpoint binder/document data.
- Added unit and Docker-backed integration coverage for challenge, throttling, wrong-host denial, provisioning success, and duplicate-name rollback behavior.
- Hardened local launch/runtime composition by filling missing `.env` keys from `.env.example` and by scoping tenant provisioning registration to the API host so worker-only launches stay valid.
- Synchronized architecture, security, contract, operations, taskboard, and delivery docs with the shipped CP7 backend boundary.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
