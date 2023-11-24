import { For, Show, createEffect, createSignal, onMount } from "solid-js"
import { currentPageContext } from "#src/renderer/state.js"
import type SlDetails from "@shoelace-style/shoelace/dist/components/details/details.js"
import { Meta, Title } from "@solidjs/meta"
import { Feedback } from "./Feedback.jsx"
import { EditButton } from "./EditButton.jsx"
import { languageTag } from "#src/paraglide/runtime.js"
import "@inlang/markdown/css"
import "@inlang/markdown/custom-elements"
import tableOfContents from "../../../../../documentation/tableOfContents.json"
import MarketplaceLayout from "#src/interface/marketplace/MarketplaceLayout.jsx"
import Link from "#src/renderer/Link.jsx"
import { i18nRouting } from "#src/renderer/_default.page.route.js"

export type PageProps = {
	markdown: Awaited<ReturnType<any>>
}

export function Page(props: PageProps) {
	let mobileDetailMenu: SlDetails | undefined
	const [editLink, setEditLink] = createSignal<string | undefined>("")
	const [markdownHeadings, setMarkdownHeadings] = createSignal<Array<string>>([])

	createEffect(() => {
		setMarkdownHeadings(
			props.markdown
				? props.markdown.match(/<h[1-3].*?>(.*?)<\/h[1-3]>/g).map((heading: string) => {
						// We have to use DOMParser to parse the heading string to a HTML element
						const parser = new DOMParser()
						const doc = parser.parseFromString(heading, "text/html")
						const node = doc.body.firstChild as HTMLElement

						return node.innerText.replace(/(<([^>]+)>)/gi, "").toString()
				  })
				: []
		)
	})

	createEffect(() => {
		if (currentPageContext) {
			setEditLink(
				"https://github.com/inlang/monorepo/edit/main/inlang/documentation" +
					"/" +
					findPageBySlug(
						currentPageContext.urlParsed.pathname
							.replace("/" + languageTag(), "")
							.replace("/documentation/", "")
					)?.path
			)
		}
	})

	return (
		<>
			<Title>
				{
					findPageBySlug(
						currentPageContext.urlParsed.pathname
							.replace("/" + languageTag(), "")
							.replace("/documentation/", "")
					)?.title
				}
			</Title>
			<Meta
				name="description"
				content={
					findPageBySlug(
						currentPageContext.urlParsed.pathname
							.replace("/" + languageTag(), "")
							.replace("/documentation/", "")
					)?.description
				}
			/>
			<Meta name="og:image" content="/opengraph/inlang-documentation-image.jpg" />
			<Meta name="twitter:card" content="summary_large_image" />
			<Meta name="twitter:image" content="/opengraph/inlang-documentation-image.jpg" />
			<Meta
				name="twitter:image:alt"
				content="inlang's ecosystem helps organizations to go global."
			/>
			<Meta
				name="twitter:title"
				content={findPageBySlug(currentPageContext.urlParsed.pathname)?.title}
			/>
			<Meta
				name="twitter:description"
				content={findPageBySlug(currentPageContext.urlParsed.pathname)?.description}
			/>
			<Meta name="twitter:site" content="@inlanghq" />
			<Meta name="twitter:creator" content="@inlanghq" />
			<MarketplaceLayout>
				{/* important: the responsive breakpoints must align throughout the markup! */}
				<div class="flex flex-col grow md:grid md:grid-cols-4 gap-10 w-full">
					{/* desktop navbar */}
					{/* 
          hacking the left margins to apply bg-surface-2 with 100rem 
              (tested on an ultrawide monitor, works!) 
          */}
					<div class="hidden md:block h-full -ml-[100rem] pl-[100rem] border-r-[1px] border-surface-2">
						<nav class="sticky top-12 max-h-[96vh] overflow-y-scroll overflow-scrollbar">
							{/* `Show` is a hotfix when client side rendering loaded this page
							 * filteredTableContents is not available on the client.
							 */}
							<div class="py-14 pr-8">
								<Show when={tableOfContents && props.markdown}>
									<NavbarCommon
										tableOfContents={tableOfContents}
										getLocale={languageTag}
										headings={markdownHeadings()}
									/>
								</Show>
							</div>
						</nav>
					</div>
					{/* Mobile navbar */}
					<nav class="sticky top-[69px] w-screen z-10 -translate-x-4 sm:-translate-x-10 md:hidden overflow-y-scroll overflow-auto backdrop-blur-sm">
						<sl-details ref={mobileDetailMenu}>
							<h3 slot="summary" class="font-medium sm:pl-6">
								Menu
							</h3>
							{/* `Show` is a hotfix when client side rendering loaded this page
							 * filteredTableContents is not available on the client.
							 */}
							<Show when={tableOfContents && props.markdown}>
								<NavbarCommon
									tableOfContents={tableOfContents}
									onLinkClick={() => {
										mobileDetailMenu?.hide()
									}}
									getLocale={languageTag}
									headings={markdownHeadings()}
								/>
							</Show>
						</sl-details>
					</nav>
					<Show when={props.markdown} fallback={<p class="text-danger">{props.markdown?.error}</p>}>
						{/* 
            rendering on the website is broken due to relative paths and 
            the escaping of html. it is better to show the RFC's on the website
            and refer to github for the rendered version than to not show them at all. 
          */}
						<div class="w-full justify-self-center mb-8 md:p-6 md:col-span-3">
							<Show when={currentPageContext.urlParsed.pathname.includes("rfc")}>
								{/* <Callout variant="warning">
									<p>
										The rendering of RFCs on the website might be broken.{" "}
										<a href="https://github.com/inlang/inlang/tree/main/rfcs" target="_blank">
											Read the RFC on GitHub instead.
										</a>
									</p>
								</Callout> */}
							</Show>
							<div
								// change the col-span to 2 if a right side nav bar should be rendered
								class="w-full justify-self-center md:col-span-3"
							>
								<Markdown markdown={props.markdown} />
								<EditButton href={editLink()} />
								<Feedback />
							</div>
						</div>
					</Show>
				</div>
			</MarketplaceLayout>
		</>
	)
}

