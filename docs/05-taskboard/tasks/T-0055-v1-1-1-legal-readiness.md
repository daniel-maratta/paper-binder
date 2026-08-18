# T-0055: V1.1.1 Legal Readiness

## Status
done

## Type
risk

## Priority
P1

## Owner
agent

## Created
2026-08-15

## Updated
2026-08-17

## Checkpoint
CP7

## Phase
V1.1.1 legal readiness addendum

## Summary
Close the legal-surface gaps found during the legality audit before the `v1.1.1` candidate is treated as publishable.

## Context
- PaperBinder is a public demo and hiring artifact, but the current public app lacks Privacy Policy, Terms of Use, Cookie Notice, Legal index, and footer legal exposure.
- The internal retention docs describe tenant lease expiration and eventual cleanup, but public policy language must match the exact technical behavior and must not assume categorical deletion at any minute-based boundary.
- The repo has MIT licensing and a short notice, but third-party dependency notices, asset provenance, and security/dependency maintenance policy are not complete enough for a public legal surface.
- Owner statement: the flagship article and presentation images/SVGs were created by the project owner.
- Legal document implementation should reuse the unauthenticated site's existing theme and general markdown content pipeline, while keeping legal content in a dedicated collection separate from articles.
- Owner decisions are recorded in `docs/95-delivery/v1-1-1-legal-readiness-plan.md`; L1 should investigate engineering facts from repo and production configuration wherever possible before returning questions to the owner.

## Acceptance Criteria
- [x] `docs/95-delivery/v1-1-1-legal-readiness-plan.md` remains synchronized with this task.
- [x] Public Privacy Policy, Terms of Use, Cookie Notice, and Legal index pages are added and reachable.
- [x] Legal documents use markdown/MDX-style content with frontmatter in a dedicated legal collection separate from articles.
- [x] Legal documents are rendered through a shared `LegalDocumentPage`-style template using simple page chrome, not the flagship article presentation chrome.
- [x] Newly created legal surfaces use the existing unauthenticated site theme and style without new controls or a new styling system.
- [x] Public and tenant footers expose the legal surface.
- [x] Point-of-collection warnings tell users not to submit sensitive, regulated, confidential, proprietary, personal, medical, financial, credential, or important real business information.
- [x] A technical retention/data inventory verifies what expiration and purge mean for every data entity and operational surface, using the required surface table shape from the legal-readiness plan or a materially equivalent shape.
- [x] L1 distinguishes current production runtime providers from development/build/release tooling and avoids policy language that implies providers process visitor data without a proved data flow.
- [x] Privacy policy wording matches runtime behavior for tenant lease duration, lease extensions, access denial after actual expiry, eventual deletion, worker cleanup cadence, recent-activity deferral, operational logs, telemetry, cookies, Turnstile, and providers.
- [x] Cookie Notice remains informational disclosure only for the current strictly necessary cookie and cookie-less aggregate analytics posture; individual GoatCounter pageview collection for the `paperbinder` site was manually verified disabled on 2026-08-17; no consent-management platform or cookie banner is added unless the inventory identifies non-essential cookies, individual analytics tracking, advertising, or telemetry requiring consent.
- [x] Terms of Use state demo-only/no-production-service posture, no availability/recovery guarantees, temporary tenants, automatic deletion, prohibited use/content, ownership/licensing, as-is/no-warranty posture, liability limits, change terms, and owner-approved law/jurisdiction.
- [x] Third-party dependency notices and asset provenance are documented.
- [x] `SECURITY.md` or equivalent dependency/security maintenance policy is added.
- [x] Runtime logging is aligned with the stated no-PII-by-default posture or any exceptions are explicitly documented and owner-approved.
- [x] Final policy wording has a concrete public effective date and does not expose draft/audit-process wording.
- [x] Validation evidence is captured before marking the task done.

## Dependencies
- `docs/20-architecture/demo-tenant-lease.md`
- `docs/20-architecture/worker-jobs.md`
- `docs/70-operations/cleanup-jobs-runbook.md`
- `docs/70-operations/deployment.md`
- `docs/70-operations/observability.md`
- `docs/30-security/secrets-and-config.md`

