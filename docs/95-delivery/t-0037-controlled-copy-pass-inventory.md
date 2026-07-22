# T-0037 Controlled Copy Pass Inventory

Status: Baseline inventory with reconciliation snapshot
Date: 2026-07-17
Purpose: Capture the original exposed user-facing copy inventory and track which high-priority areas have since been reconciled on the current branch.

Current truth:

- this document began as the pre-edit baseline inventory for `T-0037`
- several high- and medium-priority rows listed below have already been updated in the current working tree
- use the current application code as the source of truth for final copy, and use this document as the baseline/reconciliation record

## Poison Pill Note

The repo does not currently define a concrete poison-pill implementation item beyond the planning note in `T-0037`.

Best current interpretation:

- it is a deliberately late-stage implementation or hardening check inserted immediately before final review
- its purpose is to flush out any stale placeholder behavior, copy, or proof surfaces that still depend on assumptions instead of current repo truth
- it should be small, explicit, and intentionally disruptive to weak assumptions rather than a broad new feature slice

This is an inference from the current planning docs, not a defined implementation contract.

## Reconciliation Snapshot

Addressed in the current working tree:

- public landing support copy
- start-demo and root-host sign-in helper/supporting copy
- `/about`, public not-found, and invalid-host explanatory copy
- root-host and tenant-host error-detail wording
- tenant bootstrap failure copy
- dashboard non-admin helper copy
- users-and-access page framing and view-as helper copy
- binders, binder detail, and document detail medium-smell explanatory copy

Still likely worth a later pass:

- some screenshot alt text and other low-priority descriptive text in the public shell
- remaining medium-grade wording outside the highest-traffic paths
- any dormant or currently unmounted surfaces excluded from this inventory baseline

## Scope

This inventory covers distinct copy strings and templates that are currently exposed through active runtime surfaces in:

- `src/PaperBinder.Web/src/app/**`
- `src/PaperBinder.Api/TenantHostFailurePage.cs`

Consolidation rule:

- identical repeated strings are listed once with multiple locations where practical

Exclusions:

- test-only strings
- non-user-facing code identifiers
- dormant or currently unmounted components, including `src/PaperBinder.Web/src/app/tenant-impersonation-banner.tsx`
- caller-provided dynamic values such as tenant slugs, user emails, correlation IDs, and server-returned titles/details unless the template around them is user-facing

## Rating Scale

| Rating | Meaning |
| --- | --- |
| `Low` | Clear, product-first, truthful, and not overly mechanical. |
| `Medium` | Truthful, but somewhat stiff, technical, repetitive, or meta. |
| `High` | Reads like implementation commentary, reviewer narration, contract prose, or generic AI-polished product language rather than direct product copy. |

High-rated rows are candidates for later modification or removal, but no copy changes are made in this step.

## Public Path

| Text | Location in code | AI smell |
| --- | --- | --- |
| `PaperBinder` | `src/PaperBinder.Web/src/app/root-host.tsx` - `RootLandingPage` eyebrow, brand/home label, footer; `src/PaperBinder.Api/TenantHostFailurePage.cs` | `Low` |
| `Isolation` | `src/PaperBinder.Web/src/app/root-host.tsx` - `publicValuePillars` | `Low` |
| `Each tenant stays inside its own workspace boundary.` | `src/PaperBinder.Web/src/app/root-host.tsx` - `publicValuePillars` | `Low` |
| `Access control` | `src/PaperBinder.Web/src/app/root-host.tsx` - `publicValuePillars` | `Low` |
| `Binders, documents, and users remain role-aware.` | `src/PaperBinder.Web/src/app/root-host.tsx` - `publicValuePillars` | `Low` |
| `Visibility` | `src/PaperBinder.Web/src/app/root-host.tsx` - `publicValuePillars` | `Medium` |
| `Review the product itself instead of a marketing abstraction.` | `src/PaperBinder.Web/src/app/root-host.tsx` - `publicValuePillars` | `High` |
| `Disposable demo` | `src/PaperBinder.Web/src/app/root-host.tsx` - `publicValuePillars` | `Low` |
| `Each workspace is temporary and removed during periodic cleanup.` | `src/PaperBinder.Web/src/app/root-host.tsx` - `publicValuePillars` | `Medium` |
| `Loopback alias` | `src/PaperBinder.Web/src/app/root-host.tsx` - `PublicTopbar` debug chip | `Low` |
| `Start Demo` | `src/PaperBinder.Web/src/app/root-host.tsx` - topbar CTA | `Low` |
| `Product` | `src/PaperBinder.Web/src/app/route-registry.ts` - top nav label | `Low` |
| `Demo` | `src/PaperBinder.Web/src/app/route-registry.ts` - top nav label | `Low` |
| `About` | `src/PaperBinder.Web/src/app/route-registry.ts` - top nav label | `Low` |
| `PaperBinder document workspaces` | `src/PaperBinder.Web/src/app/root-host.tsx` - `RootLandingPage` hero | `Low` |
| `Multi-tenant by design. Review the product in a temporary workspace that stays product-first from the first click.` | `src/PaperBinder.Web/src/app/root-host.tsx` - `RootLandingPage` hero body | `High` |
| `Start live demo` | `src/PaperBinder.Web/src/app/root-host.tsx` - hero CTA | `Low` |
| `Learn more` | `src/PaperBinder.Web/src/app/root-host.tsx` - hero CTA | `Low` |
| `PaperBinder dashboard showing lease metrics, recent binders, and next actions inside the authenticated workspace.` | `src/PaperBinder.Web/src/app/root-host.tsx` - hero screenshot alt text | `Medium` |
| `PaperBinder start-demo flow shown in a handheld preview with one-time credentials and the live workspace handoff.` | `src/PaperBinder.Web/src/app/root-host.tsx` - phone screenshot alt text | `Medium` |
| `Users and access` | `src/PaperBinder.Web/src/app/root-host.tsx` - supporting panel eyebrow | `Low` |
| `Admin actions stay on the workspace route.` | `src/PaperBinder.Web/src/app/root-host.tsx` - supporting panel heading | `Medium` |
| `Tenant admins add users, adjust roles, and start view-as from one product surface without leaving the workspace context.` | `src/PaperBinder.Web/src/app/root-host.tsx` - supporting panel body | `High` |
| `PaperBinder users and access page showing current users, add-user form, role management, and view-as actions.` | `src/PaperBinder.Web/src/app/root-host.tsx` - supporting screenshot alt text | `Medium` |
| `Product-first public path` | `src/PaperBinder.Web/src/app/root-host.tsx` - supporting panel eyebrow | `Medium` |
| `Start with the software, not the setup mechanics.` | `src/PaperBinder.Web/src/app/root-host.tsx` - supporting panel heading | `Medium` |
| `The public experience leads with the product itself. Demo provisioning, challenge verification, one-time credentials, and redirect-safe sign in stay behind the entry flow instead of crowding the landing page.` | `src/PaperBinder.Web/src/app/root-host.tsx` - supporting panel body | `High` |
| `© 2026 PaperBinder` | `src/PaperBinder.Web/src/app/root-host.tsx` - footer | `Low` |

