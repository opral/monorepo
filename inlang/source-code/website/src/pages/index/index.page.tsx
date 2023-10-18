import { Meta, Title } from "@solidjs/meta"
import Hero from "./custom_section/Hero.jsx"
import MarketplaceLayout from "#src/components/marketplace/MarketplaceLayout.jsx"
import { Show } from "solid-js"
import Lix from "./custom_section/Lix.jsx"

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
					<Lix />
				</MarketplaceLayout>
			</div>
		</>
	)
}
