# Agent Execution Hygiene

## AI Summary

- Prefer repo-native PowerShell scripts in `scripts/` over ad hoc shell composition.
- Do not compose PaperBinder workflows with `&&`, `||`, or `;`; use one command per call or a checked-in script.
- For known elevated workflows, request escalation immediately instead of probing the sandbox first.

## Purpose

This document reduces repeated agent failures caused by sandbox restrictions, brittle PowerShell command composition, and one-off inline command strings.

Use it when an agent is about to run local validation, build/test commands, or git write operations.

## Canonical Command Surface

Prefer these wrappers before writing a custom command:

- Full build: `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- Full test pass: `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release`
- Focused frontend tests: `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/api/client.test.ts`
- Focused integration tests: `powershell -ExecutionPolicy Bypass -File .\scripts\test-integration.ps1 -Category NonDocker -Filter FullyQualifiedName~TenantResolutionIntegrationTests`
- Docker-backed focused integration tests: `powershell -ExecutionPolicy Bypass -File .\scripts\test-integration.ps1 -Category Docker -Filter FullyQualifiedName~AuthorizationPoliciesAndTenantUserAdministrationIntegrationTests`
- Docs validation: `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- Launch-profile validation: `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`

If an existing script covers the workflow, use it instead of raw `npm`, `dotnet`, or compound PowerShell.

## PowerShell Composition Rules

- Use one command per tool call unless a checked-in script already bundles the workflow.
- Do not use `&&`, `||`, or `;` to chain PaperBinder workflow commands.
- Do not rely on ad hoc multi-line PowerShell when a repo-native script can express the workflow once for everyone.
- For parallel read-only inspection, use parallel tool calls rather than shell separators.
- If a repeated workflow still needs custom composition, promote it into `scripts/` instead of retyping it across sessions.

## Known Elevated Workflows

These workflows should be treated as escalation-first in this repo:

- `git add ...`
- `git commit -m ...`
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 ...`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 ...`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 ...`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test-integration.ps1 -Category Docker ...`

Rationale:

- Git write operations commonly need access the sandbox does not grant cleanly.
- Frontend Vite/Vitest runs often cross into native module or cache locations the sandbox rejects.
- Docker-backed integration tests depend on the Docker daemon and named-pipe access outside the workspace.

## Recommended Managed Approval Prefixes

The approval system is external to the repo, but these are the high-value prefixes to pre-approve for PaperBinder:

- `["git", "add"]`
- `["git", "commit", "-m"]`
- `["C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe", "-Command", "powershell -ExecutionPolicy Bypass -File .\\scripts\\build.ps1 -Configuration Release"]`
- `["C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe", "-Command", "powershell -ExecutionPolicy Bypass -File .\\scripts\\test.ps1 -Configuration Release"]`
- `["C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe", "-Command", "powershell -ExecutionPolicy Bypass -File .\\scripts\\test-frontend.ps1"]`
- `["C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe", "-Command", "powershell -ExecutionPolicy Bypass -File .\\scripts\\test-integration.ps1"]`

If the execution environment cannot persist approvals, agents should still treat the same workflows as escalation-first.

## Workflow Integration

Before running commands:

1. Pick the repo-native script or single command that matches the workflow.
2. Decide whether the workflow is known-elevated in PaperBinder.
3. If it is known-elevated, request escalation immediately instead of doing a probe run.
4. If no stable wrapper exists and the command needs shell composition, add or extend a script first when the workflow is likely to recur.

When command friction repeats:

- update `scripts/`
- update this document
- update the relevant workflow doc under `docs/55-execution/workflows/`

That keeps the remediation durable instead of session-local.
