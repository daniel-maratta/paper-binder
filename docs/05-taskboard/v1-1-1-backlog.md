# V1.1.1 Backlog

Status: Complete through T-0052; T-0055 legal-readiness addendum queued
Authority: This file is the single source of truth for the `v1.1.1` patch backlog and must agree with `docs/95-delivery/v1-1-1-implementation-plan.md`.

## Purpose

Track the narrow post-`v1.1.0` patch requested for `v1.1.1`.

The patch is cleanup, release validation hardening, reviewer-artifact polish, and final assessment readiness. It is not a product expansion.

## Reconciled Execution Order

1. [T-0046: V1.1.1 Patch Planning And Taskboard Alignment](./tasks/T-0046-v1-1-1-patch-planning-and-taskboard-alignment.md) - done
2. [T-0047: V1.1.1 Release Validation Generalization](./tasks/T-0047-v1-1-1-release-validation-generalization.md) - done
3. [T-0048: V1.1.1 Compose Configuration Noise Cleanup](./tasks/T-0048-v1-1-1-compose-configuration-noise-cleanup.md) - done
4. [T-0049: V1.1.1 API Surface And Ceremony Review](./tasks/T-0049-v1-1-1-api-surface-and-ceremony-review.md) - done
5. [T-0050: V1.1.1 Maintainability Review](./tasks/T-0050-v1-1-1-maintainability-review.md) - done
6. [T-0051: V1.1.1 README Provenance And About Article Link](./tasks/T-0051-v1-1-1-readme-provenance-and-about-article-link.md) - done
7. [T-0052: V1.1.1 Final Validation And Hiring Assessment Review](./tasks/T-0052-v1-1-1-final-validation-and-hiring-assessment-review.md) - done
8. [T-0055: V1.1.1 Legal Readiness](./tasks/T-0055-v1-1-1-legal-readiness.md) - queued

## Checkpoint Agreement

| Checkpoint | Task(s) | Required outcome |
| --- | --- | --- |
| CP1 | `T-0046` | Plan, taskboard, queue, task files, and docs navigation all agree on `v1.1.1` scope and order. |
| CP2 | `T-0047`, `T-0048` | Release validation is generalized and Compose optional-variable warnings are quieted without runtime behavior drift. |
| CP3 | `T-0049` | API ceremony review is recorded; only tiny, safe cleanup lands if justified by discovery. |
| CP4 | `T-0050` | Maintainability review is recorded; only safe mechanical splits land if obviously beneficial. |
| CP5 | `T-0051` | README provenance polish and real flagship-article About link are restored and tested. |
| CP6 | `T-0052` | Full validation passes, hiring assessment review is completed, review findings are remediated or explicitly carried forward, and release readiness is recorded. |
| CP7 | `T-0055` | Public legal pages, footer exposure, data/retention inventory, license/asset notices, security maintenance policy, and logging/privacy alignment are complete. |

## Explicit Carry-Forwards Not In V1.1.1

These are known, intentional carry-forwards. They are not part of the `v1.1.1` patch unless the owner explicitly changes scope.

| Carry-forward | Source | Disposition |
| --- | --- | --- |
| Build a frontend archive/unarchive control for documents. | `T-0045` finding F3 | Deferred beyond `v1.1.1`; backend/API capability remains documented, frontend UI is separate product work. |
| React Router major-version upgrade. | `T-0045` finding F5 / `T-0052` finding F3 / [T-0053](./tasks/T-0053-react-router-major-version-upgrade.md) | Deferred beyond `v1.1.1`; same-major audit remediation updated React Router 7 packages, and the remaining RSC-mode advisory is not applicable to PaperBinder's client-rendered SPA runtime mode. The carry-forward is still the router major-version upgrade, not merely audit remediation, and requires its own minor-version task and validation pass. |
| Overall API shape and over-ceremony remediation. | `T-0049` / `T-0050` / `T-0052` / [T-0054](./tasks/T-0054-minor-version-api-shape-and-ceremony-review.md) | Deferred beyond `v1.1.1`; patch work completed discovery and safe mechanical splits only. The broader PaperBinder API/code-shape cleanup is tracked as minor-version engineering-quality work so endpoint ceremony, application contracts, service/file size, test shape, and naming can be addressed without weakening tenant isolation or reviewer clarity. |
| Frontend composition hotspots in `root-host.tsx` and related shell components. | Final hiring-assessment polish / [T-0054](./tasks/T-0054-minor-version-api-shape-and-ceremony-review.md) | Deferred beyond `v1.1.1`; `src/PaperBinder.Web/src/app/root-host.tsx` still concentrates route ownership, public-shell composition, view-state assembly, and auth/redirect flow handling in one seam. Backend maintainability hotspots were split during `v1.1.x` work; a future frontend pass should extract route sections, shell composition, and view-model helpers around stable responsibilities without changing user-facing behavior. |
| Add a Light / Dark / System theme preference. | `taskboard-intake.md` | Deferred future feature. |
| Add a fun `404` game treatment. | `taskboard-intake.md` | Deferred future feature. |

## Planning Invariant

Any change to checkpoint order, task ownership, or release scope must update all of:

- this file
- `docs/95-delivery/v1-1-1-implementation-plan.md`
- `docs/05-taskboard/work-queue.md`
- the affected `docs/05-taskboard/tasks/T-####-*.md` files
- `docs/95-delivery/v1-1-1-legal-readiness-plan.md` when legal-readiness scope changes
