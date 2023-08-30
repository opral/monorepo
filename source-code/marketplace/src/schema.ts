import { registry } from "./registry.js"

/**
 * Metadata that is specific to the marketplace.
 */
export interface MarketplaceMetadata {
	icon: string
	linkToReadme: Record<string, string>
	keywords: string[]
	publisherName: string
	publisherIcon: string
}

type MarketplaceItemBase = {
	meta: {
		id: string
		displayName: Record<string, string>
		description: Record<string, string>
		marketplace: MarketplaceMetadata
	}
}

type ExportedItemFromPackage = MarketplaceItemBase & {
	/**
	 * The exported items of the package.
	 */
	packageItems: string[]
	/**
	 * The link to the package.
	 */
	package: string
}

type LintRule = ExportedItemFromPackage & {
	type: "lintRule"
}

type App = MarketplaceItemBase & {
	type: "app"
	linkToApp: string
}

type Library = MarketplaceItemBase & {
	type: "library"
}

type Plugin = ExportedItemFromPackage & {
	type: "plugin"
}

export type MarketplaceItem = App | Library | Plugin | LintRule

export const marketplaceItems: MarketplaceItem[] = registry as MarketplaceItem[]
