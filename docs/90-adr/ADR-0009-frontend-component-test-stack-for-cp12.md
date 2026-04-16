# ADR-0009: Frontend Component Tests Use Vitest With React Testing Library On jsdom

Status: Accepted

## Context

CP12 introduces the first real frontend foundation for PaperBinder. The repo needs:

- deterministic component and utility coverage for the host-aware SPA foundation before CP13 and CP14 add real user flows
- a test runner that fits the existing Vite-based frontend workspace without introducing a second frontend runtime model
- DOM-level assertions for shared primitives, route composition, and ProblemDetails-aware client behavior without pulling Playwright or other browser E2E tooling forward

PaperBinder already treats stack growth conservatively:

- the frontend remains a client-rendered React SPA in the existing `src/PaperBinder.Web` workspace
- CP12 coverage stops at component and utility tests; E2E browser automation remains later-checkpoint work
- repo-native validation must run the frontend test command explicitly instead of leaving the SPA surface untested

CP12 therefore needs an explicit component-test-stack decision instead of adding test tooling by accident.

## Decision

Use the following frontend component-test stack for PaperBinder CP12 and the V1 SPA baseline:

- Vitest as the frontend component and utility test runner
- React Testing Library for DOM-oriented component rendering and queries
- jsdom as the browser-like test environment
- `@testing-library/jest-dom` matchers for accessible DOM assertions in Vitest

The runtime boundary is strict:

- this stack is for component and utility tests only
- it does not introduce browser E2E automation, SSR, framework-mode routing, or a second application runtime
- frontend tests run through checked-in npm scripts and repo-native validation rather than ad-hoc local commands

## Why

- Keeps the test runner aligned with the existing Vite toolchain instead of introducing a separate frontend build or test runtime.
- Supports route, shell, and primitive rendering tests with realistic DOM semantics and lightweight setup.
- Closes the current reviewer-visible frontend testing gap before real CP13 and CP14 browser flows land.
- Preserves the checkpoint boundary by adding component coverage without pulling Playwright-driven flow testing forward.

## Consequences

- Positive: the frontend foundation now has deterministic repo-native automated coverage instead of a placeholder-only gap.
- Positive: shared primitives, host-context logic, and API-client behavior can fail fast in local validation and CI.
- Negative: the frontend workspace now carries a small component-test dependency set that must stay scoped to CP12-style DOM testing.
- Negative: jsdom is not a full browser, so true end-to-end auth, redirect, and network-flow behavior still requires later E2E coverage.

## Alternatives considered

- Node-only tests without a DOM environment: rejected because they do not credibly exercise route composition, dialog behavior, or accessible UI primitives.
- Playwright in CP12: rejected because it would pull later-checkpoint E2E scope and environment cost forward.
- Cypress component testing: rejected because it adds a heavier second runner when the Vite-native option is sufficient for CP12.
