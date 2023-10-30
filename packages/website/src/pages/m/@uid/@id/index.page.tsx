import { Meta, Title } from "@solidjs/meta"
import { For, Show, createEffect, createSignal, onMount } from "solid-js"
import { GetHelp } from "#src/interface/components/GetHelp.jsx"
import { isModule } from "@inlang/marketplace-registry"
import { Button } from "#src/pages/index/components/Button.jsx"
import { Chip } from "#src/interface/components/Chip.jsx"
import MaterialSymbolsArrowOutward from "~icons/material-symbols/arrow-outward"
import { SelectRepo } from "./../../Select.jsx"
import {
	colorForTypeOf,
	convertLinkToGithub,
	typeOfIdToTitle,
} from "#src/interface/marketplace/helper/utilities.js"
import { languageTag } from "@inlang/paraglide-js/inlang-marketplace"
import "@inlang/markdown/css"
import "@inlang/markdown/custom-elements"
import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
import { currentPageContext } from "#src/renderer/state.js"
import MarketplaceLayout from "#src/interface/marketplace/MarketplaceLayout.jsx"
import Link from "#src/renderer/Link.jsx"

/**
 * The page props are undefined if an error occurred during parsing of the markdown.
 */
export type PageProps = {
	markdown: Awaited<ReturnType<any>>
	manifest: MarketplaceManifest & { uniqueID: string }
}

