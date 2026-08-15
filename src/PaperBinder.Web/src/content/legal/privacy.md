---
slug: privacy
path: /privacy
title: Privacy Policy
description: How PaperBinder handles information in the public demo.
documentType: privacy
effectiveDate: To be set on deployment
---

# What PaperBinder is

PaperBinder is a demonstration and hiring artifact operated by Daniel Maratta. It is not a production SaaS service. Do not submit confidential, sensitive, regulated, proprietary, personal, medical, financial, credential, or important real business information.

# Information users provide

Users may voluntarily provide information while using the demo, including:

- A workspace name submitted during demo workspace creation.
- Security challenge responses used to prevent abuse.
- Login credentials issued for a temporary workspace.
- User email addresses created inside a workspace.
- Binder names, access policies, document titles, document markdown content, archive state, and related document metadata.

# Information collected automatically

PaperBinder may automatically process operational information needed to run and protect the demo, including:

- Request path, host, correlation id, status, and timing information.
- IP-derived request information for challenge verification and rate limiting.
- Tenant, user, actor, and effective-user identifiers where needed for security, authorization, audit, or operational diagnostics.
- Security-denial, rate-limit, authentication, authorization, cleanup, and worker-event logs.
- Operational traces and metrics for API and worker behavior.

# Cookies and browser storage

PaperBinder currently uses strictly necessary cookies for authentication and CSRF protection. The auth cookie is server-readable and HttpOnly. The CSRF cookie is browser-readable so the frontend can send the `X-CSRF-TOKEN` header on protected requests.

Static review for this release did not find `localStorage` or `sessionStorage` usage. PaperBinder does not currently use marketing analytics or advertising cookies.

# Turnstile challenge processing

PaperBinder uses Cloudflare Turnstile or an equivalent challenge provider on pre-authentication surfaces such as demo creation and login. Challenge verification may send the challenge token and remote IP address to the challenge provider.

# Temporary workspace retention

Demo workspaces are temporary and expire according to the lease period displayed in the application. After the actual workspace expiry timestamp, PaperBinder denies authenticated tenant-host access.

Expiry is not the same event as deletion. Tenant-owned database rows may remain until the cleanup worker finds the workspace eligible for purge. Cleanup eligibility can be affected by worker schedule, recent authenticated activity, operational failures, and host maintenance.

When a workspace is purged, PaperBinder deletes tenant-owned database rows for the workspace, users, memberships, binders, binder policies, documents, and tenant impersonation audit records. Operational logs, telemetry, deployment logs, provider logs, database storage internals, and provider snapshots or backups may follow different retention behavior.

PaperBinder does not promise backups, restoration, recovery, availability, or continuity for demo workspace data.

# Providers

PaperBinder may use hosting, database, reverse proxy, challenge verification, DNS/TLS, deployment, container registry, administrative access, and optional telemetry providers to operate the demo. Current public policy wording should name or categorize only providers that participate in the current production data path.

Build and deployment providers should not be understood to process visitor document contents unless a specific operational data flow sends those contents to them.

# No sale of personal information

PaperBinder does not sell personal information.

# Contact

For privacy or data questions, contact [privacy@danielmaratta.com](mailto:privacy@danielmaratta.com).
