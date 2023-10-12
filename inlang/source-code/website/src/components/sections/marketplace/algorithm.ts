import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
import type { SubCategory } from "./index.jsx"
import { registry } from "@inlang/marketplace-registry"

export const filteredItems = (selectedCategories: any, searchValue: any) =>
	registry.filter((item: MarketplaceManifest) => {
		// slice to the first dot yields the category
		const category = item.id.slice(0, item.id.indexOf(".")) as SubCategory

		if (selectedCategories.length > 0 && !selectedCategories.includes(category)) {
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
