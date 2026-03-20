# Coding Standards
Status: V1 (Implementation Baseline)

## Purpose

Define repo-native implementation rules for PaperBinder code changes.

## Core Rules

- Preserve project boundaries:
  - Domain/application code must not take ASP.NET Core or EF Core runtime dependencies.
  - Infrastructure owns adapters, persistence, external integrations, and framework wiring.
  - Controllers/endpoints should orchestrate HTTP concerns, not business rules.
- Prefer small vertical slices over broad framework-first scaffolding.
- Do not add speculative abstractions or extraction-oriented layers.
- Keep naming explicit and domain-oriented; avoid generic `Manager`, `Helper`, and `Util` types.
- Favor immutable request/response models where practical.
- Keep tenant scope and authorization decisions explicit at public seams.

## Application Pattern Rules

- Use the internal CQRS dispatcher pattern defined by local architecture docs.
- Handlers implement business behavior; controllers/endpoints invoke handlers and map HTTP contracts.
- Do not use ad-hoc role checks inside handlers.
- Time, randomness, and external services should be injected behind explicit interfaces.

## Dependency Rules

- Prefer built-in platform capabilities first.
- New third-party dependencies require explicit approval and an ADR when the choice is expensive to reverse.
- Do not introduce MediatR, JWT browser auth, SignalR, or BFF infrastructure in V1.

## Change Discipline

- Non-trivial behavior changes ship with tests in the same change set.
- Contract or terminology changes require synchronized doc updates in the same change set.
- Keep comments rare and high-signal; explain non-obvious reasoning, not obvious code.

## Related Documents

- `docs/50-engineering/tech-stack.md`
- `docs/20-architecture/boundaries.md`
- `docs/80-testing/testing-standards.md`
