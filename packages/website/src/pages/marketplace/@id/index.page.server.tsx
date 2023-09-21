import { registry } from "@inlang/marketplace-registry"
import { convert } from "@inlang/markdown"
import type { PageContext } from "#src/renderer/types.js"
import type { PageProps } from "./index.page.jsx"
import type { MarketplaceManifest } from "@inlang/marketplace-manifest"

export async function onBeforeRender(pageContext: PageContext) {
	const item = registry.find(
		(item) => item.id === pageContext.routeParams.id,
	) as MarketplaceManifest

	const contents = [] as any[]

	for (const content of item.tableOfContents) {
		// @ts-ignore
		const raw = await fetch(content.path.en).then((res) => res.text())
		const markdown = await convert(raw)
		contents.push({
			...content,
			markdown,
		})
	}

	return {
		pageContext: {
			pageProps: {
				contents: contents,
				manifest: item,
			} satisfies PageProps,
		},
	}
}
