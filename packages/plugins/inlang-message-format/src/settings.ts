import { Type, type Static } from "@sinclair/typebox"

export type PluginSettings = Static<typeof PluginSettings>
export const PluginSettings = Type.Object({
	filePath: Type.String({
		pattern: ".*\\.json$",
		examples: ["./.inlang/plugin.inlang.messageFormat/messages.json", "./src/messages.json"],
		description: "The path to the JSON file where the messages are stored.",
	}),
})
