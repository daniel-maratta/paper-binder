import cookieNoticeBody from "./cookies.md?raw";
import legalIndexBody from "./legal-index.md?raw";
import privacyPolicyBody from "./privacy.md?raw";
import termsOfUseBody from "./terms.md?raw";

export type LegalDocumentType = "index" | "privacy" | "terms" | "cookies";

export type LegalDocument = {
  slug: string;
  path: string;
  title: string;
  description: string;
  documentType: LegalDocumentType;
  effectiveDate: string;
  body: string;
};

type LegalDocumentFrontmatter = Omit<LegalDocument, "body">;

const rawLegalDocuments = [legalIndexBody, privacyPolicyBody, termsOfUseBody, cookieNoticeBody] as const;

function parseFrontmatter(source: string): LegalDocument {
  const normalizedSource = source.replace(/\r\n?/g, "\n");
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(normalizedSource);
  if (match === null) {
    throw new Error("Legal document is missing frontmatter.");
  }

  const frontmatter = match[1].split("\n").reduce<Record<string, string>>((values, line) => {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex < 0) {
      return values;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    values[key] = rawValue.replace(/^"(.*)"$/, "$1");
    return values;
  }, {});

  return {
    ...readFrontmatter(frontmatter),
    body: match[2].trim()
  };
}

function readFrontmatter(frontmatter: Record<string, string>): LegalDocumentFrontmatter {
  const slug = readRequiredFrontmatter(frontmatter, "slug");
  const path = readRequiredFrontmatter(frontmatter, "path");
  const title = readRequiredFrontmatter(frontmatter, "title");
  const description = readRequiredFrontmatter(frontmatter, "description");
  const documentType = readDocumentType(readRequiredFrontmatter(frontmatter, "documentType"));
  const effectiveDate = readRequiredFrontmatter(frontmatter, "effectiveDate");

  return {
    slug,
    path,
    title,
    description,
    documentType,
    effectiveDate
  };
}

function readRequiredFrontmatter(frontmatter: Record<string, string>, key: string): string {
  const value = frontmatter[key];
  if (value === undefined || value.length === 0) {
    throw new Error(`Legal document is missing required frontmatter key \`${key}\`.`);
  }

  return value;
}

function readDocumentType(value: string): LegalDocumentType {
  if (value === "index" || value === "privacy" || value === "terms" || value === "cookies") {
    return value;
  }

  throw new Error(`Unsupported legal document type \`${value}\`.`);
}

export const legalDocuments = rawLegalDocuments.map(parseFrontmatter);

export const legalIndexDocument = legalDocuments.find((document) => document.documentType === "index")!;

export const legalPolicyDocuments = legalDocuments.filter((document) => document.documentType !== "index");

export function findLegalDocumentByPath(path: string): LegalDocument | undefined {
  return legalDocuments.find((document) => document.path === path);
}