## Start Demo And Root-Host Login

| Text | Location in code | AI smell |
| --- | --- | --- |
| `Start demo` | `src/PaperBinder.Web/src/app/root-host.tsx` - `RootWelcomePage` eyebrow | `Low` |
| `Start demo` | `src/PaperBinder.Web/src/app/root-host.tsx` - `RootWelcomePage` title | `Low` |
| `Start a temporary PaperBinder workspace, receive one-time credentials, and continue directly into the live product.` | `src/PaperBinder.Web/src/app/root-host.tsx` - `RootWelcomePage` intro body | `Medium` |
| `New demo workspace` | `src/PaperBinder.Web/src/app/root-host.tsx` - provision panel eyebrow | `Low` |
| `Provision a temporary tenant and keep the server in charge.` | `src/PaperBinder.Web/src/app/root-host.tsx` - provision panel heading | `High` |
| `Choose a workspace name and let the root host verify the challenge, create the demo tenant, and return the approved destination.` | `src/PaperBinder.Web/src/app/root-host.tsx` - provision panel body | `High` |
| `Workspace name` | `src/PaperBinder.Web/src/app/root-host.tsx` - provision form field label | `Low` |
| `PaperBinder normalizes the workspace name on the server before opening the demo.` | `src/PaperBinder.Web/src/app/root-host.tsx` - provision form field hint | `High` |
| `Acme Demo` | `src/PaperBinder.Web/src/app/root-host.tsx` - provision form placeholder | `Low` |
| `Start demo workspace` | `src/PaperBinder.Web/src/app/root-host.tsx` - provision form submit button | `Low` |
| `Go to sign in` | `src/PaperBinder.Web/src/app/root-host.tsx` - provision and success secondary CTAs | `Low` |
| `Workspace ready` | `src/PaperBinder.Web/src/app/root-host.tsx` - success panel eyebrow and heading | `Low` |
| `PaperBinder already established the signed-in session. These one-time credentials appear only during this handoff and are not written into browser storage.` | `src/PaperBinder.Web/src/app/root-host.tsx` - success panel body | `High` |
| `Save these credentials now` | `src/PaperBinder.Web/src/app/root-host.tsx` - success alert title | `Low` |
| `Save the generated email and password before you continue. This is the only time they are shown.` | `src/PaperBinder.Web/src/app/root-host.tsx` - success alert body | `Low` |
| `Tenant slug` | `src/PaperBinder.Web/src/app/root-host.tsx` - success stats | `Low` |
| `Lease expires` | `src/PaperBinder.Web/src/app/root-host.tsx` - success stats | `Low` |
| `Workspace route` | `src/PaperBinder.Web/src/app/root-host.tsx` - success stats | `Medium` |
| `Email` | `src/PaperBinder.Web/src/app/root-host.tsx` - success credential field label | `Low` |
| `Generated for this disposable workspace.` | `src/PaperBinder.Web/src/app/root-host.tsx` - success credential hint | `Low` |
| `Copy email` | `src/PaperBinder.Web/src/app/root-host.tsx` - success credential copy label | `Low` |
| `Password` | `src/PaperBinder.Web/src/app/root-host.tsx` - success credential field label | `Low` |
| `Shown once during this root-host handoff.` | `src/PaperBinder.Web/src/app/root-host.tsx` - success credential hint | `Medium` |
| `Copy password` | `src/PaperBinder.Web/src/app/root-host.tsx` - success credential copy label | `Low` |
| `Show password` | `src/PaperBinder.Web/src/app/root-host.tsx` - success credential reveal label | `Low` |
| `Hide password` | `src/PaperBinder.Web/src/app/root-host.tsx` - success credential hide label | `Low` |
| `Open workspace` | `src/PaperBinder.Web/src/app/root-host.tsx` - success primary CTA | `Low` |
| `Use existing credentials` | `src/PaperBinder.Web/src/app/root-host.tsx` - side panel eyebrow | `Low` |
| `Return to a provisioned workspace.` | `src/PaperBinder.Web/src/app/root-host.tsx` - side panel heading | `Low` |
| `Root-host sign in remains available for return visits and still relies on the same server-approved destination.` | `src/PaperBinder.Web/src/app/root-host.tsx` - side panel body | `High` |
| `What stays true` | `src/PaperBinder.Web/src/app/root-host.tsx` - side panel eyebrow | `Medium` |
| `Provisioning sends only workspace name plus challenge proof through the SPA client.` | `src/PaperBinder.Web/src/app/root-host.tsx` - side panel bullet | `High` |
| `Generated credentials remain transient in memory only and are never written into browser storage.` | `src/PaperBinder.Web/src/app/root-host.tsx` - side panel bullet | `High` |
| `Redirect navigation uses only the absolute \`redirectUrl\` returned by the server.` | `src/PaperBinder.Web/src/app/root-host.tsx` - side panel bullet | `High` |
| `Failures stay limited to challenge, credential, rate-limit, and expiry guidance.` | `src/PaperBinder.Web/src/app/root-host.tsx` - side panel bullet | `High` |
| `Demo workspaces are temporary and removed during periodic cleanup.` | `src/PaperBinder.Web/src/app/root-host.tsx` - side panel bullet | `Medium` |
| `Direct sign in` | `src/PaperBinder.Web/src/app/root-host.tsx` - `RootLoginPage` eyebrow | `Low` |
| `Sign in` | `src/PaperBinder.Web/src/app/root-host.tsx` - `RootLoginPage` title | `Low` |
| `Return to a previously provisioned workspace with valid credentials. Redirect resolution stays on the server so the browser never builds tenant URLs from user input.` | `src/PaperBinder.Web/src/app/root-host.tsx` - `RootLoginPage` intro body | `High` |
| `Root-host login` | `src/PaperBinder.Web/src/app/root-host.tsx` - login panel eyebrow | `Medium` |
| `Use existing demo credentials.` | `src/PaperBinder.Web/src/app/root-host.tsx` - login panel heading | `Low` |
| `Valid credentials continue through the server-approved destination into the tenant host.` | `src/PaperBinder.Web/src/app/root-host.tsx` - login panel body | `High` |
| `Use the email issued for this demo workspace.` | `src/PaperBinder.Web/src/app/root-host.tsx` - email hint | `Low` |
| `owner@tenant.local` | `src/PaperBinder.Web/src/app/root-host.tsx` - email placeholder | `Low` |
| `PaperBinder uses the existing cookie-auth session model after successful login.` | `src/PaperBinder.Web/src/app/root-host.tsx` - password hint | `High` |
| `Generated password` | `src/PaperBinder.Web/src/app/root-host.tsx` - password placeholder | `Low` |
| `Log in` | `src/PaperBinder.Web/src/app/root-host.tsx` - login submit button | `Low` |
| `Back to start demo` | `src/PaperBinder.Web/src/app/root-host.tsx` - login secondary CTA | `Low` |
| `Redirecting to tenant host` | `src/PaperBinder.Web/src/app/root-host.tsx` - login success alert title | `Medium` |
| `The browser is continuing with the server-approved destination.` | `src/PaperBinder.Web/src/app/root-host.tsx` - login success alert body | `High` |
| `Continue manually` | `src/PaperBinder.Web/src/app/root-host.tsx` - manual redirect button | `Low` |
| `Prefer the product-led path?` | `src/PaperBinder.Web/src/app/root-host.tsx` - side panel eyebrow | `Medium` |
| `Start with a fresh demo workspace.` | `src/PaperBinder.Web/src/app/root-host.tsx` - side panel heading | `Low` |
| `The default public flow creates a temporary demo tenant, hands off one-time credentials, and then sends you into the live product.` | `src/PaperBinder.Web/src/app/root-host.tsx` - side panel body | `Medium` |
| `Start demo instead` | `src/PaperBinder.Web/src/app/root-host.tsx` - side panel CTA | `Low` |
| `Security posture` | `src/PaperBinder.Web/src/app/root-host.tsx` - side panel eyebrow | `Medium` |
| `Challenge proof is required before login requests are accepted unless local bypass is enabled.` | `src/PaperBinder.Web/src/app/root-host.tsx` - side panel bullet | `High` |
| `Retryable failures reset the challenge requirement rather than reusing stale proof.` | `src/PaperBinder.Web/src/app/root-host.tsx` - side panel bullet | `High` |
| `The client consumes only the absolute redirect target returned by the server.` | `src/PaperBinder.Web/src/app/root-host.tsx` - side panel bullet | `High` |

