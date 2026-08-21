const canonicalDemoUrl = "https://paperbinder.danielmaratta.com";

export const productIdentity = {
  productName: "PaperBinder",
  authorName: "Daniel Maratta",
  authorUrl: "https://danielmaratta.com",
  canonicalDemoUrl,
  canonicalDemoHost: new URL(canonicalDemoUrl).host,
  canonicalRepositoryUrl: "https://github.com/daniel-maratta/paper-binder",
  provenanceSummary: "PaperBinder is a production-shaped SaaS demo designed and built by Daniel Maratta."
} as const;
