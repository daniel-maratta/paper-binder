# V1.1.1 Legal Readiness Plan

Status: L7 complete
Target release: `v1.1.1`
Authority: This file defines the legal-readiness addendum for the `v1.1.1` release candidate. The matching taskboard source is `docs/05-taskboard/tasks/T-0055-v1-1-1-legal-readiness.md`.

## Purpose

Close the public legal-surface gaps found during the legality audit before `v1.1.1` is treated as publishable.

This work does not turn PaperBinder into a production SaaS service. It makes the demo's public notices, terms, retention disclosures, license provenance, and maintenance policy match the actual constrained demo behavior.

## Scope

Included:

- Public Privacy Policy, Terms of Use, Cookie Notice, and Legal index surfaces. Cookie Notice is informational disclosure only for the current strictly necessary cookie posture; do not add a consent-management platform or cookie banner unless the L1 inventory identifies non-essential cookies or telemetry requiring consent.
- Legal document content must live in its own legal content collection, separate from articles and other content.
- Legal documents must use markdown/MDX-style content with frontmatter and be rendered through the same general content pipeline pattern as the flagship article.
- Legal document pages should be article-like in implementation, but not in presentation. Use a simpler legal page chrome and a shared `LegalDocumentPage` template rather than the flagship article page template.
- Newly created legal surfaces must follow the unauthenticated site's existing theme and style. Do not introduce new controls or a new styling system unless implementation proves a small local adjustment is unavoidable.
- Footer exposure from public and tenant shells.
- Point-of-collection warning that users must not submit sensitive, regulated, confidential, proprietary, personal, medical, financial, credential, or important real business information.
- Data collection and retention inventory covering tenant data, logs, telemetry, cookies, Turnstile, provider processing, and cleanup behavior.
- Technical audit of what tenant expiration and purge mean for each data entity and operational surface.
- Third-party/open-source license inventory and required notices.
- Asset provenance note confirming the article, presentation PNGs, presentation SVGs, and brand assets are owner-created unless a future audit identifies otherwise.
- Site copyright notice alignment.
- Security/dependency maintenance policy.
- Logging/privacy cleanup where runtime logging contradicts the stated no-PII-by-default posture.

Out of scope unless the owner explicitly changes release scope:

- Payments, subscriptions, customer contracting, or commercial SaaS legal terms.
- Account deletion/recovery workflows beyond the existing demo tenant lifecycle.
- A consent-management platform or cookie banner while the inventory confirms only strictly necessary cookies and no consent-triggering telemetry. If analytics, advertising, nonessential cookies, or consent-triggering telemetry are introduced or discovered later, consent handling becomes new work.
- A formal DMCA registered-agent workflow unless the owner decides the public demo should seek DMCA safe-harbor coverage.
- COPPA-directed product changes. The required v1.1.1 posture is "not intended for children under 13" plus no knowing collection from children.

## Checkpoints And Commits