## Public Supporting And Edge Routes

| Text | Location in code | AI smell |
| --- | --- | --- |
| `About this demo` | `src/PaperBinder.Web/src/app/root-host.tsx` - `RootAboutPage` eyebrow | `Low` |
| `PaperBinder is a constrained multi-tenant document workspace.` | `src/PaperBinder.Web/src/app/root-host.tsx` - `RootAboutPage` title | `Low` |
| `It is intentionally narrow in scope: enough product surface to feel real, enough architecture to review, and explicit boundaries around what it is not trying to become.` | `src/PaperBinder.Web/src/app/root-host.tsx` - `RootAboutPage` intro body | `High` |
| `Core product truth` | `src/PaperBinder.Web/src/app/root-host.tsx` - about panel eyebrow | `Medium` |
| `Binders, immutable documents, and role-aware access.` | `src/PaperBinder.Web/src/app/root-host.tsx` - about panel heading | `Low` |
| `Core objects` / `Binders and immutable text documents` | `src/PaperBinder.Web/src/app/root-host.tsx` - about stats | `Low` |
| `Access model` / `Role-aware and tenant-isolated` | `src/PaperBinder.Web/src/app/root-host.tsx` - about stats | `Low` |
| `Live demo path` / `Product first, then disposable workspace entry` | `src/PaperBinder.Web/src/app/root-host.tsx` - about stats | `Medium` |
| `Intentional constraints` | `src/PaperBinder.Web/src/app/root-host.tsx` - about panel eyebrow | `Medium` |
| `This demo favors clarity over breadth.` | `src/PaperBinder.Web/src/app/root-host.tsx` - about panel heading | `Medium` |
| `It is a hiring artifact and architecture demonstration, not a broad enterprise suite.` | `src/PaperBinder.Web/src/app/root-host.tsx` - about bullet | `High` |
| `Tenant isolation, redirect trust, and server-authoritative auth boundaries remain non-negotiable.` | `src/PaperBinder.Web/src/app/root-host.tsx` - about bullet | `High` |
| `Reviewer-facing context stays available without displacing the product story from the landing page.` | `src/PaperBinder.Web/src/app/root-host.tsx` - about bullet | `High` |
| `Demo tenants are temporary and may be removed during routine cleanup.` | `src/PaperBinder.Web/src/app/root-host.tsx` - about bullet | `Medium` |
| `Page unavailable` | `src/PaperBinder.Web/src/app/root-host.tsx` - `RootNotFoundPage` eyebrow | `Low` |
| `This page is not part of the PaperBinder public site.` | `src/PaperBinder.Web/src/app/root-host.tsx` - `RootNotFoundPage` title | `Low` |
| `Unknown routes stay on the root host instead of guessing tenant identity or crossing into workspace routes.` | `src/PaperBinder.Web/src/app/root-host.tsx` - `RootNotFoundPage` body | `High` |
| `Start from a known route` | `src/PaperBinder.Web/src/app/root-host.tsx` - not-found panel eyebrow | `Low` |
| `/` for the product-led public landing page | `src/PaperBinder.Web/src/app/root-host.tsx` - not-found list | `Medium` |
| `/start-demo` for provisioning and one-time credential handoff | `src/PaperBinder.Web/src/app/root-host.tsx` - not-found list | `Medium` |
| `/login` for direct sign in with existing demo credentials | `src/PaperBinder.Web/src/app/root-host.tsx` - not-found list | `Low` |
| `/about` for scope and supporting context | `src/PaperBinder.Web/src/app/root-host.tsx` - not-found list | `Low` |
| `This PaperBinder address is unavailable` | `src/PaperBinder.Web/src/app/invalid-host.tsx` - invalid-host page title | `Low` |
| `PaperBinder stays host-aware. The SPA opens only the main site or a single-label workspace address.` | `src/PaperBinder.Web/src/app/invalid-host.tsx` - invalid-host description | `High` |
| `Current host` / `Configured root host` / `Tenant base domain` | `src/PaperBinder.Web/src/app/invalid-host.tsx` - invalid-host metadata labels | `Medium` |
| `Use a known PaperBinder address` | `src/PaperBinder.Web/src/app/invalid-host.tsx` - invalid-host alert title | `Low` |

