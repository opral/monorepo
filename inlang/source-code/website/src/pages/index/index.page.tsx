import { Meta, Title } from "@solidjs/meta"
import HeroSearch from "./custom_section/HeroSearch.jsx"
import MarketplaceLayout from "#src/interface/marketplace/MarketplaceLayout.jsx"
import { Show } from "solid-js"
import Lix from "./custom_section/Lix.jsx"
import Stack from "./custom_section/Stack.jsx"
import Gridview from "#src/interface/marketplace/Gridview.jsx"
import { currentPageContext } from "#src/renderer/state.js"
import Guides from "./custom_section/Guides.jsx"
import Features from "./custom_section/Features.jsx"

export function Page() {
	const search = currentPageContext.urlParsed.search["search"]

	return (
		<>
			<Title>inlang Marketplace - The ecosystem to go global</Title>
			<Meta
				name="description"
				content="Quickly find the best solution to globalize (i18n) your app. inlang helps you to expand to new markets and acquire new customers."
			/>
			<Meta name="og:image" content="/opengraph/inlang-social-image.jpg" />
			<Meta name="twitter:card" content="summary_large_image" />
			<Meta name="twitter:image" content="/opengraph/inlang-social-image.jpg" />
			<Meta
				name="twitter:image:alt"
				content="inlang's ecosystem helps organizations to go global."
			/>
			<Meta name="twitter:title" content="inlang Marketplace - The ecosystem to go global" />
			<Meta
				name="twitter:description"
				content="Quickly find the best solution to globalize (i18n) your app. inlang helps you to expand to new markets and acquire new customers."
			/>
			<Meta name="twitter:site" content="@inlanghq" />
			<Meta name="twitter:creator" content="@inlanghq" />
			<MarketplaceLayout>
				<Show
					when={search}
					fallback={
						<>
							<HeroSearch />
							<Features />
							<Stack />
							<Guides />
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
