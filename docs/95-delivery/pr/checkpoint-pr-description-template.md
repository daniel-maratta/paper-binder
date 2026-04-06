# Checkpoint PR Description Template
Status: Template

Status guidance:
- Use `Draft` while the checkpoint PR artifact or validation is still in progress.
- Use `Review Ready` when the current checkpoint artifact is ready for reviewer handoff.
- Use `Merged` only if this artifact is intentionally updated after merge.
- Leave older merged artifacts alone unless you are already doing a broader delivery-doc consistency pass.

## Checkpoint
- `CP#`:
- Task IDs:

## Summary
- What changed
- Why this checkpoint outcome matters

## Scope Boundaries
- Included:
- Not included:

## Critic Review
- Scope-lock outcome:
- Findings summary:
- Unresolved risks or accepted gaps:

## Risks And Rollout Notes
- Config or migration considerations
- Security or operational considerations

## Validation Evidence
- Commands run:
  - Prefer `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require` for the standard scripted checkpoint-validation bundle when applicable
- Tests added/updated:
- Launch profile verification:
- Manual verification:

## Follow-Ups
- Deferred work with rationale