## Public Error And Microcopy Templates

| Text | Location in code | AI smell |
| --- | --- | --- |
| `Redirect could not be completed.` | `src/PaperBinder.Web/src/app/root-host.tsx` - `createRedirectError` title | `Medium` |
| `PaperBinder did not return a valid destination for this handoff. Try again.` | `src/PaperBinder.Web/src/app/root-host.tsx` - `createRedirectError` detail | `High` |
| `Copied` / `Copy unavailable` / `Copy to clipboard` | `src/PaperBinder.Web/src/app/root-host.tsx` - public copy tooltip state; `src/PaperBinder.Web/src/app/credential-display-field.tsx` - reusable credential field tooltip | `Low` |
| `Correlation id:` | `src/PaperBinder.Web/src/app/root-host.tsx` - `RootHostErrorNotice`; `src/PaperBinder.Web/src/app/tenant-shell.tsx` - auth error notices | `Low` |
| `Copy correlation id` | `src/PaperBinder.Web/src/app/root-host.tsx` - `RootHostErrorNotice` aria label | `Low` |
| `Request could not be completed.` | `src/PaperBinder.Web/src/app/root-host-errors.ts`; `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Medium` |
| `Something went wrong. Try again.` | `src/PaperBinder.Web/src/app/root-host-errors.ts`; `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Medium` |
| `Complete the challenge.` | `src/PaperBinder.Web/src/app/root-host-errors.ts` | `Low` |
| `Finish the challenge before submitting the form.` | `src/PaperBinder.Web/src/app/root-host-errors.ts` | `Low` |
| `Challenge verification failed.` | `src/PaperBinder.Web/src/app/root-host-errors.ts` | `Low` |
| `The submitted challenge could not be verified. Complete it again and retry.` | `src/PaperBinder.Web/src/app/root-host-errors.ts` | `Medium` |
| `Credentials were not accepted.` | `src/PaperBinder.Web/src/app/root-host-errors.ts` | `Low` |
| `The supplied email or password is invalid.` | `src/PaperBinder.Web/src/app/root-host-errors.ts` | `Low` |
| `Demo expired.` / `This demo workspace is no longer available.` | `src/PaperBinder.Web/src/app/root-host-errors.ts`; `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Low` |
| `Tenant name is not available.` | `src/PaperBinder.Web/src/app/root-host-errors.ts` | `Medium` |
| `Provide a tenant name that can be normalized into a valid tenant slug.` | `src/PaperBinder.Web/src/app/root-host-errors.ts` | `High` |
| `Tenant name already exists.` | `src/PaperBinder.Web/src/app/root-host-errors.ts` | `Low` |
| `Choose a different tenant name and retry.` | `src/PaperBinder.Web/src/app/root-host-errors.ts` | `Low` |
| `Too many attempts.` | `src/PaperBinder.Web/src/app/root-host-errors.ts`; `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Low` |
| `The root-host pre-auth request limit was exceeded.` | `src/PaperBinder.Web/src/app/root-host-errors.ts` | `High` |
| `PaperBinder is unavailable right now.` | `src/PaperBinder.Web/src/app/root-host-errors.ts`; `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Low` |
| `The request did not reach PaperBinder. Check your connection and try again in a moment.` | `src/PaperBinder.Web/src/app/root-host-errors.ts` | `Medium` |
| `Retry the request.` | `src/PaperBinder.Web/src/app/root-host-errors.ts`; `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Low` |
| `Retry in about {seconds} second(s).` / `Retry in about {minutes} minute(s).` | `src/PaperBinder.Web/src/app/root-host-errors.ts`; `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Low` |
| `Loading` / `Required` / `Ready` / `Unavailable` | `src/PaperBinder.Web/src/app/challenge-widget.tsx` - challenge status badge text | `Low` |
| `Loading the challenge widget.` | `src/PaperBinder.Web/src/app/challenge-widget.tsx` | `Low` |
| `Complete the challenge before submitting.` | `src/PaperBinder.Web/src/app/challenge-widget.tsx` | `Low` |
| `Challenge complete.` | `src/PaperBinder.Web/src/app/challenge-widget.tsx` | `Low` |
| `The challenge widget could not be loaded. Refresh and try again.` | `src/PaperBinder.Web/src/app/challenge-widget.tsx` | `Low` |
| `Local challenge bypass enabled` | `src/PaperBinder.Web/src/app/root-host.tsx` - provision and login alert title | `Medium` |
| `Challenge verification is bypassed for this local demo runtime.` | `src/PaperBinder.Web/src/app/root-host.tsx` - provision and login alert body | `High` |
| `Copy {label}` | `src/PaperBinder.Web/src/app/copy-value-chip.tsx` - button aria label template | `Low` |
| `Show {label}` / `Hide {label}` | `src/PaperBinder.Web/src/app/credential-display-field.tsx` - reveal/hide tooltip template | `Low` |

## Authenticated Shell And Edge States

