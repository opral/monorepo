import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
import type { Category, SubCategory } from "./index.jsx"
import { registry } from "@inlang/marketplace-registry"

export const algorithm = (
	selectedSubCategories: SubCategory[],
	searchValue: string,
	selectedCategory?: string
) =>
	registry.filter((item: MarketplaceManifest) => {
		const category = selectedCategory?.toLowerCase() as Category
		const subCategory = item.id.slice(0, item.id.indexOf(".")) as SubCategory

		if (selectedSubCategories.length > 0 && !selectedSubCategories.includes(subCategory)) {
			return false
		}

		const search = searchValue.toLowerCase()

		const displayName =
			typeof item.displayName === "object" ? item.displayName.en : item.displayName

		const isMatch = category
			? item.keywords.some((keyword: string) => keyword.toLowerCase().includes(category)) &&
			  displayName.toLowerCase().includes(search)
			: displayName.toLowerCase().includes(search) ||
			  item.publisherName.toLowerCase().includes(search) ||
			  item.keywords.some((keyword: string) => keyword.toLowerCase().includes(search))

		return isMatch
	})
