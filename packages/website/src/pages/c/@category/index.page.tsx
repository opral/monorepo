import { For, Show, createSignal, onMount } from "solid-js"
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
		buttonLink: string
		buttonText: string
	}

	const getHeaderContent = (): HeaderContentType | undefined => {
		switch (currentPageContext.routeParams.category) {
			case "apps":
				return {
					title: m.marketplace_header_apps_title(),
					description: m.marketplace_header_apps_description(),
					buttonLink: "/documentation/develop-app",
					buttonText: m.marketplace_header_apps_button_text(),
				}
			case "libraries":
				return {
					title: m.marketplace_header_libraries_title(),
					description: m.marketplace_header_libraries_description(),
					buttonLink: "/m/gerre34r/library-inlang-paraglideJs",
					buttonText: m.marketplace_header_libraries_button_text(),
				}
			case "plugins":
				return {
					title: m.marketplace_header_plugins_title(),
					description: m.marketplace_header_plugins_description(),
					buttonLink: "/documentation/develop-pluginp",
					buttonText: m.marketplace_header_plugins_button_text(),
				}
			case "lint-rules":
				return {
					title: m.marketplace_header_lintRules_title(),
					description: m.marketplace_header_lintRules_description(),
					buttonLink: "/documentation/develop-lint-rule",
					buttonText: m.marketplace_header_lintRules_button_text(),
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
				}
			default:
				return {
					title: "inlang",
					description: "The ecosystem to go global.",
					buttonLink: "/",
					buttonText: "Home",
				}
		}
	}

	return (
		<>
			<Title>
				{currentPageContext.routeParams.category?.toLowerCase() === "lix" ||
				currentPageContext.routeParams.category?.toLowerCase() === "guides"
					? ""
					: "Global"}{" "}
				{currentPageContext.routeParams.category?.toLowerCase() === "lix"
					? currentPageContext.routeParams.category
					: currentPageContext.routeParams.category
							?.replaceAll("-", " ")
							.replace(/\w\S*/g, (w) => w.replace(/^\w/, (c) => c.toUpperCase()))}{" "}
				| inlang
			</Title>
			<Meta
				name="description"
				content={`Find everything globalization (i18n) related to ${currentPageContext.routeParams.category?.replaceAll(
					"-",
					" "
				)} - inlang`}
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
					currentPageContext.routeParams.category?.toLowerCase() === "lix" ||
					currentPageContext.routeParams.category?.toLowerCase() === "guides"
						? ""
						: "Global"
				} ${currentPageContext.routeParams.category} | inlang`}
			/>
			<Meta
				name="twitter:description"
				content={`Find everything globalization (i18n) related to ${currentPageContext.routeParams.category?.replaceAll(
					"-",
					" "
				)} - inlang`}
			/>
			<Meta name="twitter:site" content="@inlanghq" />
			<Meta name="twitter:creator" content="@inlanghq" />
			{renderLocales(currentPageContext.urlParsed.pathname).map((locale) => (
				<Link href={locale.href} lang={locale.hreflang} rel={locale.rel} />
			))}
			<MarketplaceLayout>
				<Show when={currentPageContext.routeParams.category && getHeaderContent()}>
					<TitleSection
						title={getHeaderContent()!.title}
						description={getHeaderContent()!.description}
						buttonLink={getHeaderContent()!.buttonLink}
						buttonText={getHeaderContent()!.buttonText}
					/>
					<Show when={currentPageContext.routeParams.category === "plugins"}>
						<PluginHeader />
					</Show>
					<Show when={currentPageContext.routeParams.category === "lint-rules"}>
						<LintRulesHeader />
					</Show>
					<Show when={currentPageContext.routeParams.category === "libraries"}>
						<ParaglideHeader />
					</Show>
					<Show when={currentPageContext.routeParams.category === "lix"}>
						<LixHeader />
					</Show>
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
								<Gallery items={props.items} guides={selectedCategory().includes("c/guides")} />
							</div>{" "}
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

const Gallery = (props: { items: any; guides?: boolean }) => {
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
					<Show when={!props.guides}>
						<CardBuildOwn />
					</Show>
				</Show>
			</Show>
		</>
	)
}
