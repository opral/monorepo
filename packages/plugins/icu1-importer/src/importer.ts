import type { Import } from "@inlang/sdk2"
import type { StorageSchema } from "./storageSchema.js"
import { PluginSettings } from "./settings.js"
import { detectJsonFormatting } from "@inlang/detect-json-formatting"
import { serializeMessage } from "./parsing/serializeMessage.js"
import { parseMessage } from "./parsing/parseMessage.js"

export const pluginId = "plugin.inlang.messageFormat"

/**
 * Stringify functions of each resource file to keep the formatting.
 */
const stringifyWithFormatting: Record<string, ReturnType<typeof detectJsonFormatting>> = {}

export const importer: Import<{
	[pluginId]: PluginSettings
}> = {
	id: pluginId,
	displayName,
	description,
	settingsSchema: PluginSettings,
}
