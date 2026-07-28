# T-0039: V1.1 Comprehensive Responsive QA

## Status
done

## Type
risk

## Priority
P1

## Owner
agent

## Created
2026-07-22

## Updated
2026-07-23

## Checkpoint
Cross-checkpoint

## Phase
V1.1 close-out

## Summary
Run and record a comprehensive responsiveness QA pass across public and authenticated pages after documentation cleanup and bundled product screenshot updates land.

## Context
- A temporary screenshot sweep proved the capture approach, but the artifacts were intentionally removed and not committed.
- This task should turn the approach into durable QA evidence and remediation tracking after `T-0038`.
- Owner direction on 2026-07-23 moved documentation cleanup and product screenshot refresh ahead of this responsive QA pass.

## Acceptance Criteria
- [x] Public routes are checked at common desktop/mobile sizes and app breakpoints.
- [x] Authenticated routes are checked with representative seeded tenant content.
- [x] Issues are fixed or tracked with explicit severity and owner.
- [x] QA evidence is recorded in the taskboard or release-facing docs as appropriate.

## Dependencies
- [T-0040](./T-0040-v1-1-documentation-truth-pruning.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: QA and small responsive fixes only. Larger implementation findings should become follow-up tasks.
- Pre-PR Critique: Confirm coverage includes real data and long content.
- Escalation Notes: Browser capture may require the local Docker stack.

## Current State
- Done. Comprehensive viewport/route sweep completed against the isolated Docker E2E stack; one release-relevant defect found and fixed, two smaller items tracked in the Inbox for later work.

## Touch Points
- `src/PaperBinder.Web/src/styles.css`
- `src/PaperBinder.Web/src/app/`
- `docs/05-taskboard/`
- `docs/80-testing/`

## Implementation Plan
- Defined a route x viewport matrix bracketing every explicit CSS breakpoint in `styles.css` (420px, 768px, 1023/1024px, 1180px) plus the JS-driven desktop-shell threshold (`desktopShellMediaQuery = "(min-width: 1024px)"` in `tenant-shell.tsx`).
- Added `scripts/capture-responsive-qa-screenshots.ps1` (modeled on `scripts/capture-product-screenshots.ps1`) to provision a tenant, seed a binder/document/reader user, and sweep public + authenticated routes and states across 5 viewports: `390x844` (narrow mobile), `768x1024` (tablet), `1100x800` and `1280x832` (bracketing the 1024-1180 shell range), `1440x900` (desktop).
- Captured 34 screenshots per pass into a scratch directory (not committed; same disposition as the temporary sweep noted in T-0040).
- Reviewed every screenshot; found and fixed one confirmed release-relevant defect, and logged two smaller items to the Inbox rather than fixing them same-day (see below).

## Next Action
- None. Pull `T-0041` (Accessibility QA) into `Now` next.

## Validation Evidence
- `powershell -ExecutionPolicy Bypass -File .\scripts\capture-responsive-qa-screenshots.ps1` run 5 times against the isolated Docker E2E stack (`docker-compose.yml` + `docker-compose.e2e.yml`, project `paperbinder-e2e`) while iterating on the fix; final run captured all 34 screenshots and completed the full click-through flow (provision, binders, binder/document detail, mobile menu, users, impersonation, reader-denied) with exit code 0.
- Visually confirmed the shell-grid fix at `1100x800` and `1280x832`: authenticated shell now renders the correct side-by-side sidebar+main layout at both widths (previously broken at `1100x800`, correct at `1280x832`), and remains correct at `390x844`/`768x1024` (mobile hamburger chrome) and `1440x900` (desktop).
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`: passed.
- `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1`: passed, 63 tests across 9 files.

## Decision Notes
- **Fixed (release-relevant):** `.pb-auth-grid`/`.pb-auth-sidebar`/`.pb-auth-main`/`.pb-auth-shell-body` in `styles.css` collapsed to a single-column, position:relative layout at `max-width: 1180px`, but `useIsDesktopShell()` (`tenant-shell.tsx`) only switches to the mobile hamburger chrome below `1024px`. Every viewport in the `1024-1180px` range therefore rendered the full desktop sidebar *and* the collapsed-grid override at once: the sidebar (nav, footer) stacked as a full-width block above the header/content instead of sitting beside it. This affected the entire authenticated shell (dashboard, binders, users, binder/document detail) for a real, common width range (e.g. small laptop/tablet-landscape windows). Fix: moved the shell-grid override to `max-width: 1023px` so it only applies when the JS-driven mobile chrome has actually replaced the sidebar; left the unrelated `.pb-auth-layout-split`/`.pb-auth-detail-grid` content-panel collapse at its original `1180px` threshold. Verified safe across the full `390-1440px` sweep after two earlier attempts at a different fix (see below) had to be reverted.
- **Deferred to Inbox (non-blocking, cosmetic):** the Binders list's binder-ID `CopyValueChip` (`tenant-binders-route.tsx`, via `copy-value-chip.tsx`) wraps character-by-character in the plain `DataTable` at narrow (<420px) widths, because the Binders page (unlike the Users page) never got a mobile-card alternative to its desktop table. Tried two CSS-only fixes (`white-space: nowrap` on the chip, then a fixed-width `text-overflow: ellipsis` truncation) — both caused the whole authenticated shell to render narrower than the viewport with the action button reachable only via scroll, because the table's `overflow-x-auto` wrapper doesn't isolate horizontal overflow from its flex/grid ancestors as expected. Reverted both; the underlying UX bug is real but the correct fix (a mobile-card list matching the existing Users pattern) is a larger implementation change, not a small responsive fix, so it's tracked in `docs/05-taskboard/taskboard-intake.md` Inbox instead of being forced into this task.
- **Deferred to Inbox (non-blocking, dead code found incidentally):** `TenantImpersonationBanner` (`tenant-impersonation-banner.tsx`) is defined but never imported or rendered anywhere; the only actual "view as" feedback is the header's account-label swap to "Viewing as". Not in scope for a responsive-QA pass to fix; logged to Inbox.
- No accessibility, content, or non-responsive layout remediation was attempted; that is `T-0041`'s scope.

## Validation Plan
- Browser screenshot/review matrix using app breakpoints and common sizes.

## Outcome
- Comprehensive responsive QA pass complete across public and authenticated surfaces at 5 viewports bracketing every CSS/JS breakpoint in the app.
- Fixed a confirmed, release-relevant authenticated-shell layout defect in the 1024-1180px range (CSS/JS breakpoint mismatch between `styles.css` and `tenant-shell.tsx`).
- Tracked two smaller, non-blocking items (Binders-table narrow-width copy-chip wrap; orphaned `TenantImpersonationBanner` component) in the Inbox for future work rather than expanding this task's scope.
- No product features, architecture, or accessibility work were touched.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
