import { Meta, Title } from "@solidjs/meta"
import Hero from "./custom_section/Hero.jsx"
import MarketplaceLayout from "#src/components/marketplace/MarketplaceLayout.jsx"
import { Show } from "solid-js"
import Lix from "./custom_section/Lix.jsx"
import Stack from "./custom_section/Stack.jsx"
import Gridview from "#src/components/marketplace/Gridview.jsx"
import { currentPageContext } from "#src/renderer/state.js"

export function Page() {
	const search = currentPageContext.urlParsed.search["search"]

	return (
		<>
			<Title>inlang Marketplace</Title>
			<Meta
				name="description"
				content="Find apps, plugins and lint rules for inlang's ecosystem."
			/>
			<Meta name="og:image" content="/images/inlang-marketplace-image.jpg" />
			<MarketplaceLayout>
				<Show
					when={search}
					fallback={
						<>
							<Hero />
							<Stack />
							<Lix />
						</>
					}
				>
					<div class="pt-10">
						<Gridview />
					</div>
				</Show>
			</MarketplaceLayout>
		</>
	)
}

