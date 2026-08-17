# ADR-0016: GoatCounter Usage Analytics

Status: Approved

## Date / Scope

- Date: 2026-08-17
- Scope: Basic hosted usage analytics for the public PaperBinder demo and tenant workspace UI.

## Context

PaperBinder is a public hiring artifact. The operator needs a lightweight way to understand whether people visit the site, which public and workspace surfaces they use, where visits generally come from, and what browser/device classes need attention.

The existing OpenTelemetry baseline covers runtime diagnostics for API, worker, and database seams. It does not answer public-site usage questions and should not expand into product analytics by default.

The operator already has a GoatCounter account for `danielmaratta.com` and created a separate GoatCounter site named `paperbinder`.

## Decision

Use GoatCounter.com for basic PaperBinder usage analytics.

- Use the separate `paperbinder` GoatCounter site under the existing GoatCounter account.
- Do not load or execute GoatCounter provider JavaScript in PaperBinder pages.
- Send constrained browser image requests from PaperBinder-owned code to `https://paperbinder.goatcounter.com/count`.
- Send pageviews manually from the React Router surface after PaperBinder resolves the route to an approved analytics template.
- Enable analytics only when the production frontend build sets `VITE_PAPERBINDER_ANALYTICS_ENABLED=true` and the request is on a configured public PaperBinder host. Keep local, shared-test, and invalid-host surfaces untracked.
- Send only explicit public route paths, tenant route-template paths, and approved synthetic public event names. Tenant slugs, query strings, hashes, user identifiers, binder identifiers, document identifiers, emails, user-provided names, document titles, and document content must not be included in analytics paths or event names.
- Strip internal PaperBinder referrers and remove query strings/fragments from external referrer values before sending them to GoatCounter.
- Use namespaced synthetic event paths beginning with `pb_event_public_` for meaningful unauthenticated navigation and conversion events.
- Keep authenticated workspace interaction tracking out of scope except for sanitized pageview templates and public conversion handoff events.
- Keep GoatCounter individual pageview collection disabled; this was manually verified disabled for the `paperbinder` site on 2026-08-17.

## Why

- A separate GoatCounter site avoids mixing PaperBinder usage with `danielmaratta.com` while preserving the same account and login.
- GoatCounter gives enough aggregate product usage signal without adding analytics cookies, browser storage, advertising technology, or a product analytics SDK dependency.
- Manual SPA tracking prevents raw tenant routes with database identifiers from being sent as analytics paths.
- Direct `/count` image requests make GoatCounter a data recipient rather than an executable code supplier, reducing the consequence of an analytics-provider script compromise inside authenticated workspace pages.
- Public semantic events answer whether visitors explore, read the flagship article, and attempt or complete demo workspace creation without collecting form values or workspace identifiers.
- The narrow configuration aligns with PaperBinder's portfolio-demo scope and public legal posture.

## Consequences

- Positive: the operator can see aggregate visits, route usage, referrers, approximate location, browser/system, language, and screen-width categories for PaperBinder.
- Positive: no npm dependency is added for analytics.
- Positive: authenticated workspace pages do not execute third-party analytics JavaScript.
- Positive: public policy can disclose analytics accurately without adding a cookie-consent surface.
- Negative: final-page dwell time and full user journey reconstruction remain intentionally weak.
- Negative: GoatCounter.com becomes a hosted third-party provider for usage analytics and must stay listed in legal, retention, and operations docs.
- Negative: route and public-event authorization must be maintained whenever new public or tenant routes or public conversion controls are added.

## Alternatives Considered

- Reuse the `danielmaratta.com` GoatCounter site: rejected because PaperBinder should have separate reporting and avoid cross-domain path ambiguity.
- Create a separate GoatCounter account: rejected because separate site isolation is enough; separate account ownership can be revisited if PaperBinder ownership, billing, or recovery boundaries change.
- Use OpenTelemetry for usage analytics: rejected because the existing telemetry baseline is operational, not product analytics.
- Add a fuller product analytics platform: rejected as too broad for a constrained public demo.
- Load GoatCounter `count.js`: rejected for this integration because direct `/count` requests provide the approved aggregate pageview and event data without executing analytics-provider JavaScript inside authenticated pages.

## References

- GoatCounter getting started: `https://www.goatcounter.com/help/start`
- GoatCounter privacy policy: `https://www.goatcounter.com/help/privacy`
- GoatCounter multiple-domain guidance: `https://www.goatcounter.com/help/domains`
- GoatCounter SPA guidance: `https://www.goatcounter.com/help/spa`
- GoatCounter JavaScript API: `https://www.goatcounter.com/help/js`
- GoatCounter tracking pixel and `/count` parameters: `https://www.goatcounter.com/help/pixel`
- GoatCounter event tracking: `https://www.goatcounter.com/help/events`
