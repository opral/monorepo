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
	const icons = registry
		.slice(registry.length - 9, registry.length)
		.map((item: MarketplaceManifest) => item.icon)

	return (
		<>
			<Title>inlang Marketplace</Title>
			<Meta
				name="description"
				content="Find apps, plugins and lint rules for inlang's ecosystem."
			/>
			<Meta name="og:image" content="/images/inlang-marketplace-image.jpg" />
			<Layout>
				<div class="pb-16 md:pb-20 min-h-screen relative">
					<div class="grid xl:grid-cols-3 pb-8 xl:gap-8 grid-flow-row-dense">
						<div class="relative z-20 xl:mt-0 -mt-12 pb-8 xl:pb-0">
							<h1 class="xl:col-span-2 md:pt-20 pt-16 text-[40px] md:text-5xl font-bold text-left leading-tight mb-3">
								Marketplace
							</h1>
							<h2 class="text-3xl text-surface-500 font-semibold xl:mb-4">Explore the ecosystem</h2>
						</div>
						<div class="xl:col-span-2 max-xl:row-start-1 relative max-xl:max-h-14 xl:blur-0 blur-xl pointer-events-none w-full flex xl:justify-end content-start items-start flex-wrap gap-4 pt-12 justify-start xl:ml-auto max-w-lg">
							<For each={icons}>
								{(icon) => (
									<div
										style={{
											"background-image": `url(${icon})`,
										}}
										class="w-16 h-16 rounded-lg bg-surface-200 bg-cover bg-center opacity-30 xl:opacity-50 border border-surface-300"
									/>
								)}
							</For>
							<div class="absolute inset-0 xl:bg-gradient-to-tr bg-gradient-to-tl from-background/0 via-background/25 to-primary/25 blur-2xl z-10" />
							<div class="absolute inset-0 xl:bg-gradient-to-tr bg-gradient-to-tl from-background/0 via-background/25 to-background" />
						</div>
					</div>
					<div class="flex items-center gap-4 mb-8">
						<div class="md:h-96 h-[512px] w-full bg-surface-100 bg-[url('https://cdn.jsdelivr.net/gh/inlang/monorepo@website-update/inlang/assets/marketplace/paraglide-artwork.gif')] bg-cover bg-center rounded-2xl flex items-end justify-start relative">
							<h3 class="font-semibold absolute top-6 left-8 text-background text-3xl">
								Highlight
							</h3>
							<div class="w-full flex justify-between md:items-center md:flex-row flex-col bg-warning/40 border-t border-t-hover-warning/50 px-8 py-4 rounded-b-2xl backdrop-blur-lg">
								<div class="md:mb-0 mb-6">
									<h2 class="text-lg font-semibold mb-1 text-background">
										ParaglideJS (former SDK-JS)
									</h2>
									<p class="text-background">The all new library for all common frameworks.</p>
								</div>
								<Button chevron type="secondaryOnGray">
									Learn more
								</Button>
							</div>
						</div>
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
					<div class="mb-32 pt-10 grid xl:grid-cols-3 md:grid-cols-2 w-full gap-4 gap-y-8 justify-center items-stretch relative">
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

					return (
						<>
							<a
								href={`/marketplace/${item.id}`}
								class="relative no-underline h-72 flex flex-col gap-4 group"
							>
								<div
									style={{
										"background-image": `url(${item.gallery?.[0]})`,
									}}
									class="w-full h-full flex items-center justify-center bg-surface-50 group-hover:bg-surface-100 transition-colors rounded-lg relative bg-cover bg-center border border-surface-2"
								>
									<Chip
										text={typeOfIdToTitle(item.id)}
										color={colorForTypeOf(item.id)}
										customClasses="absolute right-4 top-4 z-5 backdrop-filter backdrop-blur-sm text-xs"
									/>
									<Show when={!item.gallery}>
										<Show
											when={item.icon}
											fallback={
												<p class="font-mono font-semibold text-surface-500">{displayName}</p>
											}
										>
											<img
												class="w-14 h-14 rounded-md m-0 shadow-lg object-cover object-center"
												src={item.icon}
											/>
										</Show>
									</Show>
								</div>
								<div class="w-full flex gap-6 justify-between">
									<div class="w-full flex gap-3 items-center">
										<div class="flex items-center gap-2 flex-shrink-0">
											<Show when={item.publisherIcon}>
												<img class="w-9 h-9 rounded-full m-0" src={item.publisherIcon} />
											</Show>
										</div>
										<div class="flex flex-col justify-between gap-0.5">
											<p class="m-0 text-surface-600 leading-none no-underline font-medium group-hover:text-surface-900 transition-colors">
												{displayName}
											</p>
											<p class="m-0 text-surface-400 leading-tight text-sm no-underline line-clamp-1 group-hover:text-surface-500 transition-colors">
												{item.publisherName}
											</p>
										</div>
									</div>
									<Show
										when={
											item.id.split(".")[0] === "plugin" ||
											item.id.split(".")[0] === "messageLintRule"
										}
									>
										<sl-tooltip prop:content="Install">
											<a
												onClick={(e) => {
													e.stopPropagation()
												}}
												href={`/install?module=${item.id}`}
												class="text-surface-400 flex-shrink-0 rounded-md p-1.5 w-8 h-8 flex items-center justify-center hover:text-surface-900 hover:bg-surface-100 transition-all"
											>
												<svg
													width="100%"
													height="100%"
													viewBox="0 0 16 16"
													fill="none"
													xmlns="http://www.w3.org/2000/svg"
												>
													<path
														fill-rule="evenodd"
														clip-rule="evenodd"
														d="M11.6 5.54982L11.6 5.5498L8.99999 8.14981L11.6 5.54982ZM8.69999 8.87407L11.5962 5.97782L12.5794 6.99612L7.99999 11.5755L3.42056 6.99612L4.40374 5.97782L7.29999 8.87407V0.299805H8.69999V8.87407ZM14.3 14.2998V11.2998H15.7V13.9998C15.7 14.4696 15.5362 14.8643 15.2004 15.2002C14.8645 15.536 14.4698 15.6998 14 15.6998H1.99999C1.53019 15.6998 1.13547 15.536 0.79962 15.2002C0.463765 14.8643 0.299988 14.4696 0.299988 13.9998V11.2998H1.69999V14.2998H14.3Z"
														fill="currentColor"
													/>
												</svg>
											</a>
										</sl-tooltip>
									</Show>
								</div>
							</a>
						</>
					)
				}}
			</For>
			<a
				href="/documentation/publish-marketplace"
				class="relative no-underline h-72 flex flex-col gap-3.5 group"
			>
				<div class="w-full h-full bg-surface-50 group-hover:bg-surface-100 transition-colors text-surface-500 rounded-lg flex justify-center items-center border border-surface-2">
					<Plus class="text-4xl" />
				</div>
				<div class="w-full">
					<div class="flex flex-col gap-1">
						<p class="m-0 text-surface-600 leading-none no-underline font-medium group-hover:text-surface-900 transition-colors">
							Build your own solution
						</p>
						<p class="m-0 text-surface-400 text-sm leading-tight no-underline line-clamp-1 group-hover:text-surface-500 transition-colors">
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
