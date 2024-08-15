import type { InlangPlugin } from "@inlang/sdk2"
import { PluginSettings } from "./settings.js"

export const pluginId = "plugin.inlang.messageFormat"
export const importer: InlangPlugin = {
	key: "importer.inlang.icu-messageformat-1",
	settingsSchema: PluginSettings,
	toBeImportedFiles: async ({ settings, nodeFs }) => {
		return []
	},
}
