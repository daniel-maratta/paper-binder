# Phase 5 - Hardening And Release

Checkpoints: CP16, CP17

## Goal

Close security, operability, and documentation gaps, then package V1 as a reviewer-ready release.

## Entry Conditions

- Phases 1-4 exit criteria are satisfied.
- Known defects and risk backlog are triaged.
- Release scope is agreed and frozen for the cut.

## Checkpoints

### CP16 - Hardening And Consistency Pass

- Reconcile threat model, cookie/CSRF/host validation, secrets posture, and markdown sanitization with actual implementation.
- Add or finish OpenTelemetry, structured logging, and minimum operational metrics.
- Run defect remediation across backend, frontend, worker, and tests.
- Reconcile architecture, security, testing, runbook, and reviewer docs with shipped behavior.

### CP17 - Release Preparation And Reviewer Snapshot

- Freeze scope and finalize changelog, delivery notes, and release checklist.
- Finalize deployment artifacts, validation commands, and rollback notes.
- Refresh reviewer docs, diagrams, and walkthrough flow against the shipped system.
- Run final clean-checkout validation and resolve any last packaging or doc drift.

## Exit Criteria

- Full regression suite is green.
- No open critical or high isolation/auth defects remain.
- Docs contain no stale or aspirational behavior claims.
- `main` is taggable as V1.
- Deployment and reviewer walkthrough are reproducible from the documented steps.

## Task Integration

Hardening tasks should be triaged from the defect and risk backlog into `docs/05-taskboard/tasks/`. Release tasks should be created as a final checklist. Reference the checkpoint ID in task context fields.

## Key References

- [execution-plan.md](../execution-plan.md) - Full checkpoint details
- [docs/80-testing/test-strategy.md](../../80-testing/test-strategy.md) - Test strategy
- [docs/95-delivery/README.md](../../95-delivery/README.md) - Delivery artifacts
