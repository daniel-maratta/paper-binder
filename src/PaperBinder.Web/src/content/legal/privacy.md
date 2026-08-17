---
slug: privacy
path: /privacy
title: Privacy Policy
description: How PaperBinder handles information in the public demo.
documentType: privacy
effectiveDate: August 17, 2026
---

# What PaperBinder is

PaperBinder is a public demonstration project and hiring portfolio piece operated by Daniel Maratta. It is not a production SaaS service. Do not submit confidential, sensitive, regulated, proprietary, personal, medical, financial, credential, or important real business information.

# Children

PaperBinder is not intended for children under 13. Do not create or use a demo workspace if you are under 13. If you believe a child under 13 submitted information to PaperBinder, contact the operator at the email address listed below.

# Information users provide

Users may voluntarily provide information while using the demo, including:

- A workspace name submitted during demo workspace creation.
- Security challenge responses used to prevent abuse.
- Login credentials issued for a temporary workspace.
- User email addresses created inside a workspace.
- Binder names, access policies, document titles, document markdown content, archive state, and related document metadata.

# Information collected automatically

PaperBinder processes operational information needed to run and protect the demo, including:

- Request path, host, correlation id, status, and timing information.
- IP-derived request information for security challenges and rate limiting.
- Tenant, user, actor, and effective-user identifiers where needed for security, authorization, audit, or operational diagnostics.
- Operational logs for security denials, rate limits, authentication, authorization, and cleanup.
- Operational traces and metrics for diagnostics.

# Cookies and browser storage

PaperBinder uses strictly necessary cookies for authentication and CSRF protection. The authentication cookie is server-readable and HttpOnly. The CSRF cookie is readable by the application so PaperBinder can send the `X-CSRF-TOKEN` header on protected requests.

PaperBinder does not store its data in your browser's `localStorage` or `sessionStorage`. PaperBinder does not use marketing analytics or advertising cookies.

# Turnstile challenge processing

PaperBinder uses Cloudflare Turnstile on pre-authentication surfaces such as demo creation and login. When a challenge is submitted, PaperBinder sends the challenge token and remote IP address to Cloudflare.

# Temporary workspace retention

Demo workspaces are temporary and expire according to the lease period displayed in the application. When a workspace expires, PaperBinder terminates access to that workspace.

Expiration is not the same as deletion. Workspace data may remain in PaperBinder's systems after expiration until automated cleanup removes it. Deletion timing can vary and may be affected by recent authenticated activity, operational failures, and host maintenance.

When cleanup removes a workspace, PaperBinder deletes workspace-associated data for the workspace, users, memberships, binders, binder policies, documents, and tenant impersonation audit records. Operational logs, telemetry, provider logs, backups, and similar operational records may follow separate retention schedules.

PaperBinder does not promise backups, restoration, recovery, availability, or continuity for demo workspace data.

# Providers

PaperBinder uses service providers for hosting, database storage, networking, DNS/TLS, security challenges, release support, and operational diagnostics. Operational telemetry is used for diagnostics and is exported outside PaperBinder only if the operator configures an external telemetry endpoint.

Some service providers help maintain and publish the PaperBinder software. They do not receive workspace documents through ordinary use, but operational logs may be shared with them for diagnostic or operational purposes.

# No sale of personal information

PaperBinder does not sell personal information.

# Contact

For privacy or data questions, contact [paperbinder@danielmaratta.com](mailto:paperbinder@danielmaratta.com).
