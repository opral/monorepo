import { Layout } from "../Layout.jsx"
import { Meta, Title } from "@solidjs/meta"
import { registry } from "@inlang/marketplace-registry"
import { For, Show, type Accessor, createSignal, createEffect } from "solid-js"
import { Chip } from "#src/components/Chip.jsx"
import { SearchIcon } from "../editor/@host/@owner/@repository/components/SearchInput.jsx"
import { Button } from "../index/components/Button.jsx"
import { GetHelp } from "#src/components/GetHelp.jsx"
import Plus from "~icons/material-symbols/add-rounded"
import { colorForTypeOf, typeOfIdToTitle } from "./utilities.js"
import type { MarketplaceManifest } from "@inlang/marketplace-manifest"

type Category = "app" | "library" | "plugin" | "messageLintRule"

/* Export searchValue to make subpages insert search-terms */
export const [searchValue, setSearchValue] = createSignal<string>("")
const [selectedCategories, setSelectedCategories] = createSignal<Category[]>([
	"app",
	"library",
	"plugin",
	"messageLintRule",
])

const filteredItems = () =>
	registry.filter((item: MarketplaceManifest) => {
		// slice to the first dot yields the category
		const category = item.id.slice(0, item.id.indexOf(".")) as Category

		if (!selectedCategories().includes(category)) {
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

export function Page() {
	return (
		<>
			<Title>inlang Marketplace</Title>
			<Meta
				name="description"
				content="Find apps, plugins and lint rules for inlang's ecosystem."
			/>
			<Meta name="og:image" content="/images/inlang-social-image.jpg" />
			<Layout>
				<div class="py-16 md:py-20 min-h-screen relative">
					<div class="grid xl:grid-cols-3 pb-8 gap-8">
						<h1 class="xl:col-span-2 text-[40px] md:text-5xl font-bold text-left leading-tight">
							Explore the marketplace
						</h1>
					</div>
					<div class="w-full top-16 sticky bg-background pb-4 pt-8 z-10 flex flex-col gap-5 outline outline-4 outline-background">
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
						<div class="h-[1px] w-full bg-surface-2 absolute -bottom-1" />
					</div>
					<div class="mb-16 pt-10 grid xl:grid-cols-3 md:grid-cols-2 w-full gap-4 justify-center items-stretch relative">
						<Gallery />
					</div>
					<GetHelp text="Need help or have questions? Join our Discord!" />
				</div>
			</Layout>
		</>
	)
}

const Gallery = () => {
	return (
		<>
			<For each={filteredItems()}>
				{(item) => {
					const displayName =
						typeof item.displayName === "object" ? item.displayName.en : item.displayName
					const description =
						typeof item.description === "object" ? item.description.en : item.description

					return (
						<>
							<a href={`/marketplace/${item.id}`} class="relative no-underline h-64">
								<div class="flex flex-col relative justify-between gap-4 bg-surface-100 h-full hover:bg-surface-200 p-6 rounded-xl border border-surface-2 cursor-pointer">
									<div class="flex flex-col gap-4">
										<div class="flex items-center gap-4">
											<Show
												when={item.icon}
												fallback={
													<div class="w-10 h-10 font-semibold text-xl rounded-md m-0 shadow-lg object-cover object-center flex items-center justify-center bg-gradient-to-t from-surface-800 to-surface-600 text-background">
														{displayName[0]}
													</div>
												}
											>
												<img
													class="w-10 h-10 rounded-md m-0 shadow-lg object-cover object-center"
													src={item.icon}
												/>
											</Show>
											<p class="m-0 text-surface-900 font-semibold text-md">{displayName}</p>
										</div>
										<p class="m-0 font-normal leading-6 text-sm tracking-wide text-surface-500 line-clamp-3">
											{description}
										</p>
									</div>
									<div class="w-full flex items-end justify-between">
										<div class="flex gap-2 items-center pt-6">
											<Show
												when={item.publisherIcon}
												fallback={
													<div class="w-6 h-6 flex items-center justify-center text-background capitalize font-medium rounded-full m-0 bg-surface-900">
														{item.publisherName[0]}
													</div>
												}
											>
												<img class="w-6 h-6 rounded-full m-0" src={item.publisherIcon} />
											</Show>
											<p class="m-0 text-surface-600 no-underline font-medium">
												{item.publisherName}
											</p>
										</div>
									</div>
									<Chip
										text={typeOfIdToTitle(item.id).replace("Message", "")}
										color={colorForTypeOf(item.id)}
										customClasses="absolute right-4 top-4 z-5 backdrop-filter backdrop-blur-lg"
									/>
								</div>
							</a>
						</>
					)
				}}
			</For>
			<a href="/documentation/publish-marketplace" class="relative no-underline">
				<div class="flex flex-col h-64 text-surface-500 relative justify-center items-center gap-4 bg-surface-100 max-h-full hover:bg-surface-200 p-6 rounded-xl border border-surface-2 cursor-pointer">
					<Plus class="text-4xl" />
					<p class="m-0 font-normal leading-6 text-sm tracking-wide line-clamp-3">Build your own</p>
				</div>
			</a>
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
					window.scrollTo({ top: 170, behavior: "smooth" })
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
	function selectTag(tag: Category) {
		if (selectedCategories().includes(tag)) {
			setSelectedCategories(selectedCategories().filter((t) => t !== tag))
		} else {
			setSelectedCategories([...selectedCategories(), tag])
		}
	}

	return (
		<div class="flex gap-3">
			<div
				onClick={() => selectTag("app")}
				class={
					"gap-2 px-3 py-1.5 rounded-full cursor-pointer text-sm capitalize hover:opacity-90 transition-all duration-100 " +
					(selectedCategories().includes("app")
						? "bg-surface-800 text-background"
						: "bg-surface-200 text-surface-600")
				}
			>
				<p class="m-0">Apps</p>
			</div>
			<div
				onClick={() => selectTag("library")}
				class={
					"gap-2 px-3 py-1.5 rounded-full cursor-pointer text-sm capitalize hover:opacity-90 transition-all duration-100 " +
					(selectedCategories().includes("library")
						? "bg-surface-800 text-background"
						: "bg-surface-200 text-surface-600")
				}
			>
				<p class="m-0">Libraries</p>
			</div>
			<div
				onClick={() => selectTag("messageLintRule")}
				class={
					"gap-2 px-3 py-1.5 rounded-full cursor-pointer text-sm capitalize hover:opacity-90 transition-all duration-100 " +
					(selectedCategories().includes("messageLintRule")
						? "bg-surface-800 text-background"
						: "bg-surface-200 text-surface-600")
				}
			>
				<p class="m-0">Lint Rules</p>
			</div>
			<div
				onClick={() => selectTag("plugin")}
				class={
					"gap-2 px-3 py-1.5 rounded-full cursor-pointer text-sm capitalize hover:opacity-90 transition-all duration-100 " +
					(selectedCategories().includes("plugin")
						? "bg-surface-800 text-background"
						: "bg-surface-200 text-surface-600")
				}
			>
				<p class="m-0">Plugins</p>
			</div>
		</div>
	)
}
