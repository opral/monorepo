import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { MarkdownPage } from "../../components/markdown-page";
import tableOfContents from "../../../content/docs/table_of_contents.json";
import {
  buildDocMaps,
  buildTocMap,
  parseSlugId,
  type Toc,
} from "../../lib/build-doc-map";
import { parse } from "@opral/markdown-wc";

const docs = import.meta.glob<string>("/content/docs/**/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
});

const tocMap = buildTocMap(tableOfContents as Toc);
const { byId: docsById } = buildDocMaps(docs);

export const Route = createFileRoute("/docs/$slugId")({
  loader: async ({ params }) => {
    const parsedSlug = parseSlugId(params.slugId);
    if (!parsedSlug) {
      throw notFound();
    }

    const doc = docsById[parsedSlug.id];

    if (!doc) {
      throw notFound();
    }

    if (doc.slugWithId !== parsedSlug.slugWithId) {
      throw redirect({
        to: `/docs/${doc.slugWithId}`,
      });
    }

    const tocEntry = tocMap.get(doc.relativePath);
    const parsedMarkdown = await parse(doc.content);

    return {
      doc,
      tocEntry,
      html: parsedMarkdown.html,
      frontmatter: parsedMarkdown.frontmatter,
    };
  },
  component: DocsPage,
});

function DocsPage() {
  const { doc, tocEntry, html, frontmatter } = Route.useLoaderData();
  const title =
    (frontmatter.title as string | undefined) ??
    tocEntry?.label ??
    doc.slugBase;
  const description =
    (frontmatter.description as string | undefined) ?? doc.description;

  return <MarkdownPage title={title} description={description} html={html} />;
}
