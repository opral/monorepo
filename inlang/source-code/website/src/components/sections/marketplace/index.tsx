import { registry } from "@inlang/marketplace-registry"
import { For, Show, type Accessor, createSignal, createEffect } from "solid-js"
import { SearchIcon } from "#src/pages/editor/@host/@owner/@repository/components/SearchInput.jsx"
import { Button } from "#src/pages/index/components/Button.jsx"
import { GetHelp } from "#src/components/GetHelp.jsx"
import Check from "~icons/material-symbols/check"
import Right from "~icons/material-symbols/chevron-right"
import Left from "~icons/material-symbols/chevron-left"
import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
import { SectionLayout } from "#src/pages/index/components/sectionLayout.jsx"
// import { filteredItems } from "./algorithm.js"
// @ts-ignore
import { createSlider } from "solid-slider"
import "solid-slider/slider.css"
import Highlight from "#src/components/Highlight.jsx"
import Card, { CardBuildOwn } from "#src/components/Card.jsx"

export type Category = "app" | "documents" | "email" | "payments" | "website"
export type SubCategory = "app" | "library" | "plugin" | "messageLintRule"

/* Export searchValue to make subpages insert search-terms */
export const [searchValue, setSearchValue] = createSignal<string>("")
const [selectedCategories, setSelectedCategories] = createSignal<SubCategory[]>([])

const filteredItems = () =>
	registry.filter((item: MarketplaceManifest) => {
		// slice to the first dot yields the category
		const category = item.id.slice(0, item.id.indexOf(".")) as SubCategory

		if (selectedCategories().length > 0 && !selectedCategories().includes(category)) {
			return false
		}

		const search = searchValue().toLowerCase()

		const displayName =
			typeof item.displayName === "object" ? item.displayName.en : item.displayName

		const isSearchMatch =
			displayName.toLowerCase().includes(search) ||
			item.publisherName.toLowerCase().includes(search) ||
			item.keywords.some((keyword: string) => keyword.toLowerCase().includes(search))

		return isSearchMatch
	})

// filteredItems(selectedCategories(), searchValue())

export default function Marketplace(props: {
	minimal?: boolean
	highlights?: Record<string, string>[]
	category?: Category | undefined
	slider?: boolean
}) {
	const [details, setDetails] = createSignal({})
	const [slider, { next, prev }] = createSlider({
		slides: {
			number: filteredItems().length + 1,
			perView: 3,
			spacing: 16,
		},

		detailsChanged: (slider: { track: { details: any } }) => {
			setDetails(slider.track.details)
		},
	})

	return (
		<SectionLayout showLines={false} type="white">
			<div class="pb-16 md:pb-20 relative">
				<Show when={props.highlights}>
					<Show when={props.highlights && props.highlights.length > 0}>
						<div class="flex justify-between gap-6 md:flex-row flex-col mb-8">
							<For each={props.highlights}>{(highlight) => <Highlight {...highlight} />}</For>
						</div>
					</Show>
				</Show>
				<Show when={!props.minimal}>
					<div class="w-full top-16 sticky bg-background/90 backdrop-blur-xl pb-4 pt-8 z-10 flex flex-col gap-5">
						<Search
							placeholder={"Search for apps, plugins, lint rules ..."}
							textValue={searchValue}
							setTextValue={setSearchValue}
						/>
						<div class="flex justify-between items-center">
							<Tags />
							<div class="max-sm:hidden">
								<Button type="text" href="/documentation/publish-marketplace">
									Build your own
								</Button>
							</div>
						</div>
					</div>
				</Show>
				<Show
					when={props.slider}
					fallback={
						<div class="mb-32 pt-10 grid xl:grid-cols-3 md:grid-cols-2 w-full gap-4 justify-center items-stretch relative">
							<Gallery />
						</div>
					}
				>
					<h3 class="font-semibold text-2xl mb-6">Related items other people visited</h3>
					<div class="relative">
						<div use:slider class="cursor-grab active:cursor-grabbing">
							<Gallery />
						</div>
						<button
							disabled={details().progress === 0}
							onClick={prev}
							class="absolute -left-2 top-1/2 -translate-y-1/2 p-1 bg-background border border-surface-100 rounded-full shadow-xl shadow-on-background/20 transition-all hover:bg-surface-50 disabled:opacity-0"
						>
							<Left class="h-8 w-8" />
						</button>
						<button
							disabled={details().progress > 0.99}
							onClick={next}
							class="absolute -right-2 top-1/2 -translate-y-1/2 p-1 bg-background border border-surface-100 rounded-full shadow-xl shadow-on-background/20 transition-all hover:bg-surface-50 disabled:opacity-0"
						>
							<Right class="h-8 w-8" />
						</button>
					</div>
				</Show>

				<Show when={!props.category && !props.slider && !props.minimal}>
					<GetHelp text="Need help or have questions? Join our Discord!" />
				</Show>
			</div>
		</SectionLayout>
	)
}

