import { For, Show, createEffect, createSignal, onMount } from "solid-js"
import { currentPageContext } from "#src/renderer/state.js"
import type SlDetails from "@shoelace-style/shoelace/dist/components/details/details.js"
import { Link, Meta, Title } from "@solidjs/meta"
import { Feedback } from "./Feedback.jsx"
import { EditButton } from "./EditButton.jsx"
import { languageTag } from "#src/paraglide/runtime.js"
import "@inlang/markdown/css"
import "@inlang/markdown/custom-elements"
import SdkDocsLayout from "#src/interface/sdkDocs/SdkDocsLayout.jsx"
import { getTableOfContents } from "./getTableOfContents.js"
import InPageNav from "./InPageNav.jsx"
import MainActions from "./MainActions.jsx"
import { getDocsBaseUrl } from "#src/interface/sdkDocs/SdkDocsHeader.jsx"
import { i18nRouting } from "#src/renderer/+onBeforeRoute.js"
import NavbarIcon from "./NavbarIcon.jsx"
import NavbarOtherPageIndicator from "./NavBarOtherPageIndicator.jsx"

export type PageProps = {
	slug: string
	markdown: Awaited<ReturnType<any>>
}

export default function Page(props: PageProps) {
	let mobileDetailMenu: SlDetails | undefined
	const [editLink, setEditLink] = createSignal<string | undefined>("")
	const [markdownHeadings, setMarkdownHeadings] = createSignal<Array<string>>([])

	const ogPath = () => {
		if (props.slug) {
			const lastWordIndex = props.slug.lastIndexOf("/")

			const slug = props.slug.includes("/") ? props.slug.slice(0, lastWordIndex) : props.slug

			return slug === ""
				? "/opengraph/inlang-documentation-image.jpg"
				: `/opengraph/generated/${slug}/${findPageBySlug(
						currentPageContext.urlParsed.pathname
							.replace("/" + languageTag(), "")
							.replace("/documentation/", "")
				  )
						?.title.toLowerCase()
						.replaceAll(" ", "_")
						.replaceAll("?", "")}.jpg`
		} else {
			return "https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/website/public/opengraph/inlang-documentation-image.jpg"
		}
	}

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
				"https://github.com/opral/monorepo/edit/main/inlang" +
					getDocsBaseUrl(currentPageContext.urlParsed.pathname) +
					"/" +
					findPageBySlug(
						currentPageContext.urlParsed.pathname
							.replace("/" + languageTag(), "")
							.replace("/documentation/", "")
					)?.path.replace("./", "")
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
				}`}
			/>
			<Meta name="og:image" content={ogPath()} />
			<Meta name="twitter:card" content="summary_large_image" />
			<Meta
				name="twitter:image"
				content="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/website/public/opengraph/inlang-documentation-image.jpg"
			/>
			<Meta
				name="twitter:image:alt"
				content="inlang's ecosystem helps organizations to go global."
			/>
			<Meta
				name="twitter:title"
				content={`${
					findPageBySlug(
						currentPageContext.urlParsed.pathname
							.replace("/" + languageTag(), "")
							.replace("/documentation/", "")
					)?.title
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
				}`}
			/>
			<Meta name="twitter:site" content="@inlanghq" />
			<Meta name="twitter:creator" content="@inlanghq" />
			<Link
				href={`https://inlang.com${i18nRouting(currentPageContext.urlParsed.pathname).url}`}
				rel="canonical"
			/>
			<SdkDocsLayout>
				<div class="relative block md:flex grow w-full">
					{/* desktop navbar */}
					<div class="sticky top-[116px] hidden md:block h-[calc(100%_-_112px)] w-[230px]">
						<nav class="max-h-[96vh] overflow-y-scroll overflow-scrollbar -ml-4 pl-4">
							{/* `Show` is a hotfix when client side rendering loaded this page
							 * filteredTableContents is not available on the client.
							 */}
							<div class="py-[48px] pb-32">
								<MainActions />
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
					<nav class="sticky top-[150px] w-screen z-10 -translate-x-4 sm:-translate-x-10 md:hidden overflow-y-scroll overflow-auto backdrop-blur-sm">
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
						<div class="flex flex-1 mb-8 md:ml-4 lg:ml-12 min-h-screen">
							<div class="flex-1 md:max-w-[500px] lg:max-w-[724px] w-full justify-self-center md:col-span-3">
								<Markdown markdown={props.markdown} />
								<EditButton href={editLink()} />
								<Feedback />
							</div>
						</div>
					</Show>
					<div class="sticky z-90 top-[116px] hidden xl:block h-[calc(100%_-_112px)] w-[230px]">
						<div class="max-h-[96vh] overflow-y-scroll overflow-scrollbar -ml-4 pl-4 py-14">
							<InPageNav
								markdown={props.markdown}
								pageName={
									findPageBySlug(
										currentPageContext.urlParsed.pathname
											.replace("/" + languageTag(), "")
											.replace("/documentation/", "")
									)?.title as string
								}
							/>
						</div>
					</div>
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

export const isSelected = (slug: string) => {
	const reference = `/documentation/${slug}`

	if (
		reference === currentPageContext.urlParsed.pathname ||
		reference === currentPageContext.urlParsed.pathname + "/"
	) {
		return true
	} else {
		return false
	}
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
			.replaceAll("@", "")
			.replaceAll(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, "")
			.replaceAll("✂", "")
			.replaceAll(":", "")
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
									const slug: string = page.slug
									return (
										<li>
											<a
												onClick={props.onLinkClick}
												class={
													(isSelected(slug)
														? "text-primary font-semibold bg-[#E2F5F9] "
														: "text-surface-600 hover:bg-surface-100 ") +
													"tracking-wide text-sm w-full font-normal h-[34px] flex items-center rounded-lg -ml-3 pl-3 pr-3"
												}
												href={`/documentation/${slug}`}
											>
												<div class="flex items-center w-full">
													<NavbarIcon slug={slug} />
													<p class="flex-1">{page.title}</p>
													<NavbarOtherPageIndicator slug={slug} />
												</div>
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
	const tableOfContents = getTableOfContents()

	for (const [, pageArray] of Object.entries(tableOfContents)) {
		const foundPage = pageArray.find(
			(page) => page.slug === slug || page.slug === slug.replace("/documentation", "")
		)

		if (foundPage) {
			return foundPage
		}
	}

	return undefined
}
