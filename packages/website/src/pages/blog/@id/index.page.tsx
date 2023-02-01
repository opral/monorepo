import { Meta, Title } from "@solidjs/meta";
import { Layout } from "@src/pages/Layout.jsx";
import { Markdown, parseMarkdown } from "@src/services/markdown/index.js";
import { Show } from "solid-js";
import type { ProcessedTableOfContents } from "./index.page.server.jsx";

/**
 * The page props are undefined if an error occurred during parsing of the markdown.
 */
export type PageProps = {
  processedTableOfContents: ProcessedTableOfContents;
  markdown: Awaited<ReturnType<typeof parseMarkdown>>;
};

export function Page(props: PageProps) {
  return (
    <>
      {/* frontmatter is undefined on first client side nav  */}
      <Title>{props.markdown?.frontmatter?.title}</Title>
      <Meta
        name="description"
        content={props.markdown?.frontmatter?.description}
      />
      <Layout>
        <div class="grid-row-2 py-10 w-full mx-auto ">
          <Show
            when={props.markdown?.renderableTree}
            fallback={<p class="text-danger">{props.markdown?.error}</p>}
          >
            <div class="mx-auto w-full 7 ml:px-8 justify-self-center">
              <Markdown renderableTree={props.markdown.renderableTree!} />
            </div>
          </Show>
          <a
            class="flex justify-center link link-primary py-4 text-primary "
            href="/blog"
          >
            &lt;- Back to Blog
          </a>
        </div>
      </Layout>
    </>
  );
}
