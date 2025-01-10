import type { MarketplaceManifest } from "@inlang/marketplace-manifest";

/**
 * Converts a camelCase string to Title Case
 */
export const typeOfIdToTitle = (id: MarketplaceManifest["id"]) => {
	const type = id.slice(0, id.indexOf("."));
	return type.includes("message")
		? "Message Lint Rule"
		: type.charAt(0).toUpperCase() + type.slice(1);
};

/**
 * Determines the color for a marketplace id.
 */
export const colorForTypeOf = (id: MarketplaceManifest["id"]) => {
	if (id.startsWith("app.")) {
		return "#3B82F6";
	} else if (id.startsWith("library.")) {
		return "#e35473";
	} else if (id.startsWith("plugin.")) {
		return "#BF7CE4";
	} else {
		return "#06B6D4";
	}
};

