import type { Plugin } from "@inlang/sdk"
import type { StorageSchema } from "./storageSchema.js"
import { displayName, description } from "../marketplace-manifest.json"
import { parse as validatePluginSettings } from "valibot"
import { PluginSettings } from "./settings.js"
import { detectJsonFormatting } from "@inlang/detect-json-formatting"

export const pluginId = "plugin.inlang.messageFormat"

let stringifyWithFormatting: ReturnType<typeof detectJsonFormatting>

export const plugin: Plugin<{
	[pluginId]: PluginSettings
}> = {
	id: pluginId,
	displayName,
	description,
	loadMessages: async ({ settings, nodeishFs }) => {
		validatePluginSettings(PluginSettings, settings["plugin.inlang.messageFormat"])

		try {
			const file = await nodeishFs.readFile(settings["plugin.inlang.messageFormat"].storagePath, {
				encoding: "utf-8",
			})
			stringifyWithFormatting = detectJsonFormatting(file)
			return (JSON.parse(file) as StorageSchema)["data"]
		} catch (error) {
			// file does not exist. create it.
			if ((error as any)?.code === "ENOENT") {
				await nodeishFs.writeFile(settings["plugin.inlang.messageFormat"].storagePath, "[]\n")
				return []
			}
			// unknown error
			throw error
		}
	},
	saveMessages: async ({ settings, nodeishFs, messages }) => {
		return nodeishFs.writeFile(
			settings["plugin.inlang.messageFormat"].storagePath,
			//! - assumes that all messages are always passed to the plugin
			//  - sorts alphabetically to minimize git diff's and merge conflicts
			stringifyWithFormatting({
				$schema: "https://inlang.com/schema/inlang-message-format",
				data: messages.sort((a, b) => a.id.localeCompare(b.id)),
			} satisfies StorageSchema)
		)
	},
}
