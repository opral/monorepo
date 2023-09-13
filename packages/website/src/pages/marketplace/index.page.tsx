import { Layout } from "../Layout.jsx"
import { Meta, Title } from "@solidjs/meta"
import { registry } from "@inlang/marketplace-registry"
import { For, Show, type Accessor, createSignal, createEffect } from "solid-js"
import { Chip } from "#src/components/Chip.jsx"
import { SearchIcon } from "../editor/@host/@owner/@repository/components/SearchInput.jsx"
import { Button } from "../index/components/Button.jsx"
import { GetHelp } from "#src/components/GetHelp.jsx"
import Plus from "~icons/material-symbols/add-rounded"
import Check from "~icons/material-symbols/check"
import { colorForTypeOf, scrollToTop, typeOfIdToTitle } from "./utilities.js"
import type { MarketplaceManifest } from "@inlang/marketplace-manifest"

type Category = "app" | "library" | "plugin" | "messageLintRule"

/* Export searchValue to make subpages insert search-terms */
export const [searchValue, setSearchValue] = createSignal<string>("")
const [selectedCategories, setSelectedCategories] = createSignal<Category[]>([])

const filteredItems = () =>
	registry.filter((item: MarketplaceManifest) => {
		// slice to the first dot yields the category
		const category = item.id.slice(0, item.id.indexOf(".")) as Category

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

export function Page() {
	return (
		<>
			<Title>inlang Marketplace</Title>
			<Meta
				name="description"
				content="Find apps, plugins and lint rules for inlang's ecosystem."
			/>
			<Meta name="og:image" content="/images/inlang-marketplace-image.jpg" />
			<Layout>
				<div class="py-16 md:py-20 min-h-screen relative">
					<div class="grid xl:grid-cols-3 pb-8 gap-8">
						<h1 class="xl:col-span-2 text-[40px] md:text-5xl font-bold text-left leading-tight">
							Explore the marketplace
						</h1>
					</div>
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
					<div class="mb-32 pt-10 grid xl:grid-cols-3 md:grid-cols-2 w-full gap-4 justify-center items-stretch relative">
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
							<a
								href={`/marketplace/${item.id}`}
								class="relative no-underline h-72 flex flex-col gap-2 group"
							>
								<div
									style={{ "--image-url": `url(${item.coverImage})` }}
									class={`w-full h-full flex items-center justify-center bg-surface-50 rounded-lg relative ${
										item.coverImage && `bg-[image:var(--image-url)]`
									} bg-cover bg-center border border-surface-100`}
								>
									<Chip
										text={typeOfIdToTitle(item.id).replace("Message", "")}
										color={colorForTypeOf(item.id)}
										customClasses="absolute right-4 top-4 z-5 backdrop-filter backdrop-blur-sm text-xs"
									/>
									<Show when={!item.coverImage}>
										<img
											class="w-14 h-14 rounded-md m-0 shadow-lg object-cover object-center"
											src={item.icon}
										/>
									</Show>
									<Show when={item.icon && item.coverImage}>
										<img
											class="w-8 h-8 rounded-md m-0 shadow-lg object-cover object-center absolute left-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity"
											src={item.icon}
										/>
									</Show>
								</div>
								<div class="w-full flex justify-between gap-6">
									<div class="flex flex-col gap-0.5">
										<p class="m-0 text-surface-600 no-underline font-medium group-hover:text-surface-900 transition-colors">
											{displayName}
										</p>
										<p class="m-0 text-surface-400 text-sm no-underline line-clamp-1 group-hover:text-surface-500 transition-colors">
											{description}
										</p>
									</div>
									<div class="flex items-center gap-2 flex-shrink-0 group/avatar">
										<Show when={item.publisherIcon} fallback={item.publisherName}>
											<sl-tooltip content={item.publisherName}>
												<Show when={item.publisherIcon}>
													<img
														class="w-6 h-6 rounded-full m-0 group-hover/avatar:opacity-60 transition-opacity duration-500"
														src={item.publisherIcon}
													/>
												</Show>
											</sl-tooltip>
										</Show>
									</div>
								</div>
							</a>
						</>
					)
				}}
			</For>
			<a
				href="/documentation/publish-marketplace"
				class="relative no-underline h-72 flex flex-col gap-2 group"
			>
				<div class="w-full h-full bg-surface-50 text-surface-500 rounded-lg flex justify-center items-center">
					<Plus class="text-4xl" />
				</div>
				<div class="w-full">
					<div class="flex flex-col gap-1">
						<p class="m-0 text-surface-600 no-underline font-medium group-hover:text-surface-900 transition-colors">
							Build your own solution
						</p>
						<p class="m-0 text-surface-400 text-sm no-underline line-clamp-1 group-hover:text-surface-500 transition-colors">
							Can't find what you search for? Build your own solution!
						</p>
					</div>
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
					scrollToTop()
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

		scrollToTop()
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
