import { type SdkConfigInput, validateSdkConfig } from "./api.js"
import type { Plugin } from "@inlang/plugin"
import { ideExtensionConfig } from "./ideExtension/config.js"

// ------------------------------------------------------------------------------------------------

export const plugin: Plugin<SdkConfigInput> = {
	meta: {
		id: "plugin.inlang.paraglide",
		displayName: { en: "Inlang Paraglide Plugin" },
		description: { en: "Inlang Paraglide Plugin" },
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
	addCustomApi({ settings }) {
		const parsedConfig = validateSdkConfig(settings)

		return {
			"app.inlang.paraglideJs": parsedConfig,
			"app.inlang.ideExtension": ideExtensionConfig(),
		}
	},
}
