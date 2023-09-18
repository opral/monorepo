import { registry } from "@inlang/marketplace-registry"
import { parseMarkdown } from "#src/services/markdown/index.js"
import type { PageContext } from "#src/renderer/types.js"
import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
import type { PageProps } from "./index.page.jsx"
import { redirect } from "vite-plugin-ssr/abort"

export async function onBeforeRender(pageContext: PageContext) {
	const item = registry.find(
		(item) => item.id === pageContext.routeParams.id
	) as MarketplaceManifest

	if (!item) {
		console.error("Item not found")
		throw redirect("/marketplace/404")
	}

	const text = await (
		await fetch(typeof item.readme === "object" ? item.readme.en : item.readme)
	).text()
	const markdown = parseMarkdown({
		/* Remove HTML tags from markdown */
		text: text
			.replace(/<[^>]*>?/gm, "")
			.replaceAll("1️⃣", "1.")
			.replaceAll("2️⃣", "2.")
			.replaceAll("3️⃣", "3."),
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
