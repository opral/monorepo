import type { InlangPlugin } from "@inlang/sdk";

export const plugin: InlangPlugin = {
	key: "my_cool_plugin",
	importFiles: async ({ files, settings }) => {
		// Implement me
		return {
			bundles: [],
			messages: [],
			variants: [],
		};
	},
	exportFiles: async ({ bundles, messages, variants, settings }) => {
		// implement me
		return [];
	},
};
