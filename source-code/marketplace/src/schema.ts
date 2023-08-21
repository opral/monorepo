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

type ExportedItemFromModule = MarketplaceItemBase & {
	/**
	 * The exported items of the module.
	 */
	moduleItems: string[]
	/**
	 * The link to the module.
	 */
	module: string
}

type LintRule = ExportedItemFromModule & {
	type: "lintRule"
}

type App = MarketplaceItemBase & {
	type: "app"
}

type Plugin = ExportedItemFromModule & {
	type: "plugin"
}

export type MarketplaceItem = App | Plugin | LintRule

export const marketplaceItems: MarketplaceItem[] = registry as unknown as MarketplaceItem[]
