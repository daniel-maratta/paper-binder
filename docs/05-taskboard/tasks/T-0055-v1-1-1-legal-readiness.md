# T-0055: V1.1.1 Legal Readiness

## Status
queued

## Type
risk

## Priority
P1

## Owner
agent

## Created
2026-08-15

## Updated
2026-08-15

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
- [ ] `docs/95-delivery/v1-1-1-legal-readiness-plan.md` remains synchronized with this task.
- [ ] Public Privacy Policy, Terms of Use, Cookie Notice, and Legal index pages are added and reachable.
- [ ] Legal documents use markdown/MDX-style content with frontmatter in a dedicated legal collection separate from articles.
- [ ] Legal documents are rendered through a shared `LegalDocumentPage`-style template using simple page chrome, not the flagship article presentation chrome.
- [ ] Newly created legal surfaces use the existing unauthenticated site theme and style without new controls or a new styling system.
- [ ] Public and tenant footers expose the legal surface.
- [ ] Point-of-collection warnings tell users not to submit sensitive, regulated, confidential, proprietary, personal, medical, financial, credential, or important real business information.
- [ ] A technical retention/data inventory verifies what expiration and purge mean for every data entity and operational surface, using the required surface table shape from the legal-readiness plan or a materially equivalent shape.
- [ ] L1 distinguishes current production runtime providers from development/build/release tooling and avoids policy language that implies providers process visitor data without a proved data flow.
- [ ] Privacy policy wording matches runtime behavior for tenant lease duration, lease extensions, access denial after actual expiry, eventual deletion, worker cleanup cadence, recent-activity deferral, operational logs, telemetry, cookies, Turnstile, and providers.
- [ ] Cookie Notice remains informational disclosure only for the current strictly necessary cookie posture; no consent-management platform or cookie banner is added unless the inventory identifies non-essential cookies or telemetry requiring consent.
- [ ] Terms of Use state demo-only/no-production-service posture, no availability/recovery guarantees, temporary tenants, automatic deletion, prohibited use/content, ownership/licensing, as-is/no-warranty posture, liability limits, change terms, and owner-approved law/jurisdiction.
- [ ] Third-party dependency notices and asset provenance are documented.
- [ ] `SECURITY.md` or equivalent dependency/security maintenance policy is added.
- [ ] Runtime logging is aligned with the stated no-PII-by-default posture or any exceptions are explicitly documented and owner-approved.
- [ ] Final policy wording has explicit owner approval before merge.
- [ ] Validation evidence is captured before marking the task done.

## Dependencies
- `docs/20-architecture/demo-tenant-lease.md`
- `docs/20-architecture/worker-jobs.md`
- `docs/70-operations/cleanup-jobs-runbook.md`
- `docs/70-operations/deployment.md`
- `docs/70-operations/observability.md`
- `docs/30-security/secrets-and-config.md`

## Blocked By
- Owner approval is required for final policy wording. Owner decisions for data contact, operator identity, governing law/venue, DMCA disposition, cookie posture, license-inventory posture, and final approval are recorded in the legal-readiness plan. Engineering facts such as live OTLP posture and provider snapshot/backup retention should be investigated from repo/production evidence first.

## Review Gates
- Scope Lock: Legal readiness for the current public demo only; no commercial SaaS expansion.
- Pre-PR Critique: Review policy wording against actual runtime behavior and confirm the terms do not overpromise deletion, availability, security, recovery, or compliance.
- Escalation Notes: Frontend Vite/Vitest and browser checks may require known elevated workflows for this repo.

## Current State
- Queued. The legal audit findings have been converted into a committable v1.1.1 addendum plan.

## Touch Points
- `docs/95-delivery/v1-1-1-legal-readiness-plan.md`
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
- Start L1 by creating the technical data/retention inventory and confirming provider/log/snapshot retention assumptions that need owner answers.

## Validation Evidence
- Pending.

## Decision Notes
- The article and presentation images/SVGs are owner-created and should be recorded as such in the public notice/provenance surface.
- Current target cookie posture is informational disclosure without a consent-management platform or cookie banner because the current app appears to use strictly necessary auth/CSRF cookies and no marketing analytics; L1 must confirm this before final wording.
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
- Pending.
