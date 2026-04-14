# T-0021: Build And Restore Diagnostics Hardening

## Status
done

## Type
debt

## Priority
P1

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
Eliminate the opaque script-level build and restore failure paths by surfacing frontend tool output directly, skipping redundant MSBuild frontend work in the canonical build path, classifying restricted-environment dotnet restore failures explicitly, and hardening the frontend restore step against transient Windows file locks.

## Context
- The prior `scripts/build.ps1` path delegated the frontend build to `PaperBinder.Api.csproj`, which could collapse Vite/esbuild failures into `Build FAILED` with `0 Error(s)`.
- The prior restore path could fail after `Determining projects to restore...` without enough detail to distinguish a broken project graph from a restricted/offline environment.
- The canonical restore path also remained vulnerable to transient Windows `npm ci` file-lock failures under `node_modules`, which are operationally different from a repo restore defect.
- This follow-up is repo-tooling hardening, not product-scope work.

## Acceptance Criteria
- [x] The canonical build script surfaces frontend build failures with tool-native output before the solution build runs.
- [x] The solution build skips redundant frontend work after the explicit frontend build step.
- [x] Restore/build script failures rerun once with richer dotnet verbosity when the first failure body is opaque.
- [x] Still-opaque restore failures are classified with environment guidance instead of being left as an unexplained graph failure.
- [x] The frontend restore step retries at least one transient Windows file-lock failure and otherwise emits concrete guidance.
- [x] Direct API-project frontend MSBuild targets emit explicit rerun guidance instead of relying on a bare nonzero `Exec` exit.
- [x] Taskboard, checkpoint ledger, and operations docs are synchronized with the tooling change.

## Dependencies
- [T-0016](./T-0016-repo-validation-tooling-hardening.md)
- [T-0020](./T-0020-cp7-pre-auth-abuse-controls-and-provisioning-surface.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Locked to repo tooling, diagnostics clarity, and the related durable docs/taskboard updates. No product-scope expansion.
- Pre-PR Critique: Keep the fix on the canonical script and MSBuild failure surfaces only. Do not reopen unrelated checkpoint workflow or product docs.
- Escalation Notes: One unrestricted validation pass was required to prove the .NET restore graph itself was healthy and to separate sandbox/package-access failures from repo defects.

## Current State
- Completed. The canonical build path no longer hides frontend failures behind an opaque MSBuild exit, and the restore path now distinguishes restricted-environment .NET failures from real repo defects while also handling the common Windows `npm ci` lock case more explicitly.

## Touch Points
- `scripts/common.ps1`
- `scripts/restore.ps1`
- `scripts/build.ps1`
- `src/PaperBinder.Api/PaperBinder.Api.csproj`
- `README.md`
- `docs/70-operations/runbook-local.md`
- `docs/55-execution/checkpoint-status.md`
- `docs/05-taskboard/work-queue.md`

## Next Action
- Use the hardened script path for future checkpoint validation. Treat a still-opaque `dotnet restore` as an environment-access issue first, and only investigate the project graph further if the same command fails outside restricted execution.

## Validation Evidence
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release` (passed: frontend Vite build completed first, then `dotnet build PaperBinder.sln -c Release --no-restore -p:SkipFrontendBuild=true` succeeded)
- `powershell -ExecutionPolicy Bypass -File .\scripts\restore.ps1` inside the sandbox (still failed after `Determining projects to restore...`; the wrapper now reruns the command with richer verbosity and classifies that specific no-body path as likely restricted/offline-environment access rather than a broken project graph)
- `powershell -ExecutionPolicy Bypass -File .\scripts\restore.ps1` outside the sandbox (confirmed the .NET restore graph is healthy: all restore projects completed; the remaining failure moved to `npm ci`, which surfaced an explicit Windows `EPERM`/`unlink` lock under `src/PaperBinder.Web\node_modules` on a native Lightning CSS module)
- `dotnet build src/PaperBinder.Api/PaperBinder.Api.csproj -c Release --no-restore -p:SkipFrontendBuild=true -v minimal` outside the sandbox (passed: no remaining opaque direct API-project build failure)
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` (passed)
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1` (passed)

## Decision Notes
- Keep frontend build orchestration in `PaperBinder.Api.csproj` for IDE/direct-project parity, but make the canonical script path run `npm run build` explicitly before the solution build.
- Pass `SkipFrontendBuild=true` during the solution build once the explicit frontend build has already succeeded.
- Treat a one-line or bodyless dotnet failure as opaque and rerun once with richer verbosity before throwing.
- Treat a still-opaque `dotnet restore` after the diagnostic rerun as an environment-access problem first, because the same PaperBinder restore commands succeed once package-source access is available.
- Retry one transient Windows `npm ci` file-lock failure before surfacing guidance, since the common failure mode is a held native module rather than an invalid frontend workspace.

## Validation Plan
- Run the canonical build script and confirm it either succeeds or fails with direct frontend tool output.
- Run the restore script in both restricted and unrestricted environments and confirm the resulting error points at environment access or frontend file locking instead of an unexplained graph failure.
- Re-run docs validation after updating the taskboard and operations docs.
- Re-run launch-profile validation to confirm no command-surface drift.

## Outcome (Fill when done)
- Added a dotnet-command wrapper that detects opaque restore/build failures and reruns once with richer verbosity before throwing.
- Moved the canonical frontend build step into `scripts/build.ps1`, then used `SkipFrontendBuild=true` for the solution build so frontend tool failures stay visible and the overall Release build succeeds in the current sandbox.
- Hardened the API project's frontend `Exec` targets to preserve console output and emit explicit rerun guidance for direct MSBuild users.
- Confirmed the previously opaque .NET restore path is healthy outside restricted execution, then updated the wrapper and taskboard/docs so future restricted-environment failures are identified as environment-access issues instead of a mysterious PaperBinder graph defect.
- Added an `npm ci` retry/guidance path for transient Windows file locks under the frontend `node_modules` tree.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
