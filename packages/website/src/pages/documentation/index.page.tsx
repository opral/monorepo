import { For, Show, createEffect, createSignal, onMount } from "solid-js"
import { currentPageContext } from "#src/renderer/state.js"
import type SlDetails from "@shoelace-style/shoelace/dist/components/details/details.js"
import { Meta, Title } from "@solidjs/meta"
import { Feedback } from "./Feedback.jsx"
import { EditButton } from "./EditButton.jsx"
import { languageTag } from "#src/paraglide/runtime.js"
import "@inlang/markdown/css"
import "@inlang/markdown/custom-elements"
import Link from "#src/renderer/Link.jsx"
import { i18nRouting } from "#src/renderer/_default.page.route.js"
import SdkDocsLayout from "#src/interface/sdkDocs/SdkDocsLayout.jsx"
import { getTableOfContents } from "./getTableOfContents.js"

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
				}{" "}
				| inlang SDK Documentation
			</Title>
			<Meta
				name="description"
				content={`${
					findPageBySlug(
						currentPageContext.urlParsed.pathname
							.replace("/" + languageTag(), "")
							.replace("/documentation/", "")
					)?.description
				} and more with inlang's Software Development Kit (SDK).`}
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
				content={`${
					findPageBySlug(currentPageContext.urlParsed.pathname)?.title
				} | inlang SDK Documentation`}
			/>
			<Meta
				name="twitter:description"
				content={`${
					findPageBySlug(
						currentPageContext.urlParsed.pathname
							.replace("/" + languageTag(), "")
							.replace("/documentation/", "")
					)?.description
				} and more with inlang's Software Development Kit (SDK).`}
			/>
			<Meta name="twitter:site" content="@inlanghq" />
			<Meta name="twitter:creator" content="@inlanghq" />
			<SdkDocsLayout>
				<div class="flex flex-col md:flex-row grow gap-12 w-full">
					{/* desktop navbar */}
					<div class="hidden md:block h-full w-[232px]">
						<nav class="sticky top-22 max-h-[96vh] overflow-y-scroll overflow-scrollbar -ml-4 pl-4">
							{/* `Show` is a hotfix when client side rendering loaded this page
							 * filteredTableContents is not available on the client.
							 */}
							<div class="py-[48px]">
								<Show when={getTableOfContents() && props.markdown}>
									<NavbarCommon
										tableOfContents={getTableOfContents()}
										getLocale={languageTag}
										headings={markdownHeadings()}
									/>
								</Show>
							</div>
						</nav>
					</div>
					{/* Mobile navbar */}
					<nav class="sticky top-[117px] w-screen z-10 -translate-x-4 sm:-translate-x-10 md:hidden overflow-y-scroll overflow-auto backdrop-blur-sm">
						<sl-details ref={mobileDetailMenu}>
							<h3 slot="summary" class="font-medium sm:pl-6">
								Menu
							</h3>
							{/* `Show` is a hotfix when client side rendering loaded this page
							 * filteredTableContents is not available on the client.
							 */}
							<Show when={getTableOfContents() && props.markdown}>
								<NavbarCommon
									tableOfContents={getTableOfContents()}
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
						<div class="flex-1 max-w-[650px] justify-self-center mb-8 md:col-span-3">
							<div class="w-full justify-self-center md:col-span-3">
								<Markdown markdown={props.markdown} />
								<EditButton href={editLink()} />
								<Feedback />
							</div>
						</div>
					</Show>
					<div class="hidden xl:block w-[260px] py-16 text-sm pl-8">This is headline</div>
				</div>
			</SdkDocsLayout>
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
	tableOfContents: any
	headings: string[]
	onLinkClick?: () => void
	getLocale: () => string
}) {
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
			}
		}
	})

	return (
		<ul role="list" class="w-full flex flex-col gap-6">
			<For each={Object.keys(props.tableOfContents)}>
				{(category) => (
					<li>
						<h2 class="tracking-wide pt-2 text-sm font-semibold text-surface-900 pb-2">
							{category}
						</h2>
						<ul role="list">
							<For each={props.tableOfContents[category]}>
								{(page) => {
									const slug = page.slug
									return (
										<li>
											<a
												onClick={props.onLinkClick}
												class={
													(isSelected(slug)
														? "text-primary font-semibold bg-[#E2F5F9] "
														: "text-surface-600 hover:bg-surface-100 ") +
													"tracking-wide text-sm w-full font-normal h-[34px] flex items-center rounded-lg -ml-3 pl-3"
												}
												href={`/documentation/${slug}`}
											>
												{page.title}
											</a>
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
	for (const [, pageArray] of Object.entries(getTableOfContents())) {
		for (const page of pageArray) {
			if (page.slug === slug || page.slug === slug.replace("/documentation", "")) {
				return page
			}
		}
	}
	return undefined
}
