---
slug: cookies
path: /cookies
title: Cookie Notice
description: How the PaperBinder public demo uses cookies and browser storage.
documentType: cookies
effectiveDate: August 17, 2026
---

# Cookie use

This Cookie Notice explains how the PaperBinder public demo uses cookies and browser storage. PaperBinder's only cookies are strictly necessary authentication and CSRF cookies. PaperBinder also uses GoatCounter for basic analytics without analytics cookies, advertising cookies, `localStorage`, or `sessionStorage`. PaperBinder does not use marketing analytics or advertising cookies.

# Strictly necessary cookies

PaperBinder uses:

- An authentication cookie used to keep a user signed in to a temporary workspace. This cookie is HttpOnly and server-readable.
- A CSRF cookie used to protect unsafe requests. PaperBinder reads this cookie to send the `X-CSRF-TOKEN` request header.

These cookies are necessary for authentication, tenant access, and request protection.

# Browser storage

PaperBinder does not store its data in your browser's `localStorage` or `sessionStorage`.

# Turnstile

PaperBinder uses Cloudflare Turnstile on pre-authentication surfaces such as demo creation and login. Cloudflare processes challenge tokens and remote IP information when the challenge is submitted. This challenge behavior is separate from PaperBinder's authentication and CSRF cookies.

# Telemetry

PaperBinder records operational telemetry for diagnostics. PaperBinder also records basic aggregate usage analytics through GoatCounter without analytics cookies, advertising cookies, `localStorage`, or `sessionStorage`.

# Contact

For cookie or privacy questions, contact [paperbinder@danielmaratta.com](mailto:paperbinder@danielmaratta.com).
