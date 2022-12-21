import { Layout } from "@src/pages/Layout.jsx";
import type { PageHead } from "@src/renderer/types.js";
import type { parseMarkdown } from "@src/services/markdown/index.js";
import { Show } from "solid-js";
import type { ProcessedTableOfContents } from "./index.page.server.jsx";

export const Head: PageHead = () => {
	return {
		title: "Blog",
		description: "Blog",
	};
};

/**
 * The page props are undefined if an error occurred during parsing of the markdown.
 */
export type PageProps = {
	processedTableOfContents: ProcessedTableOfContents;
	markdown: Awaited<ReturnType<typeof parseMarkdown>>;
};

export function Page(props: PageProps) {
	return (
		<Layout>
			<div class="grid-row-2 py-10 w-full mx-auto ">
				<Show
					when={props.markdown?.html}
					fallback={<p class="text-danger">{props.markdown?.error}</p>}
				>
					<div
						class="prose mx-auto w-full 7 ml:px-8 justify-self-center"
						innerHTML={props.markdown?.html}
					></div>
				</Show>
				<a
					class="flex justify-center link link-primary py-4 text-primary "
					href="/blog"
				>
					&lt;- Back to Blog
				</a>
			</div>
		</Layout>
	);
}
