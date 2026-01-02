import { Link, Meta, Title } from "@solidjs/meta";
import HeroSearch from "./custom_section/HeroSearch.jsx";
import MarketplaceLayout from "#src/interface/marketplace/MarketplaceLayout.jsx";
import { currentPageContext } from "#src/renderer/state.js";
import * as m from "#src/paraglide/messages.js";
import { renderLocales } from "#src/renderer/renderLocales.js";
import Features from "./custom_section/Features.jsx";
import { i18nRouting } from "#src/services/i18n/routing.js";
import { SolidMarkdown } from "solid-markdown";
import landingMarkdown from "./assets/landingpage.md?raw";

export default function Page() {
	return (
		<>
			<Title>{m.inlang_global_title()}</Title>
			<Meta name="description" content={m.inlang_global_description()} />
			<Meta
				name="og:image"
				content="https://cdn.jsdelivr.net/gh/opral/inlang@latest/packages/website/public/opengraph/inlang-social-image.jpg"
			/>
			<Meta name="twitter:card" content="summary_large_image" />
			<Meta
				name="twitter:image"
				content="https://cdn.jsdelivr.net/gh/opral/inlang@latest/packages/website/public/opengraph/inlang-social-image.jpg"
			/>
			<Meta name="twitter:image:alt" content={m.inlang_twitter_title()} />
			<Meta name="twitter:title" content={m.inlang_global_title()} />
			<Meta
				name="twitter:description"
				content={m.inlang_global_description()}
			/>
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
				href={`https://inlang.com${
					i18nRouting(currentPageContext.urlParsed.pathname).url
				}`}
				rel="canonical"
			/>
			<MarketplaceLayout>
				<HeroSearch />
				<Features />
				{/* <div class="max-w-4xl prose prose-lg mx-auto">
					<h2>Adoption</h2>
					<p>
						Inlang is used by multiple large enterprises as well as many small
						to medium scale projects. The NPM downloads of the{" "}
						<code>@inlang/sdk</code>
						provide a an indicator of developers adopting the inlang SDK to
						build i18n solutions on top of the inlang file format.
					</p>
					<iframe
						src="https://www.npmcharts.com/compare/@inlang/sdk?minimal=true"
						width="100%"
						height="500"
						// @ts-ignore
						frameBorder="0"
					></iframe>
				</div> */}
				<div class="max-w-4xl prose prose-lg mx-auto">
					<SolidMarkdown children={landingMarkdown} />
				</div>

				{/* Note if we  want the old landingpage back
				<Personas />
				<LixSection />
				<ParaglideHeader /> */}
			</MarketplaceLayout>
		</>
	);
}
