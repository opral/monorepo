import { type IdeExtensionConfig, validateIdeExtensionConfig } from "./schema.js"
import type { InlangConfig } from "@inlang/core/config"
import { createPlugin } from "@inlang/core/plugin"

// ------------------------------------------------------------------------------------------------

export const ideExtensionPlugin = createPlugin<IdeExtensionConfig>(({ settings, env }) => ({
	id: "inlang.ide-extension",
	config: async () => {
		const parsedConfig = validateIdeExtensionConfig(settings)

		return {
			ideExtension: parsedConfig,
		} as Partial<InlangConfig> // TODO: should the return type really be a partial of InlangConfig?
	},
}))
