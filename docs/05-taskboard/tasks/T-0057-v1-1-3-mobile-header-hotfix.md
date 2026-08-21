# T-0057: V1.1.3 Mobile Header Hotfix

Status: done

## Summary

Ship a narrow `v1.1.3` patch after the canonical `v1.1.2` publication so the unauthenticated
mobile header keeps the logo, Start Demo CTA, and public-navigation menu on one line.

## Scope

- Keep the mobile public menu on the right.
- Keep Start Demo centered in the mobile public header.
- Make the menu icon-only at the smallest breakpoint while preserving `aria-label="Public navigation"`.
- Stage `1.1.3` release metadata because `v1.1.2` was already published as canonical.

## Out Of Scope

- Tenant-host navigation changes.
- Authentication, authorization, tenancy, API, database, or deployment-contract changes.
- Rewriting or moving the published `v1.1.2` tag.

## Acceptance Criteria

- [x] Smallest-breakpoint menu text is visually hidden while the accessible button name remains
  `Public navigation`.
- [x] Browser geometry coverage verifies the mobile public-header one-line order and alignment.
- [x] Version metadata is staged for `1.1.3`.
- [x] Release validation evidence is recorded in `docs/95-delivery/release-checklist.md`.

## Validation

- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-version.ps1` - passed for `1.1.3`.
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require` - passed: frontend `95/95`, unit `143/143`, non-Docker integration `34/34`, Docker-backed integration `103/103`.
- `powershell -ExecutionPolicy Bypass -File .\scripts\run-browser-e2e.ps1` - passed: root-host `6/6`, tenant-host `3/3`.
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` - passed.
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1` - passed.
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release` - passed with `0 Warning(s), 0 Error(s)`.
- `git diff --check` - passed.

## Outcome

- Done on 2026-08-21. The `v1.1.3` hotfix candidate keeps the unauthenticated mobile header on one
  line, makes the smallest-breakpoint menu icon-only while preserving its accessible label, stages
  `1.1.3` version metadata, and records validation evidence. Merge, tag, Test deployment, smoke
  validation, and GitHub Release publication remain owner-controlled release actions.
