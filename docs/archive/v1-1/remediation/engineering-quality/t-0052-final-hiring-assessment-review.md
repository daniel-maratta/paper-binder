# T-0052 Final Hiring Assessment Review

## Status

Complete on 2026-07-28.

## Scope

Review the `v1.1.1` patch candidate after final validation, then remediate patch-safe findings before release readiness is recorded.

## Hotspot Files Opened

- `scripts/validate-docs.ps1`
- `docker-compose.yml`
- `docker-compose.test.yml`
- `src/PaperBinder.Application/Binders/*`
- `src/PaperBinder.Application/Documents/*`
- `src/PaperBinder.Web/src/app/root-host.tsx`
- `src/PaperBinder.Web/src/app/root-host.test.tsx`
- `src/PaperBinder.Web/src/app/tenant-shell.test.tsx`
- `src/PaperBinder.Web/package.json`
- `src/PaperBinder.Web/package-lock.json`

## Findings

### F1 - Stale Version Display Test

Severity: Low.

The `v1.1.1` metadata bump caused the mobile tenant-shell footer test to keep asserting `v1.1.0`.

Disposition: fixed. The test now asserts `v${packageJson.version}` so future release metadata bumps do not require a stale literal update.

### F2 - Patchable Frontend Audit Advisories

Severity: Medium.

Fresh `npm audit --audit-level=moderate` initially reported 7 advisories. `npm audit fix` could remediate the build-tooling and same-major router package updates inside existing package ranges.

Disposition: fixed where patch-safe. The lockfile now updates build tooling and React Router 7 packages without changing `package.json` dependency ranges. Validation was rerun after a clean `npm ci`.

### F3 - Remaining React Router RSC-Mode Advisory

Severity: Low for this app.

Fresh `npm audit --audit-level=moderate` now reports 2 high advisories through `react-router` / `react-router-dom`, specifically the React Router RSC-mode CSRF advisory. PaperBinder is a client-rendered SPA and does not use React Router RSC mode, framework actions, SSR, or document request action handling.

Disposition: explicitly rejected as not applicable to the shipped runtime mode. The existing router-major/version follow-up remains outside `v1.1.1`; no tenant isolation, CSRF, redirect, or production request handling behavior depends on the affected React Router mode.

### F4 - Release Identity Drift

Severity: Low.

After the version metadata cut, current release-facing docs still described only `v1.1.0`.

Disposition: fixed in the release-readiness update. Docs now distinguish the published `v1.1.0` release from the `v1.1.1` release-ready/taggable candidate.

## No Findings

- No Critical or High application security findings were found.
- No tenant-isolation, authorization, CSRF, or API-contract behavior changed in `v1.1.1`.
- The hosted article route is anonymous static root-host content and does not call APIs or establish tenant context.
- Application contract splits preserved public type names, namespaces, and behavior.

## Validation Evidence

- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-version.ps1` passed for `1.1.1`.
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release` passed after dependency remediation: Vite `7.3.6`, 0 warnings, 0 errors.
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require` passed after dependency remediation: 65/65 frontend, 142/142 unit, 33/33 non-Docker integration, 102/102 Docker-backed integration.
- `powershell -ExecutionPolicy Bypass -File .\scripts\run-browser-e2e.ps1` passed after dependency remediation: root-host 3/3, tenant-host 3/3.
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` passed after release-doc updates.
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1` passed.
- `powershell -ExecutionPolicy Bypass -File .\scripts\reviewer-full-stack.ps1 -NoBrowser` passed after dependency remediation and release-doc updates.
- `dotnet list PaperBinder.sln package --vulnerable --include-transitive` passed: no vulnerable NuGet packages.
- `npm.cmd audit --audit-level=moderate` reports 2 high React Router RSC-mode advisories; disposition recorded above.
