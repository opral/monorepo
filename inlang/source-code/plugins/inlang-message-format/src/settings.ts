import { Type, type Static } from "@sinclair/typebox"

export type PluginSettings = Static<typeof PluginSettings>
export const PluginSettings = Type.Object({
	pathPattern: Type.String({
		// for legacy reasions locale can be specified as well
		pattern: ".*\\{languageTag|locale\\}.*\\.json$",
		examples: ["./messages/{locale}.json", "./i18n/{locale}.json"],
		title: "Path to language files",
		description:
			"Specify the pathPattern to locate resource files in your repository. It must include `{locale}` and end with `.json`.",
	}),
})
