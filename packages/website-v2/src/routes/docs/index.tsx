import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const docsJsonFiles = import.meta.glob<string>("../../../../../docs/*.json", {
  query: "?raw",
  import: "default",
});
const docsRootPrefix = "../../../../../docs/";

const loadDocsIndex = createServerFn({ method: "GET" }).handler(async () => {
  const tocContent = await getDocsJson("table_of_contents.json");
  const toc = JSON.parse(tocContent) as Array<{
    title: string;
    pages: Array<{ path: string; slug: string }>;
  }>;

  const firstSlug = toc[0]?.pages[0]?.slug;
  return { firstSlug };
});

export const Route = createFileRoute("/docs/")({
  loader: async () => {
    // @ts-expect-error - TanStack Start server function type inference
    const { firstSlug } = await loadDocsIndex();
    if (!firstSlug) {
      throw redirect({ to: "/" });
    }
    throw redirect({ to: `/docs/${firstSlug}` });
  },
  component: () => null,
});

function getDocsJson(filename: string): Promise<string> {
  const loader = docsJsonFiles[`${docsRootPrefix}${filename}`];
  if (!loader) {
    throw new Error(`Missing docs file: ${filename}`);
  }
  return loader();
}
