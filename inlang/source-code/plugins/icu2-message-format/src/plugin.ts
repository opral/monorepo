import type { Message, Plugin } from "@inlang/sdk"
import { parseCST } from "messageformat"
import { displayName, description } from "../marketplace-manifest.json"
import { PluginSettings } from "./settings.js"

export const pluginId = "plugin.inlang.icu2MessageFormat"

export const plugin: Plugin<{
	[pluginId]: PluginSettings
}> = {
	id: pluginId,
	displayName,
	description,
	settingsSchema: PluginSettings,
	loadMessages: async ({ settings, nodeishFs }) => {
		const pathPattern = settings["plugin.inlang.icu2MessageFormat"].pathPattern

		const dictionaries = await Promise.all(
			settings.languageTags.map(async (languageTag) => {
				try {
					const filePath = pathPattern.replace("{languageTag}", languageTag)
					const file = await nodeishFs.readFile(filePath, { encoding: "utf-8" })
					return JSON.parse(file) as Record<string, string>
				} catch {
					// file does not exist. likely, no translations for the file exist yet.
					return {}
				}
			})
		)

		// collect all messageIDs across all dictionaries
		const messageIDs = [...new Set(dictionaries.flatMap(Object.keys))]

		// create message objects for each ID
		const messages: Message[] = messageIDs.map((messageId) => {})
		return messages
	},
	saveMessages: async () => {
		console.warn("The ICU2 MessageFormat Plugin does not implement saving.")
		return
	},
}

function parseICUMessage(source: string): Message {
	const parsed = parseCST(source)
}
