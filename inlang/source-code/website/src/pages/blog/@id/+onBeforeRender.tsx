import fs from "node:fs";
import tableOfContents from "../../../../../../blog/tableOfContents.json";
import { convert } from "@inlang/markdown";
import { render } from "vike/abort";

const renderedMarkdown = {} as Record<string, string>;

/* Slices the relative path to the repository, no matter where in the file system the code is executed from.
This is necessary because the code is executed from the build folder. */
const repositoryRoot = import.meta.url.slice(
  0,
  import.meta.url.lastIndexOf("inlang/source-code"),
);

export default async function onBeforeRender(pageContext: any) {
  const { id } = pageContext.routeParams;

  const page = tableOfContents.find((page) => page.slug === id);
  if (!page) {
    throw render(404);
  }

  const markdownFilePath = new URL(`inlang/blog/${page.path}`, repositoryRoot);

  if (!fs.existsSync(markdownFilePath)) {
    throw render(404);
  }

  const content = await convert(fs.readFileSync(markdownFilePath, "utf-8"));
  renderedMarkdown[id] = content.html;

  return {
    pageContext: {
      pageProps: {
        markdown: renderedMarkdown[id],
      },
    },
  };
}
