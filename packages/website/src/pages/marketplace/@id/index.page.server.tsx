import { registry } from "@inlang/marketplace-registry"
import { convert } from "#src/services/markdown/index.js"
import type { PageContext } from "#src/renderer/types.js"
import type { PageProps } from "./index.page.jsx"
import type { MarketplaceManifest } from "@inlang/marketplace-manifest"

export async function onBeforeRender(pageContext: PageContext) {
	const item = registry.find(
		(item) => item.id === pageContext.routeParams.id,
	) as MarketplaceManifest

	const text = await (
		await fetch(typeof item.readme === "object" ? item.readme.en : item.readme)
	).text()
	const markdown = await convert(text)

	return {
		pageContext: {
			pageProps: {
				markdown: markdown,
				manifest: item,
			} satisfies PageProps,
		},
	}
}
