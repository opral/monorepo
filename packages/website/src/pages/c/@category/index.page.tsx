import { For, Show, createEffect, createSignal, onMount } from "solid-js"
import { GetHelp } from "#src/interface/components/GetHelp.jsx"
import { SectionLayout } from "#src/pages/index/components/sectionLayout.jsx"
import { currentPageContext } from "#src/renderer/state.js"
import Highlight from "#src/interface/components/Highlight.jsx"
import Card, { CardBuildOwn, NoResultsCard } from "#src/interface/components/Card.jsx"
import { Meta, Title } from "@solidjs/meta"
import MarketplaceLayout from "#src/interface/marketplace/MarketplaceLayout.jsx"
import SubcategoryPills from "#src/interface/marketplace/SubcategoryPills.jsx"
import * as m from "@inlang/paraglide-js/website/messages"
import {
	IconFlutter,
	IconJavascript,
	IconNextjs,
	IconReact,
	IconSvelte,
	IconVue,
} from "#src/interface/custom-icons/subcategoryIcon.jsx"
import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
import SvelteHeader from "#src/interface/marketplace/categoryHeaders/application/svelte.jsx"
import GenericHeader from "#src/interface/marketplace/categoryHeaders/application/generic.jsx"

type SubCategoryApplication = "app" | "library" | "plugin" | "messageLintRule"

export type Category = "application" | "markdown" | "email" | "website"
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
	const getSubCategies = [
		{
			name: "Svelte",
			param: "svelte",
			icon: <IconSvelte class="-ml-1 w-5 h-5" />,
		},
		{
			name: "React",
			param: "react",
			icon: <IconReact class="-ml-1 w-5 h-5" />,
		},
		{
			name: "Next.js",
			param: "nextjs",
			icon: <IconNextjs class="-ml-1 w-5 h-5" />,
		},
		{
			name: "Vue",
			param: "vue",
			icon: <IconVue class="-ml-1 w-5 h-5" />,
		},
		{
			name: "Javascript",
			param: "javascript",
			icon: <IconJavascript class="-ml-1 w-5 h-5" />,
		},
		{
			name: "Flutter",
			param: "flutter",
			icon: <IconFlutter class="-ml-1 w-5 h-5" />,
		},
	]

	return (
		<>
			<Title>
				Global{" "}
				{currentPageContext.routeParams.category
					?.replaceAll("-", " ")
					.replace(/\w\S*/g, (w) => w.replace(/^\w/, (c) => c.toUpperCase()))}{" "}
				- inlang
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
				content={`Global ${currentPageContext.routeParams.category} - inlang`}
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
			<MarketplaceLayout>
				<Show when={currentPageContext.routeParams.category === "application"}>
					<div class="pt-4 text-sm font-medium flex items-center gap-3 w-full overflow-x-scroll pb-4 overflow-scrollbar overflow-scrollbar-x">
						<p class="pr-4 text-surface-400">{m.footer_category_title() + ":"}</p>
						<SubcategoryPills links={getSubCategies} />
					</div>
					<Show
						fallback={<GenericHeader />}
						when={currentPageContext.urlParsed.search["q"]?.includes("svelte")}
					>
						<SvelteHeader />
					</Show>
				</Show>
				<div class="pb-16 md:pb-20 min-h-screen relative">
					<h2 class="text-md text-surface-600 pb-4 pt-8">{m.marketplace_grid_title_generic()}</h2>
					<SectionLayout showLines={false} type="white">
						<div class="relative">
							<Show when={props.highlights}>
								<Show when={props.highlights && props.highlights.length > 0}>
									<div
										class={
											"flex md:grid justify-between gap-6 md:flex-row flex-col mb-8 " +
											(props.highlights!.length > 1 ? "md:grid-cols-2" : "md:grid-cols-1")
										}
									>
										{/* @ts-expect-error */}
										<For each={props.highlights}>{(highlight) => <Highlight {...highlight} />}</For>
									</div>
								</Show>
							</Show>

							<div class="mb-8 grid xl:grid-cols-4 md:grid-cols-2 w-full gap-4 justify-normal items-stretch relative">
								<Gallery items={props.items} />
							</div>

							<Guides items={props.items} />

							<Show when={!props.category && !props.slider && !props.minimal}>
								<div class="mt-20">
									<GetHelp text="Need help or have questions? Join our Discord!" />
								</div>
							</Show>
						</div>
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

const Guides = (props: { items: (MarketplaceManifest & { uniqueID: string })[] }) => {
	const [show, setShow] = createSignal<boolean>(false)
	createEffect(() => {
		if (props.items && props.items?.some((item) => item.id.split(".")[0] === "guide")) {
			setShow(true)
		}
	})
	return (
		<Show when={show()}>
			<h2 class="text-md text-surface-600 pb-4 pt-8">{m.marketplace_grid_title_guides()}</h2>
			<div class="mb-32 grid xl:grid-cols-4 md:grid-cols-2 w-full gap-4 justify-normal items-stretch relative">
				<Gallery items={props.items} guides />
			</div>
		</Show>
	)
}
