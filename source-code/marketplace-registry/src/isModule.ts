import type { MarketplaceManifest } from "@inlang/marketplace-manifest"

/**
 * Detects whether a marketplace item is a module.
 */
export const isModule = (item: MarketplaceManifest) => {
	if (item.id.startsWith("messageLintRule.") || item.id.startsWith("plugin.")) {
		return true
	}
	return false
}
