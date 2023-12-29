import { Link, Meta, Title } from "@solidjs/meta"
import HeroSearch from "./custom_section/HeroSearch.jsx"
import MarketplaceLayout from "#src/interface/marketplace/MarketplaceLayout.jsx"
import { Show } from "solid-js"
import Stack from "./custom_section/Stack.jsx"
import Gridview from "#src/interface/marketplace/Gridview.jsx"
import { currentPageContext } from "#src/renderer/state.js"
import Guides from "./custom_section/Guides.jsx"
import Features from "./custom_section/Features.jsx"
import ParaglideHeader from "#src/interface/marketplace/categoryHeaders/cards/paraglide.jsx"
import * as m from "#src/paraglide/messages.js"
import { renderLocales } from "#src/renderer/renderLocales.js"
import { i18nRouting } from "#src/renderer/+onBeforeRoute.js"

export default function Page() {
	const search = currentPageContext.urlParsed.search["search"]

	return (
		<>
			<Title>{m.inlang_global_title()}</Title>
			<Meta name="description" content={m.inlang_global_description()} />
			<Meta name="og:image" content="/opengraph/inlang-social-image.jpg" />
			<Meta name="twitter:card" content="summary_large_image" />
			<Meta name="twitter:image" content="/opengraph/inlang-social-image.jpg" />
			<Meta name="twitter:image:alt" content={m.inlang_twitter_title()} />
			<Meta name="twitter:title" content={m.inlang_global_title()} />
			<Meta name="twitter:description" content={m.inlang_global_description()} />
			<Meta name="twitter:site" content="@inlanghq" />
			<Meta name="twitter:creator" content="@inlanghq" />
			{renderLocales(currentPageContext.urlParsed.pathname).map((locale) => (
				<Link
					href={locale.href}
					hreflang={locale.hreflang}
					// @ts-ignore
					rel={
						locale.rel
							? locale.rel // eslint-disable-next-line unicorn/no-null
							: null
					}
				/>
			))}
			<Link
				href={`https://inlang.com${i18nRouting(currentPageContext.urlParsed.pathname).url}`}
				rel="canonical"
			/>
			<MarketplaceLayout>
				<Show
					when={search}
					fallback={
						<>
							<HeroSearch />
							<Features />
							<Stack />
							<Guides />
							<ParaglideHeader />
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
