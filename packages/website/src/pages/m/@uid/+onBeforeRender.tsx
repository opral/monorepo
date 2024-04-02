import type { PageContext } from "#src/renderer/types.js"
import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
import { registry } from "@inlang/marketplace-registry"
import { redirect } from "vike/abort"

export default async function onBeforeRender(pageContext: PageContext) {
	const item = registry.find(
		(item: any) => item.uniqueID === pageContext.routeParams.uid
	) as MarketplaceManifest & { uniqueID: string }

	if (!item) {
		console.error("Item not found")
		throw redirect("/not-found", 301)
	} else {
		throw redirect(
			`/m/${item.uniqueID}/${
				item.slug
					? item.slug.replaceAll(".", "-").toLowerCase()
					: item.id.replaceAll(".", "-").toLowerCase()
			}`,
			301
		)
	}
}
