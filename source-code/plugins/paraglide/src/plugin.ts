import type { Plugin } from "@inlang/plugin"
import { ideExtensionConfig } from "./ideExtension/config.js"

// ------------------------------------------------------------------------------------------------

export const plugin: Plugin = {
	meta: {
		id: "plugin.inlang.paraglide",
		displayName: { en: "Inlang Paraglide Plugin" },
		description: { en: "Inlang Paraglide Plugin" },
	},
	addCustomApi() {
		return {
			"app.inlang.ideExtension": ideExtensionConfig(),
		}
	},
}
