// Settings for i18next plugin
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
const NameSpacePathPattern = Type.Record(
	Type.String({
		pattern: "^[^.]+$",
		description: "Dots are not allowd ",
		examples: ["website", "app", "homepage"],
	}),
	PathPattern
)

export type PluginSettings = Static<typeof PluginSettings>
export const PluginSettings = Type.Object({
	pathPattern: Type.Union([PathPattern, NameSpacePathPattern]),
	variableReferencePattern: Type.Optional(Type.Array(Type.String())),
	sourceLanguageFilePath: Type.Optional(Type.Union([PathPattern, NameSpacePathPattern])),
	ignore: Type.Optional(Type.Array(Type.String())),
})
