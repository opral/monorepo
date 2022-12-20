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
	markdown: ReturnType<typeof parseMarkdown>;
};

export function Page(props: PageProps) {
	return (
		<Layout>
			<div class="grid-row-2 py-10 w-full mx-auto ">
				<Show when={props.markdown} fallback={<Error></Error>}>
					<div
						class="prose mx-auto w-full 7 ml:px-8 justify-self-center"
						innerHTML={props.markdown.html}
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

function Error() {
	return (
		<div>
			<p class="text-danger text-lg font-medium">
				The requested page could not be requested or rendered.
			</p>
			<p class="text-danger">
				Please{" "}
				<a
					class="link text-primary"
					target="_blank"
					href="https://github.com/inlang/inlang/issues/new/choose"
				>
					report the bug.
				</a>
			</p>
		</div>
	);
}
