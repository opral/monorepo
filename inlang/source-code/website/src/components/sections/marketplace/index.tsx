import { For, Show, type Accessor, createSignal, createEffect, Match, Switch, onMount } from "solid-js"
import { SearchIcon } from "#src/pages/editor/@host/@owner/@repository/components/SearchInput.jsx"
// import { Button } from "#src/pages/index/components/Button.jsx"
import { GetHelp } from "#src/components/GetHelp.jsx"
import Check from "~icons/material-symbols/check"
import Right from "~icons/material-symbols/chevron-right"
import Left from "~icons/material-symbols/chevron-left"
import { SectionLayout } from "#src/pages/index/components/sectionLayout.jsx"
import { algorithm } from "./algorithm.js"
import { currentPageContext } from "#src/renderer/state.js"
// @ts-ignore
import { createSlider } from "solid-slider"
import "solid-slider/slider.css"
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
const [selectedSubCategories, setSelectedSubCategories] = createSignal<SubCategory[]>([])

const filteredItems = (slider?: boolean) => {
	return algorithm(
		selectedSubCategories(),
		searchValue(),
		selectedCategory() === "marketplace" || slider ? undefined : selectedCategory()
	)
}
onMount(() => {
	const urlParams = new URLSearchParams(window.location.search)
	if (urlParams.get("search") !== "" && urlParams.get("search") !== undefined) {
		setSearchValue(urlParams.get("search")?.replace(/%20/g, " ") || "")
	}
})

const randomizedItems = () => filteredItems(true).reverse()

