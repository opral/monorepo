import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import tableOfContents from "../../../content/docs/table_of_contents.json";
import {
  buildDocMaps,
  normalizeRelativePath,
  type Toc,
} from "../../lib/build-doc-map";
import redirects from "./redirects.json";

/**
 * Resolves a redirect destination from the docs redirect map.
 *
 * @example
 * resolveDocsRedirect("/docs") // "/docs/what-is-lix"
 */
function resolveDocsRedirect(pathname: string): string | undefined {
  const normalized = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const redirectMap = redirects as Record<string, string>;
  return redirectMap[normalized] ?? redirectMap[pathname];
}

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
    const redirected = resolveDocsRedirect("/docs");
    if (redirected) {
      throw redirect({
        to: redirected,
      });
    }

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
      // @ts-ignore
      to: `/docs/${firstDoc.slug}`,
    });
  },
});
