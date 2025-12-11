import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { MarkdownPage } from "../../components/markdown-page";
import tableOfContents from "../../../content/docs/table_of_contents.json";
import {
  buildDocMaps,
  buildTocMap,
  parseSlugId,
  type Toc,
} from "../../lib/build-doc-map";

const docs = import.meta.glob<string>("/content/docs/**/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
});

const tocMap = buildTocMap(tableOfContents as Toc);
const { byId: docsById } = buildDocMaps(docs);

export const Route = createFileRoute("/docs/$slugId")({
  loader: ({ params }) => {
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

    return {
      doc,
      tocEntry,
    };
  },
  component: DocsPage,
});

function DocsPage() {
  const { doc, tocEntry } = Route.useLoaderData();

  return (
    <MarkdownPage
      title={doc.title ?? tocEntry?.label ?? doc.slugBase}
      description={doc.description}
      markdown={doc.content}
    />
  );
}
