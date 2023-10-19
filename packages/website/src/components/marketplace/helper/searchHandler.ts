import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
import type { SubCategory } from "../Gridview.jsx"
import { rpc } from "@inlang/rpc"

export const search = async (
	selectedSubCategories: SubCategory[],
	searchValue: string,
	selectedCategory?: string
) => {
	const results = await rpc.search({ term: searchValue })

	console.log(JSON.parse(results.data))
	return results
}