| Slice | Commit intent | Scope | Acceptance target |
| --- | --- | --- | --- |
| L1 | `docs(legal): Inventory privacy and retention surfaces` | Add a legal data/retention inventory covering automatically collected data, voluntary user input, cookies, security logs, Turnstile, providers, telemetry, tenant purge, backups/snapshots, and operational logs. Establish retention behavior from repo evidence and production configuration wherever possible before asking the owner. | Inventory maps every data entity/surface to collection purpose, storage location, retention behavior, deletion behavior, and policy wording constraints. L1 must prove the deletion boundary from runtime behavior instead of assuming deletion at any minute-based boundary. Artifact: `docs/95-delivery/v1-1-1-legal-retention-inventory.md`. |
| L2 | `feat(legal): Add public legal policy pages` | Add `/legal`, `/privacy`, `/terms`, and `/cookies` or an equivalent route set, with accessible page chrome and route tests. Legal content must be markdown/MDX-style files with frontmatter in a dedicated legal collection, rendered by a shared `LegalDocumentPage`-style template using the existing unauthenticated theme. | Public pages state demo-only status, temporary tenants, no recovery guarantee, prohibited data/use, no sale of personal information, provider processing, analytics posture, contact path, as-is terms, liability limits, law/jurisdiction placeholders for owner approval, and change terms. |
| L3 | `feat(legal): Expose legal notices in product surfaces` | Add a Legal footer section to public and tenant shells; add concise point-of-collection warnings on demo creation and document/content-entry flows. Reuse existing links, public-shell layout primitives, and typography. | A reasonable visitor can find legal pages before starting a demo and while inside a tenant; sensitive-data warnings appear before user-provided content is submitted. No new controls or standalone styling system are introduced. |
| L4 | `docs(legal): Document notices licensing and asset provenance` | Add or update `THIRD-PARTY-NOTICES.md`, `NOTICE.md`, asset provenance notes, and copyright wording. | Repo distinguishes PaperBinder MIT licensing from third-party package licenses and owner-created site/article/presentation assets. |
| L5 | `docs(security): Add dependency maintenance policy` | Add `SECURITY.md` and dependency/security maintenance expectations. | Vulnerability reporting, supported versions, no bug-bounty/no SLA posture, dependency audit cadence, disclosure expectations, and safe harbor limits are explicit. |
| L6 | `fix(privacy): Align logs with legal disclosures` | Remove or reduce logging of user-supplied names/content identifiers where not needed; update tests if existing assertions depend on those fields. | Runtime logs do not include user-provided workspace names, binder names, document titles/content, emails, or credentials except where a deliberate documented exception is approved. |
| L7 | `chore(release): Validate legal readiness` | Run legal route tests, frontend tests, docs validation, focused backend tests if logging changed, and update release checklist/taskboard outcome. | `T-0055` is done, legal pages are reachable, docs validation passes, and release readiness records the legal addendum as complete. |

## Required Policy Content

## Frontend Implementation Constraints

- Store legal documents in a dedicated frontend legal content collection created during L2.
- Keep legal collection files separate from the existing frontend article content collection.
- Use markdown/MDX-style legal content with frontmatter for title, description, effective date, route slug, and document type.
- Render legal documents through the same general content pipeline pattern used by the flagship article, including shared markdown rendering where appropriate.
- Use a simpler `LegalDocumentPage` template or equivalent. Do not reuse the flagship article presentation chrome, article evidence block, article metadata rail, or article-specific calls to action.
- Keep page chrome consistent with the unauthenticated site: existing public shell, existing typography, existing link/button treatments, existing spacing rhythm, and existing responsive behavior.
- Do not add new controls or a new styling system for legal pages. If a small class is needed for layout polish, keep it local, minimal, and consistent with existing public-page styles.
- Keep `/legal` as an index into the legal collection rather than a marketing page.

## Legal Defaults And Owner Decisions

Use these owner decisions unless later owner direction changes them:

| Item | Decision |
| --- | --- |
| Data contact | Prefer a dedicated `privacy@danielmaratta.com` address for the Privacy Policy. A broader `legal@danielmaratta.com` may be used if one address is preferred across all legal pages. |
| Operator identity | Use `Daniel Maratta` unless PaperBinder is actually owned or operated by a separate legal entity. Do not attribute PaperBinder to an LLC for polish. |
| Governing law | Tennessee. |
| Venue | Tennessee state or federal courts appropriate to the owner's residence or operation; avoid aggressive or over-specific venue wording unless attorney-reviewed. |
| Effective date | Use the date the policies actually become publicly effective, likely the T-0055 deployment date rather than the planning date. |
| DMCA | Add a copyright-contact process only; defer formal designated-agent registration. |
| Cookie posture | Disclosure only; no consent banner unless L1 finds nonessential tracking/storage or consent-triggering telemetry. |
| License inventory | Prefer a small repeatable repo-native generator/check over a handcrafted dependency list if it remains simple and deterministic. |
| Final policy wording | Explicit owner approval gate before merge. |

Distinguish owner decisions from engineering facts. The owner decisions above should not be repeatedly re-litigated during implementation unless new facts create a conflict. Engineering facts must be investigated by L1 from repo and production evidence wherever possible:

