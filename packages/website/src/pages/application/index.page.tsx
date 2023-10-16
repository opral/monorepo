import { Meta, Title } from "@solidjs/meta"
import Marketplace from "#src/components/sections/marketplace/index.jsx"
import MarketplaceLayout from "#src/components/marketplace/MarketplaceLayout.jsx"
import SubcategoryPills from "#src/components/marketplace/SubcategoryPills.tsx.jsx"

export function Page() {
	const getSubCategies = [
		{
			name: "Svelte",
			param: "svelte",
		},
		{
			name: "React",
			param: "react",
		},
		{
			name: "Next.js",
			param: "nextjs",
		},
		{
			name: "Javascript",
			param: "javascript",
		},
		{
			name: "Flutter",
			param: "flutter",
		},
	]

	return (
		<>
			<Title>Global Application</Title>
			<Meta name="description" content="Globalization infrastructure for software" />
			<Meta name="og:image" content="/images/inlang-marketplace-image.jpg" />
			<div class="bg-surface-50">
				<MarketplaceLayout>
					<div class="pt-4 text-sm font-medium flex items-center gap-3">
						<p class="pr-4 text-surface-400">Categories:</p>
						<SubcategoryPills links={getSubCategies} />
					</div>

					<div class="pb-16 md:pb-20 min-h-screen relative">
						<h2 class="text-2xl font-semibold pb-4 pt-8">All Products</h2>
						<Marketplace />
					</div>
				</MarketplaceLayout>
			</div>
		</>
	)
}