| Text | Location in code | AI smell |
| --- | --- | --- |
| `Workspace loading` | `src/PaperBinder.Web/src/app/tenant-shell.tsx` - loading page eyebrow | `Low` |
| `Loading tenant workspace` | `src/PaperBinder.Web/src/app/tenant-shell.tsx` - loading page title | `Low` |
| `PaperBinder is loading the current workspace context.` | `src/PaperBinder.Web/src/app/tenant-shell.tsx` - loading page body | `Medium` |
| `Workspace routing` | `src/PaperBinder.Web/src/app/tenant-shell.tsx` - bootstrap failure eyebrow | `Medium` |
| `{error.title}` / `{error.detail}` | `src/PaperBinder.Web/src/app/tenant-shell.tsx` - bootstrap failure page uses mapped error content | `N/A` |
| `PaperBinder keeps workspace routing host-derived even when this workspace cannot be opened.` | `src/PaperBinder.Web/src/app/tenant-shell.tsx` - bootstrap failure body | `High` |
| `Return to a safe starting point` | `src/PaperBinder.Web/src/app/tenant-shell.tsx` - bootstrap failure alert title | `Medium` |
| `Return to main site` | `src/PaperBinder.Web/src/app/tenant-shell.tsx` - bootstrap failure CTA | `Low` |
| `Return to sign in` | `src/PaperBinder.Web/src/app/tenant-shell.tsx` - bootstrap failure CTA | `Low` |
| `Route status` | `src/PaperBinder.Web/src/app/tenant-shell.tsx` - route failure eyebrow | `Medium` |
| `PaperBinder kept this route inside the current workspace.` | `src/PaperBinder.Web/src/app/tenant-shell.tsx` - route failure body | `High` |
| `Dashboard` / `Binders` / `Users` | `src/PaperBinder.Web/src/app/route-registry.ts` - authenticated nav labels | `Low` |
| `Copyright` / `Version` | `src/PaperBinder.Web/src/app/tenant-shell.tsx` - sidebar footer labels | `Low` |
| `About PaperBinder` | `src/PaperBinder.Web/src/app/tenant-shell.tsx` - sidebar footer link | `Low` |
| `Viewing as` / `Logged in as` / `Signed in as {actor email}` | `src/PaperBinder.Web/src/app/tenant-shell.tsx` - header account copy | `Low` |
| `Stop impersonation` | `src/PaperBinder.Web/src/app/tenant-shell.tsx` - header action | `Low` |
| `Tenant` | `src/PaperBinder.Web/src/app/tenant-shell.tsx` - header pill label | `Low` |
| `Log out` | `src/PaperBinder.Web/src/app/tenant-shell.tsx` - header button | `Low` |
| `This workspace page is unavailable` | `src/PaperBinder.Web/src/app/tenant-host.tsx` - tenant not-found title | `Low` |
| `Unknown tenant routes stay inside the current workspace shell and never infer a different tenant.` | `src/PaperBinder.Web/src/app/tenant-host.tsx` - tenant not-found description | `High` |
| `Use a known workspace route` | `src/PaperBinder.Web/src/app/tenant-host.tsx` - tenant not-found alert title | `Low` |
| `\`/app\`, \`/app/binders\`, \`/app/binders/:binderId\`, \`/app/documents/:documentId\`, and \`/app/users\` are the available workspace routes in this demo.` | `src/PaperBinder.Web/src/app/tenant-host.tsx` - tenant not-found alert body | `High` |

## Lease, Route, And Tenant Error States

