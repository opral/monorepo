import { Meta, Title } from "@solidjs/meta"
import Marketplace from "#src/components/sections/marketplace/index.jsx"
import Hero from "./custom_section/Hero.jsx"
import MarketplaceLayout from "#src/components/marketplace/MarketplaceLayout.jsx"

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
				<MarketplaceLayout>
					<Hero />
					<div class="pb-16 md:pb-20 min-h-screen relative">
						<h2 class="text-2xl font-semibold pb-4 pt-8">All Products</h2>
						<Marketplace />
					</div>
				</MarketplaceLayout>
			</div>
		</>
	)
}
