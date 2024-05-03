import { currentPageContext } from "#src/renderer/state.js"
import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
import { For, Show, createEffect, createSignal, onMount } from "solid-js"

type Headlines = { level: "H1" | "H2" | "H3"; anchor: string; element: Element }[]

const InlangDocInPage = (props: {
	manifest: MarketplaceManifest & { uniqueID: string }
	contentInHtml: HTMLCollection
	currentRoute: string
}) => {
	const [headlines, setHeadlines] = createSignal<Headlines>([])

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
			.replaceAll("'", "")
	}

	const findHeadlineElements = (elements: HTMLCollection) => {
		const myHeadlines: Headlines = []
		for (const element of elements) {
			// Check if the element is an h1 or h2
			if (
				element &&
				element.textContent &&
				(element.tagName === "H1" || element.tagName === "H2" || element.tagName === "H3")
			) {
				// Add the element to the headers array
				const id = replaceChars(element.textContent.toLowerCase())
				myHeadlines.push({ level: element.tagName, anchor: id, element: element })
			}
		}

		// Return the array of h1 and h2 elements
		return myHeadlines
	}

	const doesH1Exist = (headlines: Headlines) => {
		return headlines.some((headline) => headline.level === "H1")
	}

	const scrollToAnchor = (anchor: string, behavior?: ScrollBehavior) => {
		const element = document.getElementById(anchor)
		if (element && window) {
			window.scrollTo({
				top: element.offsetTop - 128,
				behavior: behavior ?? "instant",
			})
		}
		window.history.pushState(
			{},
			"",
			`${currentPageContext.urlParsed.pathname}${
				currentPageContext.urlParsed.search.view
					? `?view=${currentPageContext.urlParsed.search.view}`
					: ""
			}#${anchor}`
		)
	}

	createEffect(() => {
		if (props.currentRoute) {
			setTimeout(() => {
				setHeadlines([])
				setHeadlines(findHeadlineElements(props.contentInHtml))
			})
		}
	})

	onMount(async () => {
		setHeadlines(findHeadlineElements(props.contentInHtml))

		for (const sectionTitle of headlines()) {
			if (currentPageContext.urlParsed.hash.toString() === replaceChars(sectionTitle.anchor)) {
				/* Wait for all images to load before scrolling to anchor */
				await Promise.all(
					[...document.querySelectorAll("img")].map((img) =>
						img.complete
							? Promise.resolve()
							: new Promise((resolve) => img.addEventListener("load", resolve))
					)
				)
				setTimeout(() => {
					scrollToAnchor(sectionTitle.anchor, "smooth")
				}, 100)
			}
		}
	})

	return (
		<div class="text-sm pt-8" part="base">
			<p class="font-semibold">On this page</p>
			<div class="flex flex-col mt-2">
				<For each={headlines()}>
					{(headline) => {
						if (headline.level === "H1") {
							return (
								<div
									onClick={() => {
										scrollToAnchor(headline.anchor, "smooth")
									}}
									class={`text-surface-600 cursor-pointer text-sm py-[5px] ml-0 hover:text-primary`}
								>
									{headline.element.textContent?.replaceAll("#", "")}
								</div>
							)
						} else if (headline.level === "H2") {
							return (
								<div
									class={`text-surface-600 text-sm cursor-pointer py-[5px] hover:text-primary ${
										doesH1Exist(headlines()!) ? "ml-4" : "ml-0"
									}`}
									onClick={() => {
										scrollToAnchor(headline.anchor, "smooth")
									}}
								>
									{headline.element.textContent?.replaceAll("#", "")}
								</div>
							)
						} else {
							return (
								<div
									class={`text-surface-600 cursor-pointer text-sm py-[5px] hover:text-primary ${
										doesH1Exist(headlines()!) ? "ml-8" : "ml-4"
									}`}
									onClick={() => {
										scrollToAnchor(headline.anchor, "smooth")
									}}
								>
									{headline.element.textContent?.replaceAll("#", "")}
								</div>
							)
						}
					}}
				</For>
			</div>
			<div class="w-full h-[1px] bg-surface-200 my-4" />
			<Show when={headlines() && headlines()![0]}>
				<div
					class="flex items-center gap-[6px] text-surface-600 cursor-pointer"
					onClick={() => {
						scrollToAnchor(headlines()![0]!.anchor, "smooth")
					}}
				>
					<p class="text-surface-600 text-sm py-[5px] hover:text-primary">Scroll to top</p>
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
						<path
							fill="currentColor"
							d="M11 16h2v-4.2l1.6 1.6L16 12l-4-4l-4 4l1.4 1.4l1.6-1.6zm1 6q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"
						/>
					</svg>
				</div>
			</Show>
		</div>
	)
}

export default InlangDocInPage
