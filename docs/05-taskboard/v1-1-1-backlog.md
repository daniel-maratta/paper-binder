# V1.1.1 Backlog

Status: Active
Authority: This file is the single source of truth for the `v1.1.1` patch backlog and must agree with `docs/95-delivery/v1-1-1-implementation-plan.md`.

## Purpose

Track the narrow post-`v1.1.0` patch requested for `v1.1.1`.

The patch is cleanup, release validation hardening, reviewer-artifact polish, and final assessment readiness. It is not a product expansion.

## Reconciled Execution Order

1. [T-0046: V1.1.1 Patch Planning And Taskboard Alignment](./tasks/T-0046-v1-1-1-patch-planning-and-taskboard-alignment.md) - done
2. [T-0047: V1.1.1 Release Validation Generalization](./tasks/T-0047-v1-1-1-release-validation-generalization.md) - done
3. [T-0048: V1.1.1 Compose Configuration Noise Cleanup](./tasks/T-0048-v1-1-1-compose-configuration-noise-cleanup.md) - done
4. [T-0049: V1.1.1 API Surface And Ceremony Review](./tasks/T-0049-v1-1-1-api-surface-and-ceremony-review.md) - done
5. [T-0050: V1.1.1 Maintainability Review](./tasks/T-0050-v1-1-1-maintainability-review.md) - queued
6. [T-0051: V1.1.1 README Provenance And About Article Link](./tasks/T-0051-v1-1-1-readme-provenance-and-about-article-link.md) - queued
7. [T-0052: V1.1.1 Final Validation And Hiring Assessment Review](./tasks/T-0052-v1-1-1-final-validation-and-hiring-assessment-review.md) - queued

## Checkpoint Agreement

| Checkpoint | Task(s) | Required outcome |
| --- | --- | --- |
| CP1 | `T-0046` | Plan, taskboard, queue, task files, and docs navigation all agree on `v1.1.1` scope and order. |
| CP2 | `T-0047`, `T-0048` | Release validation is generalized and Compose optional-variable warnings are quieted without runtime behavior drift. |
| CP3 | `T-0049` | API ceremony review is recorded; only tiny, safe cleanup lands if justified by discovery. |
| CP4 | `T-0050` | Maintainability review is recorded; only safe mechanical splits land if obviously beneficial. |
| CP5 | `T-0051` | README provenance polish and real flagship-article About link are restored and tested. |
| CP6 | `T-0052` | Full validation passes, hiring assessment review is completed, review findings are remediated or explicitly carried forward, and release readiness is recorded. |

## Explicit Carry-Forwards Not In V1.1.1

These are known, intentional carry-forwards. They are not part of the `v1.1.1` patch unless the owner explicitly changes scope.

| Carry-forward | Source | Disposition |
| --- | --- | --- |
| Build a frontend archive/unarchive control for documents. | `T-0045` finding F3 | Deferred beyond `v1.1.1`; backend/API capability remains documented, frontend UI is separate product work. |
| React Router 7 to 8 migration. | `T-0045` finding F5 | Deferred beyond `v1.1.1`; major-version dependency migration requires its own task and validation pass. |
| Add a Light / Dark / System theme preference. | `taskboard-intake.md` | Deferred future feature. |
| Add a fun `404` game treatment. | `taskboard-intake.md` | Deferred future feature. |

## Planning Invariant

Any change to checkpoint order, task ownership, or release scope must update all of:

- this file
- `docs/95-delivery/v1-1-1-implementation-plan.md`
- `docs/05-taskboard/work-queue.md`
- the affected `docs/05-taskboard/tasks/T-####-*.md` files
