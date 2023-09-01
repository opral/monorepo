import { Meta, Title } from "@solidjs/meta"
import { Layout } from "#src/pages/Layout.jsx"
import { Markdown, parseMarkdown } from "#src/services/markdown/index.js"
import { For, Show, createSignal } from "solid-js"
import type { ProcessedTableOfContents } from "./index.page.server.jsx"
import { GetHelp } from "#src/components/GetHelp.jsx"
import { marketplaceItems } from "@inlang/marketplace"
import { Button } from "#src/pages/index/components/Button.jsx"
import { Chip } from "#src/components/Chip.jsx"
import MaterialSymbolsArrowOutward from "~icons/material-symbols/arrow-outward"
import { SelectRepo } from "../Select.jsx"
import { setSearchValue } from "../index.page.jsx"

/**
 * The page props are undefined if an error occurred during parsing of the markdown.
 */
export type PageProps = {
	processedTableOfContents: ProcessedTableOfContents
	markdown: Awaited<ReturnType<typeof parseMarkdown>>
	urlPathname: string
}

export function Page(props: PageProps) {
	const [readmore, setReadmore] = createSignal<boolean>(false)
	const item = () =>
		marketplaceItems.find(
			(item) =>
				item.displayName.en?.toLowerCase().replaceAll(" ", "-") ===
				props.markdown?.frontmatter?.title?.toLowerCase().replaceAll(" ", "-"),
		)

	return (
		<>
			{/* frontmatter is undefined on first client side nav  */}
			<Title>{props.markdown?.frontmatter?.title}</Title>
			<Meta name="description" content={props.markdown?.frontmatter?.description} />
			<Layout>
				<div class="md:py-28 py-16">
					<div class="w-full grid grid-cols-1 md:grid-cols-4 pb-40 md:gap-16 gap-6">
						<Show
							when={props.markdown?.renderableTree}
							fallback={<p class="text-danger">{props.markdown?.error}</p>}
						>
							<div class="col-span-1 md:col-span-3 md:pb-16 pb-12 border-b border-surface-2">
								<div class="flex max-md:flex-col items-start gap-8 mb-10">
									<Show
										when={item()?.icon}
										fallback={
											<div class="w-16 h-16 font-semibold text-3xl rounded-md m-0 shadow-lg object-cover object-center flex items-center justify-center bg-gradient-to-t from-surface-800 to-surface-600 text-background">
												{item()?.displayName.en?.[0]}
											</div>
										}
									>
										<img
											class="w-16 h-16 rounded-md m-0 shadow-lg object-cover object-center"
											src={item()?.icon}
										/>
									</Show>
									<div class="flex flex-col gap-3">
										<h1 class="text-3xl font-bold">{item()?.displayName.en}</h1>
										<div class="inline-block text-surface-500 ">
											<p class={!readmore() ? "lg:line-clamp-2" : ""}>{item()?.description.en}</p>
											{/* @ts-ignore */}
											<Show when={item()?.meta?.description?.en?.length > 205}>
												<p
													onClick={() => setReadmore((prev) => !prev)}
													class="cursor-pointer hover:text-surface-700 transition-all duration-150 font-medium max-lg:hidden"
												>
													{readmore() ? "Minimize" : "Read more"}
												</p>
											</Show>
										</div>
									</div>
								</div>
								<div class="flex gap-4 flex-wrap">
									<Show
										when={item()?.type !== "app" && item()?.type !== "library"}
										fallback={
											/* @ts-ignore */
											<Show when={item()?.linkToApp}>
												{/* @ts-ignore */}
												<Button type="primary" href={item()?.linkToApp}>
													Open
												</Button>
											</Show>
										}
									>
										<div class="flex items-center gap-2">
											{/* @ts-ignore */}
											<Button type="primary" href={`/install?module=${item()?.module}`}>
												<span class="capitalize">
													Install {item()?.type === "lintRule" ? "lint rule" : item()?.type}
												</span>
												{/* @ts-ignore */}
												<SelectRepo size="medium" modules={[item()?.module]} />
											</Button>
										</div>
									</Show>
									<Button type="secondary" href={item()?.linkToReadme.en?.replace("README.md", "")}>
										GitHub
										<MaterialSymbolsArrowOutward
											// @ts-ignore
											slot="suffix"
										/>
									</Button>
								</div>
								{/* </div> */}
							</div>
							<div class="col-span-1 row-span-2 p-4 relative">
								<div class="sticky top-28">
									<h2 class="text-xl font-semibold mb-6">Information</h2>
									<div class="flex flex-col gap-3 mb-8">
										<h3 class="text-sm text-surface-400">Publisher</h3>
										<div class="flex gap-2 items-center">
											<Show
												when={item()?.publisherIcon}
												fallback={
													<div
														class={
															"w-6 h-6 flex items-center justify-center text-background capitalize font-medium rounded-full m-0 bg-surface-900"
														}
													>
														{item()?.publisherName[0]}
													</div>
												}
											>
												<img class="w-6 h-6 rounded-full m-0" src={item()?.publisherIcon} />
											</Show>
											<p class="m-0 text-surface-600 no-underline font-medium">
												{item()?.publisherName}
											</p>
										</div>
									</div>
									<div class="flex flex-col gap-3 mb-8">
										<h3 class="text-sm text-surface-400">Keywords</h3>
										<div class="flex flex-wrap gap-2 items-center">
											<For each={item()?.keywords}>
												{(keyword) => (
													<a
														class="transition-opacity hover:opacity-80 cursor-pointer"
														href="/marketplace"
														onClick={() => {
															setSearchValue(keyword)
														}}
													>
														<Chip
															text={keyword}
															color={
																item()?.type.toLowerCase() === "app"
																	? "#3B82F6"
																	: item()?.type.toLowerCase() === "library"
																	? "#e35473"
																	: item()?.type.toLowerCase() === "plugin"
																	? "#BF7CE4"
																	: "#06B6D4"
															}
														/>
													</a>
												)}
											</For>
										</div>
									</div>
									<div class="flex flex-col gap-3 mb-8">
										<h3 class="text-sm text-surface-400">License</h3>
										<p class="m-0 text-surface-600 no-underline font-medium">{item()?.license}</p>
									</div>
								</div>
							</div>
							<div class="w-full col-span-1 md:col-span-3 rounded-lg">
								<Markdown renderableTree={props.markdown.renderableTree!} />
							</div>
						</Show>
					</div>
					<GetHelp text="Do you have questions?" />
				</div>
			</Layout>
		</>
	)
}
