# CLAUDE.md

This repository follows the AGENTS contract defined in:

AGENTS.md

AGENTS.md is the authoritative source of truth for:
- Project intent and scope boundaries
- Multi-tenant security constraints
- Architectural decision rules (ADR triggers)
- Git hygiene and PR quality expectations
- Documentation and change control rules

This project is a constrained multi-tenant SaaS demonstration, not a production framework.

When contributing:

1. Read AGENTS.md first.
2. If present, load AGENTS.local.md and apply local-only constraints.
3. Read relevant files under docs/ (especially ADRs related to the task).
4. Implement the smallest coherent change that satisfies the request.
5. Maintain tenant isolation and security invariants.
6. Avoid feature creep and unnecessary infrastructure.

If a requested change conflicts with project intent, non-goals, or tenant isolation rules, preserve intent and halt for clarification.

Do not introduce:
- Cross-tenant data access
- File upload/storage pipelines
- Unapproved third-party dependencies
- Large architectural expansions without ADR

Clarity, security, and scope discipline take precedence over feature breadth.
