import { type IdeExtensionConfig, validateIdeExtensionConfig } from "./schema.js"
import { createPlugin } from "@inlang/core/plugin"

// ------------------------------------------------------------------------------------------------

export const ideExtensionPlugin = createPlugin<IdeExtensionConfig>(({ settings }) => ({
	id: "inlang.ide-extension",
	config: async () => {
		const parsedConfig = validateIdeExtensionConfig(settings)

		return {
			ideExtension: parsedConfig,
		}
	},
}))
