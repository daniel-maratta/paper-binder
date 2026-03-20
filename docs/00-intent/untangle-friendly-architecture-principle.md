# Untangle-Friendly Architecture Principle

PaperBinder should be implemented as a clear, constrained demonstration with explicit boundaries.
The repository should avoid language that reframes the project outside documented v1 scope.

## Principle

Prioritize:
- Tenant isolation correctness
- Policy enforcement clarity
- Reviewable architecture boundaries
- Scope discipline

Avoid:
- Abstractions introduced only for hypothetical future reuse
- Premature generalization that does not improve current v1 behavior

## Practical Guidance

- Keep domain and application logic independent from infrastructure concerns.
- Keep provider and transport integrations in adapter/infrastructure layers.
- Prefer explicit interfaces only where they reduce coupling for current requirements.
- Document irreversible architectural choices via ADR.

## Anti-Patterns

- Adding extension points with no active use case.
- Expanding architecture to support unknown future products.
- Reframing project goals away from the documented v1 scope.