## Blocked By
- None. Owner approval of the final legal wording is complete (`2026-08-17`), the `v1.1.1` candidate branch has merged to `main` (PR #54, commit `89ad4aa`, `2026-08-17`), the `v1.1.1` tag's `release.yml` run passed on `2026-08-18` (GHCR images published, draft GitHub Release created), and `v1.1.1` is deployed and smoke-verified on Test (`2026-08-18`); Prod deployment and production smoke validation remain explicit owner-controlled release actions before publication.

## Review Gates
- Scope Lock: Legal readiness for the current public demo only; no commercial SaaS expansion.
- Pre-PR Critique: Review policy wording against actual runtime behavior and confirm the terms do not overpromise deletion, availability, security, recovery, or compliance.
- Escalation Notes: Frontend Vite/Vitest and browser checks may require known elevated workflows for this repo.

## Current State
- L8 complete, with 2026-08-17 public-copy, logging, and GoatCounter usage analytics follow-ups. The legal audit findings have been converted into a committable v1.1.1 addendum plan, the technical retention inventory has been added at `docs/95-delivery/v1-1-1-legal-retention-inventory.md`, public legal policy routes render from a dedicated frontend legal content collection, public/tenant product surfaces now expose legal links and point-of-collection sensitive-data warnings, notice/licensing/provenance files now distinguish PaperBinder MIT licensing from third-party dependencies and owner-created public assets, the root `SECURITY.md` documents vulnerability reporting plus dependency/security maintenance posture, runtime logging no longer includes the identified tenant slug, email, or binder name fields from app log templates, public legal copy uses the August 17, 2026 effective date, repo-owned Compose files now bound container log retention, and GoatCounter usage analytics are constrained to direct `/count` requests with route-template pageviews and approved public events.

## Review Passes And Outcomes
- Legal surface audit on 2026-08-17 found publication blockers in the legal surface: placeholder effective dates, public draft/approval wording, missing children-under-13 language, ambiguous contact routing, ambiguous MIT-vs-owner-content rights, and unbounded Docker container logs.
- AI wording-shape pass on 2026-08-17 removed generated/audit-like public legal phrasing such as `Static review for this release`, draft/approval language, and policy instructions written as `should` statements. `scripts/validate-docs.ps1` now fails when those phrases appear in public legal Markdown.
- Public legal content remediation on 2026-08-17 set the effective date to `August 17, 2026`, added children-under-13 wording, changed the public contact path to `paperbinder@danielmaratta.com`, clarified content-rights boundaries, and tightened the `/legal` policy-list card spacing.
- Operational retention remediation on 2026-08-17 configured Docker Compose logging with the `local` driver, `max-size=10m`, and `max-file=5` across repo-owned compose shapes. Deployed containers must be recreated before the new logging driver applies.
- GoatCounter analytics follow-up on 2026-08-17 added the separate `paperbinder` GoatCounter site as a hosted aggregate usage analytics provider, constrained the SPA integration to PaperBinder-owned direct `/count` requests with sanitized route-template pageviews and approved public events, updated public legal copy, recorded `ADR-0016`, and recorded that individual pageview collection for the `paperbinder` site was manually verified disabled.
- Validation on 2026-08-17 passed for docs validation, focused root-host legal route tests, and Compose config rendering. Compose emitted a local Docker config read warning in the sandbox but still rendered the config successfully.

## Touch Points
- `docs/95-delivery/v1-1-1-legal-readiness-plan.md`
- `docs/95-delivery/v1-1-1-legal-retention-inventory.md`
- `docs/95-delivery/v1-1-1-implementation-plan.md`
- `docs/95-delivery/release-checklist.md`
- `docs/05-taskboard/v1-1-1-backlog.md`
- `docs/05-taskboard/work-queue.md`
- `docs/ai-index.md`
- `docs/repo-map.json`
- `NOTICE.md`
- `LICENSE`
- `SECURITY.md`
- `THIRD-PARTY-NOTICES.md`
- `src/PaperBinder.Web/src/app/`
- `src/PaperBinder.Web/src/content/`
- `src/PaperBinder.Infrastructure/`
- `src/PaperBinder.Api/`

## Implementation Plan
- L1: Inventory privacy and retention surfaces, including the defensible deletion boundary after lease expiry and worker cleanup; distinguish runtime providers from development/build/release tooling.
- L2: Add public legal policy pages using frontmatter-backed markdown/MDX-style legal documents, a dedicated legal collection, and a shared legal document template.
- L3: Expose legal notices in product surfaces using existing public/tenant shell patterns and no new controls or styling system.
- L4: Document notices, licensing, and owner-created asset provenance.
- L5: Add dependency/security maintenance policy.
- L6: Align runtime logging with legal disclosures.
- L7: Validate legal readiness and update release evidence.

## Next Action
- Owner (Daniel Maratta) approved the final legal wording for publication on `2026-08-17`.
- The `v1.1.1` candidate branch merged to `main` via PR #54 (commit `89ad4aa`) on `2026-08-17`.
- Remaining owner-controlled release follow-through: tag `v1.1.1`, deploy with recreated containers so the logging driver applies, and smoke test.

## Validation Evidence
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` passed on 2026-08-15 for the L1 documentation update.
- `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/root-host.test.tsx` passed on 2026-08-15 for the L2 legal-route implementation.
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release` passed on 2026-08-15 for the L2 legal-route implementation; it emitted the then-existing `NU1903` warning for `SSH.NET` in `tests/PaperBinder.IntegrationTests`, later superseded by the 2026-08-16 `SSH.NET` remediation below.
- `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/root-host.test.tsx` passed on 2026-08-15 for the L3 public legal footer and demo warning implementation.
- `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/tenant-shell.test.tsx` passed on 2026-08-15 for the L3 tenant legal footer and document-entry warning implementation.
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release` passed on 2026-08-15 for the L3 implementation; it emitted the then-existing `NU1903` warning for `SSH.NET` in `tests/PaperBinder.IntegrationTests`, later superseded by the 2026-08-16 `SSH.NET` remediation below.
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` passed on 2026-08-15 for the L3 documentation update.
- `npm.cmd run third-party-notices:check` passed on 2026-08-15 for the L4 generated dependency-notice inventory.
- `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/root-host.test.tsx` passed on 2026-08-15 for the L4 public footer copyright wording.
- `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/tenant-shell.test.tsx` passed on 2026-08-15 for the L4 tenant footer copyright wording.
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release` passed on 2026-08-15 for the L4 implementation; it emitted the then-existing `NU1903` warning for `SSH.NET` in `tests/PaperBinder.IntegrationTests`, later superseded by the 2026-08-16 `SSH.NET` remediation below.
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` passed on 2026-08-15 for the L4 documentation update.
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` passed on 2026-08-15 for the L5 `SECURITY.md` and documentation-index update.
- `npm.cmd run third-party-notices:check` passed on 2026-08-15 for the L5 dependency-notice maintenance check.
- `dotnet test tests/PaperBinder.UnitTests/PaperBinder.UnitTests.csproj -c Release --no-restore -p:SkipFrontendBuild=true --filter FullyQualifiedName~RuntimeLoggingPrivacyTests --logger "console;verbosity=detailed"` passed on 2026-08-16 for the L6 runtime logging privacy guard.
- `dotnet build PaperBinder.sln -c Release --no-restore -p:SkipFrontendBuild=true -v minimal` passed on 2026-08-16 for the L6 backend logging changes; it emitted the then-existing `NU1903` warning for `SSH.NET` in `tests/PaperBinder.IntegrationTests`, later superseded by the 2026-08-16 `SSH.NET` remediation below.
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` passed on 2026-08-16 for the L6 documentation update.
- `powershell -ExecutionPolicy Bypass -File .\scripts\restore.ps1` passed on 2026-08-16 after stale PaperBinder Vite processes were stopped; it emitted the then-existing `NU1903` warning for `SSH.NET` in `tests/PaperBinder.IntegrationTests`, later superseded by the 2026-08-16 `SSH.NET` remediation below.
- `npm.cmd audit --audit-level=moderate` initially found high-severity advisories in `nanoid`, `react-router`, and `react-router-dom`; `npm.cmd audit fix` remediated them with same-major/patch lockfile updates.
- `npm.cmd audit --audit-level=moderate` passed on 2026-08-16 after the L7 dependency remediation: zero vulnerabilities.
- `npm.cmd run third-party-notices:check` passed on 2026-08-16 after regenerating `THIRD-PARTY-NOTICES.md`.
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release` passed on 2026-08-16 after the L7 legal browser test and dependency remediation; it emitted the then-existing `NU1903` warning for `SSH.NET` in `tests/PaperBinder.IntegrationTests`, later superseded by the 2026-08-16 `SSH.NET` remediation below.
- Superseding security-maintenance evidence on 2026-08-16: the prior `NU1903` warning for transitive `SSH.NET` was remediated by adding a test-only `SSH.NET 2026.0.0` override to `tests/PaperBinder.IntegrationTests`; `dotnet list tests/PaperBinder.IntegrationTests/PaperBinder.IntegrationTests.csproj package --vulnerable --include-transitive` then reported no vulnerable packages.
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require` passed on 2026-08-16 after the L7 legal browser test and dependency remediation: frontend `70/70`, unit `143/143`, non-Docker integration `34/34`, Docker-backed integration `103/103`.
- `powershell -ExecutionPolicy Bypass -File .\scripts\run-browser-e2e.ps1` passed on 2026-08-16 after the L7 legal browser test and dependency remediation: root-host `5/5`, tenant-host `3/3`.
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` passed on 2026-08-16 for the L7 closeout update.
- `git diff --check` passed on 2026-08-15 for the L5 documentation-only change set.
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` passed on 2026-08-17 after the public legal copy, configured contact alias, and validation-guard updates.
- `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/root-host.test.tsx` passed on 2026-08-17 after the legal route copy/contact updates: `22/22`.
- `docker compose -f docker-compose.yml -f docker-compose.e2e.yml config --no-interpolate` rendered successfully on 2026-08-17 after adding the shared logging block. Docker emitted a local config-file access warning in the sandbox.
- `docker compose -f docker-compose.prod.yml config --no-interpolate` rendered successfully on 2026-08-17 after adding the shared logging block. Docker emitted a local config-file access warning in the sandbox.

## Decision Notes
- The article and presentation images/SVGs are owner-created and should be recorded as such in the public notice/provenance surface.
- Current cookie posture is informational disclosure without a consent-management platform or cookie banner because the current app uses strictly necessary auth/CSRF cookies and cookie-less aggregate usage analytics with GoatCounter individual pageview collection manually verified disabled; no marketing analytics or advertising cookies are used.
- DMCA registered-agent work is not automatically in scope; owner must decide whether to pursue formal safe-harbor coverage now.
- Owner has directed copyright-contact process only for T-0055; formal DMCA designated-agent registration is deferred.
- Public policy should not say demo data is deleted at any minute-based boundary unless L1 proves that exact boundary. Prefer wording that demo workspaces expire according to the lease period displayed in the application, with default initial duration described separately only if verified.
- License inventory should use a small repeatable repo-native generator/check if it remains simple and deterministic; do not build a broad license-compliance platform.

## Validation Plan
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- Frontend unit tests for legal routes and footer links.
- Focused browser test proving legal pages are reachable from the public root host.
- Focused backend tests if logging behavior changes.
- Static searches for legal-route exposure, private-path leakage, and accidental user-supplied logging fields.

## Outcome (Fill when done)
- Done on 2026-08-16, with 2026-08-17 review follow-ups recorded. T-0055 legal-readiness implementation is complete for `v1.1.1`: public legal pages, footer exposure, point-of-collection warnings, retention/provider inventory, generated third-party notices, owner-created asset provenance, security/dependency maintenance policy, runtime logging privacy alignment, browser reachability coverage, effective dated public policy copy, configured public contact alias, bounded Compose container logging, GoatCounter usage analytics disclosure, verified disabled GoatCounter individual pageview collection, and final validation evidence are in place. Final publication approval, merge, tag, deploy, container recreation, and smoke validation remain owner-controlled release actions.
