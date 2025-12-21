import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import tableOfContents from "../../../content/docs/table_of_contents.json";
import {
  buildDocMaps,
  normalizeRelativePath,
  type Toc,
} from "../../lib/build-doc-map";

const docs = import.meta.glob<string>("/content/docs/**/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
});

const { bySlug: docsBySlug } = buildDocMaps(docs);
const docsByRelativePath = Object.values(docsBySlug).reduce((acc, doc) => {
  acc[doc.relativePath] = doc;
  return acc;
}, {} as Record<string, (typeof docsBySlug)[string]>);

export const Route = createFileRoute("/docs/")({
  loader: () => {
    const toc = tableOfContents as Toc;
    const firstFile = toc.sidebar[0]?.items[0]?.file;
    const firstRelative = firstFile
      ? normalizeRelativePath(firstFile)
      : undefined;
    const firstDoc =
      (firstRelative && docsByRelativePath[firstRelative]) ||
      Object.values(docsBySlug)[0];

    if (!firstDoc) {
      throw notFound();
    }

    throw redirect({
      to: `/docs/${firstDoc.slug}`,
    });
  },
});
