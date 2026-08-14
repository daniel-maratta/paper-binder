import type { ReactNode } from "react";

type MarkdownBlock = {
  key: string;
  kind: "heading" | "paragraph" | "list" | "figure";
  id?: string;
  depth?: number;
  text?: string;
  items?: string[];
  image?: {
    alt: string;
    src: string;
  };
  caption?: string;
};

const headingOffset = 1;

export type MarkdownArticleHeading = {
  id: string;
  depth: number;
  text: string;
};

function createHeadingSlug(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug.length > 0 ? slug : "section";
}

function parseMarkdownArticle(source: string): MarkdownBlock[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  const headingSlugs = new Map<string, number>();
  let index = 0;

  function createKey(kind: MarkdownBlock["kind"]) {
    return `${kind}-${blocks.length}`;
  }

  function createHeadingId(text: string) {
    const baseSlug = createHeadingSlug(text);
    const slugCount = headingSlugs.get(baseSlug) ?? 0;
    headingSlugs.set(baseSlug, slugCount + 1);
    return slugCount === 0 ? baseSlug : `${baseSlug}-${slugCount + 1}`;
  }

  while (index < lines.length) {
    const line = lines[index].trim();

    if (line.length === 0) {
      index += 1;
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);
    if (headingMatch) {
      blocks.push({
        key: createKey("heading"),
        kind: "heading",
        id: createHeadingId(headingMatch[2]),
        depth: Math.min(headingMatch[1].length + headingOffset, 6),
        text: headingMatch[2]
      });
      index += 1;
      continue;
    }

    const imageMatch = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(line);
    if (imageMatch) {
      let nextIndex = index + 1;
      while (nextIndex < lines.length && lines[nextIndex].trim().length === 0) {
        nextIndex += 1;
      }

      const caption = nextIndex < lines.length ? parseFigureCaption(lines[nextIndex].trim()) : null;
      blocks.push({
        key: createKey("figure"),
        kind: "figure",
        image: {
          alt: imageMatch[1],
          src: imageMatch[2]
        },
        caption: caption ?? undefined
      });
      index = caption === null ? index + 1 : nextIndex + 1;
      continue;
    }

    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("- ")) {
        items.push(lines[index].trim().slice(2));
        index += 1;
      }

      blocks.push({
        key: createKey("list"),
        kind: "list",
        items
      });
      continue;
    }

    const paragraphLines = [line];
    index += 1;
    while (index < lines.length) {
      const nextLine = lines[index].trim();
      if (
        nextLine.length === 0 ||
        nextLine.startsWith("- ") ||
        /^#{1,6}\s+/.test(nextLine) ||
        /^!\[([^\]]*)\]\(([^)]+)\)$/.test(nextLine)
      ) {
        break;
      }

      paragraphLines.push(nextLine);
      index += 1;
    }

    blocks.push({
      key: createKey("paragraph"),
      kind: "paragraph",
      text: paragraphLines.join(" ")
    });
  }

  return blocks;
}

export function getMarkdownArticleHeadings(source: string): MarkdownArticleHeading[] {
  return parseMarkdownArticle(source).flatMap((block) => {
    if (block.kind !== "heading" || block.id === undefined || block.depth === undefined || block.text === undefined) {
      return [];
    }

    return [
      {
        id: block.id,
        depth: block.depth,
        text: block.text
      }
    ];
  });
}

function parseFigureCaption(line: string): string | null {
  const match = /^\*?\^(.+)\^\*?$/.exec(line);
  return match?.[1] ?? null;
}

function renderInlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[2] !== undefined) {
      nodes.push(<code key={`${keyPrefix}-code-${match.index}`}>{match[2]}</code>);
    } else {
      const href = match[4];
      const isExternal = /^https?:\/\//.test(href);
      nodes.push(
        <a
          href={href}
          key={`${keyPrefix}-link-${match.index}`}
          rel={isExternal ? "noreferrer" : undefined}
          target={isExternal ? "_blank" : undefined}
        >
          {match[3]}
        </a>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function MarkdownHeading({ block }: { block: MarkdownBlock }) {
  const content = renderInlineMarkdown(block.text ?? "", block.key);

  if (block.depth === 2) {
    return <h2 id={block.id}>{content}</h2>;
  }

  if (block.depth === 3) {
    return <h3 id={block.id}>{content}</h3>;
  }

  if (block.depth === 4) {
    return <h4 id={block.id}>{content}</h4>;
  }

  return <h5 id={block.id}>{content}</h5>;
}

export function MarkdownArticle({ source }: { source: string }) {
  return (
    <article className="pb-public-markdown-article">
      {parseMarkdownArticle(source).map((block) => {
        if (block.kind === "heading") {
          return <MarkdownHeading block={block} key={block.key} />;
        }

        if (block.kind === "list") {
          return (
            <ul key={block.key}>
              {block.items?.map((item, itemIndex) => (
                <li key={`${block.key}-${itemIndex}`}>{renderInlineMarkdown(item, `${block.key}-${itemIndex}`)}</li>
              ))}
            </ul>
          );
        }

        if (block.kind === "figure" && block.image !== undefined) {
          return (
            <figure key={block.key}>
              <img alt={block.image.alt} src={block.image.src} />
              {block.caption ? <figcaption>{renderInlineMarkdown(block.caption, `${block.key}-caption`)}</figcaption> : null}
            </figure>
          );
        }

        return <p key={block.key}>{renderInlineMarkdown(block.text ?? "", block.key)}</p>;
      })}
    </article>
  );
}
