import { type SdkConfigInput, validateSdkConfig } from "./api.js"
import type { Plugin } from "@inlang/plugin"
import { ideExtensionDefaultConfig } from "./ideExtension/config.js"

// ------------------------------------------------------------------------------------------------

export const sdkPlugin: Plugin<SdkConfigInput> = {
	meta: {
		id: "inlang.plugin.sdkJs",
		displayName: { en: "Inlang SDK for JavaScript" },
		description: { en: "Plugin for the Inlang SDK for JavaScript" },
		marketplace: {
			keywords: [
				"inlang",
				"sdk",
				"runtime",
				"plugin",
				"tranform",
				"javascript",
				"typescript",
				"svelte",
				"sveltekit",
			],
		},
	},
	addAppSpecificApi({ settings }) {
		const parsedConfig = validateSdkConfig(settings)

		return {
			"inlang.app.sdkJs": parsedConfig,
			"inlang.app.ideExtension": ideExtensionDefaultConfig,
		}
	},
}
