import type { Message, Plugin } from "@inlang/sdk"
import { displayName, description } from "../marketplace-manifest.json"
import { parse as validatePluginSettings } from "valibot"
import { PluginSettings } from "./settings.js"

export const pluginId = "plugin.inlang.messageFormat"

/**
 * For simplicity, the storage schema is identical to the I/O of the
 * plugin functions.
 *
 * Pros:
 *   - No need to transform the data (time complexity).
 *   - No need to maintain a separate data structure (space complexity).
 *
 * Cons:
 *  - No optimizations but they can be introduced in a non-breaking change manner
 *    in the future.
 */
type StorageSchema = Message[]

export const plugin: Plugin<{
	[pluginId]: PluginSettings
}> = {
	id: pluginId,
	displayName,
	description,
	loadMessages: async ({ settings, nodeishFs }) => {
		validatePluginSettings(PluginSettings, settings["plugin.inlang.messageFormat"])
		const file = await nodeishFs.readFile(settings["plugin.inlang.messageFormat"].storagePath, {
			encoding: "utf-8",
		})
		return JSON.parse(file) satisfies StorageSchema
	},
	saveMessages: async ({ settings, nodeishFs, messages }) => {
		return nodeishFs.writeFile(
			settings["plugin.inlang.messageFormat"].storagePath,
			//! - assumes that all messages are always passed to the plugin
			//  - sorts alphabetically to minimize git diff's and merge conflicts
			JSON.stringify(messages.sort((a, b) => a.id.localeCompare(b.id)))
		)
	},
}
