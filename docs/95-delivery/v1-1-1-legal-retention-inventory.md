# V1.1.1 Legal Retention Inventory

Status: Draft L6 evidence update
Task: `T-0055`
Date: 2026-08-15

## Purpose

This inventory records what PaperBinder collects, where it lives, and what "expire" and "purge" mean for the current public demo. It is an engineering evidence artifact for the v1.1.1 Privacy Policy, Terms of Use, Cookie Notice, and Legal index work.

This is not final policy wording. Public legal docs must still receive owner approval before merge.

## Evidence Scope

Evidence reviewed:

- Runtime configuration and production compose files: `PaperBinderRuntimeSettings.cs`, `docker-compose.prod.yml`, `deploy/prod/Caddyfile`.
- Tenant provisioning, lease, expiry, and cleanup services.
- Database schema model and tenant-owned Dapper delete paths.
- Auth, CSRF, Turnstile, rate-limit, and telemetry wiring.
- Frontend static searches for browser storage and cookie reads.
- Operations docs for deployment, observability, cleanup jobs, snapshots/backups, Caddy, PostgreSQL, GitHub Actions/GHCR, Namecheap, Tailscale, and DigitalOcean/equivalent VM topology.
- Non-secret production checks on 2026-08-15 for lease/cookie/audit/OTLP environment keys and Docker container log configuration. Secret values were not queried.

Evidence limits:

- Provider-level snapshot/backup enablement and retention could not be proven from repository files alone.
- External provider log retention for Cloudflare, GitHub, Namecheap, Tailscale, and the VM provider must be confirmed from the owner/provider consoles if policy wording needs exact periods.
- This inventory avoids any public deletion promise tied to a specific minute count. The defensible public boundary is expiry according to the lease shown in the app, followed by eventual cleanup after the worker finds the tenant eligible for purge.

## Core Findings

- PaperBinder does not currently have public Privacy Policy, Terms of Use, Cookie Notice, or Legal index pages.
- Demo tenants are created with an expiry timestamp. Authenticated tenant-host access is denied once the actual expiry timestamp has passed.
- Deletion is not the same event as expiry. The worker selects expired tenants, then purges only if cleanup rules allow it. Recent authenticated activity can defer purge eligibility.
- The purge deletes tenant-owned database rows for tenants, users, memberships, binders, binder policies, documents, and impersonation audit records in one transaction.
- The successful purge may leave an operational summary log when audit retention mode is configured to retain purge summaries.
- Browser storage review found no `localStorage` or `sessionStorage` usage. The frontend reads `document.cookie` only to echo the CSRF cookie into the `X-CSRF-TOKEN` header.
- Current cookies are strictly necessary for auth/session and CSRF. The Cookie Notice should remain informational disclosure only unless future inventory finds nonessential cookies, analytics, advertising, or telemetry requiring consent.
- No marketing analytics were found. OpenTelemetry exists for operational traces/metrics. Production config evidence did not show an active OTLP endpoint.
- Production containers currently use Docker `json-file` logging with no rotation configuration visible from container inspection. Log retention is therefore host/runtime dependent until an operator policy is documented.

## Retention Table

