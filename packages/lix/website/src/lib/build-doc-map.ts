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
  slug: string;
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
 * Builds doc lookup maps keyed by slug.
 *
 * @example
 * buildDocMaps({ "/content/docs/hello.md": rawMarkdown });
 */
export function buildDocMaps(entries: Record<string, string>) {
  return Object.entries(entries).reduce(
    (acc, [filePath, raw]) => {
      const relativePath = normalizeRelativePath(filePath);
      const frontmatter = extractFrontmatter(raw);
      const frontmatterSlug = frontmatter?.slug?.trim() ?? "";
      const normalizedSlug = frontmatterSlug
        ? slugifyValue(frontmatterSlug)
        : "";
      const slug = normalizedSlug || slugifyFileName(relativePath);

      const record: DocRecord = {
        slug,
        content: raw,
        relativePath,
      };

      acc.bySlug[slug] = record;

      return acc;
    },
    {
      bySlug: {} as Record<string, DocRecord>,
    },
  );
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
 * Produces a URL-safe slug from a single filename.
 *
 * @example
 * slugifyFileName("./guide/hello-world.md") // "hello-world"
 */
export function slugifyFileName(relativePath: string) {
  const fileName = relativePath.split(/[\\/]/).pop() ?? relativePath;
  const withoutExt = fileName.replace(/\.md$/, "");
  return slugifyValue(withoutExt);
}

/**
 * Produces a URL-safe slug from a string value.
 *
 * @example
 * slugifyValue("Hello World") // "hello-world"
 */
export function slugifyValue(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Extracts a minimal YAML frontmatter object from markdown.
 *
 * Only supports simple `key: value` pairs.
 *
 * @example
 * extractFrontmatter("---\\ntitle: Hello\\n---\\n# Title") // { title: "Hello" }
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
