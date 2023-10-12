import { Layout } from "../Layout.jsx"
import { Meta, Title } from "@solidjs/meta"
import { registry } from "@inlang/marketplace-registry"
import { For } from "solid-js"
import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
import Marketplace from "#src/components/sections/marketplace/index.jsx"

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
					<div class="grid xl:grid-cols-3 xl:gap-8 grid-flow-row-dense">
						<div class="relative z-20 xl:mt-0 -mt-12 pb-8 xl:pb-0">
							<h1 class="xl:col-span-2 md:pt-20 pt-16 text-[40px] md:text-5xl font-bold text-left leading-tight mb-3">
								Explore the ecosystem
							</h1>
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
					<Marketplace featured />
				</div>
			</Layout>
		</>
	)
}
