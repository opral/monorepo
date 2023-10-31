import { For, Show, createEffect, createSignal } from "solid-js"
import { GetHelp } from "#src/interface/components/GetHelp.jsx"
import { SectionLayout } from "#src/pages/index/components/sectionLayout.jsx"
import { currentPageContext } from "#src/renderer/state.js"
import Card, { CardBuildOwn, NoResultsCard } from "#src/interface/components/Card.jsx"
import { rpc } from "@inlang/rpc"
import * as m from "@inlang/paraglide-js/website/messages"

type SubCategoryApplication = "app" | "library" | "plugin" | "messageLintRule"

export type Category = "application" | "markdown" | "email" | "payments" | "website"
export type SubCategory = SubCategoryApplication

/* Export searchValue to make subpages insert search-terms */
export const [searchValue, setSearchValue] = createSignal<string>("")
const selectedCategory = () => {
	return currentPageContext.urlParsed.pathname.replace("/", "")
}
const [filteredItems, setFilteredItems] = createSignal<any[]>([])

const filterItems = async () => {
	let items
	if (
		selectedCategory() === "application" ||
		selectedCategory() === "website" ||
		selectedCategory() === "email" ||
		selectedCategory() === "markdown"
	) {
		items = await rpc.search({ term: selectedCategory(), category: true })
	} else {
		items = await rpc.search({ term: searchValue() })
	}

	// @ts-expect-error
	setFilteredItems(JSON.parse(items.data))
}

export default function Gridview(props: {
	minimal?: boolean
	highlights?: Record<string, string>[]
	category?: Category | undefined
	slider?: boolean
}) {
	createEffect(() => {
		if (currentPageContext.urlParsed.search["search"]) {
			setSearchValue(currentPageContext.urlParsed.search["search"]?.replace(/%20/g, " ") || "")
		}

		filterItems()
	})

	return (
		<SectionLayout showLines={false} type="white">
			<div class="relative">
				<div class="mb-32 grid xl:grid-cols-4 md:grid-cols-2 w-full gap-4 justify-normal items-stretch relative">
					<Gallery />
				</div>

				<Show when={!props.category && !props.slider && !props.minimal}>
					<div class="mt-20">
						<GetHelp text={m.marketplace_grid_need_help()} />
					</div>
				</Show>
			</div>
		</SectionLayout>
	)
}

const Gallery = () => {
	return (
		<>
			<Show when={filteredItems()} fallback={<NoResultsCard category={selectedCategory()} />}>
				<For each={filteredItems()}>
					{(item) => {
						const displayName =
							typeof item.displayName === "object" ? item.displayName.en : item.displayName

						return <Card item={item} displayName={displayName} />
					}}
				</For>
				<CardBuildOwn />
			</Show>
		</>
	)
}
