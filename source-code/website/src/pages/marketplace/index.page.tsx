import { Layout } from "../Layout.jsx"
import { Meta, Title } from "@solidjs/meta"
import { marketplaceItems as items } from "@inlang/marketplace/src"
import { For, Show, Accessor, createSignal, createEffect } from "solid-js"
import { Chip } from "#src/components/Chip.jsx"
import { SearchIcon } from "../editor/@host/@owner/@repository/components/SearchInput.jsx"
import { Button } from "../index/components/Button.jsx"
import { GetHelp } from "#src/components/GetHelp.jsx"
import Plus from "~icons/material-symbols/add-rounded"
import Package from "~icons/material-symbols/package-2"

export type PageProps = {
	markdown: string
}

export function Page() {
	const [textValue, setTextValue] = createSignal<string>("")
	const [tags, setTags] = createSignal<Record<string, any>[]>([])

	createEffect(() => {
		items.forEach((item: any) => {
			setTags((tags) => {
				const newTags = [...tags]
				const tagId = item.id.split(".")[1].toLowerCase()

				const tagIndex = newTags.findIndex((tag) => tag.name === tagId)

				if (tagIndex === -1) {
					newTags.push({ name: tagId, activated: true })
				}

				return newTags
			})
		})
	})

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
							textValue={textValue}
							setTextValue={setTextValue}
						/>
						<div class="flex justify-between items-center">
							<Tags tags={tags} setTags={setTags} />
							<div class="max-sm:hidden">
								<Button type="text" href="/documentation">
									Build your own
								</Button>
							</div>
						</div>
					</div>
					<div class="grid xl:grid-cols-3 md:grid-cols-2 w-full gap-4 justify-center items-stretch py-8 mb-8">
						<Gallery tags={tags} textValue={textValue} setTextValue={setTextValue} />
					</div>
					<GetHelp />
				</div>
			</Layout>
		</>
	)
}

const Gallery = ({
	tags,
	textValue,
	setTextValue,
}: {
	tags: Accessor<Record<string, any>[]>
	textValue: Accessor<string>
	setTextValue: (value: string) => void
}) => {
	return (
		<>
			<For each={items}>
				{(item) => {
					return (
						<Show
							when={
								/* filter by tags */
								tags().find(
									(tag) => tag.activated && tag.name === item.id.split(".")[1]?.toLowerCase(),
								) &&
								/* filter by search */
								(item.displayName.en?.toLowerCase().includes(textValue().toLowerCase()) ||
									item.marketplace.publisherName
										.toLowerCase()
										.includes(textValue().toLowerCase()) ||
									item.marketplace.keywords.some((keyword: string) =>
										keyword.toLowerCase().includes(textValue().toLowerCase()),
									) ||
									item.id.split(".")[1]?.toLowerCase().includes(textValue().toLowerCase()) ||
									item.id.toLocaleLowerCase().includes(textValue().toLowerCase()))
							}
						>
							<a
								href={item.marketplace.linkToReadme.en}
								target="_blanc"
								class="relative no-underline h-64"
							>
								<div class="flex flex-col relative justify-between gap-4 bg-surface-100 h-full hover:bg-surface-200 p-6 rounded-xl border border-surface-2 cursor-pointer">
									<div class="flex flex-col gap-4">
										<div class="flex items-center gap-4">
											<img class="w-10 h-10 rounded-md m-0 shadow-lg" src={item.marketplace.icon} />
											<p class="m-0 text-surface-900 font-semibold text-md">
												{item.displayName.en}
											</p>
										</div>
										<p class="m-0 font-normal leading-6 text-sm tracking-wide text-surface-500 line-clamp-3">
											{item.description.en}
										</p>
									</div>
									<Show when={item.marketplace.publisherName && item.marketplace.publisherIcon}>
										<div class="w-full flex items-end justify-between">
											<div class="flex gap-2 items-center pt-6">
												<img
													class="w-6 h-6 rounded-full m-0"
													src={item.marketplace.publisherIcon}
												/>
												<p class="m-0 text-surface-600 no-underline hover:text-surface-900 font-medium">
													{item.marketplace.publisherName}
												</p>
											</div>
											<Show when={item.marketplace.bundle}>
												<sl-tooltip
													prop:content={`Comes in a bundle of ${item.marketplace.bundle}`}
													prop:distance={16}
													prop:hoist={true}
													prop:placement="top"
												>
													<div
														onClick={(e) => {
															e.preventDefault()
															e.stopPropagation()

															// set text name to the first and second id part e.g. inlang.lintRule
															setTextValue(
																`${item.id.split(".")[0]?.toLowerCase()}.${item.id
																	.split(".")[1]
																	?.toLowerCase()}`,
															)
														}}
														class="text-surface-500 text-xl hover:text-surface-900 transition-all"
													>
														<Package />
													</div>
												</sl-tooltip>
											</Show>
										</div>
									</Show>
									<Chip
										text={
											item.id.split(".")[1]?.toLowerCase() === "lintrule"
												? "lint rule"
												: item.id.split(".")[1]?.toLowerCase()
										}
										color={
											item.id.split(".")[1]?.toLowerCase() === "app"
												? "#BF7CE4"
												: item.id.split(".")[1]?.toLowerCase() === "plugin"
												? "#BF7CE4"
												: "#06B6D4"
										}
										customClasses="absolute top-4 z-5 backdrop-filter backdrop-blur-lg"
									/>
								</div>
							</a>
						</Show>
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

interface TagsProps {
	tags: Accessor<Record<string, any>[]>
	setTags: (value: Record<string, any>[]) => void
}

const Tags = (props: TagsProps) => {
	const toggleTagActivation = (index: number) => {
		const updatedTags = props.tags().map((tag, i) => {
			if (i === index) {
				return { ...tag, activated: !tag.activated }
			}
			return tag
		})
		props.setTags(updatedTags)
	}

	return (
		<div class="flex gap-3">
			<For each={props.tags()}>
				{(tag) => {
					return (
						<div
							onClick={() => toggleTagActivation(props.tags().indexOf(tag))}
							class={
								"gap-2 px-3 py-1.5 rounded-full cursor-pointer text-sm capitalize hover:opacity-90 transition-all duration-100 " +
								(tag.activated
									? "bg-surface-800 text-background"
									: "bg-surface-200 text-surface-600")
							}
						>
							<p class="m-0">{tag.name === "lintrule" ? "lint rule" : tag.name}</p>
						</div>
					)
				}}
			</For>
		</div>
	)
}
