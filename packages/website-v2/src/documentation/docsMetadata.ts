import {
  extractMarkdownDescription,
  extractMarkdownH1,
} from "../marketplace/seo";

type DocsMetadataInput = {
  rawMarkdown: string;
  frontmatter?: Record<string, unknown>;
};

export function getDocTitle({ rawMarkdown, frontmatter }: DocsMetadataInput) {
  const ogTitle =
    typeof frontmatter?.["og:title"] === "string"
      ? frontmatter["og:title"]
      : undefined;
  if (ogTitle) {
    return ogTitle;
  }

  return extractMarkdownH1(rawMarkdown);
}

export function getDocDescription({
  rawMarkdown,
  frontmatter,
}: DocsMetadataInput) {
  const ogDescription =
    typeof frontmatter?.["og:description"] === "string"
      ? frontmatter["og:description"]
      : undefined;
  if (ogDescription) {
    return ogDescription;
  }

  return extractMarkdownDescription(rawMarkdown);
}
