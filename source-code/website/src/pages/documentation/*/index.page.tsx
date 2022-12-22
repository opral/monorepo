import { Navigation } from "./Navigation.jsx";
import type { PageHead } from "@src/renderer/types.js";
import { Show } from "solid-js";
import { Layout as RootLayout } from "@src/pages/Layout.jsx";
import type { parseMarkdown } from "@src/services/markdown/index.js";
import type { ProcessedTableOfContents } from "./index.page.server.jsx";

export const Head: PageHead<PageProps> = (props) => {
	return {
		title: props.pageContext.pageProps.markdown.frontmatter.title + " | inlang",
		description: props.pageContext.pageProps.markdown.frontmatter.description,
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
		<RootLayout>
			<div class="sm:grid sm:grid-cols-9 gap-10 py-4 w-full">
				<div class="sm:flex col-span-2 sticky top-0">
					{/* `Show` is a hotfix when client side rendering loaded this page
					 * filteredTableContents is not available on the client.
					 */}
					<Show when={props.processedTableOfContents}>
						<Navigation {...props} />
					</Show>
				</div>
				<Show
					when={props.markdown?.html}
					fallback={<p class="text-danger">{props.markdown?.error}</p>}
				>
					<div
						class="pt-3 w-full sm:col-span-7 prose justify-self-center"
						innerHTML={props.markdown?.html}
					></div>
				</Show>
			</div>
		</RootLayout>
	);
}
