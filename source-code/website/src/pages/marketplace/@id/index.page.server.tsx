import { registry } from "@inlang/marketplace-registry"
import { parseMarkdown } from "#src/services/markdown/index.js"
import type { PageContext } from "#src/renderer/types.js"
import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
import type { PageProps } from "./index.page.jsx"

export async function onBeforeRender(pageContext: PageContext) {
	const item = registry.find(
		(item) => item.id === pageContext.routeParams.id,
	) as MarketplaceManifest

	const text = await(await fetch(item.readme.en)).text()
	const markdown = parseMarkdown({
		text: text,
	})

	return {
		pageContext: {
			pageProps: {
				markdown: markdown,
				manifest: item,
			} satisfies PageProps,
		},
	}
}
