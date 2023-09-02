import { type SdkConfigInput, validateSdkConfig } from "./api.js"
import type { Plugin } from "@inlang/plugin"
import { ideExtensionDefaultConfig } from "./ideExtension/config.js"

// ------------------------------------------------------------------------------------------------

export const sdkPlugin: Plugin<SdkConfigInput> = {
	meta: {
		id: "plugin.inlang.paraglideJsIdeExtension",
		displayName: { en: "Inlang SDK for JavaScript" },
		description: { en: "Plugin for the Inlang SDK for JavaScript" },
		// marketplace: {
		// 	keywords: [
		// 		"inlang",
		// 		"sdk",
		// 		"runtime",
		// 		"plugin",
		// 		"transform",
		// 		"javascript",
		// 		"typescript",
		// 		"svelte",
		// 		"sveltekit",
		// 	],
		// },
	},
	addAppSpecificApi({ settings }) {
		const parsedConfig = validateSdkConfig(settings)

		return {
			"app.inlang.sdkJs": parsedConfig,
			"app.inlang.ideExtension": ideExtensionDefaultConfig,
		}
	},
}
