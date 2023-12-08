import { For, Show, createSignal, onMount, type JSX } from "solid-js"
import { GetHelp } from "#src/interface/components/GetHelp.jsx"
import { SectionLayout } from "#src/pages/index/components/sectionLayout.jsx"
import { currentPageContext } from "#src/renderer/state.js"
import Highlight from "#src/interface/components/Highlight.jsx"
import Card, { CardBuildOwn, NoResultsCard } from "#src/interface/components/Card.jsx"
import { Link, Meta, Title } from "@solidjs/meta"
import MarketplaceLayout from "#src/interface/marketplace/MarketplaceLayout.jsx"
import * as m from "#src/paraglide/messages.js"
import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
import TitleSection from "#src/interface/marketplace/categoryHeaders/titleSection.jsx"
import PluginHeader from "#src/interface/marketplace/categoryHeaders/toast/plugins.jsx"
import ParaglideHeader from "#src/interface/marketplace/categoryHeaders/cards/paraglide.jsx"
import LintRulesHeader from "#src/interface/marketplace/categoryHeaders/toast/lintRules.jsx"
import LixHeader from "#src/interface/marketplace/categoryHeaders/cards/lix.jsx"
import { renderLocales } from "#src/renderer/renderLocales.js"
import SvelteHeader from "#src/interface/marketplace/categoryHeaders/cards/svelte.jsx"
import NextjsHeader from "#src/interface/marketplace/categoryHeaders/cards/nextjs.jsx"
import GenericHeader from "#src/interface/marketplace/categoryHeaders/cards/generic.jsx"

type SubCategoryApplication = "app" | "library" | "plugin" | "messageLintRule"

export type Category = "application" | "markdown" | "email"
export type SubCategory = SubCategoryApplication

/* Export searchValue to make subpages insert search-terms */
export const [searchValue, setSearchValue] = createSignal<string>("")
const selectedCategory = () => {
	return currentPageContext.urlParsed.pathname.replace("/", "")
}

