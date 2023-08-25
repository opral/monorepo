import { Meta, Title } from "@solidjs/meta"
import { Layout } from "#src/pages/Layout.jsx"
import { Markdown, parseMarkdown } from "#src/services/markdown/index.js"
import { For, Show, createEffect, createSignal } from "solid-js"
import type { ProcessedTableOfContents } from "./index.page.server.jsx"
import { GetHelp } from "#src/components/GetHelp.jsx"
import { marketplaceItems } from "@inlang/marketplace"
import type { MarketplaceItem } from "@inlang/marketplace"
import { Button } from "#src/pages/index/components/Button.jsx"
import { Chip } from "#src/components/Chip.jsx"

/**
 * The page props are undefined if an error occurred during parsing of the markdown.
 */
export type PageProps = {
	processedTableOfContents: ProcessedTableOfContents
	markdown: Awaited<ReturnType<typeof parseMarkdown>>
}

export function Page(props: PageProps) {
	const [item, setItem] = createSignal<MarketplaceItem | undefined>(undefined)

	createEffect(() => {
		setItem(
			marketplaceItems.find(
				(item) =>
					item.meta.displayName.en?.toLowerCase().replaceAll(" ", "-") ===
					props.markdown?.frontmatter?.title?.toLowerCase().replaceAll(" ", "-"),
			),
		)
	})

	return (
		<>
			{/* frontmatter is undefined on first client side nav  */}
			<Title>{props.markdown?.frontmatter?.title}</Title>
			<Meta name="description" content={props.markdown?.frontmatter?.description} />
			<Layout>
				<div class="py-24">
					<div class="w-full grid grid-cols-1 md:grid-cols-4 pb-40 gap-16">
						<Show
							when={props.markdown?.renderableTree && item()}
							fallback={<p class="text-danger">{props.markdown?.error}</p>}
						>
							<div class="col-span-1 md:col-span-3 py-8">
								<h1 class="text-3xl font-bold mb-4">{item().meta.displayName.en}</h1>
								<p class="text-surface-500 mb-8">{item().meta.description.en}</p>
								<div class="flex items-center gap-4">
									<Show
										when={item().type !== "app"}
										fallback={
											<Button type="primary" href="#">
												Open App
											</Button>
										}
									>
										<Button type="primary" href={`/install?module=${item().module}`}>
											Install Module
										</Button>
									</Show>
									<Button
										type="secondary"
										href={item()?.meta.marketplace.linkToReadme.en.replace("README.md", "")}
									>
										GitHub
									</Button>
								</div>
							</div>
							<div class="col-span-1 row-span-2 p-4 relative">
								<div class="sticky top-28">
									<h2 class="text-xl font-semibold mb-6">Information</h2>
									<div class="flex flex-col gap-3 mb-8">
										<h3 class="text-sm text-surface-400">Publisher</h3>
										<div class="flex gap-2 items-center">
											<img
												class="w-6 h-6 rounded-full m-0"
												src={item().meta.marketplace.publisherIcon}
											/>
											<p class="m-0 text-surface-600 no-underline font-medium">
												{item().meta.marketplace.publisherName}
											</p>
										</div>
									</div>
									<div class="flex flex-col gap-3 mb-8">
										<h3 class="text-sm text-surface-400">Keywords</h3>
										<div class="flex flex-wrap gap-2 items-center">
											<For each={item().meta.marketplace.keywords}>
												{(keyword) => (
													<Chip
														text={keyword}
														color={
															item().type === "app"
																? "#3B82F6"
																: item().type === "plugin"
																? "#BF7CE4"
																: "#06B6D4"
														}
													/>
												)}
											</For>
										</div>
									</div>
									<Show when={item().moduleItems.length > 1}>
										<div class="flex flex-col gap-3">
											<h3 class="text-sm text-surface-400">Comes with</h3>
											<div class="flex flex-col items-start">
												<For each={item().moduleItems}>
													{(moduleItem) => (
														<Show when={moduleItem !== item()?.meta.id}>
															<Button
																type="text"
																href={`/marketplace/${
																	// in marketplaceItems, the module.meta.id.toLowerCase() is the same as moduleItem.toLowerCase()
																	marketplaceItems
																		.find(
																			(item) =>
																				item.meta.id.toLowerCase() === moduleItem.toLowerCase(),
																		)
																		?.meta.displayName.en?.toLocaleLowerCase()
																		.replaceAll(" ", "-")
																}`}
															>
																{" "}
																<span class="capitalize">
																	{
																		// in marketplaceItems, the module.meta.id.toLowerCase() is the same as moduleItem.toLowerCase()
																		marketplaceItems
																			.find(
																				(item) =>
																					item.meta.id.toLowerCase() === moduleItem.toLowerCase(),
																			)
																			?.meta.displayName.en?.toLocaleLowerCase()
																	}{" "}
																</span>
															</Button>
														</Show>
													)}
												</For>
											</div>
										</div>
									</Show>
								</div>
							</div>
							<div class="w-full col-span-1 md:col-span-3 rounded-lg pb-16">
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
