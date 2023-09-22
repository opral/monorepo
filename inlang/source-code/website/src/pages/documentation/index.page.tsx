import { For, Show, createEffect, createSignal, onMount } from "solid-js"
import { Layout as RootLayout } from "#src/pages/Layout.jsx"
import type { GeneratedTableOfContents } from "./index.page.server.jsx"
import { currentPageContext } from "#src/renderer/state.js"
import type SlDetails from "@shoelace-style/shoelace/dist/components/details/details.js"
import { Meta, Title } from "@solidjs/meta"
import { Feedback } from "./Feedback.jsx"
import { EditButton } from "./EditButton.jsx"
import { defaultLanguage } from "#src/renderer/_default.page.route.js"
import { useI18n } from "@solid-primitives/i18n"
import "@inlang/markdown/css"
import "@inlang/markdown/custom-elements"
import tableOfContents from "../../../../../documentation/tableOfContents.json"

export type PageProps = {
	processedTableOfContents: GeneratedTableOfContents
	markdown: Awaited<ReturnType<any>>
}

export function Page(props: PageProps) {
	let mobileDetailMenu: SlDetails | undefined
	const [editLink, setEditLink] = createSignal<string | undefined>("")
	const [, { locale }] = useI18n()

	const getLocale = () => {
		const language = locale() ?? defaultLanguage
		return language !== defaultLanguage ? "/" + language : ""
	}

	createEffect(() => {
		if (currentPageContext) {
			setEditLink(
				"https://github.com/inlang/monorepo/edit/main/inlang/documentation" +
					"/" +
					findPageBySlug(
						currentPageContext.urlParsed.pathname
							.replace(getLocale(), "")
							.replace("/documentation/", ""),
					)?.path,
			)
		}
	})

	return (
		<>
			<Title>
				{
					findPageBySlug(
						currentPageContext.urlParsed.pathname
							.replace(getLocale(), "")
							.replace("/documentation/", "")
					)?.title
				}
			</Title>
			<Meta
				name="description"
				content={
					findPageBySlug(
						currentPageContext.urlParsed.pathname
							.replace(getLocale(), "")
							.replace("/documentation/", "")
					)?.description
				}
			/>
			<Meta name="og:image" content="/images/inlang-social-image.jpg" />
			<RootLayout>
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
								<Show when={props.processedTableOfContents && props.markdown}>
									<NavbarCommon
										{...props}
										getLocale={getLocale}
										headings={props.markdown
											.match(/<h[1-3].*?>(.*?)<\/h[1-3]>/g)
											.map((heading: string) => {
												return heading.replace(/(<([^>]+)>)/gi, "")
											})}
									/>
								</Show>
							</div>
						</nav>
					</div>
					{/* Mobile navbar */}
					<nav class="fixed min-w-full z-10 -translate-x-4 sm:-translate-x-10 sm:px-6 md:hidden overflow-y-scroll overflow-auto backdrop-blur-sm">
						<sl-details ref={mobileDetailMenu}>
							<h3 slot="summary" class="font-medium">
								Menu
							</h3>
							{/* `Show` is a hotfix when client side rendering loaded this page
							 * filteredTableContents is not available on the client.
							 */}
							<Show when={props.processedTableOfContents && props.markdown}>
								<NavbarCommon
									{...props}
									onLinkClick={() => {
										mobileDetailMenu?.hide()
									}}
									getLocale={getLocale}
									headings={props.markdown
										.match(/<h[1-3].*?>(.*?)<\/h[1-3]>/g)
										.map((heading: string) => {
											return heading.replace(/(<([^>]+)>)/gi, "")
										})}
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
			</RootLayout>
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
	processedTableOfContents: PageProps["processedTableOfContents"]
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
		if (
			`/documentation/${slug}` ===
				currentPageContext.urlParsed.pathname.replace(props.getLocale(), "") ||
			`/documentation/${slug}` ===
				currentPageContext.urlParsed.pathname.replace(props.getLocale(), "") + "/"
		) {
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
		<ul role="list" class="w-full space-y-3">
			<For each={Object.keys(props.processedTableOfContents)}>
				{(category) => (
					<li>
						<h2 class="tracking-wide pt-2 text font-semibold text-on-surface pb-2">{category}</h2>
						<ul class="space-y-2" role="list">
							<For
								each={
									props.processedTableOfContents[
										category as keyof typeof props.processedTableOfContents
									]
								}
							>
								{(page) => {
									const slug = page.href.replace("/documentation/", "")
									return (
										<li>
											<a
												onClick={props.onLinkClick}
												class={
													(isSelected(slug)
														? "text-primary font-semibold "
														: "text-info/80 hover:text-on-background ") +
													"tracking-wide text-sm block w-full font-normal mb-2"
												}
												href={props.getLocale() + `/documentation/${slug}`}
											>
												{page.title}
											</a>
											<Show when={props.headings.length > 0 && isSelected(slug)}>
												<For each={props.headings}>
													{(heading) => (
														<Show when={!heading.includes(page.title)}>
															<li>
																<a
																	onClick={(e) => {
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
																	href={`#${replaceChars(heading.toString().toLowerCase())}`}
																>
																	{heading.replace("#", "")}
																</a>
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