export function Page(props: PageProps) {
	const [readmore, setReadmore] = createSignal<boolean>(false)

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

	const [tableOfContents, setTableOfContents] = createSignal({})
	createEffect(() => {
		const table: Record<string, Array<string>> = {}
		if (
			props.markdown &&
			props.markdown.match(/<h[1-3].*?>(.*?)<\/h[1-3]>/g) &&
			props.markdown.match(/<h[1].*?>(.*?)<\/h[1]>/g)
		) {
			props.markdown.match(/<h[1-3].*?>(.*?)<\/h[1-3]>/g).map((heading: string) => {
				// We have to use DOMParser to parse the heading string to a HTML element
				const parser = new DOMParser()
				const doc = parser.parseFromString(heading, "text/html")
				const node = doc.body.firstChild as HTMLElement

				let lastH1Key = ""

				if (node.tagName === "H1") {
					// @ts-ignore
					table[node.innerText.replace(/(<([^>]+)>)/gi, "").replace("#", "")] = []
				} else {
					// @ts-ignore
					if (!table[lastH1Key]) {
						const h1Keys = Object.keys(table)
						// @ts-ignore
						lastH1Key = h1Keys.at(-1)
						// @ts-ignore
						table[lastH1Key].push(node.innerText.replace(/(<([^>]+)>)/gi, "").replace("#", ""))
					} else {
						// @ts-ignore
						table[lastH1Key].push(node.innerText.replace(/(<([^>]+)>)/gi, "").replace("#", ""))
					}
				}

				return node.innerText.replace(/(<([^>]+)>)/gi, "").replace("#", "")
			})
		}

		setTableOfContents(table)
	})

	// const [details, setDetails] = createSignal({})
	// const [slider, { next, prev }] = createSlider({
	// 	slides: {
	// 		number: props.manifest && props.manifest.gallery ? props.manifest.gallery.length - 1 : 0,
	// 		perView: window ? (window.innerWidth > 768 ? 3 : 1) : 1,
	// 		spacing: 8,
	// 	},

	// 	detailsChanged: (slider: { track: { details: any } }) => {
	// 		setDetails(slider.track.details)
	// 	},
	// })

	return (
		<>
			<Title>{`${props.manifest && displayName()} ${
				props.manifest &&
				(props.manifest.publisherName === "inlang"
					? "- inlang"
					: `from ${props.manifest.publisherName}  - inlang`)
			}`}</Title>
			<Meta name="description" content={props.manifest && description()} />
			{props.manifest && props.manifest.gallery ? (
				<Meta name="og:image" content={props.manifest.gallery[0]} />
			) : (
				<Meta name="og:image" content="/images/inlang-social-image.jpg" />
			)}
			<MarketplaceLayout>
				<Show when={props.markdown && props.manifest}>
					<div class="md:py-28 py-16">
						<div class="w-full grid grid-cols-1 md:grid-cols-4 pb-20 md:gap-8 gap-6">
							<Show
								when={props.markdown}
								fallback={<p class="text-danger">{props.markdown?.error}</p>}
							>
								<section class="col-span-1 md:col-span-4 md:pb-10 pb-8 mb-12 md:mb-8 border-b border-surface-2 grid md:grid-cols-4 grid-cols-1 gap-16">
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
												<div class="flex items-center gap-4">
													<h1 class="text-3xl font-bold">{displayName()}</h1>
													<Link href="/search?q=lix">
														<div class="w-9 text-primary hover:text-hover-primary transition-colors">
															<sl-tooltip prop:content="Powered by lix">
																<LixBadge />
															</sl-tooltip>
														</div>
													</Link>
												</div>
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
										{/* <Show
											when={props.manifest.gallery && props.manifest.gallery.length > 1 && slider}
										>
											<div class="relative">
												<div use:slider class="mt-16 cursor-grab active:cursor-grabbing">
													<For each={props.manifest.gallery}>
														{(image) => (
															<a
																href={image}
																target="_blank"
																rel="noopener noreferrer"
																class="transition-opacity hover:opacity-80 cursor-pointer w-80 flex-shrink-0 active:cursor-grabbin flex items-center justify-center"
															>
																<img class="rounded-md w-80" src={image} />
															</a>
														)}
													</For>
												</div>
												<Show when={details()}>
													<button
														disabled={
															// @ts-ignore
															details() && details().progress ? details().progress === 0 : false
														}
														onClick={prev}
														class="absolute -left-2 top-1/2 -translate-y-1/2 p-1 bg-background border border-surface-100 rounded-full shadow-xl shadow-on-background/20 transition-all hover:bg-surface-50 disabled:opacity-0"
													>
														<Left class="h-8 w-8" />
													</button>
													<button
														disabled={
															// @ts-ignore
															details() && details().progress ? details().progress > 0.99 : false
														}
														onClick={next}
														class="absolute -right-2 top-1/2 -translate-y-1/2 p-1 bg-background border border-surface-100 rounded-full shadow-xl shadow-on-background/20 transition-all hover:bg-surface-50 disabled:opacity-0"
													>
														<Right class="h-8 w-8" />
													</button>
												</Show>
											</div>
										</Show> */}
									</div>
									<div class="w-full">
										<div class="flex flex-col gap-4 items-col flex-shrink-0">
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
															<Link
																class="transition-opacity hover:opacity-80 cursor-pointer"
																href={"/search?q=" + keyword}
															>
																<Chip text={keyword} color={colorForTypeOf(props.manifest.id)} />
															</Link>
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
								</section>
								<Show
									when={props.markdown.match(/<h[1-3].*?>(.*?)<\/h[1-3]>/g)}
									fallback={<Markdown markdown={props.markdown} fullWidth />}
								>
									<div class="grid md:grid-cols-4 grid-cols-1 col-span-1 md:col-span-4 gap-16">
										<Markdown markdown={props.markdown} />
										{/* Classes to be added: sticky z-10 top-16 pt-8 md:pt-0 md:static bg-background */}
										<aside class="col-span-1 md:order-1 -order-1">
											<NavbarCommon
												displayName={displayName}
												getLocale={languageTag}
												tableOfContents={tableOfContents}
											/>
										</aside>
									</div>
								</Show>
							</Show>
						</div>
						<div class="mt-20">
							<GetHelp text="Do you have questions?" />
						</div>
					</div>
				</Show>
			</MarketplaceLayout>
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
	getLocale: () => string
	displayName: () => string
	tableOfContents: () => Record<string, string[]>
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
			.replaceAll(":", "")
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
		for (const sectionTitle of Object.keys(props.tableOfContents())) {
			if (
				currentPageContext.urlParsed.hash?.replace("#", "").toString() ===
				replaceChars(sectionTitle.toString().toLowerCase())
			) {
				/* Wait for all images to load before scrolling to anchor */
				await Promise.all(
					[...document.querySelectorAll("img")].map((img) =>
						img.complete
							? Promise.resolve()
							: new Promise((resolve) => img.addEventListener("load", resolve))
					)
				)

				//scrollToAnchor(replaceChars(sectionTitle.toString().toLowerCase()), "smooth")
				setHighlightedAnchor(replaceChars(sectionTitle.toString().toLowerCase()))
			} else {
				for (const heading of props.tableOfContents()[sectionTitle]!) {
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
			}
		}
	})

	return (
		<div class="mb-12 sticky top-28 max-h-[96vh] overflow-y-scroll overflow-scrollbar">
			<ul role="list" class="w-full space-y-3">
				<For each={Object.keys(props.tableOfContents())}>
					{(sectionTitle) => (
						<li>
							<Link
								onClick={(e: any) => {
									e.preventDefault()
									scrollToAnchor(replaceChars(sectionTitle.toString().toLowerCase()))
									setHighlightedAnchor(replaceChars(sectionTitle.toString().toLowerCase()))
								}}
								class={
									(isSelected(replaceChars(sectionTitle.toString().toLowerCase()))
										? "text-primary font-semibold "
										: "text-info/80 hover:text-on-background ") +
									"tracking-wide text-sm block w-full font-normal mb-2"
								}
								href={`#${replaceChars(sectionTitle.toString().toLowerCase())}`}
							>
								{sectionTitle.replace("#", "")}
							</Link>
							<For each={props.tableOfContents()[sectionTitle]}>
								{(heading) => (
									<li>
										<Link
											onClick={(e: any) => {
												e.preventDefault()
												scrollToAnchor(replaceChars(heading.toString().toLowerCase()))
												setHighlightedAnchor(replaceChars(heading.toString().toLowerCase()))
											}}
											class={
												"text-sm tracking-widem block w-full border-l pl-3 py-1 hover:border-l-info/80 " +
												(highlightedAnchor() === replaceChars(heading.toString().toLowerCase())
													? "font-medium text-on-background border-l-on-background "
													: "text-info/80 hover:text-on-background font-normal border-l-info/20 ")
											}
											href={`#${replaceChars(heading.toString().toLowerCase())}`}
										>
											{heading.replace("#", "")}
										</Link>
									</li>
								)}
							</For>
						</li>
					)}
				</For>
			</ul>
		</div>
	)
}

