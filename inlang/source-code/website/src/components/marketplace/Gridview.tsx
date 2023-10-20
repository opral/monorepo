import { For, Show, createSignal, onMount } from "solid-js"
import { GetHelp } from "#src/components/GetHelp.jsx"
import { SectionLayout } from "#src/pages/index/components/sectionLayout.jsx"
import { algorithm } from "./helper/algorithm.js"
import { currentPageContext } from "#src/renderer/state.js"
import Highlight from "#src/components/Highlight.jsx"
import Card, { CardBuildOwn, NoResultsCard } from "#src/components/Card.jsx"

type SubCategoryApplication = "app" | "library" | "plugin" | "messageLintRule"

export type Category = "app" | "documents" | "email" | "payments" | "website"
export type SubCategory = SubCategoryApplication

/* Export searchValue to make subpages insert search-terms */
export const [searchValue, setSearchValue] = createSignal<string>("")
const selectedCategory = () => {
	return currentPageContext.urlParsed.pathname.replace("/", "")
}
const [selectedSubCategories] = createSignal<SubCategory[]>([])

const filteredItems = (slider?: boolean) => {
	return algorithm(
		selectedSubCategories(),
		searchValue(),
		selectedCategory() === "marketplace" || slider ? undefined : selectedCategory()
	)
}

const randomizedItems = () => filteredItems(true).reverse()

export default function Gridview(props: {
	minimal?: boolean
	highlights?: Record<string, string>[]
	category?: Category | undefined
	slider?: boolean
}) {
	onMount(() => {
		const urlParams = new URLSearchParams(window.location.search)
		if (urlParams.get("search") !== "" && urlParams.get("search") !== undefined) {
			setSearchValue(urlParams.get("search")?.replace(/%20/g, " ") || "")
		}
	})

	return (
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

				<div class="mb-32 grid xl:grid-cols-4 md:grid-cols-2 w-full gap-4 justify-normal items-stretch relative">
					<Gallery />
				</div>

				<Show when={!props.category && !props.slider && !props.minimal}>
					<div class="mt-20">
						<GetHelp text="Need help or have questions? Join our Discord!" />
					</div>
				</Show>
			</div>
		</SectionLayout>
	)
}

const Gallery = (props: { randomize?: boolean }) => {
	return (
		<>
			<Show
				when={filteredItems(props.randomize).length > 0}
				fallback={<NoResultsCard category={selectedCategory()} />}
			>
				<For each={props.randomize ? randomizedItems() : filteredItems()}>
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
