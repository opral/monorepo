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

const toBeImportedFiles: NonNullable<InlangPlugin["toBeImportedFiles"]> = async ({
	settings,
	nodeFs,
}) => {
	const pluginSettings = settings[pluginKey]
	if (pluginSettings === undefined) {
		return []
	}
	const result: Array<{ path: string; content: ArrayBuffer }> = []

	for (const locale of settings.locales) {
    try {

      const path = pluginSettings.pathPattern.replace("{locale}", locale)
      const content = await nodeFs.readFile(path)
      result.push({ path, content })
    } catch (error) {
      
    }
	}

	return result
}
