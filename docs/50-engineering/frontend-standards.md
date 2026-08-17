# Frontend Standards
Status: V1 (Implementation Baseline)

## Purpose

Define repo-native frontend rules for the PaperBinder SPA.

## Runtime Rules

- PaperBinder uses a client-rendered React SPA built with Vite.
- API calls are made directly from the SPA with `credentials: "include"`.
- Browser `/api/*` transport must flow through one shared client layer.
- The SPA must send `X-Api-Version` on `/api/*` calls.
- Do not store auth tokens in localStorage or sessionStorage.
- Root-host and tenant-host experiences remain in one SPA with host-aware routing/guards.
- Root-host `/` owns the product-first public landing, root-host `/start-demo` owns provisioning and shown-once credential handoff, root-host `/login` remains the direct-login route, and root-host `/articles/building-paperbinder-production-shaped-saas-demo` hosts the public flagship article; tenant-host `/app`, `/app/binders`, `/app/binders/:binderId`, `/app/documents/:documentId`, and `/app/users` own the live product flows.

## UI and Dependency Rules

- Tailwind CSS and Radix UI primitives are the default UI baseline.
- CP12 shared primitive baseline includes Button, Card, Banner, form fields, tables, alerts, dialogs, and status badges before feature-specific composites are added.
- Prefer lightweight native React form handling for V1.
- Keep generated provisioning credentials in transient in-memory UI state only; do not persist them to browser storage, cookies, or query params.
- Do not add `react-hook-form`, `zod`, SSR, route-module server loaders/actions, or realtime channels unless scope changes explicitly.
- Shared UI primitives should be introduced before repeated feature-specific one-offs.

## Error and Security Rules

- API failures are handled through ProblemDetails-aware UX.
- Unsafe cookie-auth requests require CSRF protection.
- UI must not make tenant-scoping decisions from user-editable payloads.
- Browser-owned challenge wrapper markup must provide label, helper/error association, and visible state feedback around the provider surface.
- Permissions should be enforced in the API; frontend guards improve UX but do not replace backend policy checks.

## Testing Rules

- Vitest with React Testing Library on jsdom is the baseline for frontend component and utility tests.
- Component tests cover shared primitives, host-aware routing, and critical client error handling.
- CP13 E2E covers root-host provisioning/login and major deny paths through the dedicated root-host browser suite.
- The repo-native browser gate now covers the public landing, root-host demo-entry or login flows, and tenant-host navigation, lease, forbidden, expired, and logout/login-cycle flows.
- Prefer Playwright for E2E coverage in V1.

## Flagship Article Publication

- The accepted editorial source for the flagship article is `artifacts/Flagship Article - Release Candidate 2.docx`.
- The web representation of that article body lives at `src/PaperBinder.Web/src/content/articles/building-paperbinder-production-shaped-saas-demo.md` and renders on `/articles/building-paperbinder-production-shaped-saas-demo`.
- RC2 is the source of truth for article prose, headings, lists, links, figure order, and captions. Do not casually rewrite the article body in the Markdown representation.
- Publication chrome, article route composition, SEO/social metadata, JSON-LD, and calls to action are web-specific concerns and may evolve independently without changing accepted article prose.
- Article figures use the existing presentation assets in `src/PaperBinder.Web/public/presentation`; do not extract or regenerate DOCX images unless a required canonical presentation asset is missing.
- The article is part of the public reviewer and hiring artifact, not a separate blog design system or CMS.

## Related Documents

- `docs/20-architecture/frontend-spa.md`
- `docs/archive/presentation-history/v1-shipped/ui-ux-contract-v1.md`
- `docs/80-testing/e2e-tests.md`
