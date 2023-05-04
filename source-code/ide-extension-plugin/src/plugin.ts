import { type IdeExtensionSettings, validateIdeExtensionSettings } from "./schema.js"
import { createPlugin } from "@inlang/core/plugin"

// ------------------------------------------------------------------------------------------------

export const ideExtensionPlugin = createPlugin<IdeExtensionSettings>(({ settings }) => ({
	id: "inlang.ide-extension",
	config: async () => {
		const parsedConfig = validateIdeExtensionSettings(settings)

		return {
			ideExtension: parsedConfig,
		}
	},
}))
