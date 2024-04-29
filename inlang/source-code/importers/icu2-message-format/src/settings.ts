import { Type, type Static } from "@sinclair/typebox"

export type PluginSettings = Static<typeof PluginSettings>
export const PluginSettings = Type.Object({
	pathPattern: Type.String({
		pattern: ".*\\{languageTag\\}.*\\.json$",
		examples: ["./messages/{languageTag}.json", "./i18n/{languageTag}.json"],
		title: "Path to language files",
		description:
			"Specify the pathPattern to locate language files in your repository. It must include `{languageTag}` and end with `.json`.",
	}),
})
