import type { PageHead } from "@src/renderer/types.js";
import { For, onMount, Show } from "solid-js";
import { Layout as RootLayout } from "@src/pages/Layout.jsx";
import type { parseMarkdown } from "@src/services/markdown/index.js";
import type { ProcessedTableOfContents } from "./index.page.server.jsx";
import { currentPageContext } from "@src/renderer/state.js";

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
			{/* important: the responsive breakpoints must align throughout the markup! */}
			<div class="flex flex-col md:grid md:grid-cols-4 gap-10 w-full">
				{/* desktop navbar */}
				{/* 
					hacking the left margins to apply bg-surface-2 with 100rem 
				    (tested on an ultrawide monitor, works!) 
				*/}
				<nav class="hidden md:block -ml-[100rem] pl-[100rem] bg-surface-2 py-4 pr-8">
					{/* `Show` is a hotfix when client side rendering loaded this page
					 * filteredTableContents is not available on the client.
					 */}
					<Show when={props.processedTableOfContents}>
						<NavbarCommon {...props} />
					</Show>
				</nav>
				{/* Mobile navbar */}
				<nav class="block md:hidden overflow-y-auto overflow-auto min-w-full pt-5">
					<sl-details>
						<h3 slot="summary" class="font-medium">
							Menu
						</h3>
						{/* `Show` is a hotfix when client side rendering loaded this page
						 * filteredTableContents is not available on the client.
						 */}
						<Show when={props.processedTableOfContents}>
							<NavbarCommon {...props} />
						</Show>
					</sl-details>
				</nav>
				<Show
					when={props.markdown?.html}
					fallback={<p class="text-danger">{props.markdown?.error}</p>}
				>
					<div
						// change the col-span to 2 if a right side nav bar should be rendered
						class="w-full prose justify-self-center md:pt-6 md:col-span-3"
						innerHTML={props.markdown?.html}
					></div>
				</Show>
			</div>
		</RootLayout>
	);
}

function NavbarCommon(props: {
	processedTableOfContents: PageProps["processedTableOfContents"];
}) {
	return (
		<ul role="list" class="divide-y divide-outline w-full">
			<For each={Object.keys(props.processedTableOfContents)}>
				{(section) => (
					<li class="py-3">
						<h2 class="font-bold text-on-surface pb-3">{section}</h2>
						<ul class="space-y-1.5" role="list">
							<For
								each={
									props.processedTableOfContents[
										section as keyof typeof props.processedTableOfContents
									]
								}
							>
								{(document) => (
									<li>
										<a
											class="block w-full font-medium link link-primary"
											classList={{
												"text-primary":
													document.frontmatter.href ===
													currentPageContext().urlParsed.pathname,
												"text-on-surface-variant":
													document.frontmatter.href !==
													currentPageContext().urlParsed.pathname,
											}}
											href={document.frontmatter.href}
										>
											{document.frontmatter.title}
										</a>
									</li>
								)}
							</For>
						</ul>
					</li>
				)}
			</For>
		</ul>
	);
}