| Text | Location in code | AI smell |
| --- | --- | --- |
| `Lease expired.` | `src/PaperBinder.Web/src/app/tenant-lease-banner.tsx` | `Low` |
| `This workspace has expired. Existing UI may stay visible, but new actions will fail until an admin extends the lease or cleanup removes the workspace.` | `src/PaperBinder.Web/src/app/tenant-lease-banner.tsx` | `Medium` |
| `Lease extension window open.` | `src/PaperBinder.Web/src/app/tenant-lease-banner.tsx` | `Medium` |
| `This workspace can be extended now before it expires.` | `src/PaperBinder.Web/src/app/tenant-lease-banner.tsx` | `Low` |
| `Demo lease active.` | `src/PaperBinder.Web/src/app/tenant-lease-banner.tsx` | `Medium` |
| `This workspace remains active. The extend action appears only after the server opens the final extension window.` | `src/PaperBinder.Web/src/app/tenant-lease-banner.tsx` | `High` |
| `Expires` / `Demo expires in` / `Extensions` | `src/PaperBinder.Web/src/app/tenant-lease-banner.tsx` - metric labels | `Low` |
| `Extend lease` / `Extend when window opens` | `src/PaperBinder.Web/src/app/tenant-lease-banner.tsx` - CTA | `Low` |
| `Authentication required` | `src/PaperBinder.Web/src/app/tenant-shell.tsx` - bootstrap mapping | `Low` |
| `Sign in again from the main site before returning to this workspace.` | `src/PaperBinder.Web/src/app/tenant-shell.tsx` - bootstrap mapping | `Low` |
| `Workspace access denied` | `src/PaperBinder.Web/src/app/tenant-shell.tsx` - bootstrap mapping | `Low` |
| `This session is not allowed to open the requested workspace.` | `src/PaperBinder.Web/src/app/tenant-shell.tsx` - bootstrap mapping | `Low` |
| `Demo expired` | `src/PaperBinder.Web/src/app/tenant-shell.tsx`; `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Low` |
| `This demo workspace has expired. PaperBinder is keeping it briefly because there was recent activity, but access is already closed and cleanup will remove it soon.` | `src/PaperBinder.Web/src/app/tenant-shell.tsx` - retained-expiry bootstrap mapping | `Medium` |
| `Workspace unavailable` | `src/PaperBinder.Web/src/app/tenant-shell.tsx` - bootstrap mapping | `Low` |
| `This workspace is not available from the current address.` | `src/PaperBinder.Web/src/app/tenant-shell.tsx` - bootstrap mapping | `Low` |
| `Workspace could not be loaded` | `src/PaperBinder.Web/src/app/tenant-shell.tsx` - bootstrap mapping | `Low` |
| `PaperBinder could not load this workspace. Check your connection and try again in a moment.` | `src/PaperBinder.Web/src/app/tenant-shell.tsx` - bootstrap mapping | `Medium` |
| `Copied.` / `Clipboard unavailable.` | `src/PaperBinder.Web/src/app/tenant-shell.tsx` - correlation copy state | `Low` |
| `Access is not allowed.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Low` |
| `The current tenant session is not allowed to perform this action.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Low` |
| `Binder access denied.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Low` |
| `This binder is not available for the current tenant role.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Low` |
| `Tenant unavailable.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Low` |
| `This tenant host no longer resolves to an active tenant.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Medium` |
| `Binder name is required.` / `Provide a binder name between 1 and 200 characters.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Low` |
| `Binder not found.` / `The requested binder was not found for the current tenant.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Low` |
| `Binder policy is invalid.` / `Choose a supported policy mode and role combination.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Medium` |
| `Document not found.` / `The requested document was not found for the current tenant.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Low` |
| `Document title is required.` / `Provide a document title between 1 and 200 characters.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Low` |
| `Document title already exists.` / `Use a unique title in this binder, or supersede an earlier document with the same title.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Medium` |
| `Document content is required.` / `Provide markdown content for the new document.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Low` |
| `Document content is too large.` / `Document content must stay within the 50,000 character limit.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Low` |
| `Only markdown documents are supported.` / `PaperBinder v1 accepts only markdown document content.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Medium` |
| `A binder is required.` / `Documents must be created from a specific binder context.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Medium` |
| `Supersedes target is invalid.` / `Supersedes must reference an existing document in the same binder.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Low` |
| `Email already exists.` / `Choose a different email for the tenant user.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Low` |
| `Select a valid role.` / `Tenant users and binder policies require a supported PaperBinder role.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Medium` |
| `Tenant user not found.` / `The selected tenant user no longer exists for this tenant.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Low` |
| `At least one tenant admin is required.` / `PaperBinder cannot remove the final tenant admin from the tenant.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Medium` |
| `Lease extension is not available yet.` / `The tenant lease can be extended only during the final extension window.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `High` |
| `Lease extension limit reached.` / `This tenant has already used the maximum number of lease extensions.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Low` |
| `View-as is not allowed.` / `Only tenant admins can start tenant-local impersonation.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Medium` |
| `View-as target is invalid.` / `Choose a valid tenant user before retrying view-as.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Low` |
| `View-as target not found.` / `The selected tenant user is not available for this tenant.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Low` |
| `View-as target is not eligible.` / `Choose another tenant-local user to start view-as.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Medium` |
| `View-as is already active.` / `Stop the current view-as session before starting another one.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Low` |
| `No active view-as session.` / `Start view-as before trying to stop it.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Low` |
| `Session changed.` / `Refresh the tenant workspace and retry the view-as action.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Medium` |
| `Request could not be verified.` / `Refresh the page and retry the action.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Low` |
| `PaperBinder is currently unavailable. Check your connection and try again in a moment.` | `src/PaperBinder.Web/src/app/tenant-host-errors.ts` | `Medium` |

## Dashboard

| Text | Location in code | AI smell |
| --- | --- | --- |
| `Overview` | `src/PaperBinder.Web/src/app/tenant-dashboard-route.tsx` - eyebrow | `Low` |
| `Workspace dashboard` | `src/PaperBinder.Web/src/app/tenant-dashboard-route.tsx` - title | `Low` |
| `See lease status, recent binders, and the next actions available in this workspace.` | `src/PaperBinder.Web/src/app/tenant-dashboard-route.tsx` - intro body | `Low` |
| `Visible binders` / `Current role` / `Lease extensions` / `Demo expires in` | `src/PaperBinder.Web/src/app/tenant-dashboard-route.tsx` - stat labels | `Low` |
| `Loading...` | `src/PaperBinder.Web/src/app/tenant-dashboard-route.tsx` - loading stat value | `Low` |
| `This demo tenant will be available for an hour after creation` | `src/PaperBinder.Web/src/app/tenant-dashboard-route.tsx` - callout title | `Medium` |
| `When less than 10 minutes are left, the opportunity to extend the demo by 10 minutes appears if you need more time. You can extend the tenant demo by up to 3 times (30 minutes).` | `src/PaperBinder.Web/src/app/tenant-dashboard-route.tsx` - callout body | `Medium` |
| `Recent binders` | `src/PaperBinder.Web/src/app/tenant-dashboard-route.tsx` - panel title | `Low` |
| `Return to the binders that are currently visible to this session.` | `src/PaperBinder.Web/src/app/tenant-dashboard-route.tsx` - panel body | `Medium` |
| `Loading visible binders...` | `src/PaperBinder.Web/src/app/tenant-dashboard-route.tsx` - loading state | `Low` |
| `No binders yet.` | `src/PaperBinder.Web/src/app/tenant-dashboard-route.tsx` - empty alert title | `Low` |
| `Add a binder from the binders page to start organizing documents in this workspace.` | `src/PaperBinder.Web/src/app/tenant-dashboard-route.tsx` - empty alert body | `Low` |
| `Open binder` | `src/PaperBinder.Web/src/app/tenant-dashboard-route.tsx` - row CTA | `Low` |
| `Next actions` | `src/PaperBinder.Web/src/app/tenant-dashboard-route.tsx` - panel title | `Low` |
| `Move directly to the routes most likely to matter in this workspace.` | `src/PaperBinder.Web/src/app/tenant-dashboard-route.tsx` - panel body | `Medium` |
| `Add your first binder` / `Review binders` | `src/PaperBinder.Web/src/app/tenant-dashboard-route.tsx` - primary CTA | `Low` |
| `Manage users` | `src/PaperBinder.Web/src/app/tenant-dashboard-route.tsx` - secondary CTA | `Low` |
| `Users and access stays role-aware.` | `src/PaperBinder.Web/src/app/tenant-dashboard-route.tsx` - alert title | `Medium` |
| `Workspace admins see user management here when that action is available.` | `src/PaperBinder.Web/src/app/tenant-dashboard-route.tsx` - alert body | `Medium` |

## Binders

| Text | Location in code | AI smell |
| --- | --- | --- |
| `Workspace library` | `src/PaperBinder.Web/src/app/tenant-binders-route.tsx` - eyebrow | `Medium` |
| `Binders` | `src/PaperBinder.Web/src/app/tenant-binders-route.tsx` - title | `Low` |
| `Create and open the binders currently available to this workspace.` | `src/PaperBinder.Web/src/app/tenant-binders-route.tsx` - intro body | `Low` |
| `Available binders` | `src/PaperBinder.Web/src/app/tenant-binders-route.tsx` - panel title | `Low` |
| `Only binders visible to this session appear here.` | `src/PaperBinder.Web/src/app/tenant-binders-route.tsx` - panel body | `Medium` |
| `Workspace binders` | `src/PaperBinder.Web/src/app/tenant-binders-route.tsx` - table caption | `Low` |
| `Binder` / `Created` / `Actions` | `src/PaperBinder.Web/src/app/tenant-binders-route.tsx` - table headers | `Low` |
| `No binders are visible in this workspace yet.` | `src/PaperBinder.Web/src/app/tenant-binders-route.tsx` - table empty state | `Low` |
| `Loading workspace binders...` | `src/PaperBinder.Web/src/app/tenant-binders-route.tsx` - table loading label | `Low` |
| `Add binder` | `src/PaperBinder.Web/src/app/tenant-binders-route.tsx` - panel title and submit button | `Low` |
| `Create a binder to group immutable source documents in this workspace.` | `src/PaperBinder.Web/src/app/tenant-binders-route.tsx` - panel body | `Medium` |
| `Binder name` | `src/PaperBinder.Web/src/app/tenant-binders-route.tsx` - field label | `Low` |
| `Use a clear name people in this workspace can recognize.` | `src/PaperBinder.Web/src/app/tenant-binders-route.tsx` - field hint | `Low` |
| `Operations` | `src/PaperBinder.Web/src/app/tenant-binders-route.tsx` - placeholder | `Low` |
| `Binder added.` | `src/PaperBinder.Web/src/app/tenant-binders-route.tsx` - success alert title | `Low` |
| `{binderName} is now available in this workspace.` | `src/PaperBinder.Web/src/app/tenant-binders-route.tsx` - success alert body template | `Low` |
| `{label} copied.` / `{label} is ready to paste.` | `src/PaperBinder.Web/src/app/tenant-binders-route.tsx` - toast success template | `Low` |
| `Could not copy {label}.` / `Clipboard access is not available in this browser session.` | `src/PaperBinder.Web/src/app/tenant-binders-route.tsx` - toast warning template | `Low` |

## Binder Detail And Binder Policy

| Text | Location in code | AI smell |
| --- | --- | --- |
| `Binder detail` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - eyebrow and loading state | `Low` |
| `Back to binders` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - CTA | `Low` |
| `Loading binder` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - loading title | `Low` |
| `PaperBinder is loading binder details and visible documents.` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - loading body | `Medium` |
| `Work with the documents currently available in this binder.` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - intro body | `Low` |
| `Visible documents` / `Created` / `Binder id` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - stat labels | `Low` |
| `Documents` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - panel title | `Low` |
| `Open the documents currently visible in this binder.` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - panel body | `Low` |
| `Binder documents` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - table caption | `Low` |
| `Document` / `Created` / `Supersedes` / `Actions` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - table headers | `Low` |
| `No documents are visible in this binder yet.` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - table empty state | `Low` |
| `Open document` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - row CTA and post-create CTA | `Low` |
| `None` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - supersedes display | `Low` |
| `Binder access` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - policy card title | `Low` |
| `Choose inherited workspace access or limit this binder to specific roles.` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - policy card body | `Medium` |
| `Loading binder policy...` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - policy loading state | `Low` |
| `Access mode` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - policy field label | `Low` |
| `Keep inherited access for normal behavior, or limit the binder to a specific set of roles.` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - policy field hint | `Medium` |
| `Use workspace role access` / `Limit to selected roles` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - policy select options | `Low` |
| `Allowed roles` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - policy legend | `Low` |
| `Only the selected roles can open this binder.` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - policy helper text | `Low` |
| `Binder access saved.` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - policy success title | `Low` |
| `The binder now reflects the latest confirmed access rules.` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - policy success body | `Medium` |
| `Save policy` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - policy submit button | `Low` |

## Document Creation And Detail

| Text | Location in code | AI smell |
| --- | --- | --- |
| `Add document` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - section title and submit button | `Low` |
| `Save a new immutable source document in this binder.` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - section body | `Medium` |
| `Document title` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - field label | `Low` |
| `Up to 200 characters.` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - field hint | `Low` |
| `Security handbook` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - title placeholder | `Low` |
| `Document source` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - field label; `src/PaperBinder.Web/src/app/tenant-document-detail-route.tsx` - source view title | `Low` |
| `Markdown supported.` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - content hint | `Low` |
| `# Operations handbook` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - content placeholder | `Low` |
| `Supersedes` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - field label; `src/PaperBinder.Web/src/app/tenant-document-detail-route.tsx` - stat label | `Low` |
| `Optional. Link this document to an earlier visible document in the same binder.` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - supersedes hint | `Medium` |
| `No superseded document` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - supersedes option | `Low` |
| `Document added.` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - success title | `Low` |
| `{documentTitle} is now available in this binder.` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - success body template | `Low` |
| `Document detail` | `src/PaperBinder.Web/src/app/tenant-document-detail-route.tsx` - eyebrow and loading state | `Low` |
| `Loading document` | `src/PaperBinder.Web/src/app/tenant-document-detail-route.tsx` - loading title | `Low` |
| `PaperBinder is loading the current document.` | `src/PaperBinder.Web/src/app/tenant-document-detail-route.tsx` - loading body | `Medium` |
| `Read the rendered markdown by default, or switch to source when you need the stored document body.` | `src/PaperBinder.Web/src/app/tenant-document-detail-route.tsx` - intro body | `Medium` |
| `Created` / `Format` / `Status` | `src/PaperBinder.Web/src/app/tenant-document-detail-route.tsx` - stat labels | `Low` |
| `Markdown` | `src/PaperBinder.Web/src/app/tenant-binder-detail-route.tsx` - content type label; `src/PaperBinder.Web/src/app/tenant-document-detail-route.tsx` - format stat | `Low` |
| `Linked document` | `src/PaperBinder.Web/src/app/tenant-document-detail-route.tsx` - supersedes fallback label | `Low` |
| `Archived` / `Active` | `src/PaperBinder.Web/src/app/tenant-document-detail-route.tsx` - status badge | `Low` |
| `Archived document visible by direct id.` | `src/PaperBinder.Web/src/app/tenant-document-detail-route.tsx` - archive alert title | `Medium` |
| `Binder lists hide archived documents, but direct reads remain available to allowed users.` | `src/PaperBinder.Web/src/app/tenant-document-detail-route.tsx` - archive alert body | `Medium` |
| `Document preview` | `src/PaperBinder.Web/src/app/tenant-document-detail-route.tsx` - rendered view title | `Low` |
| `Read-only markdown source is shown exactly as stored for this workspace.` | `src/PaperBinder.Web/src/app/tenant-document-detail-route.tsx` - source view helper | `Medium` |
| `Rendered markdown is shown by default so the document reads like a finished page.` | `src/PaperBinder.Web/src/app/tenant-document-detail-route.tsx` - preview helper | `Medium` |
| `View Rendered` / `View Source` | `src/PaperBinder.Web/src/app/tenant-document-detail-route.tsx` - view toggle | `Low` |
| `Reference metadata` | `src/PaperBinder.Web/src/app/tenant-document-detail-route.tsx` - metadata title | `Medium` |
| `Document id` / `Binder id` | `src/PaperBinder.Web/src/app/tenant-document-detail-route.tsx` - metadata labels | `Low` |
| `Back to binder` | `src/PaperBinder.Web/src/app/tenant-document-detail-route.tsx` - CTA | `Low` |

