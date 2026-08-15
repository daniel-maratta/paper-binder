# V1.1.1 Patch Implementation Plan

Status: Complete through CP6; legal-readiness addendum queued
Target release: `v1.1.1`
Authority: This file defines the checkpoint and commit plan for the `v1.1.1` patch. The matching taskboard source is `docs/05-taskboard/v1-1-1-backlog.md`.

## Purpose

Ship a narrow `v1.1.1` patch after the published `v1.1.0` release.

This patch is cleanup and release-readiness work only. It does not expand PaperBinder's product scope, tenancy model, authorization model, deployment model, or public API contract.

## Scope

Included:

- Release Validation Generalization.
- Compose Configuration Noise Cleanup.
- API Surface and Ceremony Review: discovery plus only very small cleanup.
- Maintainability Review: discovery plus only safe mechanical splits if obviously beneficial.
- `README.md` cleanup, polish, and provenance.
- Restore the About-page link to the real flagship article.
- Final validation before the hiring assessment review.
- Remediation of findings surfaced by that final review before release.
- Legal readiness addendum after the legality audit.

Out of scope unless the owner explicitly changes the patch scope:

- Archive/unarchive frontend controls.
- React Router major-version upgrade after same-major audit remediation (`T-0053`).
- Overall API shape and over-ceremony remediation as minor-version engineering-quality work (`T-0054`).
- Light / Dark / System theme preference.
- Fun `404` game treatment.
- New product features, new endpoint behavior, new deployment topology, or speculative abstraction.

## Checkpoints And Commits

| Checkpoint | Task | Scope | Intended commit |
| --- | --- | --- | --- |
| CP1 | `T-0046` | Create this plan, create the `v1.1.1` backlog, queue the tasks, and update docs navigation so the plan and taskboard agree. | `docs(taskboard): Plan v1.1.1 patch checkpoints` |
| CP2 | `T-0047`, `T-0048` | Generalize release validation away from the pinned CP17 artifact assumption, then quiet optional Docker Compose lease-extension variable warnings without changing runtime semantics. | `chore(release): Generalize validation and compose defaults` |
| CP3 | `T-0049` | Run the API surface and ceremony review. Make only obviously safe, tiny cleanup where it reduces duplication without weakening tenant isolation, authorization, CSRF, validation, or problem-response consistency. | `refactor(api): Trim small ceremony after surface review` |
| CP4 | `T-0050` | Run the maintainability review. Apply only safe mechanical splits if they are clearly beneficial and low-risk; otherwise record findings and defer. | `refactor: Split obvious maintainability hotspots` |
| CP5 | `T-0051` | Polish `README.md` provenance/reviewer copy and restore the real flagship-article link on the About page. | `docs(readme): Polish provenance and restore article link` |
| CP6 | `T-0052` | Run final validation, complete the hiring assessment review, remediate any findings that are in patch scope, and record release readiness. | `chore(release): Validate v1.1.1 release readiness` |
| CP7 | `T-0055` | Close public legal-surface gaps: Privacy Policy, Terms of Use, Cookie Notice, Legal footer exposure, retention inventory, licensing/asset provenance, security maintenance policy, and logging/privacy alignment. | See `docs/95-delivery/v1-1-1-legal-readiness-plan.md` |

If CP6 surfaces findings that need code changes, remediation happens after the review and before release. Small, same-area fixes may stay in CP6; larger or cross-cutting findings must become new taskboard tasks and checkpoint commits before `v1.1.1` is declared clean.
CP7 was added after the legality audit and is now release-blocking for treating `v1.1.1` as legally ready.

## Execution Rules

- Keep one cohesive commit per checkpoint.
- CP7 may use multiple cohesive commits as defined by `docs/95-delivery/v1-1-1-legal-readiness-plan.md` because legal readiness crosses public UI, notices, documentation, licensing, and logging behavior.
- Preserve tenant isolation, authorization, CSRF, validation, and problem-response consistency as non-negotiable.
- Do discovery before cleanup for CP3 and CP4; do not refactor for aesthetics alone.
- If a cleanup would require broad behavior changes, new abstractions, new dependencies, or uncertain reviewer value, record it as a deferred finding instead.
- Keep plan changes synchronized across this file, `docs/05-taskboard/v1-1-1-backlog.md`, `docs/05-taskboard/work-queue.md`, and the relevant `T-####` task files.
- Keep CP7 synchronized with `docs/95-delivery/v1-1-1-legal-readiness-plan.md` and `docs/05-taskboard/tasks/T-0055-v1-1-1-legal-readiness.md`.

## Validation Gates

Per checkpoint:

- Docs-only checkpoint: run `scripts/validate-docs.ps1`.
- Tooling/config checkpoint: run focused script/config validation plus `scripts/validate-docs.ps1`.
- API or maintainability checkpoint: run focused tests first, then the repo-native build/test/doc gates appropriate to touched code.
- Browser-surface checkpoint: run affected frontend tests and browser checks as needed.

Final release validation before the hiring assessment review:

- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-version.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
- `powershell -ExecutionPolicy Bypass -File .\scripts\run-browser-e2e.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\reviewer-full-stack.ps1 -NoBrowser`

The final hiring assessment review happens only after those gates pass or have explicit, owner-approved waivers. Any findings from that review are remediated before the `v1.1.1` release is called clean, except for explicit carry-forwards recorded in the taskboard.
