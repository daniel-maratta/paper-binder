# AGENTS - Security and Tenant Isolation

This file is authoritative for tenant isolation and security-boundary rules.
Root `AGENTS.md` is intentionally minimal.

These rules are non-negotiable and apply to all tasks touching authentication, tenancy resolution, authorization, or data access.

## Multi-Tenant Security Baseline (Non-Negotiable)

Tenant isolation is a **security boundary**.

Rules:
- Every request must establish tenant context early.
- Every data access path must be tenant-scoped by construction.
- Never "filter after fetch" for tenant isolation.
- Avoid implicit fallbacks that might cross tenants.
- Any change that affects tenant boundaries requires an ADR.

If tenant context cannot be proven for a code path, treat it as a security defect and halt.
