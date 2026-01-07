import { parse } from "@opral/markdown-wc";
import { registry } from "@inlang/marketplace-registry";
import type { MarketplaceManifest } from "@inlang/marketplace-manifest";
import { redirect } from "@tanstack/react-router";
import { getLegacyRedirect } from "./legacyRedirects";

const localMarketplaceFiles = import.meta.glob<string>(
  "../../../../packages/**/*.{md,html}",
  {
    query: "?raw",
    import: "default",
  },
);
const marketplaceRootPrefix = "../../../../";

export type MarketplaceHeading = {
  id: string;
  text: string;
  level: number;
};

export type MarketplacePageData = {
  markdown: string;
  rawMarkdown: string;
  frontmatter?: Record<string, {}>;
  pagePath: string;
  manifest: MarketplaceManifest & { uniqueID: string };
  recommends?: MarketplaceManifest[];
  imports?: string[];
  headings: MarketplaceHeading[];
  prevPagePath?: string;
  nextPagePath?: string;
};

export async function loadMarketplacePage({
  uid,
  slug,
  splat,
}: {
  uid: string;
  slug: string;
  splat?: string;
}): Promise<MarketplacePageData> {
  const legacyRedirect = getLegacyRedirect(uid);
  if (legacyRedirect) {
    throw redirect({
      to: legacyRedirect.to,
      statusCode: legacyRedirect.statusCode,
    });
  }
  const item = registry.find((entry: any) => entry.uniqueID === uid) as
    | (MarketplaceManifest & { uniqueID: string })
    | undefined;

  if (!item) {
    throw redirect({ to: "/not-found" });
  }

  const canonicalSlug = item.slug
    ? item.slug.replaceAll(".", "-")
    : item.id.replaceAll(".", "-");
  const itemPath = `/m/${item.uniqueID}/${canonicalSlug}`;
  const pagePath = splat ? `/${splat}` : "/";

  if (item.pageRedirects) {
    for (const [from, to] of Object.entries(item.pageRedirects)) {
      const newPagePath = getRedirectPath(pagePath, from, to);
      if (newPagePath) {
        throw redirect({ to: `${itemPath}${newPagePath}` });
      }
    }
  }

  if (item.slug) {
    if (item.slug !== slug) {
      throw redirect({ to: `${itemPath}${pagePath}` });
    }
  } else if (item.id.replaceAll(".", "-") !== slug) {
    throw redirect({ to: `${itemPath}${pagePath}` });
  }

  const flatPages = item.pages ? flattenPages(item.pages) : undefined;
  let renderedMarkdown: string | undefined;
  let rawMarkdownContent: string | undefined;
  let frontmatter: Record<string, {}> | undefined;
  let imports: string[] | undefined;

  if (flatPages) {
    const pageEntry = Object.entries(flatPages).find(
      ([route]) => route === pagePath,
    );

    if (!pageEntry) {
      if (pagePath !== "/") {
        throw redirect({ to: itemPath });
      }
      throw redirect({ to: "/not-found" });
    }

    const [, page] = pageEntry;
    if (!page || !(await fileExists(page))) {
      throw redirect({ to: itemPath });
    }

    const content = await getContentString(page);
    rawMarkdownContent = content;
    const markdown = await parse(content);
    renderedMarkdown = markdown.html;
    frontmatter = markdown.frontmatter as Record<string, {}> | undefined;
    imports = markdown.frontmatter?.imports as string[] | undefined;
  } else if (item.readme) {
    const readme =
      typeof item.readme === "object" ? item.readme.en : item.readme;

    try {
      const content = await getContentString(readme);
      rawMarkdownContent = content;
      const markdown = await parse(content);
      renderedMarkdown = markdown.html;
      frontmatter = markdown.frontmatter as Record<string, {}> | undefined;
      imports = markdown.frontmatter?.imports as string[] | undefined;
    } catch {
      throw redirect({ to: "/not-found" });
    }
  } else {
    throw redirect({ to: "/not-found" });
  }

  if (!renderedMarkdown) {
    throw redirect({ to: "/not-found" });
  }

  const { html: markdownWithIds, headings } =
    extractHeadingsAndInjectIds(renderedMarkdown);
  const { prevRoute, nextRoute } = getMarketplacePageNeighbors(item, pagePath);
  const basePath = itemPath;

  const recommends = item.recommends
    ? registry.filter((entry: any) =>
        item.recommends!.some((recommend) => {
          const normalized = recommend.replace(/^m\//, "").replace(/^g\//, "");
          return normalized === entry.uniqueID;
        }),
      )
    : undefined;

  return {
    markdown: markdownWithIds,
    rawMarkdown: rawMarkdownContent || "",
    frontmatter,
    pagePath,
    manifest: item,
    recommends,
    imports,
    headings,
    prevPagePath: prevRoute ? `${basePath}${prevRoute}` : undefined,
    nextPagePath: nextRoute ? `${basePath}${nextRoute}` : undefined,
  };
}

function flattenPages(
  pages: Record<string, string> | Record<string, Record<string, string>>,
) {
  const flatPages: Record<string, string> = {};
  for (const [key, value] of Object.entries(pages) as Array<
    [string, string | Record<string, string>]
  >) {
    if (typeof value === "string") {
      flatPages[key] = value;
    } else {
      for (const [subKey, subValue] of Object.entries(value) as Array<
        [string, string]
      >) {
        flatPages[subKey] = subValue;
      }
    }
  }
  return flatPages;
}

function getRedirectPath(path: string, from: string, to: string) {
  const regex = new RegExp("^" + from.replace("*", "(.*)") + "$");
  if (regex.test(path)) {
    return path.replace(regex, to.replace("*", "$1"));
  }
  return undefined;
}

const getContentString = (path: string): Promise<string> =>
  path.includes("http")
    ? fetch(path).then((res) => res.text())
    : loadLocalMarketplaceFile(path);

async function fileExists(path: string): Promise<boolean> {
  try {
    if (path.startsWith("http")) {
      const response = await fetch(path, { method: "HEAD" });
      return response.ok;
    }
    return Boolean(getMarketplaceFileLoader(path));
  } catch {
    return false;
  }
}

function getMarketplaceFileLoader(
  path: string,
): (() => Promise<string>) | undefined {
  const normalized = path.replace(/^[./]+/, "");
  const key = `${marketplaceRootPrefix}${normalized}`;
  return localMarketplaceFiles[key];
}

async function loadLocalMarketplaceFile(path: string): Promise<string> {
  const loader = getMarketplaceFileLoader(path);
  if (!loader) {
    throw new Error(`Missing marketplace file: ${path}`);
  }
  return await loader();
}

function extractHeadingsAndInjectIds(html: string): {
  html: string;
  headings: MarketplaceHeading[];
} {
  const headings: MarketplaceHeading[] = [];
  const headingRegex = /<h([1-2])([^>]*)>(.*?)<\/h\1>/gis;
  const updatedHtml = html.replace(
    headingRegex,
    (_match, level, attrs, inner) => {
      const text = decodeHtmlEntities(stripHtml(String(inner))).trim();
      const id = slugifyHeading(text);
      headings.push({ id, text, level: Number(level) });
      const cleanAttrs = String(attrs).replace(/\s+id=(["']).*?\1/i, "");
      return `<h${level}${cleanAttrs} id="${id}">${inner}</h${level}>`;
    },
  );
  return { html: updatedHtml, headings };
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "");
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .replaceAll(" ", "-")
    .replaceAll("/", "")
    .replace("#", "")
    .replaceAll("(", "")
    .replaceAll(")", "")
    .replaceAll("?", "")
    .replaceAll(".", "")
    .replaceAll("@", "")
    .replaceAll(
      /([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g,
      "",
    )
    .replaceAll("✂", "")
    .replaceAll(":", "")
    .replaceAll("'", "");
}

function getMarketplacePageNeighbors(
  manifest: MarketplaceManifest & { uniqueID: string },
  currentRoute: string,
) {
  if (!manifest.pages) {
    return { prevRoute: undefined, nextRoute: undefined };
  }

  const allPages: Array<{ route: string; isExternal: boolean }> = [];
  const entries = Object.entries(manifest.pages);

  for (const [key, value] of entries) {
    if (typeof value === "string") {
      const isExternal = !value.endsWith(".md") && !value.endsWith(".html");
      if (!isExternal) {
        allPages.push({ route: key, isExternal });
      }
    } else {
      for (const [route, path] of Object.entries(
        value as Record<string, string>,
      )) {
        const isExternal = !path.endsWith(".md") && !path.endsWith(".html");
        if (!isExternal) {
          allPages.push({ route, isExternal });
        }
      }
    }
  }

  const currentIndex = allPages.findIndex((p) => p.route === currentRoute);
  if (currentIndex === -1 || allPages.length <= 1) {
    return { prevRoute: undefined, nextRoute: undefined };
  }

  const prevRoute = currentIndex > 0 ? allPages[currentIndex - 1].route : null;
  const nextRoute =
    currentIndex < allPages.length - 1
      ? allPages[currentIndex + 1].route
      : null;

  return {
    prevRoute: prevRoute || undefined,
    nextRoute: nextRoute || undefined,
  };
}