| Surface | Data | Created by | Accessibility after expiry | Deletion trigger | Actual retention | Policy-visible? |
| --- | --- | --- | --- | --- | --- | --- |
| Tenant/workspace row | Tenant id, slug, display name, creation timestamp, expiry timestamp, lease extension count, last authenticated activity timestamp | Provisioning API; lease extension API; tenant resolution middleware records authenticated activity | Authenticated tenant-host access returns expired-state denial after actual expiry; row may remain until cleanup purge | Worker cleanup selects expired tenants and purges when recent-activity rules allow | Until actual expiry plus eventual worker cleanup after eligibility; no exact public deletion interval should be promised | Yes |
| Owner/generated user | Generated local owner email, normalized names/emails, password hash, security stamp | Provisioning API | User cannot access tenant after expiry, but user row may remain until tenant purge | Tenant purge deletes users associated with the tenant | Same as tenant database purge; raw generated password is returned to the user but not stored in the database | Yes |
| Tenant-created users | User emails, normalized emails, password hashes, security stamps | Tenant user administration API | No access after tenant expiry; row may remain until tenant purge | Tenant purge deletes associated users; explicit user-delete paths can remove users earlier | Same as tenant database purge unless user is explicitly deleted earlier | Yes |
| User memberships/roles | User id, tenant id, role, owner flag | Provisioning and tenant user administration APIs | No access after tenant expiry; rows may remain until tenant purge | Tenant purge deletes memberships | Same as tenant database purge | Yes |
| Binders | Binder ids, tenant id, binder name, created timestamp | Binder API | No tenant-host access after expiry; rows may remain until tenant purge | Tenant purge deletes binders; explicit binder delete can remove binders earlier | Same as tenant database purge unless deleted earlier | Yes |
| Binder policies | Binder id, tenant id, policy mode, allowed roles, timestamps | Binder policy API and binder creation defaults | No tenant-host access after expiry; rows may remain until tenant purge | Tenant purge deletes binder policies; binder delete cascades through policy data | Same as tenant database purge unless associated binder is deleted earlier | Yes |
| Documents | Document ids, tenant id, binder id, title, markdown content, content type, superseded link, created timestamp, archive timestamp | Document API | No tenant-host access after expiry; rows may remain until tenant purge | Tenant purge deletes documents; explicit document delete can remove documents earlier | Same as tenant database purge unless deleted earlier | Yes |
| Impersonation audit records | Session id, event name, tenant id, actor user id, effective user id, timestamp, correlation id | Impersonation service | No tenant-host access after expiry; audit rows may remain until tenant purge | Tenant purge deletes tenant impersonation audit rows | Same as tenant database purge; purge-summary logs may remain separately | Probably |
| Auth cookie | Server auth ticket in `paperbinder.auth` or configured auth cookie name | Login/provisioning/sign-in flows; impersonation state changes | Expired tenants are rejected server-side even if cookie still exists; invalid sessions clear cookies | Logout, invalid security stamp, missing user, invalid impersonation, or browser session end | Session cookie behavior; protected by ASP.NET Core Data Protection keys; not governed by tenant row purge alone | Yes |
| CSRF cookie | Browser-readable random token in auth-cookie-name plus `.csrf` | Login/provisioning/sign-in and impersonation state changes | Does not grant access by itself; expired tenant still rejected server-side | Logout, invalid session checks, invalid impersonation, or browser session end | Session cookie behavior; browser-readable by design so the frontend can echo it in `X-CSRF-TOKEN` | Yes |
| Browser storage | No `localStorage` or `sessionStorage` usage found; clipboard API used only for user-initiated copy actions | N/A | N/A | N/A | No current Web Storage retention surface found | Cookie Notice |
| Turnstile challenge | Browser challenge token; server sends challenge secret, token response, and remote IP when available to Cloudflare Siteverify | Cloudflare Turnstile widget and server verification service | N/A to tenant expiry; Turnstile is pre-auth and provider-side | Provider retention governed by Cloudflare; app does not persist token response in database | Provider retention unknown from repo; app logs some failed verification metadata, including remote IP | Yes |
| Pre-auth rate limiting | Remote IP partition, path/host, retry metadata on rejections | ASP.NET rate limiter and rejection logger | N/A to tenant expiry | In-memory limiter state and operational logging; no database row | Runtime memory plus logs; log retention is host/runtime dependent | Aggregate description |
| API/app logs | Security denials, rate-limit rejections, auth boundary failures, tenant/user ids where scoped, path, host, correlation id; L6 removed identified app log fields for tenant slug, email, and binder name from runtime logger templates | API runtime structured logs | N/A; logs may outlive tenant expiry and purge | Docker/container log handling, host maintenance, deploy log collection | Production containers use Docker `json-file` logging without visible rotation config; exact retention is host/runtime dependent | Aggregate description |
| Worker logs | Cleanup cycle start/complete/failure, selected/purged/skipped/failed counts, tenant id on purge/failure, optional deleted-row summary | Worker runtime | N/A; logs may outlive tenant expiry and purge | Docker/container log handling and host maintenance | Production containers use Docker `json-file` logging without visible rotation config; exact retention is host/runtime dependent | Aggregate description |
| Caddy/proxy logs | Reverse-proxy operational logs; Caddyfile does not configure a dedicated access-log block, but container stdout/stderr may include proxy/TLS events | Caddy container | N/A | Docker/container log handling and host maintenance | Production proxy container uses Docker `json-file` logging without visible rotation config; exact retention is host/runtime dependent | Aggregate description |
| OpenTelemetry traces/metrics | Operational request/worker traces and metrics; tenant/user/correlation tags where available; no marketing analytics found | API and worker OpenTelemetry wiring | N/A; traces/metrics may outlive tenant expiry if exported | Console exporter in dev/test; optional OTLP exporter only when configured | Production non-secret config did not show an active OTLP endpoint; if enabled later, provider retention must be disclosed | Yes if active; otherwise aggregate no-analytics statement |
| PostgreSQL Docker volume | Persistent database files containing tenant-owned rows and operational schema | PostgreSQL container | Tenant-owned rows can remain in the volume until worker purge; inaccessible through app after expiry | Tenant purge removes tenant-owned rows; volume lifecycle is managed by Docker/host operations | Tenant-owned logical rows are purged by worker; physical storage and database internals may persist until PostgreSQL/storage reuse, vacuum, backup, or volume removal | Yes |
| Data Protection key ring | ASP.NET Core Data Protection keys under `/data/keys`; certificate-backed protection in deployed environments | App/worker runtime and deployment secret | N/A; keys protect/validate auth cookies and other protected payloads | Key-ring rotation/volume lifecycle, not tenant purge | Operational security state persists outside tenant data lifecycle | Aggregate/security description |
| Server `.env` and deployment files | Runtime configuration, provider endpoints, secrets, image tags, DB credentials | GitHub deploy workflow and operator | N/A | Operator/deployment lifecycle | Production `.env` persists on host; do not treat it as tenant content | Aggregate/security description |
| GitHub Actions logs | Build/test/deploy logs, image tags, deployment metadata; workflow can print recent app/proxy logs on deploy failure | GitHub Actions | N/A | GitHub retention policy/configuration | Build/deploy metadata may remain with GitHub; visitor document contents should not flow there except if operational logs are intentionally printed into failed deploy logs | Possibly, as build/deploy processor not ordinary visitor content processor |
| GHCR | Tagged container images and registry metadata | Release workflow and deploy workflow | N/A | GitHub/GHCR retention policy and owner cleanup | No visitor document content expected in images; provider processes deployment artifacts | Usually not visitor policy wording except provider/legal index notes |
| Namecheap DNS/API | DNS records, ACME DNS challenge API requests, whitelisted client IP configuration | Caddy DNS-01 flow and operator DNS setup | N/A | DNS/provider retention | DNS/TLS infrastructure provider; not evidenced as processing visitor document contents | Usually no, except infrastructure/provider description if naming providers |
| Tailscale admin access | Tailnet admin/SSH access metadata | Operator, deploy/admin access | N/A | Tailscale/provider retention | Administrative access provider; not evidenced as processing visitor document contents | Usually no, except security/provider description if naming providers |
| DigitalOcean or equivalent VM provider | VM, network, disk, snapshot/backup metadata, possible block-level tenant data in snapshots/backups if enabled | Operator/provider | N/A through app; provider-level snapshots/backups may contain retained block data | Provider snapshot/backup settings and operator cleanup | Snapshot/backup enablement and retention not proven from repo; owner/provider verification required | Yes if enabled or if provider hosts live data |

