import { Type, type Static } from "@sinclair/typebox"

export type PluginSettings = Static<typeof PluginSettings>
export const PluginSettings = Type.Object({
	/** @deprecated use `filePathPattern` instead */
	filePath: Type.Optional(
		Type.String({ description: "DEPRECATED. Use filePathPattern instead.", deprecated: true })
	),
	pathPattern: Type.String({
		pattern: ".*\\{languageTag\\}.*\\.json$",
		examples: ["./messages/{languageTag}.json", "./i18n/{languageTag}.json"],
		description: "The path to the JSON file where the messages are stored.",
	}),
})
