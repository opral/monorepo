import { For, Show, createSignal, onMount } from "solid-js"
import { GetHelp } from "#src/interface/components/GetHelp.jsx"
import { SectionLayout } from "#src/pages/index/components/sectionLayout.jsx"
import { currentPageContext } from "#src/renderer/state.js"
// import Highlight from "#src/interface/components/Highlight.jsx"
import Card, { CardBuildOwn, NoResultsCard } from "#src/interface/components/Card.jsx"
import { Meta, Title } from "@solidjs/meta"
import MarketplaceLayout from "#src/interface/marketplace/MarketplaceLayout.jsx"
import SvelteHeader from "#src/interface/marketplace/categoryHeaders/application/svelte.jsx"
import GenericHeader from "#src/interface/marketplace/categoryHeaders/application/generic.jsx"
import * as m from "#src/paraglide/messages.js"

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

	return (
		<>
			<Title>Serach</Title>
			<Meta name="description" content="Globalization infrastructure for software" />
			<Meta name="og:image" content="/opengraph/inlang-search-image.jpg" />
			<MarketplaceLayout>
				<div class="pb-16 md:pb-20 min-h-screen relative">
					<Show
						fallback={
							<div class="pt-8">
								<GenericHeader />
							</div>
						}
						when={currentPageContext.urlParsed.search["q"]?.includes("svelte")}
					>
						<div class="pt-8">
							<SvelteHeader />
						</div>
					</Show>
					<h2 class="text-md text-surface-600 pb-4 pt-8">{m.marketplace_grid_title_generic()}</h2>
					<SectionLayout showLines={false} type="white">
						<div class="relative">
							<div class="mb-32 grid xl:grid-cols-4 md:grid-cols-2 w-full gap-4 justify-normal items-stretch relative">
								<Gallery items={props.items} />
							</div>

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

const Gallery = (props: { items: any }) => {
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
					fallback={<NoResultsCard category={selectedCategory()} />}
				>
					<For each={props.items}>
						{(item) => {
							const displayName =
								typeof item.displayName === "object" ? item.displayName.en : item.displayName

							return <Card item={item} displayName={displayName} />
						}}
					</For>
					<CardBuildOwn />
				</Show>
			</Show>
		</>
	)
}
