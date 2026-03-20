# PaperBinder

PaperBinder is a constrained multi-tenant SaaS demonstration designed to exhibit architectural discipline.

It is intentionally narrow in scope: the goal is to demonstrate senior-level system design, security posture, and delivery discipline without building a "kitchen sink" platform.

---

## For Technical Reviewers

If you are reviewing this repository as part of a technical interview or architecture discussion, see:

REVIEWERS.md

---

## Purpose

This repo exists to:
- Provide a high-signal hiring artifact: realistic SaaS boundaries, tenant isolation, auditability, and clean delivery practices.
- Demonstrate a pragmatic approach to multi-tenant architecture (auth, tenant routing, isolation, and operational constraints).
- Show careful scoping: build just enough to be credible, secure, and reviewable.

This is not intended to become a commercial product.

---

## What PaperBinder Is

- A multi-tenant web app where each tenant operates in an isolated context.
- A document/policy binder concept implemented using DB-backed text documents.
- A product demo emphasizing tenant-aware routing and authorization with explicit non-goals.

---

## Docs Layout

- `docs/00-intent/`: product intent constraints and glossary.
- `docs/05-taskboard/`: repo-native agent taskboard and durable execution state.
- `docs/10-product/`: product requirements, user stories, and UX/domain language.
- `docs/15-feature-definition/`: feature-level contracts and ambiguity resolution docs.
- `docs/20-architecture/`: conceptual system design and boundary definitions.
- `docs/30-security/`: security posture, tenant isolation, and threat model.
- `docs/40-contracts/`: API and external contract documentation.
- `docs/50-engineering/`: product engineering constraints and stack lock.
- `docs/55-execution/`: staged delivery plan for this product.
- `docs/60-ai/`: product AI subsystem scope and architecture.
- `docs/70-operations/`: operational procedures and runbooks.
- `docs/80-testing/`: test strategy, test data, and test suites.
- `docs/90-adr/`: product architecture decision records.
- `docs/95-delivery/`: release/PR artifacts and delivery/versioning notes.

---

## Documentation

- AI docs index: `docs/ai-index.md`
- Machine-readable doc topology: `docs/repo-map.json`
- Documentation integrity contract: `docs/00-intent/documentation-integrity-contract.md`
- Agent taskboard: `docs/05-taskboard/`
- API contracts: `docs/40-contracts/`
- ADRs: `docs/90-adr/`
- Security stance: `docs/30-security/`
- Operational runbooks: `docs/70-operations/`
- Testing docs: `docs/80-testing/`

---

## Status

This repository is under active development.
