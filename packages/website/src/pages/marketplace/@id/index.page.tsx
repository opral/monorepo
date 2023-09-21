import { Meta, Title } from "@solidjs/meta"
import { Layout } from "#src/pages/Layout.jsx"
import { For, Show, createSignal, onMount } from "solid-js"
import { GetHelp } from "#src/components/GetHelp.jsx"
import { isModule } from "@inlang/marketplace-registry"
import { Button } from "#src/pages/index/components/Button.jsx"
import { Chip } from "#src/components/Chip.jsx"
import MaterialSymbolsArrowOutward from "~icons/material-symbols/arrow-outward"
import { SelectRepo } from "../Select.jsx"
import { setSearchValue } from "../index.page.jsx"
import { colorForTypeOf, convertLinkToGithub, typeOfIdToTitle } from "../utilities.js"
import "@inlang/markdown/css"
import type { MarketplaceManifest } from "@inlang/marketplace-manifest"

/**
 * The page props are undefined if an error occurred during parsing of the markdown.
 */
export type PageProps = {
	contents: Awaited<ReturnType<any>>
	manifest: MarketplaceManifest
}

export function Page(props: PageProps) {
	const [readmore, setReadmore] = createSignal<boolean>(false)
	const [page, setPage] = createSignal<number>(0)

	// mapping translatable types
	const displayName = () =>
		typeof props.manifest.displayName === "object"
			? props.manifest.displayName.en
			: props.manifest.displayName

	const description = () =>
		typeof props.manifest.description === "object"
			? props.manifest.description.en
			: props.manifest.description

	onMount(() => {
		const urlQuery = new URLSearchParams(window.location.search)

		if (urlQuery.has("page")) {
			setPage(props.contents.findIndex((content: any) => content.slug === urlQuery.get("page")))
		}
	})

	const readme = () =>
		typeof props.contents[0].path === "object" ? props.contents[0].path.en : props.contents[0].path

	return (
		<>
			<Title>{props.manifest && displayName()}</Title>
			<Meta name="description" content={props.manifest && description()} />
			<Layout>
				<Show when={props.manifest && props.contents}>
					<div class="md:py-28 py-16">
						<div class="w-full grid grid-cols-1 md:grid-cols-4 pb-40 md:gap-16 gap-6">
							<Show
								when={props.contents[Number(page())].markdown}
								fallback={<p class="text-danger">Parsing markdown went wrong.</p>}
							>
								<div class="col-span-1 md:col-span-3 md:pb-16 pb-12 border-b border-surface-2">
									<div class="flex max-md:flex-col items-start gap-8 mb-10">
										<Show
											when={props.manifest.icon}
											fallback={
												<div class="w-16 h-16 font-semibold text-3xl rounded-md m-0 shadow-lg object-cover object-center flex items-center justify-center bg-gradient-to-t from-surface-800 to-surface-600 text-background">
													{displayName()[0]}
												</div>
											}
										>
											<img
												class="w-16 h-16 rounded-md m-0 shadow-lg object-cover object-center"
												src={props.manifest.icon}
											/>
										</Show>
										<div class="flex flex-col gap-3">
											<h1 class="text-3xl font-bold">{displayName()}</h1>
											<div class="inline-block text-surface-500 ">
												<p class={!readmore() ? "lg:line-clamp-2" : ""}>{description()}</p>
												<Show when={description().length > 205}>
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
											when={isModule(props.manifest)}
											fallback={
												/* @ts-ignore */
												<Show when={props.manifest.website}>
													{/* @ts-ignore */}
													<Button type="primary" href={props.manifest.website}>
														Open
													</Button>
												</Show>
											}
										>
											<div class="flex items-center gap-2">
												{/* @ts-ignore */}
												<Button type="primary" href={`/install?module=${props.manifest.id}`}>
													<span class="capitalize">
														Install{" "}
														{props.manifest.id.includes("messageLintRule")
															? "Lint Rule"
															: typeOfIdToTitle(props.manifest.id)}
													</span>
													{/* @ts-ignore */}
													<SelectRepo size="medium" modules={[props.manifest.id]} />
												</Button>
											</div>
										</Show>
										<Button
											type="secondary"
											href={convertLinkToGithub(readme().replace("README.md", ""))}
										>
											GitHub
											<MaterialSymbolsArrowOutward
												// @ts-ignore
												slot="suffix"
											/>
										</Button>
									</div>
								</div>
								<div class="col-span-1 row-span-2 p-4 relative">
									<div class="sticky top-28">
										<Show when={props.contents.length > 1}>
											<div class="mb-12">
												<h2 class="text-xl font-semibold mb-6">Documentation</h2>
												<SubNavigation contents={props.contents} page={page()} setPage={setPage} />
											</div>
										</Show>
										<h2 class="text-xl font-semibold mb-6">Information</h2>
										<div class="flex flex-col gap-3 mb-8">
											<h3 class="text-sm text-surface-400">Publisher</h3>
											<div class="flex gap-2 items-center">
												<Show
													when={props.manifest.publisherIcon}
													fallback={
														<div
															class={
																"w-6 h-6 flex items-center justify-center text-background capitalize font-medium rounded-full m-0 bg-surface-900"
															}
														>
															{props.manifest.publisherName[0]}
														</div>
													}
												>
													<img
														class="w-6 h-6 rounded-full m-0"
														src={props.manifest.publisherIcon}
													/>
												</Show>
												<p class="m-0 text-surface-600 no-underline font-medium">
													{props.manifest.publisherName}
												</p>
											</div>
										</div>
										<div class="flex flex-col gap-3 mb-8">
											<h3 class="text-sm text-surface-400">Keywords</h3>
											<div class="flex flex-wrap gap-2 items-center">
												<For each={props?.manifest?.keywords}>
													{(keyword) => (
														<a
															class="transition-opacity hover:opacity-80 cursor-pointer"
															href="/marketplace"
															onClick={() => {
																setSearchValue(keyword.toString())
															}}
														>
															<Chip text={keyword} color={colorForTypeOf(props.manifest.id)} />
														</a>
													)}
												</For>
											</div>
										</div>
										<div class="flex flex-col gap-3 mb-8">
											<h3 class="text-sm text-surface-400">License</h3>
											<p class="m-0 text-surface-600 no-underline font-medium">
												{props?.manifest?.license}
											</p>
										</div>
									</div>
								</div>
							</Show>
							<Show when={props.contents}>
								<Markdown markdown={props.contents[Number(page())].markdown} />
							</Show>
						</div>
						<GetHelp text="Do you have questions?" />
					</div>
				</Show>
			</Layout>
		</>
	)
}

function Markdown(props: { markdown: string }) {
	return (
		<div
			class="w-full col-span-1 md:col-span-3 rounded-lg"
			// eslint-disable-next-line solid/no-innerhtml
			innerHTML={props.markdown}
		/>
	)
}

function SubNavigation(props: {
	contents: PageProps["contents"]
	page: number
	setPage: (page: string) => void
}) {
	return (
		<nav class="w-full">
			<For each={props.contents}>
				{(content) => (
					<>
						<div class="flex items-center my-4">
							<a
								class={
									"text-sm " +
									(props.page === props.contents.indexOf(content)
										? "font-semibold text-primary"
										: "text-surface-500 hover:text-surface-600 ")
								}
								href={content.slug !== "" ? `?page=${content.slug}` : window.location.pathname}
								onClick={() => props.setPage(props.contents.indexOf(content))}
							>
								{content.title.en}
							</a>
						</div>
					</>
				)}
			</For>
		</nav>
	)
}