function Markdown(props: { markdown: string }) {
	return (
		<article
			// eslint-disable-next-line solid/no-innerhtml
			innerHTML={props.markdown}
		/>
	)
}

function NavbarCommon(props: {
	tableOfContents: typeof tableOfContents
	headings: string[]
	onLinkClick?: () => void
	getLocale: () => string
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
	}

	const isSelected = (slug: string) => {
		const reference = `/documentation/${slug}`

		if (props.getLocale() === "en") {
			if (
				reference === currentPageContext.urlParsed.pathname ||
				reference === currentPageContext.urlParsed.pathname + "/"
			) {
				return true
			} else {
				return false
			}
		} else {
			if (
				reference === i18nRouting(currentPageContext.urlParsed.pathname).url ||
				reference === i18nRouting(currentPageContext.urlParsed.pathname).url + "/"
			) {
				return true
			} else {
				return false
			}
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

	const onAnchorClick = async (anchor: string) => {
		setHighlightedAnchor(anchor)
		scrollToAnchor(anchor)
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

				setHighlightedAnchor(replaceChars(heading.toString().toLowerCase()))
				scrollToAnchor(replaceChars(heading.toString().toLowerCase()), "smooth")
			}
		}
	})

	return (
		<ul role="list" class="w-full space-y-3 sm:pl-6">
			<For each={Object.keys(props.tableOfContents)}>
				{(category) => (
					<li>
						<h2 class="tracking-wide pt-2 text font-semibold text-on-surface pb-2">{category}</h2>
						<ul class="space-y-2" role="list">
							<For each={props.tableOfContents[category as keyof typeof props.tableOfContents]}>
								{(page) => {
									const slug = page.slug
									return (
										<li>
											<Link
												onClick={props.onLinkClick}
												class={
													(isSelected(slug)
														? "text-primary font-semibold "
														: "text-info/80 hover:text-on-background ") +
													"tracking-wide text-sm block w-full font-normal mb-2"
												}
												href={`/documentation/${slug}`}
											>
												{page.title}
											</Link>
											<Show when={props.headings && props.headings.length > 0 && isSelected(slug)}>
												<For each={props.headings}>
													{(heading) => (
														<Show when={!heading.includes(page.title)}>
															<li>
																<Link
																	onClick={(e: any) => {
																		e.preventDefault()
																		onAnchorClick(replaceChars(heading.toString().toLowerCase()))
																		props.onLinkClick?.()
																	}}
																	class={
																		"text-sm tracking-widem block w-full border-l pl-3 py-1 hover:border-l-info/80 " +
																		(highlightedAnchor() ===
																		replaceChars(heading.toString().toLowerCase())
																			? "font-medium text-on-background border-l-on-background "
																			: "text-info/80 hover:text-on-background font-normal border-l-info/20 ")
																	}
																	href={`/documentation/${slug}#${replaceChars(
																		heading.toString().toLowerCase()
																	)}`}
																>
																	{heading.replace("#", "")}
																</Link>
															</li>
														</Show>
													)}
												</For>
											</Show>
										</li>
									)
								}}
							</For>
						</ul>
					</li>
				)}
			</For>
		</ul>
	)
}

function findPageBySlug(slug: string) {
	for (const [, pageArray] of Object.entries(tableOfContents)) {
		for (const page of pageArray) {
			if (page.slug === slug || page.slug === slug.replace("/documentation", "")) {
				return page
			}
		}
	}
	return undefined
}
