import { type SdkConfigInput, validateSdkConfig } from "./api.js"
import { Plugin } from "@inlang/plugin"
import { ideExtensionDefaultConfig } from './ideExtension/config.js'

// ------------------------------------------------------------------------------------------------

export const sdkPlugin = {
	meta: {
		id: "inlang.sdk-js",
		displayName: { en: "Inlang SDK for JavaScript" },
		description: { en: "Plugin for the Inlang SDK for JavaScript" },
		keywords: ["inlang", "sdk", "runtime", "plugin", "tranform", "javascript", "typescript", "svelte", "sveltekit"],
	},
	addAppSpecificApi({ options }) {
		const parsedConfig = validateSdkConfig(options)

		return {
			"inlang.sdk-js": parsedConfig,
			"inlang.ide-extension": ideExtensionDefaultConfig,
		}
	},
} satisfies Plugin<SdkConfigInput>
