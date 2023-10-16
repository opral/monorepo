import { Layout } from "../Layout.jsx"
import { Meta, Title } from "@solidjs/meta"
import { registry } from "@inlang/marketplace-registry"
import { For } from "solid-js"
import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
import Marketplace from "#src/components/sections/marketplace/index.jsx"
import { Button } from "../index/components/Button.jsx"

const featuredArray = ["app.inlang.editor", "library.inlang.paraglideJsSveltekit", "app.inlang.cli"]

export function Page() {
	return (
		<>
			<Title>inlang Marketplace</Title>
			<Meta
				name="description"
				content="Find apps, plugins and lint rules for inlang's ecosystem."
			/>
			<Meta name="og:image" content="/images/inlang-marketplace-image.jpg" />
			<div class="bg-surface-50">
				<Layout>
					<div class="w-full flex gap-4 mt-12">
						<div class="w-1/4 bg-background border border-surface-200 rounded-xl p-5">
							<p class="pb-6 text-surface-400">Featured</p>
							<ul class="flex flex-col gap-8">
								<For each={featuredArray}>
									{(feature) => {
										const m = registry.find((m) => m.id === feature)
										return (
											<div class="flex flex-col gap-2">
												<div class="flex items-center gap-2">
													<img class="w-8 h-8 rounded" src={m?.publisherIcon} alt={m?.id} />
													<h3 class="flex-1 text-lg text-surface-700 font-semibold whitespace-nowrap overflow-hidden">
														{(m?.displayName as { en: string }).en}
													</h3>
												</div>
												<p class="line-clamp-2">{(m?.description as { en: string }).en}</p>
												<div class="w-fit">
													<Button chevron={true} type="textPrimary" href={"/m/" + m?.id}>
														See more
													</Button>
												</div>
											</div>
										)
									}}
								</For>
							</ul>
						</div>
						<div class="flex-1 h-[600px] bg-background border border-surface-200 rounded-xl p-5">
							Welcome to inlang
						</div>
					</div>
					<div class="pb-16 md:pb-20 min-h-screen relative">
						<h2 class="text-2xl font-semibold pb-4 pt-8">All Modules</h2>
						<Marketplace />
					</div>
				</Layout>
			</div>
		</>
	)
}
