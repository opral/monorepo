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
import { defaultLanguage } from "#src/renderer/_default.page.route.js"
import { useI18n } from "@solid-primitives/i18n"
import "@inlang/markdown/css"
import "@inlang/markdown/custom-elements"
import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
import { currentPageContext } from "#src/renderer/state.js"

/**
 * The page props are undefined if an error occurred during parsing of the markdown.
 */
export type PageProps = {
	markdown: Awaited<ReturnType<any>>
	manifest: MarketplaceManifest
}

export function Page(props: PageProps) {
	const [readmore, setReadmore] = createSignal<boolean>(false)
	const [, { locale }] = useI18n()

	const getLocale = () => {
		const language = locale() ?? defaultLanguage
		return language !== defaultLanguage ? "/" + language : ""
	}

	// mapping translatable types
	const displayName = () =>
		typeof props.manifest.displayName === "object"
			? props.manifest.displayName.en
			: props.manifest.displayName

	const description = () =>
		typeof props.manifest.description === "object"
			? props.manifest.description.en
			: props.manifest.description

	const readme = () =>
		typeof props.manifest.readme === "object" ? props.manifest.readme.en : props.manifest.readme

	return (
		<>
			<Title>{props.manifest && displayName()}</Title>
			<Meta name="description" content={props.manifest && description()} />
			<Layout>
				<Show when={props.markdown && props.manifest}>
					<div class="md:py-28 py-16">
						<div class="w-full grid grid-cols-1 md:grid-cols-4 pb-40 md:gap-8 gap-6">
							<Show
								when={props.markdown}
								fallback={<p class="text-danger">{props.markdown?.error}</p>}
							>
								<div class="col-span-1 md:col-span-4 md:pb-14 pb-12 mb-12 md:mb-8 border-b border-surface-2 grid md:grid-cols-4 grid-cols-1 gap-16">
									<div class="flex-col h-full justify-between md:col-span-3">
										<div class="flex max-md:flex-col items-start gap-8 mb-12">
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
												href={convertLinkToGithub(readme())?.replace("README.md", "")}
											>
												GitHub
												<MaterialSymbolsArrowOutward
													// @ts-ignore
													slot="suffix"
												/>
											</Button>
										</div>
									</div>
									<div class="w-full flex md:justify-end">
										<div class="flex flex-col gap-4 items-col flex-shrink-0">
											<h2 class="font-semibold text-lg">Information</h2>
											<div>
												<h3 class="text-surface-400 text-sm mb-2">Publisher</h3>
												<div class="flex items-center gap-2">
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
											<div>
												<h3 class="text-surface-400 text-sm mb-2">Keywords</h3>
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
											<div>
												<h3 class="text-surface-400 text-sm mb-2">License</h3>
												<p class="m-0 text-surface-600 no-underline font-medium">
													{props?.manifest?.license}
												</p>
											</div>
										</div>
									</div>
								</div>
								<Show
									when={props.markdown.match(/<h[1-3].*?>(.*?)<\/h[1-3]>/g)}
									fallback={<Markdown markdown={props.markdown} fullWidth />}
								>
									<div class="grid md:grid-cols-4 grid-cols-1 col-span-1 md:col-span-4">
										{/* Classes to be added: sticky z-10 top-16 pt-8 md:pt-0 md:static bg-background */}
										<div class="col-span-1">
											<NavbarCommon
												displayName={displayName}
												getLocale={getLocale}
												headings={props.markdown
													.match(/<h[1-3].*?>(.*?)<\/h[1-3]>/g)
													.map((heading: string) => {
														// We have to use DOMParser to parse the heading string to a HTML element
														const parser = new DOMParser()
														const doc = parser.parseFromString(heading, "text/html")
														const node = doc.body.firstChild as HTMLElement

														return node.innerText.replace(/(<([^>]+)>)/gi, "").toString()
													})}
											/>
										</div>
										<Markdown markdown={props.markdown} />
									</div>
								</Show>
							</Show>
						</div>
						<GetHelp text="Do you have questions?" />
					</div>
				</Show>
			</Layout>
		</>
	)
}

function Markdown(props: { markdown: string; fullWidth?: boolean }) {
	return (
		<article
			class={
				"w-full rounded-lg col-span-1 " + (props.fullWidth ? "md:col-span-4" : "md:col-span-3")
			}
			// eslint-disable-next-line solid/no-innerhtml
			innerHTML={props.markdown}
		/>
	)
}

function NavbarCommon(props: {
	headings: string[]
	getLocale: () => string
	displayName: () => string
}) {
	const [highlightedAnchor, setHighlightedAnchor] = createSignal<string | undefined>("")

	const replaceChars = (str: string) => {
		return str
			.replaceAll(" ", "-")
			.replaceAll("/", "")
			.replace("#", "")
			.replaceAll("(", "")
			.replaceAll(")", "")
			.replaceAll("?", "")
			.replaceAll(".", "")
			.replaceAll("@", "")
			.replaceAll(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, "")
			.replaceAll("✂", "")
	}

	const isSelected = (heading: string) => {
		if (heading === highlightedAnchor()) {
			return true
		} else {
			return false
		}
	}

	const scrollToAnchor = (anchor: string, behavior?: ScrollBehavior) => {
		const element = document.getElementById(anchor)
		if (element && window) {
			window.scrollTo({
				top: element.offsetTop - 96,
				behavior: behavior ?? "instant",
			})
		}
		window.history.pushState({}, "", `${currentPageContext.urlParsed.pathname}#${anchor}`)
	}

	onMount(async () => {
		for (const heading of props.headings) {
			if (
				currentPageContext.urlParsed.hash?.replace("#", "").toString() ===
				replaceChars(heading.toString().toLowerCase())
			) {
				/* Wait for all images to load before scrolling to anchor */
				await Promise.all(
					[...document.querySelectorAll("img")].map((img) =>
						img.complete
							? Promise.resolve()
							: new Promise((resolve) => img.addEventListener("load", resolve))
					)
				)

				scrollToAnchor(replaceChars(heading.toString().toLowerCase()), "smooth")
				setHighlightedAnchor(replaceChars(heading.toString().toLowerCase()))
			}
		}
	})

	return (
		<div class="mb-12 sticky top-28">
			<h2 class="text-lg font-semibold mb-4">Documentation</h2>
			<ul class="space-y-2" role="list">
				<For each={props.headings}>
					{(heading) => (
						<Show when={!heading.includes(props.displayName())}>
							<li>
								<a
									onClick={(e) => {
										e.preventDefault()
										scrollToAnchor(replaceChars(heading.toString().toLowerCase()))
										setHighlightedAnchor(replaceChars(heading.toString().toLowerCase()))
									}}
									class={
										(isSelected(replaceChars(heading.toString().toLowerCase()))
											? "text-primary font-semibold "
											: "text-info/80 hover:text-on-background ") +
										"tracking-wide text-sm block w-full font-normal mb-2"
									}
									href={`#${replaceChars(heading.toString().toLowerCase())}`}
								>
									{heading.replace("#", "")}
								</a>
							</li>
						</Show>
					)}
				</For>
			</ul>
		</div>
	)
}
