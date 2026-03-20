# Future Evolution (Reviewer Summary)

The items below are possible post-v1 directions, not current commitments.

Each item would require explicit scope approval and an ADR when it changes architecture boundaries.

## Candidate Directions (Post-v1)

- Expand RBAC from one effective role to additive multi-role evaluation.
- Add richer binder policy modes while preserving API-boundary authorization.
- Add document history navigation for immutable supersedes chains.
- Expand AI-assisted read-only workflows inside strict tenant boundaries.
- Evolve deployment topology beyond single-host when operational signals justify it.

## Explicit v1 Boundary Reminder

Current v1 intentionally excludes several categories, including uploads, cross-tenant sharing, and broad realtime collaboration.

Future additions in those areas require deliberate scope changes, not incidental implementation drift.

## Required Gates Before Adoption

- Feature specification under `docs/15-feature-definition/`.
- ADR in `docs/90-adr/` for sticky or boundary-changing decisions.
- Security and tenancy impact review.
- Contract and test updates in the same change set.

## Canonical References

- `docs/00-intent/project-scope.md`
- `docs/00-intent/non-goals.md`
- `docs/90-adr/AGENTS.md`
- `docs/80-testing/README.md`