function LixBadge() {
	return (
		<svg
			width="100%"
			height="auto"
			viewBox="0 0 77 47"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<g clip-path="url(#clip0_1771_54)">
				<rect width="76.5514" height="46.6222" rx="16" fill="currentColor" />
				<path
					d="M30.0854 14.1221C29.1858 14.1221 28.414 13.8238 27.7701 13.2272C27.1356 12.6211 26.8184 11.8967 26.8184 11.0539C26.8184 10.2206 27.1356 9.50559 27.7701 8.909C28.414 8.30294 29.1858 7.99991 30.0854 7.99991C30.9851 7.99991 31.7521 8.30294 32.3866 8.909C33.0305 9.50559 33.3525 10.2206 33.3525 11.0539C33.3525 11.8967 33.0305 12.6211 32.3866 13.2272C31.7521 13.8238 30.9851 14.1221 30.0854 14.1221Z"
					fill="white"
				/>
				<path d="M22.0511 9.53125V38.6222H16V9.53125H22.0511Z" fill="white" />
				<path
					fill-rule="evenodd"
					clip-rule="evenodd"
					d="M46.0627 16.8036L50.0649 24.4249L51.5 27.5L51.7659 22.1825L73.7926 -7H80L54.0599 27.7127L60.5514 38.6218H54.3724L50.0684 31.0792L45.8354 38.6218H39.5854L44.7046 30H41.0857H41V29.9998C35.4146 29.9785 31.7353 27.8726 29.5619 24.8929C27.5025 22.0698 27.0854 18.8605 27.0854 17H33.0854C33.0854 18.1395 33.3685 19.9302 34.4093 21.3571C35.3248 22.6122 37.1191 24 41.0857 24H43.9356L39.8127 16.8036H46.0627Z"
					fill="white"
				/>
			</g>
			<defs>
				<clipPath id="clip0_1771_54">
					<rect width="76.5514" height="46.6222" rx="16" fill="white" />
				</clipPath>
			</defs>
		</svg>
	)
}