- Maximum lease lifetime with extensions.
- Cleanup cadence.
- Recent-activity deferral.
- Actual cookies and browser storage.
- Live telemetry configuration.
- Logging behavior and log fields.
- Enabled snapshots/backups and retention.
- Current production runtime provider inventory.

The Privacy Policy must cover:

- What PaperBinder collects automatically.
- What users can voluntarily put into the demo.
- Cookies and browser-accessible CSRF token behavior.
- Server, security, rate-limit, and operational logs.
- Retention periods and practical deletion timing as proven by the L1 inventory.
- Tenant lease duration, lease extensions, immediate access denial after actual expiry, eventual purge, worker cadence, and recent-activity cleanup deferral. Do not claim categorical deletion at any minute-based boundary; user-facing wording must place the deletion boundary at a defensible interval at or beyond the actual expiry-plus-worker-cleanup behavior verified by L1. Public policy wording should say demo workspaces are temporary and expire according to the lease period displayed in the application; the default initial duration may be described separately if L1 verifies it.
- Infrastructure/providers that process information.
- Whether analytics are used. Current target wording: no marketing analytics; minimal operational telemetry may be emitted and optional OTLP export may be configured by the operator.
- No sale of personal information.
- Data contact path.
- A clear warning not to submit sensitive, regulated, confidential, proprietary, personal, medical, financial, credential, or important real business information.

The Terms of Use must cover:

- PaperBinder is a demonstration/hiring artifact, not a production SaaS service.
- No service availability, continuity, backup, restoration, or recovery promise.
- Demo tenants and contents are temporary and may be deleted automatically without notice.
- Prohibited uploads/content and prohibited unlawful or abusive use.
- No attempts to compromise, disrupt, exploit, scrape excessively, or circumvent security or tenant boundaries.
- Access may be restricted or terminated.
- Software/site/content ownership and open-source licensing boundaries.
- As-is/no warranties.
- Reasonable limitation of liability.
- Terms may change.
- Applicable law/jurisdiction fields requiring owner confirmation before publication.

The Cookie Notice must cover:

- Auth cookie.
- Browser-readable CSRF cookie.
- Turnstile challenge behavior and Cloudflare reference.
- No localStorage/sessionStorage use in the current frontend, based on current static review.
- Cookie Notice is informational disclosure only for the current strictly necessary cookie posture.
- Do not add a consent-management platform or cookie banner unless the inventory identifies non-essential cookies or telemetry requiring consent.

## Technical Audit Checklist

L1 evidence lives in `docs/95-delivery/v1-1-1-legal-retention-inventory.md`. Later legal-page implementation must use that artifact as the source for retention, cookie, telemetry, provider, and unresolved owner-verification facts.

L1 must produce a retention table with this shape or a materially equivalent shape:

| Surface | Data | Created by | Accessibility after expiry | Deletion trigger | Actual retention | Policy-visible? |
| --- | --- | --- | --- | --- | --- | --- |
| Tenant | TBD | TBD | TBD | TBD | TBD | Yes |
| Documents | TBD | TBD | TBD | TBD | TBD | Yes |
| Audit records | TBD | TBD | TBD | TBD | TBD | Probably |
| Auth/session data | TBD | TBD | TBD | TBD | TBD | Yes |
| API logs | TBD | TBD | N/A | TBD | TBD | Aggregate description |
| Worker logs | TBD | TBD | N/A | TBD | TBD | Aggregate description |
| Caddy logs | TBD | TBD | N/A | TBD | TBD | Aggregate description |
| PostgreSQL | TBD | TBD | TBD | TBD | TBD | Yes |
| DigitalOcean snapshots/backups | TBD | DigitalOcean or operator | N/A | TBD | TBD | If enabled |
| GitHub Actions/GHCR | TBD | GitHub | N/A | GitHub policy/config | TBD | Possibly |
| OTLP | TBD | Operator/provider | N/A | TBD | TBD | Only if active |

