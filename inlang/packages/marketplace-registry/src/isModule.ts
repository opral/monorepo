import type { Registry } from "./registry.js";

/**
 * Detects whether a marketplace item is a module.
 */
export const isModule = (item: Registry) => {
	if (item.id.startsWith("messageLintRule.") || item.id.startsWith("plugin.")) {
		return true;
	}
	return false;
};
