# T-0048: V1.1.1 Compose Configuration Noise Cleanup

## Status
done

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
- [x] Local and test Compose files no longer warn about unset optional lease-extension variables in Compose versions that emit optional-variable warnings.
- [x] Defaults match `.env.example` and documented canonical values.
- [x] Required secrets/configuration remain explicit and are not silently defaulted.
- [x] Focused Compose/config validation passes.

## Dependencies
- [T-0046](./T-0046-v1-1-1-patch-planning-and-taskboard-alignment.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Compose noise cleanup only.
- Pre-PR Critique: Confirm no required value is converted into an unsafe implicit default.
- Escalation Notes: Docker-backed validation may require approval.

## Current State
- Done. Local/test Compose lease-extension defaults now match `.env.example`; shared-test deploy also has the explicit extension-window default that the task context expected.

## Touch Points
- `docker-compose.yml`
- `docker-compose.test.yml`
- `docker-compose.test-deploy.yml`
- `.env.example`
- configuration docs only if drift is found

## Implementation Plan
- Compare local/test Compose lease-extension values with production/test-deploy defaults.
- Add explicit defaults only for the optional lease-extension variables.
- Run focused Compose config rendering and docs validation.

## Next Action
- None for this task. Continue with `T-0049`.

## Validation Evidence
- `docker compose --env-file .env.example -f docker-compose.yml config --quiet` - passed on 2026-07-28; Docker config-file access warning was environmental and non-fatal.
- `docker compose --env-file .env.example -f docker-compose.test.yml config --quiet` - passed on 2026-07-28; expected unset Namecheap warnings remained, and no lease-extension variable warning appeared.
- `$env:PAPERBINDER_IMAGE_REGISTRY='example.local/paperbinder'; $env:PAPERBINDER_IMAGE_TAG='v1.1.1-test'; docker compose --env-file .env.example -f docker-compose.test-deploy.yml config --quiet` - passed on 2026-07-28; expected unset Namecheap warnings remained.
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` - passed on 2026-07-28.

## Decision Notes
- The intended values are `PAPERBINDER_LEASE_EXTENSION_WINDOW_MINUTES=10` and `PAPERBINDER_LEASE_EXTENSION_MINUTES=15`.
- `docker-compose.test-deploy.yml` was included because inspection showed it did not explicitly pass `PAPERBINDER_LEASE_EXTENSION_WINDOW_MINUTES`; adding the `10` default is behavior-preserving because the runtime default is already `10`.

## Validation Plan
- Render/validate affected Compose files.
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`

## Outcome (Fill when done)
- Done on 2026-07-28. Added explicit `10`/`15` defaults for lease-extension window/minutes in local and source-build test Compose files, and restored the explicit `10` extension-window default in shared-test deploy Compose. Required secrets and deploy-only DNS variables remain unset unless provided by the environment.
