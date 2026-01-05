type MarketplaceHeadInput = {
  displayName: string;
  pagePath: string;
  rawMarkdown: string;
  frontmatter?: Record<string, unknown>;
};

export function buildMarketplaceTitle(input: MarketplaceHeadInput) {
  const subpageTitle = getMarketplaceSubpageTitle(input);
  if (subpageTitle) {
    return `${input.displayName} - ${subpageTitle} | inlang`;
  }
  return `${input.displayName} | inlang`;
}

export function extractOgMeta(frontmatter?: Record<string, unknown>) {
  if (!frontmatter) return [];
  return Object.entries(frontmatter)
    .filter(([key, value]) => key.startsWith("og:") && typeof value === "string")
    .map(([key, value]) => ({
      property: key,
      content: value as string,
    }));
}

export function extractTwitterMeta(frontmatter?: Record<string, unknown>) {
  if (!frontmatter) return [];
  return Object.entries(frontmatter)
    .filter(
      ([key, value]) =>
        key.startsWith("twitter:") && typeof value === "string"
    )
    .map(([key, value]) => ({
      name: key,
      content: value as string,
    }));
}

export function getMarketplaceSubpageTitle(input: MarketplaceHeadInput) {
  const ogTitle =
    typeof input.frontmatter?.["og:title"] === "string"
      ? input.frontmatter["og:title"]
      : undefined;
  if (ogTitle) {
    return ogTitle;
  }

  const h1 = extractMarkdownH1(input.rawMarkdown);
  if (h1) {
    return h1;
  }

  return deriveTitleFromPath(input.pagePath);
}

type JsonLdInput = MarketplaceHeadInput & {
  description: string;
  canonicalUrl: string;
  image?: string;
};

export function buildMarketplaceJsonLd(input: JsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: buildMarketplaceTitle(input),
    description: input.description,
    url: input.canonicalUrl,
    ...(input.image ? { image: input.image } : {}),
  };
}

type BreadcrumbInput = {
  displayName: string;
  canonicalUrl: string;
  canonicalBaseUrl: string;
  subpageTitle?: string;
};

export function buildMarketplaceBreadcrumbJsonLd(input: BreadcrumbInput) {
  const items: Array<Record<string, unknown>> = [
    {
      "@type": "ListItem",
      position: 1,
      name: input.displayName,
      item: input.canonicalBaseUrl,
    },
  ];

  if (input.subpageTitle) {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: input.subpageTitle,
      item: input.canonicalUrl,
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

export function extractMarkdownH1(markdown: string) {
  if (!markdown) return undefined;
  const sanitized = stripFrontmatter(markdown);
  const lines = sanitized.split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith("# ")) {
      return line.slice(2).trim() || undefined;
    }
  }
  return undefined;
}

function stripFrontmatter(markdown: string) {
  if (!markdown.startsWith("---")) return markdown;
  const end = markdown.indexOf("\n---", 3);
  if (end === -1) return markdown;
  return markdown.slice(end + 4).trimStart();
}

export function deriveTitleFromPath(path: string) {
  if (!path || path === "/") return undefined;
  const segment = path.split("/").filter(Boolean).slice(-1)[0];
  if (!segment) return undefined;
  return segment
    .split("-")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}
