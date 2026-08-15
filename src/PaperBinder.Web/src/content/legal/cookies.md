---
slug: cookies
path: /cookies
title: Cookie Notice
description: Current cookie and browser-storage posture for PaperBinder.
documentType: cookies
effectiveDate: To be set on deployment
---

# Current posture

This Cookie Notice is an informational disclosure for PaperBinder's current strictly necessary cookie posture. PaperBinder should not add a consent-management platform or cookie banner unless a future inventory identifies non-essential cookies, analytics, advertising, or telemetry requiring consent.

# Strictly necessary cookies

PaperBinder currently uses:

- An authentication cookie used to keep a user signed in to a temporary workspace. This cookie is HttpOnly and server-readable.
- A CSRF cookie used to protect unsafe requests. This cookie is browser-readable by design so the frontend can copy its value into the `X-CSRF-TOKEN` request header.

These cookies are necessary for authentication, tenant access, and request protection.

# Browser storage

Static review for this release did not find `localStorage` or `sessionStorage` usage in the current frontend.

# Turnstile

PaperBinder uses Cloudflare Turnstile or an equivalent challenge provider on pre-authentication surfaces such as demo creation and login. The challenge provider may process challenge tokens and remote IP information. This challenge behavior is separate from PaperBinder's auth and CSRF cookies.

# Analytics

PaperBinder does not currently use marketing analytics or advertising cookies. Operational telemetry may be emitted by the API or worker for diagnostics, and optional external telemetry export should be disclosed if enabled.

# Contact

For cookie or privacy questions, contact [privacy@danielmaratta.com](mailto:privacy@danielmaratta.com).