export function Page(props: {
	minimal?: boolean
	highlights?: Record<string, string>[]
	category?: Category | undefined
	slider?: boolean
	items: Awaited<ReturnType<any>>
}) {
	onMount(() => {
		const urlParams = new URLSearchParams(window.location.search)
		if (urlParams.get("search") !== "" && urlParams.get("search") !== undefined) {
			setSearchValue(urlParams.get("search")?.replace(/%20/g, " ") || "")
		}
	})

	type HeaderContentType = {
		title: string
		description: string
		buttonLink?: string
		buttonText?: string
		icon?: string
		withGuides?: boolean
		coverCard?: JSX.Element
	}

	const getCategoryContent = (): HeaderContentType | undefined => {
		switch (currentPageContext.routeParams.category) {
			case "apps":
				return {
					title: m.marketplace_header_apps_title(),
					description: m.marketplace_header_apps_description(),
					buttonLink: "/documentation/build-app",
					buttonText: m.marketplace_header_apps_button_text(),
				}
			case "libraries":
				return {
					title: m.marketplace_header_libraries_title(),
					description: m.marketplace_header_libraries_description(),
					buttonLink: "/m/gerre34r/library-inlang-paraglideJs",
					buttonText: m.marketplace_header_libraries_button_text(),
					coverCard: <ParaglideHeader />,
				}
			case "plugins":
				return {
					title: m.marketplace_header_plugins_title(),
					description: m.marketplace_header_plugins_description(),
					buttonLink: "/documentation/plugin/guide",
					buttonText: m.marketplace_header_plugins_button_text(),
					coverCard: <PluginHeader />,
				}
			case "lint-rules":
				return {
					title: m.marketplace_header_lintRules_title(),
					description: m.marketplace_header_lintRules_description(),
					buttonLink: "/documentation/build-lint-rule",
					buttonText: m.marketplace_header_lintRules_button_text(),
					coverCard: <LintRulesHeader />,
				}
			case "guides":
				return {
					title: m.marketplace_header_guides_title(),
					description: m.marketplace_header_guides_description(),
					buttonLink: "/documentation/publish-guide",
					buttonText: m.marketplace_header_guides_button_text(),
				}
			case "lix":
				return {
					title: m.marketplace_header_lix_title(),
					description: m.marketplace_header_lix_short_description(),
					buttonLink: "https://github.com/inlang/monorepo/tree/main/lix",
					buttonText: m.marketplace_header_lix_button_text(),
					coverCard: <LixHeader />,
				}
			case "svelte":
				return {
					title: "Svelte - i18n Tooling",
					description: "Recommended internationalization tooling for your svelte stack.",
					icon: "https://avatars.githubusercontent.com/u/23617963?s=200&v=4",
					withGuides: true,
					coverCard: <SvelteHeader />,
				}
			case "nextjs":
				return {
					title: "Next.js - i18n Tooling",
					description: "Recommended internationalization tooling for your next.js stack.",
					icon: "https://assets.vercel.com/image/upload/v1662130559/nextjs/Icon_light_background.png",
					withGuides: true,
					coverCard: <NextjsHeader />,
				}
			default:
				return {
					title: currentPageContext.urlParsed.pathname.split("/")[2]?.toUpperCase() || "Your stack",
					description: "Recommended internationalization tooling for your stack.",
					coverCard: <GenericHeader />,
				}
		}
	}

	return (
		<>
			<Title>
				{currentPageContext.routeParams.category === "svelte" ||
				currentPageContext.routeParams.category === "nextjs"
					? getCategoryContent()?.title + " "
					: (currentPageContext.routeParams.category?.toLowerCase() === "lix" ||
					  currentPageContext.routeParams.category?.toLowerCase() === "guides"
							? ""
							: "Global" + " ") +
					  ((currentPageContext.routeParams.category?.toLowerCase() === "lix"
							? currentPageContext.routeParams.category
							: currentPageContext.routeParams.category
									?.replaceAll("-", " ")
									.replace(/\w\S*/g, (w) => w.replace(/^\w/, (c) => c.toUpperCase()))) +
							" ")}
				| inlang
			</Title>
			<Meta
				name="description"
				content={
					currentPageContext.routeParams.category === "svelte" ||
					currentPageContext.routeParams.category === "nextjs"
						? getCategoryContent()?.description
						: `Find everything globalization (i18n) related to ${currentPageContext.routeParams.category?.replaceAll(
								"-",
								" "
						  )} - inlang`
				}
			/>
			<Meta name="og:image" content="/images/inlang-marketplace-image.jpg" />
			<Meta name="twitter:card" content="summary_large_image" />
			<Meta name="twitter:image" content="/opengraph/inlang-marketplace-image.jpg" />
			<Meta
				name="twitter:image:alt"
				content="inlang's ecosystem helps organizations to go global."
			/>
			<Meta
				name="twitter:title"
				content={`${
					currentPageContext.routeParams.category === "svelte" ||
					currentPageContext.routeParams.category === "nextjs"
						? getCategoryContent()?.title + " "
						: (currentPageContext.routeParams.category?.toLowerCase() === "lix" ||
						  currentPageContext.routeParams.category?.toLowerCase() === "guides"
								? ""
								: "Global" + " ") +
						  ((currentPageContext.routeParams.category?.toLowerCase() === "lix"
								? currentPageContext.routeParams.category
								: currentPageContext.routeParams.category
										?.replaceAll("-", " ")
										.replace(/\w\S*/g, (w) => w.replace(/^\w/, (c) => c.toUpperCase()))) +
								" ")
				} | inlang`}
			/>
			<Meta
				name="twitter:description"
				content={
					currentPageContext.routeParams.category === "svelte" ||
					currentPageContext.routeParams.category === "nextjs"
						? getCategoryContent()?.description
						: `Find everything globalization (i18n) related to ${currentPageContext.routeParams.category?.replaceAll(
								"-",
								" "
						  )} - inlang`
				}
			/>
			<Meta name="twitter:site" content="@inlanghq" />
			<Meta name="twitter:creator" content="@inlanghq" />
			{renderLocales(currentPageContext.urlParsed.pathname).map((locale) => (
				<Link href={locale.href} lang={locale.hreflang} rel={locale.rel} />
			))}
			<MarketplaceLayout>
				<Show when={currentPageContext.routeParams.category && getCategoryContent()}>
					<TitleSection
						title={getCategoryContent()!.title}
						description={getCategoryContent()!.description}
						buttonLink={getCategoryContent()!.buttonLink}
						buttonText={getCategoryContent()!.buttonText}
						icon={getCategoryContent()!.icon}
					/>
					<Show when={getCategoryContent()?.coverCard}>{getCategoryContent()?.coverCard}</Show>
				</Show>
				<div class="pb-16 md:pb-20 min-h-screen relative">
					<SectionLayout showLines={false} type="white">
						<div class="min-h-[70vh]">
							<Show when={props.highlights}>
								<Show when={props.highlights && props.highlights.length > 0}>
									<div
										class={
											"flex md:grid justify-between gap-6 md:flex-row flex-col mb-8 " +
											(props.highlights!.length > 1 ? "md:grid-cols-2" : "md:grid-cols-1")
										}
									>
										<For each={props.highlights}>
											{/* @ts-expect-error */}
											{(highlight) => <Highlight {...highlight} />}
										</For>
									</div>
								</Show>
							</Show>
							<div class="mb-8 grid xl:grid-cols-4 md:grid-cols-2 w-full gap-4 justify-normal items-stretch relative">
								<Gallery
									items={props.items}
									guides={selectedCategory().includes("c/guides")}
									hideBuildYourOwn={getCategoryContent()?.withGuides}
								/>
							</div>{" "}
							<Show when={getCategoryContent()?.withGuides}>
								<p class="text-lg font-semibold leading-snug tracking-tight py-4">Guides</p>
								<div class="mb-8 grid xl:grid-cols-4 md:grid-cols-2 w-full gap-4 justify-normal items-stretch relative">
									<Gallery items={props.items} guides={true} />
								</div>{" "}
							</Show>
						</div>
						<Show when={!props.category && !props.slider && !props.minimal}>
							<div class="mt-20">
								<GetHelp text="Need help or have questions? Join our Discord!" />
							</div>
						</Show>
					</SectionLayout>
				</div>
			</MarketplaceLayout>
		</>
	)
}

