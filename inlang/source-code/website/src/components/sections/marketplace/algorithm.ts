import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
import type { SubCategory } from "./index.jsx"
import { registry } from "@inlang/marketplace-registry"

export const algorithm = (
	selectedSubCategories: SubCategory[],
	searchValue: string,
	selectedCategory?: string
) =>
	selectedCategory
		? registry.filter((item: MarketplaceManifest) => {
				const category = selectedCategory

				const isSearchMatch = item.keywords.some((keyword: string) =>
					keyword.toLowerCase().includes(category)
				)

				return isSearchMatch
		  })
		: registry.filter((item: MarketplaceManifest) => {
				// slice to the first dot yields the category
				const subCategory = item.id.slice(0, item.id.indexOf(".")) as SubCategory

				if (selectedSubCategories.length > 0 && !selectedSubCategories.includes(subCategory)) {
					return false
				}

				const search = searchValue.toLowerCase()

				const displayName =
					typeof item.displayName === "object" ? item.displayName.en : item.displayName

				const isSearchMatch =
					displayName.toLowerCase().includes(search) ||
					item.publisherName.toLowerCase().includes(search) ||
					item.keywords.some((keyword: string) => keyword.toLowerCase().includes(search))

				return isSearchMatch
		  })
