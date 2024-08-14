import type { InlangPlugin } from "@inlang/sdk2"
import { PluginSettings } from "./settings.js"
import { detectJsonFormatting } from "@inlang/detect-json-formatting"

export const pluginId = "plugin.inlang.messageFormat"

/**
 * Stringify functions of each resource file to keep the formatting.
 */
const stringifyWithFormatting: Record<string, ReturnType<typeof detectJsonFormatting>> = {}

export const importer: InlangPlugin<{
	[pluginId]: PluginSettings
}> = {
	id: pluginId,
	settingsSchema: PluginSettings,
	importFiles,
}
