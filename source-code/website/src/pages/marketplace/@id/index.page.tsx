import { Meta, Title } from "@solidjs/meta"
import { Layout } from "#src/pages/Layout.jsx"
import { Markdown, parseMarkdown } from "#src/services/markdown/index.js"
import { Show } from "solid-js"
import type { ProcessedTableOfContents } from "./index.page.server.jsx"
import { GetHelp } from "#src/components/GetHelp.jsx"
import type { MarketplaceItem } from "@inlang/marketplace"

/**
 * The page props are undefined if an error occurred during parsing of the markdown.
 */
export type PageProps = {
	processedTableOfContents: ProcessedTableOfContents
	markdown: Awaited<ReturnType<typeof parseMarkdown>>
	marketplaceItem: MarketplaceItem
}

export function Page(props: PageProps) {
	return (
		<>
			{/* frontmatter is undefined on first client side nav  */}
			<Title>{props.markdown?.frontmatter?.title}</Title>
			<Meta name="description" content={props.markdown?.frontmatter?.description} />
			<Layout>
				<div class="py-24">
					<div class="w-full py-8">
						<h1 class="md:text-3xl text-[40px] font-bold mb-4">
							{props.markdown?.frontmatter?.title}
						</h1>
						<p class="text-surface-500">{props.markdown?.frontmatter?.description}</p>
					</div>
					<div class="w-full grid grid-cols-3 pb-40 gap-8">
						<Show
							when={props.markdown?.renderableTree}
							fallback={<p class="text-danger">{props.markdown?.error}</p>}
						>
							<div class="w-full col-span-2 rounded-lg">
								<Markdown renderableTree={props.markdown.renderableTree!} />
							</div>
						</Show>
					</div>
					{/* <a class="flex justify-center link link-primary py-4 text-primary " href="/marketplace">
						&lt;- Back to Marketplace
					</a> */}
					<GetHelp text="Have questions?" />
				</div>
			</Layout>
		</>
	)
}
