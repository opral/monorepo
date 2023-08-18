import { Layout } from "../Layout.jsx"
import { Meta, Title } from "@solidjs/meta"
import { marketplaceItems as items } from "@inlang/marketplace/src"
import { For, Show, Accessor, createSignal, createEffect } from "solid-js"
import { Chip } from "#src/components/Chip.jsx"
import { SearchIcon } from "../editor/@host/@owner/@repository/components/SearchInput.jsx"
import { Button } from "../index/components/Button.jsx"
import { GetHelp } from "#src/components/GetHelp.jsx"
import Plus from "~icons/material-symbols/add-rounded"

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
						<h1 class="xl:col-span-2 text-[40px] md:text-5xl font-bold text-left">
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
							<Button type="text" href="/documentation">
								Build your own
							</Button>
						</div>
					</div>
					<div class="grid xl:grid-cols-3 md:grid-cols-2 w-full gap-4 justify-center items-stretch py-8 mb-8">
						<Gallery tags={tags()} />
					</div>
					<GetHelp />
				</div>
			</Layout>
		</>
	)
}

const Gallery = ({ tags }: { tags: Record<string, any>[] }) => {
	return (
		<>
			<For each={items}>
				{(item) => {
					return (
						<a
							href={item.marketplace.linkToReadme.en}
							target="_blanc"
							class="relative no-underline"
						>
							<div class="flex flex-col relative justify-between gap-4 bg-surface-100 h-full hover:bg-surface-200 p-6 rounded-xl border border-surface-2 cursor-pointer">
								<div class="flex flex-col gap-4">
									<div class="flex items-center gap-4">
										<img class="w-10 h-10 rounded-md m-0 shadow-lg" src={item.marketplace.icon} />
										<p class="m-0 text-surface-900 font-semibold text-md">{item.displayName.en}</p>
									</div>
									<p class="m-0 font-normal leading-6 text-sm tracking-wide text-surface-500 line-clamp-3">
										{item.description.en}
									</p>
								</div>
								<Show when={item.marketplace.publisherName && item.marketplace.publisherIcon}>
									<div class="flex gap-2 items-center pt-6">
										<img class="w-6 h-6 rounded-full m-0" src={item.marketplace.publisherIcon} />
										<p class="m-0 text-surface-600 no-underline hover:text-surface-900 font-medium">
											{item.marketplace.publisherName}
										</p>
									</div>
								</Show>
								<Chip
									text={
										item.id.split(".")[1].toLowerCase() === "lintrule"
											? "lint rule"
											: item.id.split(".")[1].toLowerCase()
									}
									color={
										item.id.split(".")[1].toLowerCase() === "app"
											? "#BF7CE4"
											: item.id.split(".")[1].toLowerCase() === "plugin"
											? "#BF7CE4"
											: "#06B6D4"
									}
									customClasses="absolute top-4"
								/>
							</div>
						</a>
					)
				}}
			</For>
			{/* position it in center */}
			<a href="/documentation" target="" class="relative no-underline xl:col-start-2">
				<div class="flex flex-col h-56 relative justify-center items-center gap-4 bg-surface-100 max-h-full hover:bg-surface-200 p-6 rounded-xl border border-surface-2 cursor-pointer">
					<Plus class="text-4xl" />
					<p class="m-0 font-normal leading-6 text-sm tracking-wide text-surface-500 line-clamp-3">
						Build your own
					</p>
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