const Gallery = () => {
	return (
		<>
			<For each={filteredItems()}>
				{(item) => {
					const displayName =
						typeof item.displayName === "object" ? item.displayName.en : item.displayName

					return <Card item={item} displayName={displayName} />
				}}
			</For>
			<CardBuildOwn />
		</>
	)
}

interface SearchInputProps {
	placeholder: string
	textValue: Accessor<string>
	setTextValue: (value: string) => void
}

const Search = (props: SearchInputProps) => {
	createEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.metaKey && e.key === "f") {
				e.preventDefault()
				const input = document.querySelector("sl-input")
				input?.focus()
			}
		}
		const handleKeyUp = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				const input = document.querySelector("sl-input")
				input?.blur()
			}
		}
		document.addEventListener("keyup", handleKeyUp)
		document.addEventListener("keydown", handleKeyDown)
		return () => {
			document.removeEventListener("keyup", handleKeyUp)
			document.removeEventListener("keydown", handleKeyDown)
		}
	})

	return (
		<div>
			<sl-input
				style={{
					padding: "0px",
					border: "none",
					"--tw-ring-color": "#06B6D4",
					"border-radius": "4px",
				}}
				prop:placeholder={props.placeholder}
				prop:size={"medium"}
				prop:value={props.textValue()}
				onInput={(e) => {
					props.setTextValue(e.currentTarget.value)
				}}
			>
				<div slot={"suffix"}>
					<SearchIcon />
				</div>
			</sl-input>
		</div>
	)
}

const Tags = () => {
	function selectTag(tag: SubCategory) {
		if (selectedCategories().includes(tag)) {
			setSelectedCategories(selectedCategories().filter((t) => t !== tag))
		} else {
			setSelectedCategories([...selectedCategories(), tag])
		}
	}

	return (
		<div class="flex gap-2">
			<div
				onClick={() => selectTag("app")}
				class={
					"gap-2 relative py-1.5 rounded-full cursor-pointer border border-solid text-sm capitalize hover:opacity-90 transition-all duration-100 flex items-center " +
					(selectedCategories().includes("app")
						? "bg-surface-800 text-background border-surface-800 pl-7 pr-3"
						: "bg-background text-surface-600 border-surface-200 px-3 hover:border-surface-400")
				}
			>
				<Show when={selectedCategories().includes("app")}>
					<Check class="w-4 h-4 absolute left-2" />
				</Show>
				<p class="m-0">Apps</p>
			</div>
			<div
				onClick={() => selectTag("library")}
				class={
					"gap-2 relative py-1.5 rounded-full cursor-pointer border border-solid text-sm capitalize hover:opacity-90 transition-all duration-100 flex items-center " +
					(selectedCategories().includes("library")
						? "bg-surface-800 text-background border-surface-800 pl-7 pr-3"
						: "bg-background text-surface-600 border-surface-200 px-3 hover:border-surface-400")
				}
			>
				<Show when={selectedCategories().includes("library")}>
					<Check class="w-4 h-4 absolute left-2" />
				</Show>
				<p class="m-0">Libraries</p>
			</div>
			<div
				onClick={() => selectTag("messageLintRule")}
				class={
					"gap-2 relative py-1.5 rounded-full cursor-pointer border border-solid text-sm capitalize hover:opacity-90 transition-all duration-100 flex items-center " +
					(selectedCategories().includes("messageLintRule")
						? "bg-surface-800 text-background border-surface-800 pl-7 pr-3"
						: "bg-background text-surface-600 border-surface-200 px-3 hover:border-surface-400")
				}
			>
				<Show when={selectedCategories().includes("messageLintRule")}>
					<Check class="w-4 h-4 absolute left-2" />
				</Show>
				<p class="m-0">Lint Rules</p>
			</div>
			<div
				onClick={() => selectTag("plugin")}
				class={
					"gap-2 relative py-1.5 rounded-full cursor-pointer border border-solid text-sm capitalize hover:opacity-90 transition-all duration-100 flex items-center " +
					(selectedCategories().includes("plugin")
						? "bg-surface-800 text-background border-surface-800 pl-7 pr-3"
						: "bg-background text-surface-600 border-surface-200 px-3 hover:border-surface-400")
				}
			>
				<Show when={selectedCategories().includes("plugin")}>
					<Check class="w-4 h-4 absolute left-2" />
				</Show>
				<p class="m-0">Plugins</p>
			</div>
		</div>
	)
}
