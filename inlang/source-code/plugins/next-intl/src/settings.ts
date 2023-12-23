// Settings for next-intl plugin
import { Type, type Static } from "@sinclair/typebox"
const PathPattern = Type.String({
	pattern: "^(\\./|\\../|/)[^*]*\\{languageTag\\}[^*]*\\.json",
	description: "The pathPattern must contain `{languageTag}` and end with `.json`.",
	examples: [
		"./{languageTag}/file.json",
		"../folder/{languageTag}/file.json",
		"./{languageTag}.json",
	],
})

export type PluginSettings = Static<typeof PluginSettings>
export const PluginSettings = Type.Object({
	pathPattern: PathPattern,
	variableReferencePattern: Type.Optional(Type.Array(Type.String())),
	sourceLanguageFilePath: Type.Optional(PathPattern),
	ignore: Type.Optional(Type.Array(Type.String())),
})
