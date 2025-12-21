import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { DocsLayout, type SidebarSection } from "../../components/docs-layout";
import { MarkdownPage } from "../../components/markdown-page";
import tableOfContents from "../../../content/docs/table_of_contents.json";
import {
  buildDocMaps,
  buildTocMap,
  normalizeRelativePath,
  type Toc,
} from "../../lib/build-doc-map";
import { parse } from "@opral/markdown-wc";
import markdownPageCss from "../../components/markdown-page.style.css?url";

const docs = import.meta.glob<string>("/content/docs/**/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
});

const tocMap = buildTocMap(tableOfContents as Toc);
const { bySlug: docsBySlug } = buildDocMaps(docs);
const docsByRelativePath = Object.values(docsBySlug).reduce((acc, doc) => {
  acc[doc.relativePath] = doc;
  return acc;
}, {} as Record<string, (typeof docsBySlug)[string]>);

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
            href: `/docs/${doc.slug}`,
            relativePath,
          };
        })
        .filter((value): value is NonNullable<typeof value> => Boolean(value));

      return { label: section.label, items };
    })
    .filter((section) => section.items.length > 0);
}

export const Route = createFileRoute("/docs/$slugId")({
  head: () => ({
    links: [
      {
        rel: "stylesheet",
        href: markdownPageCss,
      },
    ],
  }),
  loader: async ({ params }) => {
    const doc = docsBySlug[params.slugId];

    if (!doc) {
      throw notFound();
    }

    const tocEntry = tocMap.get(doc.relativePath);
    const parsedMarkdown = await parse(doc.content, { externalLinks: true });

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
  const { doc, sidebarSections, html, frontmatter } = Route.useLoaderData();

  return (
    <DocsLayout
      toc={tableOfContents as Toc}
      sidebarSections={sidebarSections}
      activeRelativePath={doc.relativePath}
    >
      <MarkdownPage
        html={html}
        imports={(frontmatter.imports as string[] | undefined) ?? undefined}
      />
    </DocsLayout>
  );
}
