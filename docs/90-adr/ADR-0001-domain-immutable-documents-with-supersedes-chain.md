# ADR-Domain: Immutable Documents with Supersedes Chain

## Context

Documents are central to the demo. Editing behavior must be clearly defined.

Mutable document rows complicate auditability and history reconstruction, especially in PostgreSQL where temporal tables are not native.

## Decision

Documents are immutable.

- Creating a document inserts a new row.
- Editing a document creates a new row.
- The new document references the previous document via supersedes_document_id.
- No in-place updates to document content are allowed.

History is represented as a chain of immutable records.

## Why

- Immutability simplifies reasoning and auditing.
- It eliminates the need for generic shadow tables for documents.
- It aligns with event-style modeling without implementing full event sourcing.
- It avoids accidental data mutation.
- This is a domain-level rule and must be explicitly documented.
- The same philosophy extends to other record-like entities: prefer append-only patterns when feasible.

## Consequences

- Queries must determine the "current" document version.
- Slight increase in storage usage.
- Simplified audit and debugging.
- Reduced need for trigger-based history tracking for documents.
- Mutable updates outside this model are allowed only when mutation is intrinsic state (for example tenant status or lease extension) or the entity is not record-like, and such mutation must emit an audit event.

## Alternatives considered
- Mutable document rows with revision columns: easier writes but weaker audit clarity.
- Full version-control style model: too heavy for v1 objectives.