## Provider Classification For Policy Drafting

Current runtime data path:

- VM/cloud host provider for the production server and attached storage.
- Docker/Caddy/PostgreSQL runtime inside the production host.
- Cloudflare Turnstile for challenge verification on root-host provisioning and login.
- Optional OTLP provider only if `PAPERBINDER_OTEL_OTLP_ENDPOINT` is configured.

Build/deploy/support path:

- GitHub Actions and GHCR for tests, release images, deployment metadata, and deploy logs.
- Namecheap DNS API for Caddy ACME DNS-01 wildcard certificate issuance/renewal.
- Tailscale for administrative SSH reachability.

Public policy should avoid implying that build/deploy/support providers process visitor document contents unless a specific data flow proves that they do.

## Policy Wording Constraints

- Say demo workspaces are temporary and expire according to the lease period displayed in the application.
- Do not say data is deleted at any fixed minute boundary.
- Say access is denied after the actual workspace expiry timestamp, but database rows may remain until automated cleanup finds the workspace eligible for purge.
- Say cleanup can be deferred by recent authenticated activity and operational failures.
- Say tenant purge deletes tenant-owned database rows, but operational logs, telemetry, deployment logs, provider logs, physical database storage behavior, and snapshots/backups can have different retention.
- Say there is no backup, recovery, restore, or availability guarantee for users.
- Say no marketing analytics were found in the current implementation; operational telemetry may be emitted, and optional OTLP export should be disclosed only if enabled.
- Say current cookies are strictly necessary auth/CSRF cookies and the Cookie Notice is informational disclosure only. Do not add a consent-management platform or banner unless future inventory identifies nonessential cookies, analytics, advertising, or consent-triggering telemetry.
- Warn users not to submit sensitive, regulated, confidential, proprietary, personal, medical, financial, credential, or important real business information.

## Remediation Items For Later Slices

- L2/L3: Public legal pages and legal footer exposure are missing.
- L2: Policy text must use the temporary-workspace wording above and avoid exact deletion intervals.
- L4: Third-party notices and asset provenance still need durable notice files.
- L5: Add dependency/security maintenance policy.
- L6: Logging privacy alignment removed identified runtime log fields for tenant slug, email, and binder name and added a source-level guard against user-submitted names/content, emails, passwords, and credentials in logger templates. Remaining path, host, IP-derived data, tenant/user identifiers, and correlation identifiers are disclosed operational/security metadata in the Privacy Policy.
- L7: If provider snapshots/backups are enabled, document their retention before release or keep policy wording general enough to avoid an exact retention claim.

## Open Questions

- Are production provider snapshots or recurring backups enabled for the VM or volumes? If yes, what is the retention period?
- Does the owner want public policy to name the VM/cloud host provider, or categorize it as a cloud hosting provider?
- Should Docker log rotation be configured before final legal wording, or should policy disclose host/runtime-dependent operational log retention without a precise period?
- Is any external OTLP endpoint intentionally enabled outside the checked production `.env` evidence?
