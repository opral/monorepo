export type TocItem = {
  file: string;
  label: string;
};

export type Toc = {
  sidebar: Array<{
    label: string;
    items: TocItem[];
  }>;
};

export type DocRecord = {
  id: string;
  slugBase: string;
  slugWithId: string;
  /**
   * Raw markdown including frontmatter.
   */
  content: string;
  relativePath: string;
};

/**
 * Converts file path entries in the table of contents into a quick lookup map.
 *
 * @example
 * buildTocMap({ sidebar: [{ items: [{ file: "./hello.md", label: "Hello" }] }] });
 */
export function buildTocMap(toc: Toc): Map<string, TocItem> {
  const map = new Map<string, TocItem>();

  for (const section of toc.sidebar) {
    for (const item of section.items) {
      const normalized = normalizeRelativePath(item.file);
      map.set(normalized, item);
    }
  }

  return map;
}

/**
 * Builds doc lookup maps keyed by both id and slug-with-id.
 *
 * @example
 * buildDocMaps({ "/content/docs/hello.md": rawMarkdown });
 */
export function buildDocMaps(entries: Record<string, string>) {
  return Object.entries(entries).reduce(
    (acc, [filePath, raw]) => {
      const frontmatter = extractFrontmatter(raw);

      if (!frontmatter?.id) {
        throw new Error(`Missing required "id" frontmatter in ${filePath}`);
      }

      const relativePath = normalizeRelativePath(filePath);
      const slugBase = slugifyRelativePath(relativePath);
      const slugWithId = `${slugBase}-${String(frontmatter.id)}`;

      const record: DocRecord = {
        id: String(frontmatter.id),
        slugBase,
        slugWithId,
        content: raw,
        relativePath,
      };

      acc.byId[record.id] = record;
      acc.bySlugId[record.slugWithId] = record;

      return acc;
    },
    {
      byId: {} as Record<string, DocRecord>,
      bySlugId: {} as Record<string, DocRecord>,
    },
  );
}

/**
 * Splits "hello-123abc" into its constituent slug base and id.
 *
 * @example
 * parseSlugId("hello-123") // { slugBase: "hello", id: "123", slugWithId: "hello-123" }
 */
export function parseSlugId(slugId: string) {
  const lastDashIndex = slugId.lastIndexOf("-");
  if (lastDashIndex <= 0) {
    return null;
  }

  const slugBase = slugId.slice(0, lastDashIndex);
  const id = slugId.slice(lastDashIndex + 1);

  if (!slugBase || !id) {
    return null;
  }

  return { slugBase, id, slugWithId: slugId };
}

/**
 * Normalizes a doc file path to a relative form rooted at content/docs.
 *
 * @example
 * normalizeRelativePath("/content/docs/guide/hello.md") // "./guide/hello.md"
 */
export function normalizeRelativePath(filePath: string) {
  return filePath.replace(/^\/?content\/docs\//, "./");
}

/**
 * Produces a URL-safe slug base from a relative file path.
 *
 * @example
 * slugifyRelativePath("./guide/hello-world.md") // "guide-hello-world"
 */
export function slugifyRelativePath(relativePath: string) {
  const withoutExt = relativePath.replace(/\.md$/, "");
  return withoutExt
    .replace(/^\.\//, "")
    .replace(/[\/\\]+/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Extracts a minimal YAML frontmatter object from markdown.
 *
 * Only supports simple `key: value` pairs. This is sufficient for stable ids
 * and avoids pulling in Node-only parsers in the browser bundle.
 *
 * @example
 * extractFrontmatter("---\\nid: abc123\\n---\\n# Title") // { id: "abc123" }
 */
function extractFrontmatter(markdown: string): Record<string, string> | null {
  const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) {
    return null;
  }

  const lines = match[1].split("\n");
  const data: Record<string, string> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!key) {
      continue;
    }

    data[key] = value.replace(/^['"]|['"]$/g, "");
  }

  return data;
}
