import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
import type { Category, SubCategory } from "./../Gridview.jsx"
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

		const flatItemContent = JSON.stringify(item).toLowerCase()

		const isMatch = category
			? item.keywords.some((keyword: string) => keyword.toLowerCase().includes(category)) &&
			  flatItemContent.includes(search)
			: flatItemContent.includes(search) ||
			  item.publisherName.toLowerCase().includes(search) ||
			  item.keywords.some((keyword: string) => keyword.toLowerCase().includes(search))

		return isMatch
	})
