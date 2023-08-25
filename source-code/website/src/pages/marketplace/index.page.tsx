import { Layout } from "../Layout.jsx"
import { Meta, Title } from "@solidjs/meta"
import { marketplaceItems } from "@inlang/marketplace"
import { For, Show, Accessor, createSignal, createEffect } from "solid-js"
import { Chip } from "#src/components/Chip.jsx"
import { SearchIcon } from "../editor/@host/@owner/@repository/components/SearchInput.jsx"
import { Button } from "../index/components/Button.jsx"
import { GetHelp } from "#src/components/GetHelp.jsx"
import Plus from "~icons/material-symbols/add-rounded"
import Package from "~icons/material-symbols/package-2"

type Category = "app" | "plugin" | "lintrule"

const [searchValue, setSearchValue] = createSignal<string>("")

const [selectedCategories, setSelectedCategories] = createSignal<Category[]>([
	"app",
	"plugin",
	"lintrule",
])

const filteredItems = () =>
	marketplaceItems.filter((item: Record<string, any>) => {
		return filterItem(item, selectedCategories(), searchValue())
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
					<div class="grid xl:grid-cols-3 pb-8">
						<h1 class="xl:col-span-2 text-[40px] md:text-5xl font-bold text-left leading-tight">
							Explore the marketplace
						</h1>
					</div>
					<div class="w-full top-16 sticky bg-background pb-4 pt-8 z-10 border-b border-surface-2 flex flex-col gap-5">
						<Search
							placeholder={"Search for apps, plugins, lint rules ..."}
							textValue={searchValue}
							setTextValue={setSearchValue}
						/>
						<div class="flex justify-between items-center">
							<Tags />
							<div class="max-sm:hidden">
								<Button type="text" href="/documentation">
									Build your own
								</Button>
							</div>
						</div>
					</div>
					<div class="mb-16 pt-10 grid xl:grid-cols-3 md:grid-cols-2 w-full gap-4 justify-center items-stretch">
						<Gallery />
					</div>
					<GetHelp text="Need help or have questions? Join our Discord!" />
				</div>
			</Layout>
		</>
	)
}

function filterItem(
	item: Record<string, any>,
	selectedCategories: Category[],
	searchValue: string,
) {
	if (!selectedCategories.includes(item.type.toLowerCase())) {
		return false
	}

	const isSearchMatch =
		item.meta.displayName.en?.toLowerCase().includes(searchValue.toLowerCase()) ||
		item.meta.marketplace.publisherName.toLowerCase().includes(searchValue.toLowerCase()) ||
		item.meta.marketplace.keywords.some((keyword: string) =>
			keyword.toLowerCase().includes(searchValue.toLowerCase()),
		) ||
		item.meta.marketplace.bundleName?.toLowerCase().includes(searchValue.toLowerCase()) ||
		item.meta.id.split(".")[1]?.toLowerCase().includes(searchValue.toLowerCase()) ||
		item.meta.id.toLowerCase().includes(searchValue.toLowerCase()) ||
		item.module?.toLowerCase() === searchValue.toLowerCase()

	return isSearchMatch
}

const Gallery = () => {
	return (
		<>
			<For each={filteredItems()}>
				{(item) => {
					return (
						<a
							href={`/marketplace/${item.meta.displayName.en?.toLowerCase().replaceAll(" ", "-")}`}
							target="_blanc"
							class="relative no-underline h-64"
						>
							<div class="flex flex-col relative justify-between gap-4 bg-surface-100 h-full hover:bg-surface-200 p-6 rounded-xl border border-surface-2 cursor-pointer">
								<div class="flex flex-col gap-4">
									<div class="flex items-center gap-4">
										<img
											class="w-10 h-10 rounded-md m-0 shadow-lg"
											src={item.meta.marketplace.icon}
										/>
										<p class="m-0 text-surface-900 font-semibold text-md">
											{item.meta.displayName.en}
										</p>
									</div>
									<p class="m-0 font-normal leading-6 text-sm tracking-wide text-surface-500 line-clamp-3">
										{item.meta.description.en}
									</p>
								</div>
								<Show
									when={item.meta.marketplace.publisherName && item.meta.marketplace.publisherIcon}
								>
									<div class="w-full flex items-end justify-between">
										<div class="flex gap-2 items-center pt-6">
											<img
												class="w-6 h-6 rounded-full m-0"
												src={item.meta.marketplace.publisherIcon}
											/>
											<p class="m-0 text-surface-600 no-underline hover:text-surface-900 font-medium">
												{item.meta.marketplace.publisherName}
											</p>
										</div>
										{item.type !== "app" && item.moduleItems.length > 1 && (
											<sl-tooltip
												prop:content={`Comes in a bundle of ${item.moduleItems?.length}`}
												prop:distance={16}
												prop:hoist={true}
												prop:placement="top"
											>
												<div
													onClick={(e) => {
														e.preventDefault()
														e.stopPropagation()
														setSearchValue(`${item.module ?? item.meta.id}`)
														window.scrollTo({ top: 0 })
													}}
													class="text-surface-500 text-xl hover:text-surface-900 transition-all"
												>
													<Package />
												</div>
											</sl-tooltip>
										)}
									</div>
								</Show>
								<Chip
									text={item.type.toLocaleLowerCase() === "lintrule" ? "Lint Rule" : item.type}
									color={
										item.meta.id.split(".")[1]?.toLowerCase() === "app"
											? "#3B82F6"
											: item.meta.id.split(".")[1]?.toLowerCase() === "plugin"
											? "#BF7CE4"
											: "#06B6D4"
									}
									customClasses="absolute right-4 top-4 z-5 backdrop-filter backdrop-blur-lg"
								/>
							</div>
						</a>
					)
				}}
			</For>
			<a href="/documentation" target="" class="relative no-underline xl:col-start-2">
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
				onInput={(e) => props.setTextValue(e.currentTarget.value)}
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
			<div
				onClick={() => selectTag("lintrule")}
				class={
					"gap-2 px-3 py-1.5 rounded-full cursor-pointer text-sm capitalize hover:opacity-90 transition-all duration-100 " +
					(selectedCategories().includes("lintrule")
						? "bg-surface-800 text-background"
						: "bg-surface-200 text-surface-600")
				}
			>
				<p class="m-0">Lint Rules</p>
			</div>
		</div>
	)
}