L1 must distinguish current production runtime providers from development/build/release tooling. Do not turn the Privacy Policy into a historical vendor inventory. Name or categorize providers only where they participate in the current production data path or materially process relevant operational data. Examples:

- GitHub Actions/GHCR may be relevant to build/deploy metadata, but should not imply GitHub processes visitor document contents unless the data flow proves that.
- Namecheap may be registrar/DNS infrastructure, but should not be described as a visitor-data processor unless the actual production data flow proves that.
- DigitalOcean/provider snapshots and backups should be policy-visible only if enabled or otherwise relevant to retained tenant/runtime data.

- [ ] Tenant row: created, extended when lease-extension rules allow, expires, and purged.
- [ ] User rows and password hashes: generated owner and tenant-created users, purged with tenant.
- [ ] User memberships/roles: purged with tenant.
- [ ] Binders and binder policies: purged with tenant.
- [ ] Documents: title/content/archive state/supersedes fields, purged with tenant.
- [ ] Tenant impersonation audit rows: purged with tenant.
- [ ] Tenant recent activity timestamp: purged with tenant row.
- [ ] Auth and CSRF cookies: issued/cleared behavior and browser visibility.
- [ ] Turnstile token verification: Cloudflare challenge script and Siteverify processing.
- [ ] API/app logs: fields, retention, provider/container persistence.
- [ ] Caddy/proxy logs: fields, retention, provider/container persistence.
- [ ] Worker logs: cleanup cadence, cleanup events, retained purge summaries, and the earliest defensible deletion boundary after expiry.
- [ ] OpenTelemetry traces/metrics: console/default, optional OTLP export, field policy.
- [ ] PostgreSQL volume: persistence and relationship to tenant purge.
- [ ] Data Protection key ring: operational state not tenant content.
- [ ] Server `.env`, deployment logs, GitHub Actions logs, GHCR metadata, DNS/TLS provider surfaces.
- [ ] Provider snapshots/backups, if enabled by operator.

## Asset And Licensing Notes

- Owner statement for this plan: the article and presentation images/SVGs were created by the project owner.
- L4 must record that statement in a durable public notice and make clear that future third-party or generated assets require source/license/provenance notes before publication.
- Package notices must cover both npm and NuGet dependencies. The license inventory should be generated or checked from current lock/project files rather than handwritten from memory when a simple deterministic repo-native approach is feasible.
- Do not create a miniature license-compliance platform. The notice generation/check should remain small, deterministic, reviewable, and maintenance-friendly.

## Validation Gates

Minimum closeout:

- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- Frontend unit tests for legal route rendering/footer links.
- Browser E2E or focused Playwright coverage proving public legal pages are reachable from the root host.
- Focused backend tests for any logging behavior changed in L6.
- Static search confirming no `privacy`, `terms`, `legal`, or `cookies` route gap remains.
- Static search confirming no newly introduced references to private local paths.

Full release closeout may reuse the final v1.1.1 validation bundle after L1-L7 complete.

## L7 Closeout

Completed on 2026-08-16.

- Public legal pages are reachable at `/legal`, `/privacy`, `/terms`, and `/cookies`.
- Public and tenant footer exposure is covered by frontend tests, and public root-host legal reachability is covered by browser E2E.
- Runtime logging privacy is covered by a backend source-level guard.
- Third-party notices are generated from the current dependency graph and validated by the repo-native check.
- Final policy public effectiveness remains owner-controlled: legal document frontmatter still uses `effectiveDate: To be set on deployment`, and the legal index/notice docs retain the explicit owner-approval gate before public release.
- Provider snapshot/backup retention and any live external OTLP export remain owner/provider facts. The current public wording stays general and does not claim an exact provider retention period or any fixed-minute deletion boundary.

## Owner Approval Required

- Final Privacy Policy and Terms wording.
- Data contact email or URL.
- Governing law and venue.
- Whether to add a formal DMCA registered-agent workflow now or defer it.
- Whether optional OTLP export is enabled in the live production environment.
- Whether provider snapshots/backups are enabled and their retention period.
- Any public retention promise that names a specific deletion interval.