export default function Marketplace(props: {
	minimal?: boolean
	highlights?: Record<string, string>[]
	category?: Category | undefined
	slider?: boolean
}) {
	const [details, setDetails] = createSignal({})
	const [slider, { next, prev }] = createSlider({
		slides: {
			number: filteredItems(true).length,
			perView: window ? (window.innerWidth > 768 ? 3 : 1) : 1,
			spacing: 16,
		},

		detailsChanged: (slider: { track: { details: any } }) => {
			setDetails(slider.track.details)
		},
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
				<Switch>
					<Match when={props.slider}>
						<h3 class="font-semibold text-2xl mb-6">Items that might interest you</h3>
						<div class="relative">
							{/* @ts-ignore */}
							<div use:slider class="cursor-grab active:cursor-grabbing">
								<Gallery randomize />
							</div>
							<button
								// @ts-ignore
								disabled={details().progress === 0}
								onClick={prev}
								class="absolute -left-2 top-1/2 -translate-y-1/2 p-1 bg-background border border-surface-100 rounded-full shadow-xl shadow-on-background/20 transition-all hover:bg-surface-50 disabled:opacity-0"
							>
								<Left class="h-8 w-8" />
							</button>
							<button
								// @ts-ignore
								disabled={details().progress > 0.99}
								onClick={next}
								class="absolute -right-2 top-1/2 -translate-y-1/2 p-1 bg-background border border-surface-100 rounded-full shadow-xl shadow-on-background/20 transition-all hover:bg-surface-50 disabled:opacity-0"
							>
								<Right class="h-8 w-8" />
							</button>
						</div>
					</Match>
					<Match when={!props.slider}>
						<div class="mb-32 grid xl:grid-cols-3 md:grid-cols-2 w-full gap-4 justify-normal items-stretch relative">
							<Gallery />
						</div>
					</Match>
				</Switch>
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
			{/* <Match when={filteredItems(true).length === 0 && searchValue() !== ""}> */}
			{/* <NoResultsCard /> */}
			{/* </Match> */}
		</>
	)
}

// interface SearchInputProps {
// 	placeholder: string
// 	textValue: Accessor<string>
// 	setTextValue: (value: string) => void
// }

// const Search = (props: SearchInputProps) => {
// 	createEffect(() => {
// 		const handleKeyDown = (e: KeyboardEvent) => {
// 			if (e.metaKey && e.key === "f") {
// 				e.preventDefault()
// 				const input = document.querySelector("sl-input")
// 				input?.focus()
// 			}
// 		}
// 		const handleKeyUp = (e: KeyboardEvent) => {
// 			if (e.key === "Escape") {
// 				const input = document.querySelector("sl-input")
// 				input?.blur()
// 			}
// 		}
// 		document.addEventListener("keyup", handleKeyUp)
// 		document.addEventListener("keydown", handleKeyDown)
// 		return () => {
// 			document.removeEventListener("keyup", handleKeyUp)
// 			document.removeEventListener("keydown", handleKeyDown)
// 		}
// 	})

// 	return (
// 		<div>
// 			<sl-input
// 				style={{
// 					padding: "0px",
// 					border: "none",
// 					"--tw-ring-color": "#06B6D4",
// 					"border-radius": "4px",
// 				}}
// 				prop:placeholder={props.placeholder}
// 				prop:size={"medium"}
// 				prop:value={props.textValue()}
// 				onInput={(e) => {
// 					props.setTextValue(e.currentTarget.value)
// 				}}
// 			>
// 				<div slot={"suffix"}>
// 					<SearchIcon />
// 				</div>
// 			</sl-input>
// 		</div>
// 	)
// }

// const Tags = () => {
// 	function selectTag(tag: SubCategory) {
// 		if (selectedSubCategories().includes(tag)) {
// 			setSelectedSubCategories(selectedSubCategories().filter((t) => t !== tag))
// 		} else {
// 			setSelectedSubCategories([...selectedSubCategories(), tag])
// 		}
// 	}

// 	return (
// 		<div class="flex gap-2">
// 			<div
// 				onClick={() => selectTag("app")}
// 				class={
// 					"gap-2 relative py-1.5 rounded-full cursor-pointer border border-solid text-sm capitalize hover:opacity-90 transition-all duration-100 flex items-center " +
// 					(selectedSubCategories().includes("app")
// 						? "bg-surface-800 text-background border-surface-800 pl-7 pr-3"
// 						: "bg-background text-surface-600 border-surface-200 px-3 hover:border-surface-400")
// 				}
// 			>
// 				<Show when={selectedSubCategories().includes("app")}>
// 					<Check class="w-4 h-4 absolute left-2" />
// 				</Show>
// 				<p class="m-0">Apps</p>
// 			</div>
// 			<div
// 				onClick={() => selectTag("library")}
// 				class={
// 					"gap-2 relative py-1.5 rounded-full cursor-pointer border border-solid text-sm capitalize hover:opacity-90 transition-all duration-100 flex items-center " +
// 					(selectedSubCategories().includes("library")
// 						? "bg-surface-800 text-background border-surface-800 pl-7 pr-3"
// 						: "bg-background text-surface-600 border-surface-200 px-3 hover:border-surface-400")
// 				}
// 			>
// 				<Show when={selectedSubCategories().includes("library")}>
// 					<Check class="w-4 h-4 absolute left-2" />
// 				</Show>
// 				<p class="m-0">Libraries</p>
// 			</div>
// 			<div
// 				onClick={() => selectTag("messageLintRule")}
// 				class={
// 					"gap-2 relative py-1.5 rounded-full cursor-pointer border border-solid text-sm capitalize hover:opacity-90 transition-all duration-100 flex items-center " +
// 					(selectedSubCategories().includes("messageLintRule")
// 						? "bg-surface-800 text-background border-surface-800 pl-7 pr-3"
// 						: "bg-background text-surface-600 border-surface-200 px-3 hover:border-surface-400")
// 				}
// 			>
// 				<Show when={selectedSubCategories().includes("messageLintRule")}>
// 					<Check class="w-4 h-4 absolute left-2" />
// 				</Show>
// 				<p class="m-0">Lint Rules</p>
// 			</div>
// 			<div
// 				onClick={() => selectTag("plugin")}
// 				class={
// 					"gap-2 relative py-1.5 rounded-full cursor-pointer border border-solid text-sm capitalize hover:opacity-90 transition-all duration-100 flex items-center " +
// 					(selectedSubCategories().includes("plugin")
// 						? "bg-surface-800 text-background border-surface-800 pl-7 pr-3"
// 						: "bg-background text-surface-600 border-surface-200 px-3 hover:border-surface-400")
// 				}
// 			>
// 				<Show when={selectedSubCategories().includes("plugin")}>
// 					<Check class="w-4 h-4 absolute left-2" />
// 				</Show>
// 				<p class="m-0">Plugins</p>
// 			</div>
// 		</div>
// 	)
// }