## Users And Access

| Text | Location in code | AI smell |
| --- | --- | --- |
| `Access management` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - eyebrow | `Medium` |
| `Users and access` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - title | `Low` |
| `Keep the full user list on screen while add-user, role updates, and impersonation actions expand on this route.` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - intro body | `High` |
| `Current users` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - panel title | `Low` |
| `Role changes, owner visibility, and impersonation eligibility stay server-enforced for this workspace.` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - panel body | `High` |
| `Workspace users` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - table caption | `Low` |
| `Email` / `Role` / `Ownership` / `Actions` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - table headers | `Low` |
| `No workspace users are available.` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - table empty state | `Low` |
| `Loading workspace users...` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - table loading label | `Low` |
| `Owner` / `Member` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - ownership display | `Low` |
| `Manage user {email}` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - manage button aria label | `Low` |
| `Manage` / `Managing` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - manage button text | `Low` |
| `Manage selected user` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - detail panel heading | `Low` |
| `Role changes and impersonation start here without leaving the current user list.` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - detail panel body | `Medium` |
| `Close panel` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - CTA | `Low` |
| `Select a user from the table to expand the role-change and view-as panels here.` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - empty selection state | `Medium` |
| `User` / `Current role` / `User ID` / `Ownership` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - selected-user metadata labels | `Low` |
| `Change role` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - subpanel title | `Low` |
| `Update the effective role used when this user signs into the workspace.` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - subpanel body | `Medium` |
| `Role for {email}` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - field label | `Low` |
| `Role changes stay within the tenant-scoped permissions model.` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - field hint | `High` |
| `Role saved.` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - success title | `Low` |
| `{email} now uses the selected role.` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - success body template | `Low` |
| `Save role` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - CTA | `Low` |
| `Impersonate` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - subpanel title | `Low` |
| `Start impersonation from this user-management surface only.` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - subpanel body | `High` |
| `Eligible on this screen` / `Not eligible` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - status badge | `Medium` |
| `Use impersonation when you need to confirm the workspace from the selected member role.` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - impersonation helper | `Medium` |
| `Stop the current impersonation session before starting another one.` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - impersonation helper | `Low` |
| `The current effective user cannot impersonate itself.` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - impersonation helper | `Medium` |
| `Impersonate this user` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - CTA | `Low` |
| `Add user` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - panel title and submit button | `Low` |
| `Create a workspace member with an initial role. PaperBinder issues the temporary password on the server and shows it once after creation.` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - panel body | `Medium` |
| `Use the email this workspace member will sign in with.` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - email hint | `Low` |
| `member@tenant.local` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - email placeholder | `Low` |
| `Each workspace member has one role in v1.` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - role hint | `Medium` |
| `User added.` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - success title | `Low` |
| `{email} was added to this workspace.` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - success body template | `Low` |
| `Record these one-time credentials now if you need to hand them to the user.` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - success body | `Low` |
| `Workspace email` / `Workspace password` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - credential field labels | `Low` |
| `Shown once after creation for credential handoff.` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - email hint | `Medium` |
| `Masked by default and shown once after the server creates the user.` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - password hint | `Low` |
| `Copy workspace email for {email}` / `Copy workspace password for {email}` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - credential copy labels | `Low` |
| `Show workspace password` / `Hide workspace password` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - password reveal labels | `Low` |
| `User added to workspace.` / `{email} can now be managed from this route.` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - create-user toast | `Low` |
| `Role updated.` / `{email} now uses {role}.` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - role-update toast | `Low` |
| `Impersonation started.` / `The workspace is switching to the selected effective user.` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - impersonation toast | `Medium` |
| `Could not copy user email.` / `User email is ready to paste.` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - credential copy toasts | `Low` |
| `Temporary password copied.` / `Temporary password is ready to paste.` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - credential copy toasts | `Low` |
| `Could not copy temporary password.` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` - credential copy warning | `Low` |

## Server-Rendered Tenant Failure Page

| Text | Location in code | AI smell |
| --- | --- | --- |
| `PaperBinder` | `src/PaperBinder.Api/TenantHostFailurePage.cs` - static brand label | `Low` |
| `{encodedTitle}` | `src/PaperBinder.Api/TenantHostFailurePage.cs` - dynamic page title and `h1` | `N/A` |
| `{encodedDetail}` | `src/PaperBinder.Api/TenantHostFailurePage.cs` - dynamic page body | `N/A` |

## Highest-Smell Candidates

These are the clearest candidates for follow-up edits or removal in the later copy-change pass:

| Text | Location in code | Why it stands out |
| --- | --- | --- |
| `Review the product itself instead of a marketing abstraction.` | `src/PaperBinder.Web/src/app/root-host.tsx` | Reads like critique/meta commentary, not product copy. |
| `Provision a temporary tenant and keep the server in charge.` | `src/PaperBinder.Web/src/app/root-host.tsx` | Contract- and implementation-heavy. |
| `PaperBinder normalizes the workspace name on the server before opening the demo.` | `src/PaperBinder.Web/src/app/root-host.tsx` | Internal-processing narration in helper text. |
| `Root-host sign in remains available for return visits and still relies on the same server-approved destination.` | `src/PaperBinder.Web/src/app/root-host.tsx` | Strongly mechanical and architecture-forward. |
| `Provisioning sends only workspace name plus challenge proof through the SPA client.` | `src/PaperBinder.Web/src/app/root-host.tsx` | Reviewer/implementation commentary. |
| `Redirect navigation uses only the absolute \`redirectUrl\` returned by the server.` | `src/PaperBinder.Web/src/app/root-host.tsx` | API-contract phrasing rather than product phrasing. |
| `Return to a previously provisioned workspace with valid credentials. Redirect resolution stays on the server so the browser never builds tenant URLs from user input.` | `src/PaperBinder.Web/src/app/root-host.tsx` | Accurate, but overly defensive and implementation-led for the main public flow. |
| `PaperBinder uses the existing cookie-auth session model after successful login.` | `src/PaperBinder.Web/src/app/root-host.tsx` | Internal architecture copy on a user form. |
| `It is a hiring artifact and architecture demonstration, not a broad enterprise suite.` | `src/PaperBinder.Web/src/app/root-host.tsx` | Repo-truthful, but still reviewer/meta-heavy for product-facing copy. |
| `PaperBinder keeps workspace routing host-derived even when this workspace cannot be opened.` | `src/PaperBinder.Web/src/app/tenant-shell.tsx` | Internal routing mechanism is foregrounded in a failure surface. |
| `Unknown routes stay on the root host instead of guessing tenant identity or crossing into workspace routes.` | `src/PaperBinder.Web/src/app/root-host.tsx` | Correct, but sounds like system-design commentary. |
| `Role changes, owner visibility, and impersonation eligibility stay server-enforced for this workspace.` | `src/PaperBinder.Web/src/app/tenant-users-route.tsx` | Reads like review notes, not user help text. |
