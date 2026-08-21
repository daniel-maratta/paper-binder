import articleBody from "./building-paperbinder-production-shaped-saas-demo.md?raw";

function estimateReadingTimeMinutes(markdown: string): number {
  const wordCount = markdown
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+]\([^)]+\)/g, " ")
    .replace(/[`#*_>^-]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(wordCount / 250));
}

export const flagshipArticle = {
  path: "/articles/building-paperbinder-production-shaped-saas-demo",
  title: "Building PaperBinder: From AI-Generated Code to Shippable Software",
  subtitle:
    "How architecture, documentation, testing, independent review, and human judgment turned AI-generated implementation into a production-shaped SaaS application.",
  category: "Architecture / SaaS demo / AI-assisted development",
  description:
    "A technical article about the engineering practices used to move AI-generated implementation toward production quality in PaperBinder, a constrained SaaS application.",
  artifactLabel: "V1.1.2 public artifact",
  readingTimeLabel: `${estimateReadingTimeMinutes(articleBody)} min read`,
  body: articleBody,
  socialImagePath: "/presentation/after-redesign.png"
} as const;
