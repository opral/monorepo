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
  }
);
const marketplaceRootPrefix = "../../../../";

export type MarketplacePageData = {
  markdown: string;
  rawMarkdown: string;
  frontmatter?: Record<string, {}>;
  pagePath: string;
  manifest: MarketplaceManifest & { uniqueID: string };
  recommends?: MarketplaceManifest[];
  imports?: string[];
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
      ([route]) => route === pagePath
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

  const recommends = item.recommends
    ? registry.filter((entry: any) =>
        item.recommends!.some((recommend) => {
          const normalized = recommend.replace(/^m\//, "").replace(/^g\//, "");
          return normalized === entry.uniqueID;
        })
      )
    : undefined;

  return {
    markdown: renderedMarkdown,
    rawMarkdown: rawMarkdownContent || "",
    frontmatter,
    pagePath,
    manifest: item,
    recommends,
    imports,
  };
}

function flattenPages(
  pages: Record<string, string> | Record<string, Record<string, string>>
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
  path: string
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
