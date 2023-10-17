import { Meta, Title } from "@solidjs/meta"
import Marketplace from "#src/components/sections/marketplace/index.jsx"
import Hero from "./custom_section/Hero.jsx"
import MarketplaceLayout from "#src/components/marketplace/MarketplaceLayout.jsx"
import { Show } from "solid-js"

export function Page() {
	const urlParams = new URLSearchParams(window.location.search)
	return (
		<>
			<Title>inlang Marketplace</Title>
			<Meta
				name="description"
				content="Find apps, plugins and lint rules for inlang's ecosystem."
			/>
			<Meta name="og:image" content="/images/inlang-marketplace-image.jpg" />
			<div class="bg-surface-50">
				<MarketplaceLayout>
					<Show when={!urlParams.get("search")}>
						<Hero />
					</Show>
					<div class="pb-16 md:pb-20 min-h-screen relative">
						<h2 class="text-sm text-surface-500 pb-3 pl-2 pt-4">Products</h2>
						<Marketplace />
					</div>
				</MarketplaceLayout>
			</div>
		</>
	)
}
