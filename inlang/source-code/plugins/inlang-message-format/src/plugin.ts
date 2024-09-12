import type { InlangPlugin } from "@inlang/sdk2"
import { plugin as pluginV2 } from "./v2/plugin.js"
import { PluginSettings } from "./settings.js"

const pluginKey = "plugin.inlang.messageFormat"

export const plugin: InlangPlugin<{
	[pluginKey]: PluginSettings
}> = {
	key: pluginKey,
	// legacy v2 stuff for backwards compatibility
	// given that most people don't have a major version
	// pinning in their settings
	id: pluginV2.id,
	loadMessages: pluginV2.loadMessages,
	saveMessages: pluginV2.saveMessages,
	settingsSchema: PluginSettings,
	toBeImportedFiles: (args) => toBeImportedFiles(args),
	importFiles: () => ({ bundles: [] }),
	exportFiles: () => [],
}

const toBeImportedFiles: NonNullable<InlangPlugin["toBeImportedFiles"]> = async ({ settings }) => {
	const result = []
	const pluginSettings = settings[pluginKey]
	if (pluginSettings === undefined) {
		return []
	}
	for (const locale of settings.locales) {
		if (pluginSettings.pathPattern.includes("{languageTag}")) {
			result.push(pluginSettings.pathPattern.replace("{languageTag}", locale))
		} else {
			result.push(pluginSettings.pathPattern.replace("{locale}", locale))
		}
	}
	return result
}
