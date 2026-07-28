# T-0048: V1.1.1 Compose Configuration Noise Cleanup

## Status
queued

## Type
debt

## Priority
P2

## Owner
agent

## Created
2026-07-28

## Updated
2026-07-28

## Checkpoint
CP2

## Phase
V1.1.1 patch

## Summary
Quiet optional Docker Compose lease-extension variable warnings by aligning local/test Compose defaults with the documented canonical values.

## Context
- `docker-compose.yml` and `docker-compose.test.yml` reference lease-extension environment variables without compose-level defaults.
- Production and test-deploy Compose files already default those values to the canonical `10` and `15`.
- The cleanup must reduce operational noise without hiding genuinely required configuration.

## Acceptance Criteria
- [ ] Local and test Compose files no longer warn about unset optional lease-extension variables in Compose versions that emit optional-variable warnings.
- [ ] Defaults match `.env.example` and documented canonical values.
- [ ] Required secrets/configuration remain explicit and are not silently defaulted.
- [ ] Focused Compose/config validation passes.

## Dependencies
- [T-0046](./T-0046-v1-1-1-patch-planning-and-taskboard-alignment.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Compose noise cleanup only.
- Pre-PR Critique: Confirm no required value is converted into an unsafe implicit default.
- Escalation Notes: Docker-backed validation may require approval.

## Current State
- Queued.

## Touch Points
- `docker-compose.yml`
- `docker-compose.test.yml`
- `.env.example`
- configuration docs only if drift is found

## Implementation Plan
- Compare local/test Compose lease-extension values with production/test-deploy defaults.
- Add explicit defaults only for the optional lease-extension variables.
- Run focused Compose config rendering and docs validation.

## Next Action
- Pull with `T-0047` in CP2.

## Validation Evidence
- Pending.

## Decision Notes
- The intended values are `PAPERBINDER_LEASE_EXTENSION_WINDOW_MINUTES=10` and `PAPERBINDER_LEASE_EXTENSION_MINUTES=15`.

## Validation Plan
- Render/validate affected Compose files.
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`

## Outcome (Fill when done)
- Pending.

