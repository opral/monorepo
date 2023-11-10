import { Meta, Title } from "@solidjs/meta"
import { For, Show, onMount } from "solid-js"
import { GetHelp } from "#src/interface/components/GetHelp.jsx"
import { Chip } from "#src/interface/components/Chip.jsx"
import { colorForTypeOf, convertLinkToGithub } from "../../utilities.js"
import "@inlang/markdown/css"
import "@inlang/markdown/custom-elements"
import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
import MarketplaceLayout from "#src/interface/marketplace/MarketplaceLayout.jsx"
import Link from "#src/renderer/Link.jsx"
import { EditButton } from "#src/pages/documentation/EditButton.jsx"
import { currentPageContext } from "#src/renderer/state.js"

/**
 * The page props are undefined if an error occurred during parsing of the markdown.
 */
export type PageProps = {
	markdown: Awaited<ReturnType<any>>
	manifest: MarketplaceManifest & { uniqueID: string }
}

export function Page(props: PageProps) {
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

	onMount(() => {
		if (!currentPageContext.urlParsed.hash) return
		// @ts-ignore
		scrollToAnchor(currentPageContext.urlParsed.hash?.replace("#", "").toString(), "smooth")
	})

	return (
		<>
			<Title>{`${props.manifest && displayName()} ${
				props.manifest &&
				(props.manifest.publisherName === "inlang"
					? "- inlang"
					: `| Guide from ${props.manifest.publisherName}  - inlang`)
			}`}</Title>
			<Meta name="description" content={props.manifest && description()} />
			{props.manifest && props.manifest.gallery ? (
				<Meta name="og:image" content={props.manifest.gallery[0]} />
			) : (
				<Meta name="og:image" content="/images/inlang-social-image.jpg" />
			)}
			<Meta name="twitter:card" content="summary_large_image" />
			{props.manifest && props.manifest.gallery ? (
				<Meta name="twitter:image" content={props.manifest.gallery[0]} />
			) : (
				<Meta name="twitter:image" content="/images/inlang-social-image.jpg" />
			)}
			<Meta
				name="twitter:image:alt"
				content="inlang's ecosystem helps organizations to go global."
			/>
			<Meta name="twitter:title" content={props.manifest && displayName()} />
			<Meta name="twitter:description" content={props.manifest && description()} />
			<Meta name="twitter:site" content="@inlanghq" />
			<Meta name="twitter:creator" content="@inlanghq" />
			<MarketplaceLayout>
				<Show when={props.markdown && props.manifest}>
					<div class="md:py-20 py-16">
						<div class="w-full pb-20 md:gap-8 gap-6">
							<Show
								when={props.markdown}
								fallback={<p class="text-danger">{props.markdown?.error}</p>}
							>
								<section class="w-full mb-32">
									<div class="mx-auto w-full flex items-center flex-col justify-center gap-4 max-w-lg text-center md:px-8">
										<Show
											when={props.manifest.icon}
											fallback={
												<div class="w-16 h-16 font-semibold text-3xl rounded-md m-0 shadow-lg object-cover object-center flex items-center justify-center bg-gradient-to-t from-surface-800 to-surface-600 text-background">
													{displayName()[0]}
												</div>
											}
										>
											<img
												src={props.manifest.icon}
												class="w-16 h-16 rounded-md m-0 shadow-lg object-cover object-center mb-4"
											/>
										</Show>
										<h1 class="text-4xl font-bold">{displayName()}</h1>
										<p class="text-surface-500 mb-4">{description()}</p>
										<div class="flex items-center gap-4">
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
												<img class="w-6 h-6 rounded-full m-0" src={props.manifest.publisherIcon} />
											</Show>
											<p class="m-0 text-surface-600 no-underline font-medium">
												{props.manifest.publisherName}
											</p>
										</div>
									</div>
								</section>
								<section class="max-w-4xl mx-auto mb-24">
									<Markdown markdown={props.markdown} />
									<EditButton
										// type="secondary"
										href={convertLinkToGithub(readme())?.replace("README.md", "")}
									/>
								</section>
								<section class="max-w-4xl mx-auto">
									<h3 class="text-surface-400 text-sm mb-4">Keywords</h3>
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
								</section>
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

// function NavbarCommon(props: {
// 	getLocale: () => string
// 	displayName: () => string
// 	tableOfContents: () => Record<string, string[]>
// }) {
// 	const [highlightedAnchor, setHighlightedAnchor] = createSignal<string | undefined>("")

// 	const replaceChars = (str: string) => {
// 		return str
// 			.replaceAll(" ", "-")
// 			.replaceAll("/", "")
// 			.replace("#", "")
// 			.replaceAll("(", "")
// 			.replaceAll(")", "")
// 			.replaceAll("?", "")
// 			.replaceAll(".", "")
// 			.replaceAll("@", "")
// 			.replaceAll(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, "")
// 			.replaceAll("✂", "")
// 			.replaceAll(":", "")
// 	}

// 	const isSelected = (heading: string) => {
// 		if (heading === highlightedAnchor()) {
// 			return true
// 		} else {
// 			return false
// 		}
// 	}

// 	const scrollToAnchor = (anchor: string, behavior?: ScrollBehavior) => {
// 		const element = document.getElementById(anchor)
// 		if (element && window) {
// 			window.scrollTo({
// 				top: element.offsetTop - 96,
// 				behavior: behavior ?? "instant",
// 			})
// 		}
// 		window.history.pushState({}, "", `${currentPageContext.urlParsed.pathname}#${anchor}`)
// 	}

// 	onMount(async () => {
// 		for (const sectionTitle of Object.keys(props.tableOfContents())) {
// 			if (
// 				currentPageContext.urlParsed.hash?.replace("#", "").toString() ===
// 				replaceChars(sectionTitle.toString().toLowerCase())
// 			) {
// 				/* Wait for all images to load before scrolling to anchor */
// 				await Promise.all(
// 					[...document.querySelectorAll("img")].map((img) =>
// 						img.complete
// 							? Promise.resolve()
// 							: new Promise((resolve) => img.addEventListener("load", resolve))
// 					)
// 				)

// 				scrollToAnchor(replaceChars(sectionTitle.toString().toLowerCase()), "smooth")
// 				setHighlightedAnchor(replaceChars(sectionTitle.toString().toLowerCase()))
// 			} else {
// 				for (const heading of props.tableOfContents()[sectionTitle]!) {
// 					if (
// 						currentPageContext.urlParsed.hash?.replace("#", "").toString() ===
// 						replaceChars(heading.toString().toLowerCase())
// 					) {
// 						/* Wait for all images to load before scrolling to anchor */
// 						await Promise.all(
// 							[...document.querySelectorAll("img")].map((img) =>
// 								img.complete
// 									? Promise.resolve()
// 									: new Promise((resolve) => img.addEventListener("load", resolve))
// 							)
// 						)

// 						scrollToAnchor(replaceChars(heading.toString().toLowerCase()), "smooth")
// 						setHighlightedAnchor(replaceChars(heading.toString().toLowerCase()))
// 					}
// 				}
// 			}
// 		}
// 	})

// 	return (
// 		<div class="mb-12 sticky top-28 max-h-[96vh] overflow-y-scroll overflow-scrollbar">
// 			<ul role="list" class="w-full space-y-3">
// 				<For each={Object.keys(props.tableOfContents())}>
// 					{(sectionTitle) => (
// 						<li>
// 							<Link
// 								onClick={(e: Event) => {
// 									e.preventDefault()
// 									scrollToAnchor(replaceChars(sectionTitle.toString().toLowerCase()))
// 									setHighlightedAnchor(replaceChars(sectionTitle.toString().toLowerCase()))
// 								}}
// 								class={
// 									(isSelected(replaceChars(sectionTitle.toString().toLowerCase()))
// 										? "text-primary font-semibold "
// 										: "text-info/80 hover:text-on-background ") +
// 									"tracking-wide text-sm block w-full font-normal mb-2"
// 								}
// 								href={`#${replaceChars(sectionTitle.toString().toLowerCase())}`}
// 							>
// 								{sectionTitle.replace("#", "")}
// 							</Link>
// 							<For each={props.tableOfContents()[sectionTitle]}>
// 								{(heading) => (
// 									<li>
// 										<Link
// 											onClick={(e: Event) => {
// 												e.preventDefault()
// 												scrollToAnchor(replaceChars(heading.toString().toLowerCase()))
// 												setHighlightedAnchor(replaceChars(heading.toString().toLowerCase()))
// 											}}
// 											class={
// 												"text-sm tracking-widem block w-full border-l pl-3 py-1 hover:border-l-info/80 " +
// 												(highlightedAnchor() === replaceChars(heading.toString().toLowerCase())
// 													? "font-medium text-on-background border-l-on-background "
// 													: "text-info/80 hover:text-on-background font-normal border-l-info/20 ")
// 											}
// 											href={`#${replaceChars(heading.toString().toLowerCase())}`}
// 										>
// 											{heading.replace("#", "")}
// 										</Link>
// 									</li>
// 								)}
// 							</For>
// 						</li>
// 					)}
// 				</For>
// 			</ul>
// 		</div>
// 	)
// }
