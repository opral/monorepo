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
	bundleItems?: number
	bundleName?: string
}

/**
 * General Metadata needed for the marketplace.
 */
export interface Metadata {
	id: string
	displayName: Record<string, string>
	description: Record<string, string>
	marketplace: MarketplaceMetadata
}

export const marketplaceItems: Metadata[] = registry
