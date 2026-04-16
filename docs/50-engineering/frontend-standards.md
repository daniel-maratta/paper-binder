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

## UI and Dependency Rules

- Tailwind CSS and Radix UI primitives are the default UI baseline.
- CP12 shared primitive baseline includes Button, Card, Banner, form fields, tables, alerts, dialogs, and status badges before feature-specific composites are added.
- Prefer lightweight native React form handling for V1.
- Do not add `react-hook-form`, `zod`, SSR, route-module server loaders/actions, or realtime channels unless scope changes explicitly.
- Shared UI primitives should be introduced before repeated feature-specific one-offs.

## Error and Security Rules

- API failures are handled through ProblemDetails-aware UX.
- Unsafe cookie-auth requests require CSRF protection.
- UI must not make tenant-scoping decisions from user-editable payloads.
- Permissions should be enforced in the API; frontend guards improve UX but do not replace backend policy checks.

## Testing Rules

- Vitest with React Testing Library on jsdom is the baseline for frontend component and utility tests.
- Component tests cover shared primitives, host-aware routing, and critical client error handling.
- E2E tests cover provisioning, login, tenant navigation, lease flows, and major deny paths.
- Prefer Playwright for E2E coverage in V1.

## Related Documents

- `docs/20-architecture/frontend-spa.md`
- `docs/10-product/ui-ux-contract-v1.md`
- `docs/80-testing/e2e-tests.md`
