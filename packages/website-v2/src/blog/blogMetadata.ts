import {
  extractMarkdownDescription,
  extractMarkdownH1,
} from "../marketplace/seo";

type BlogMetadataInput = {
  rawMarkdown: string;
  frontmatter?: Record<string, unknown>;
};

export function getBlogTitle({ rawMarkdown, frontmatter }: BlogMetadataInput) {
  const ogTitle =
    typeof frontmatter?.["og:title"] === "string"
      ? frontmatter["og:title"]
      : undefined;
  if (ogTitle) {
    return ogTitle;
  }

  return extractMarkdownH1(rawMarkdown);
}

export function getBlogDescription({
  rawMarkdown,
  frontmatter,
}: BlogMetadataInput) {
  const ogDescription =
    typeof frontmatter?.["og:description"] === "string"
      ? frontmatter["og:description"]
      : undefined;
  if (ogDescription) {
    return ogDescription;
  }

  return extractMarkdownDescription(rawMarkdown);
}
