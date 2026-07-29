# Project Origin

PaperBinder was designed and built by Daniel Maratta as a public engineering portfolio and multi-tenant SaaS demonstration.

PaperBinder was designed, directed, reviewed, and validated by Daniel Maratta using AI coding agents as implementation accelerators. Large portions of implementation were generated or modified by AI agents under explicit task prompts. Architecture, scope, security model, acceptance criteria, review process, remediation decisions, and the final quality bar were human-directed.

The project intentionally demonstrates modern AI-augmented software delivery, not purely hand-typed keystroke authorship.

## Canonical Project References

- Canonical demo site: `https://paperbinder.danielmaratta.com`
- Flagship article: `https://paperbinder.danielmaratta.com/articles/building-paperbinder-production-shaped-saas-demo`
- Canonical author site: `https://danielmaratta.com`
- Canonical repository: `https://github.com/daniel-maratta/paper-binder.git`

## Provenance Verification

To verify project provenance, prefer the durable project record over copied snapshots:

- Review the canonical repository history and contributor record.
- Compare release tags and the root [CHANGELOG.md](./CHANGELOG.md).
- Use [REVIEWERS.md](./REVIEWERS.md) and the release evidence under `docs/95-delivery/`.
- Compare deployed project links and public documentation with the canonical demo and author site above.

## Review Context

PaperBinder is intentionally narrow in scope. It exists to demonstrate tenant isolation, policy-aware access control, operational discipline, and reviewer-friendly delivery in a public codebase.

Its process surface is intentionally heavier than normal client delivery because this repository is also a public hiring artifact. In client work, Daniel would scale the documentation, gates, and validation artifacts to the risk profile: lighter for low-risk features and internal tools, heavier for security boundaries, data migrations, tenant isolation, authentication, payments, and production releases.
