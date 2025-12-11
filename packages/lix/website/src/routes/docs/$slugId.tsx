import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { DocsLayout, type SidebarSection } from "../../components/docs-layout";
import { MarkdownPage } from "../../components/markdown-page";
import tableOfContents from "../../../content/docs/table_of_contents.json";
import {
  buildDocMaps,
  buildTocMap,
  normalizeRelativePath,
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
const docsByRelativePath = Object.values(docsById).reduce(
  (acc, doc) => {
    acc[doc.relativePath] = doc;
    return acc;
  },
  {} as Record<string, (typeof docsById)[string]>,
);

function buildSidebarSections(toc: Toc): SidebarSection[] {
  return toc.sidebar
    .map((section) => {
      const items = section.items
        .map((item) => {
          const relativePath = normalizeRelativePath(item.file);
          const doc = docsByRelativePath[relativePath];
          if (!doc) {
            return null;
          }

          return {
            label: item.label,
            href: `/docs/${doc.slugWithId}`,
            relativePath,
          };
        })
        .filter((value): value is NonNullable<typeof value> => Boolean(value));

      return { label: section.label, items };
    })
    .filter((section) => section.items.length > 0);
}

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
      sidebarSections: buildSidebarSections(tableOfContents as Toc),
      html: parsedMarkdown.html,
      frontmatter: parsedMarkdown.frontmatter,
    };
  },
  component: DocsPage,
});

function DocsPage() {
  const { doc, sidebarSections, html } = Route.useLoaderData();

  return (
    <DocsLayout
      toc={tableOfContents as Toc}
      sidebarSections={sidebarSections}
      activeRelativePath={doc.relativePath}
    >
      <MarkdownPage html={html} />
    </DocsLayout>
  );
}
