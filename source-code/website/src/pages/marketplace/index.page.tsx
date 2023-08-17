import { Layout } from "../Layout.jsx"
import { Meta, Title } from "@solidjs/meta"
import { registry as items } from "@inlang/marketplace/src/registry"
import { For, Show } from "solid-js"
import { Chip } from "#src/components/Chip.jsx"

export type PageProps = {
	markdown: string
}

export function Page() {
	console.log(items)
	return (
		<>
			<Title>inlang Marketplace</Title>
			<Meta
				name="description"
				content="Find apps, plugins and lint rules for inlang's ecosystem."
			/>
			<Meta name="og:image" content="/images/inlang-social-image.jpg" />
			<Layout>
				<div class="py-16 md:py-20 min-h-screen">
					<div class="grid grid-cols-3 pb-16">
						<h1 class="col-span-2 text-5xl font-bold text-left">Explore the marketplace</h1>
					</div>
					<div class="grid grid-cols-3 w-full gap-4 justify-center items-stretch">
						<Gallery />
					</div>
				</div>
			</Layout>
		</>
	)
}

function Gallery() {
	return (
		<For each={items}>
			{(item) => {
				return (
					<a href={item.marketplace.linkToReadme.en} target="_blanc" class="relative no-underline">
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
	)
}