const Gallery = (props: { items: any; guides?: boolean; hideBuildYourOwn?: boolean }) => {
	const [show, setShow] = createSignal<boolean>(false)
	onMount(() => {
		setShow(true)
	})
	return (
		<>
			<Show
				when={show()}
				fallback={
					<div class="h-96 w-full col-span-4 flex items-center justify-center py-80 relative">
						<div class="mx-auto">
							<div class="h-12 w-12 animate-spin mb-4">
								<div class="h-full w-full bg-surface-50 border-primary border-4 rounded-full" />
								<div class="h-1/2 w-1/2 absolute top-0 left-0 z-5 bg-surface-50" />
							</div>
						</div>
					</div>
				}
			>
				<Show
					when={props.items && props.items.length > 0}
					fallback={!props.guides && <NoResultsCard category={selectedCategory()} />}
				>
					<For
						each={
							props.guides
								? props.items.filter(
										(item: MarketplaceManifest & { uniqueID: string }) =>
											item.id.split(".")[0] === "guide"
								  )
								: props.items.filter(
										(item: MarketplaceManifest & { uniqueID: string }) =>
											item.id.split(".")[0] !== "guide"
								  )
						}
					>
						{(item) => {
							const displayName =
								typeof item.displayName === "object" ? item.displayName.en : item.displayName

							return <Card item={item} displayName={displayName} />
						}}
					</For>
					<Show when={!props.guides && !props.hideBuildYourOwn}>
						<CardBuildOwn />
					</Show>
				</Show>
			</Show>
		</>
	)
}
